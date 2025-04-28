const { contextBridge, ipcRenderer } = require('electron');

// if (navigator.geolocation) {
//   console.log('with in if block');
//  navigator.geolocation.getCurrentPosition((position) => {
//     console.log("Latitude : " + position.coords.latitude);
//   } ,(err ) =>{
//     console.log("getting error : " + err.message);
//   } , {timeout:10000})

// } else { 
//   console.log('with in else block');
// }

contextBridge.exposeInMainWorld('electronAPI', {
  // System Events
  onSystemEvent: (callback) => {
    ipcRenderer.on('system-event', (event, message) => callback(event, message));
    return () => ipcRenderer.removeListener('system-event', callback);
  },

  onInactiveTime: (callback) => {
    console.log('Inside onInactiveTime callback');
    ipcRenderer.on('inactive-time', (event, inactiveTime) => callback(inactiveTime));
    return () => ipcRenderer.removeListener('inactive-time', callback);
  },

  onCurrentIdleTime: (callback) => {
    ipcRenderer.on('current-idle-time', (_, idleTime) => callback(idleTime));
    return () => ipcRenderer.removeListener('current-idle-time', callback);
  },
  

  onPowerEvent: (callback) => {
    ipcRenderer.on('power-event', callback);
    return () => ipcRenderer.removeListener('power-event', callback);
  },

  // Display Handling
  onDisplayChange: (callback) => {
    ipcRenderer.on('display-change', (_, displays) => callback(displays));
    return () => ipcRenderer.removeListener('display-change', callback);
  },
  getCurrentDisplays: () => ipcRenderer.invoke('get-current-displays'),
  refreshDisplays: () => ipcRenderer.send('display-change', screen.getAllDisplays()),

  // System Monitoring
  getLogHistory: () => ipcRenderer.invoke('get-log-history'),
  onNetworkStatus: (callback) => {
    ipcRenderer.on('network-status', (_, status) => callback(status));
    return () => ipcRenderer.removeListener('network-status', callback);
  },
  onSystemStats: (callback) => {
    ipcRenderer.on('system-stats', (_, stats) => callback(stats));
    return () => ipcRenderer.removeListener('system-stats', callback);
  },
  onIdleEvent: (callback) => {
    ipcRenderer.on('idle-event', (_, idleTime) => callback(idleTime));
    return () => ipcRenderer.removeListener('idle-event', callback);
  },
  onDeviceEvent: (callback) => {
    ipcRenderer.on('device-event', (event, message) => callback(message));
    return () => ipcRenderer.removeListener('device-event', callback);
  },

  onPowerStateChange: (callback) => {
    ipcRenderer.on('power-state-change', callback);
    return () => ipcRenderer.removeListener('power-state-change', callback);
  },
  refreshDisplays: () => ipcRenderer.send('refresh-displays'),

  getIPLocation: () => ipcRenderer.invoke('get-ip-location'),
  getLocationData: (lat, lon) => ipcRenderer.invoke('get-location-data', lat, lon),

  getSystemLocation: () => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(position.coords),
      error => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }),
  getAddressData: (lat, lon) => ipcRenderer.invoke('get-address-data', lat, lon),

  downloadReport: (requestOptions, fileOptions) => ipcRenderer.invoke('download-report', requestOptions, fileOptions),

  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  requestExitApp: () => ipcRenderer.send('request-exit-app'),
});