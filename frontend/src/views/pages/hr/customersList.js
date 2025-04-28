import React, { useState, useEffect } from 'react';
import {
  CCard, CCardBody, CCardHeader, CContainer, CRow, CCol,
  CListGroup, CListGroupItem, CProgress, CButton, CBadge,
  CWidgetStatsA, CWidgetStatsB, CWidgetStatsF, CTooltip, CFormSwitch
} from '@coreui/react';
import { cilDevices, cilLockLocked, cilPowerStandby } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer, cilChartPie
} from '@coreui/icons';
import Geolocation from '../../../components/Geolocation';

function CustomersList() {
  const [systemStatus, setSystemStatus] = useState('Active');
  const [eventHistory, setEventHistory] = useState([]);
  const [displays, setDisplays] = useState([]);
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    idleTime: 0
  });
  const [showHistory, setShowHistory] = useState(true);

  // Status color mapping
  const statusColors = {
    'Locked': 'danger',
    'Sleep': 'warning',
    'Active': 'success',
    'Unlocked': 'info',
    'Offline': 'secondary'
  };

  useEffect(() => {
    const loadHistory = async () => {
      const history = await window.electronAPI?.getLogHistory();
      if (history) setEventHistory(history.split('\n').reverse().filter(Boolean));
    };

    const handlers = {
      system: (_, msg) => setSystemStatus(msg),
      display: (displays) => setDisplays(displays),
      stats: (stats) => setSystemStats(stats),
      power: (_, msg) => {
        setSystemStatus(msg);
        setEventHistory(prev => [
          `${new Date().toLocaleString()}: ${msg}`,
          ...prev.slice(0, 50)
        ]);

        if (msg.includes('Sleep')) {
          window.electronAPI.getCurrentDisplays().then(setDisplays);
        }
      }
    };

    loadHistory();

    const cleanups = [
      window.electronAPI?.onSystemEvent(handlers.system),
      window.electronAPI?.onDisplayChange(handlers.display),
      window.electronAPI?.onSystemStats(handlers.stats),
      window.electronAPI?.onPowerEvent(handlers.power)
    ];

    return () => cleanups.forEach(cleanup => cleanup?.());
  }, []);

  return (

    <CContainer className="my-4">

      <CRow className="mb-3">
        <CCol md={6}>
          <Geolocation />
        </CCol>
        <CCol>
          <CFormSwitch
            label="Show Event History"
            id="history-switch"
            checked={showHistory}
            onChange={() => setShowHistory(!showHistory)}
            className="mb-3"
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol md={6}>
          <CCard className="mb-4 shadow">
            <CCardHeader className="bg-primary text-white">
              <h3 className="mb-0">System Dashboard</h3>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol sm={6}>
                  <CWidgetStatsA
                    className="mb-4"
                    color={statusColors[systemStatus.split(' ')[1]] || 'info'}
                    value={systemStatus}
                    title="Current Status"
                    icon={<CIcon icon={cilPowerStandby} height={36} />}
                  />
                </CCol>

                <CCol sm={6}>
                  <CWidgetStatsA
                    className="mb-4"
                    color="info"
                    value={`${displays.length} Displays`}
                    title="Connected Displays"
                    icon={<CIcon icon={cilDevices} height={36} />}
                  />
                </CCol>
              </CRow>

              <CRow>
                <CCol>
                  <CCard className="mb-4">
                    <CCardHeader className="bg-success text-white">
                      <CIcon icon={cilLockLocked} className="me-2" />
                      Security Status
                    </CCardHeader>
                    <CCardBody>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5>System Lock State:</h5>
                          <CBadge color={statusColors[systemStatus.split(' ')[1]]}>
                            {systemStatus}
                          </CBadge>
                        </div>
                        <CButton
                          color="light"
                          onClick={() => window.electronAPI?.refreshDisplays()}
                        >
                          Refresh Status
                        </CButton>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              <CRow>
                <CCol>
                  <CCard className="mb-4">
                    <CCardHeader className="bg-warning text-dark">
                      Performance Metrics
                    </CCardHeader>
                    <CCardBody>
                      <CRow className="g-4">
                        {/* CPU Widget */}
                        <CCol xl={4}>
                          <CWidgetStatsB
                            className="mb-4"
                            progress={{ color: systemStats.cpu > 80 ? 'danger' : 'success', value: systemStats.cpu }}
                            title="CPU Usage"
                            value={`${systemStats.cpu}%`}
                            icon={<CIcon icon={cilSpeedometer} height={36} className="text-white" />}
                            color={systemStats.cpu > 80 ? 'danger' : 'success'}
                          />
                        </CCol>

                        {/* Memory Widget */}
                        <CCol xl={4}>
                          <CWidgetStatsB
                            className="mb-4"
                            progress={{ color: systemStats.memory > 80 ? 'danger' : 'info', value: systemStats.memory }}
                            title="Memory Usage"
                            value={`${systemStats.memory}%`}
                            icon={<CIcon icon={cilChartPie} height={36} className="text-white" />}
                            color={systemStats.memory > 80 ? 'danger' : 'info'}
                          />
                        </CCol>

                        {/* Idle Time Widget */}
                        <CCol xl={4}>
                          <CWidgetStatsF
                            className="mb-4"
                            icon={<CIcon icon={cilPowerStandby} size="xl" className="text-white" />}
                            title="Idle Time"
                            value={`${Math.floor(systemStats.idleTime / 60)}m`}
                            color="warning"
                            padding={false}
                            footer={
                              <small className="text-body-secondary">
                                {systemStats.idleTime % 60}s
                              </small>
                            }
                          />
                        </CCol>
                      </CRow>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>

        {showHistory && (
          <CCol md={6}>
            <CCard className="mb-4 shadow">
              <CCardHeader className="bg-info text-white">
                <h3 className="mb-0">Event Timeline</h3>
              </CCardHeader>
              <CCardBody style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <CListGroup>
                  {eventHistory.map((entry, index) => (
                    <CListGroupItem
                      key={index}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span className="text-muted small">{entry.split(': ')[0]}</span>
                      <CBadge
                        color={
                          entry.includes('SYSTEM_WOKE') ? 'success' :
                            entry.includes('SYSTEM_SLEPT') ? 'warning' :
                              entry.includes('Locked') ? 'danger' :
                                entry.includes('Unlocked') ? 'success' :
                                  'info'
                        }
                      >
                        {entry.split(': ')[1]}
                      </CBadge>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              </CCardBody>
            </CCard>
          </CCol>
        )}
      </CRow>
    </CContainer>
  );
}

export default CustomersList;