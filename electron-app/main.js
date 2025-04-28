const { app, BrowserWindow, powerMonitor, screen, ipcMain, net, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { cwd } = require('process');
const { log } = require('console');
const https = require('https');
const http = require('http');
let mainWindow;
const logFileName = 'system-events.log';
const idleThreshold = 300; // 5 minutes in seconds

ipcMain.on('request-exit-app', () => {
 app.quit();
});

ipcMain.handle('save-file', async (event, options) => {
  try {
    const { fileName, fileData, filters } = options;
    
    // Show save dialog to get file path
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save File',
      defaultPath: path.join(app.getPath('downloads'), fileName),
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Save cancelled' };
    }

    // Write the file
    fs.writeFileSync(filePath, Buffer.from(fileData));
    
    // Show notification
    new Notification({
      title: 'File Saved',
      body: `File has been saved to ${path.basename(filePath)}`
    }).show();
    
    return { 
      success: true, 
      message: 'File saved successfully',
      filePath 
    };
  } catch (error) {
    console.error('Save file error:', error);
    return { 
      success: false, 
      message: `Error saving file: ${error.message}` 
    };
  }
});



function createWindow() {

  app.commandLine.appendSwitch('ignore-certificate-errors')

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, 'assets/blue-512X512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    kiosk: true
  });

  mainWindow.maximize();

  setupPowerMonitoring();

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('Permission requested:', permission);
    
    if (permission === 'geolocation') {
      console.log('Geolocation permission requested');
      console.log(callback);
      
      callback(true); // Grant permission
    } else {
      callback(false);
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission) => {
      console.log('Permission check:', permission);
      return permission === 'geolocation';
    }
  );

  
  // Load React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('https://10.2.0.3:444/');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('https://10.2.0.3:444/');
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('display-change', screen.getAllDisplays());
    const isLocked = typeof powerMonitor.isScreenLocked === 'function' ?
      powerMonitor.isScreenLocked() : false;
    mainWindow.webContents.send('system-event', isLocked ? 'System Locked' : 'System Unlocked');
  });



  // System monitoring intervals
  setInterval(() => {
    const stats = {
      cpu: Math.round(os.loadavg()[0] * 10),
      memory: Math.round((1 - os.freemem() / os.totalmem()) * 100),
      idleTime: powerMonitor.getSystemIdleTime()
    };
    mainWindow.webContents.send('system-stats', stats);
    // mainWindow.webContents.send('idle-event', stats.idleTime);
  }, 5000);

  setInterval(checkNetwork, 30000);
}

function logEvent(event) {
  const logPath = path.join(app.getPath('userData'), logFileName);
  const entry = `${new Date().toISOString()} - ${event}\n`;
  fs.appendFileSync(logPath, entry);
}

function checkNetwork() {
  const request = net.request('http://www.google.com');
  request.on('response', () => {
    mainWindow?.webContents.send('network-status', 'Online');
  });
  request.on('error', () => {
    mainWindow?.webContents.send('network-status', 'Offline');
  });
  request.end();
}
let sleepStartTime = null;

function setupPowerMonitoring() {
  let lockStartTime = null;
  let idleStartTime = null;

  console.log('Setting up power monitoring...');

  // Remove existing listeners but log it
  console.log('Removing any existing suspend/resume listeners');
  powerMonitor.removeAllListeners('suspend');
  powerMonitor.removeAllListeners('resume');

   powerMonitor.on('suspend', () => {
    console.log('System suspending...');
    sleepStartTime = new Date();
    logEvent('SYSTEM_SLEPT');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('system-event', 'System Sleep');
    } else {
      console.log('Cannot send system-event: mainWindow is not available');
    }
  });

  powerMonitor.on('resume', () => {
    console.log('System resuming...');
    if (sleepStartTime) {
      const sleepDuration = Math.round((new Date() - sleepStartTime) / 1000); // in seconds
      logEvent(`SYSTEM_WOKE - Sleep Duration: ${sleepDuration} seconds`);
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('system-event', 'System Wake');
        mainWindow.webContents.send('inactive-time', sleepDuration);
        console.log(`Sent inactive-time: ${sleepDuration}`);
      } else {
        console.log('Cannot send events: mainWindow is not available');
      }
      
      sleepStartTime = null;
    } else {
      console.log('No sleep start time recorded');
    }
  });
  
  powerMonitor.on('lock-screen', () => {
    lockStartTime = new Date();
    logEvent('SYSTEM_LOCKED');
    mainWindow?.webContents.send('system-event', 'System Locked');
  });

  powerMonitor.on('unlock-screen', () => {
    if (lockStartTime) {
      const lockDuration = Math.round((new Date() - lockStartTime) / 1000); // in seconds
      logEvent(`SYSTEM_UNLOCKED - Lock Duration: ${lockDuration} seconds`);
      mainWindow?.webContents.send('inactive-time', lockDuration);
      lockStartTime = null;
    }
  });

  // Only use suspend/resume events (remove the generic handler)
 

  // Idle time monitoring
  setInterval(() => {
    console.log('Checking system idle time...');
    
    const currentIdleTime = powerMonitor.getSystemIdleTime();

    console.log(`Current idle time: ${currentIdleTime} seconds`);
    
    
    // If idle time is greater than threshold and we haven't started tracking yet
    if (currentIdleTime > idleThreshold && !idleStartTime && !lockStartTime && !sleepStartTime) {
      console.log(`System idle for ${currentIdleTime} seconds, starting idle tracking`);
      idleStartTime = new Date(new Date() - (currentIdleTime * 1000)); // Adjust for already elapsed idle time
      logEvent(`IDLE_STARTED - System idle for more than ${idleThreshold} seconds`);
    } 
    // If we were idle but now active again
    else if (idleStartTime && currentIdleTime < 5) { // 5 seconds threshold for activity
      const idleDuration = Math.round((new Date() - idleStartTime) / 1000);
      console.log(`System active again after ${idleDuration} seconds of idle time`);
      logEvent(`IDLE_ENDED - System was idle for ${idleDuration} seconds`);
      mainWindow?.webContents.send('inactive-time', idleDuration);
      idleStartTime = null;
    }
    
    // Send current idle time to frontend for display
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('current-idle-time', currentIdleTime);
    }
  }, 10000); // Check every 10 seconds

  screen.on('display-added', () => {
    logEvent('DISPLAY_ADDED');
    mainWindow?.webContents.send('display-change', screen.getAllDisplays());
  });

  screen.on('display-removed', () => {
    logEvent('DISPLAY_REMOVED');
    mainWindow?.webContents.send('display-change', screen.getAllDisplays());
  });
}

ipcMain.on('refresh-displays', () => { // Add this handler
  mainWindow?.webContents.send('display-change', screen.getAllDisplays());
});

// IPC Handlers
ipcMain.handle('get-log-history', async () => {
  const logPath = path.join(app.getPath('userData'), logFileName);
  try {
    return fs.readFileSync(logPath, 'utf-8');
  } catch {
    return '';
  }
});

// Add cache in main.js
const locationCache = new Map();



ipcMain.handle('get-current-displays', () => screen.getAllDisplays());
ipcMain.handle('get-ip-location', async () => {
  try {
    const services = [
      'https://ipapi.co/json/',
    ];

    for (const url of services) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const data = await response.json();
        const coords = {
          latitude: data.latitude || data.lat,
          longitude: data.longitude || data.lon,
          city: data.city,
          country: data.country_name || data.country
        };

        if (coords.latitude && coords.longitude) {
          return coords;
        }
      } catch (error) {
        console.error(`Failed with ${url}:`, error);
      }
    }
    
    throw new Error('All geolocation services failed');
  } catch (error) {
    console.error('IP Geolocation Error:', error);
    return { error: error.message };
  }
});



ipcMain.handle('get-location-data', async (_, lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    );
    return await response.json();
  } catch (error) {
    return { error: 'Failed to fetch address' };
  }
})

// In main.js

app.whenReady().then(() => {
  process.env.GOOGLE_API_KEY = "AIzaSyDNNBYjEAkegopkQCR-e10rn1g0yMnLIYo" ; 
  createWindow();
  app.on('ready', () => {
    console.log('App ready, setting up additional power monitoring');
    // This is a backup in case the first setup didn't work
    setupPowerMonitoring();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (event, contents) => {
  contents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Referer'] = 'electron-app://';
    callback({ requestHeaders: details.requestHeaders });
  });
});


app.on('activate', () => {
  console.log('App activated'); 
  if (mainWindow === null) {
    createWindow();
    setupPowerMonitoring();
  }
});