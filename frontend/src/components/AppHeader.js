import React, { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CAvatar,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderBrand,
  CHeaderDivider,
  CHeaderNav,
  CHeaderText,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  CRow,
  CTooltip,
  CSpinner,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalendar,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
  cilUser,
  cilSettings,
  cilSpeedometer,
  cilHome,
  cilCheck,
  cilTrash,
  cilX,
  cilReload,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'
import { useNotifications } from '../views/hooks/NotificationPoller'
// Import your logo image
import logo from '../assets/brand/ico-format/blue-64X64.ico'
import DateTime from './DateTime'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const [userData, setUserData] = useState(null)
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const { notifications, markAsRead, clearAllNotifications, fetchNotifications } = useNotifications()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [updatingNotifications, setUpdatingNotifications] = useState({});
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch (e) {
      return {}
    }
  }

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (token) {
      try {
        const decoded = parseJwt(token)
        setUserData(decoded)
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }
  }, [])

  // Manual refresh of notifications
  const handleRefreshNotifications = (e) => {
    e.stopPropagation()
    setIsRefreshing(true)
    fetchNotifications()
      .then(() => {
        setTimeout(() => setIsRefreshing(false), 500) // Add minimum delay for UX
      })
      .catch(() => {
        setIsRefreshing(false)
      })
  }

  const handleMarkAsRead = (id) => {
    // Set this notification as updating
    setUpdatingNotifications(prev => ({ ...prev, [id]: true }));
    
    try {
      const result = markAsRead(id);
      
      if (result && typeof result.then === 'function') {
        result
          .then(() => {
            setTimeout(() => {
              setUpdatingNotifications(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
              });
            }, 500);
          })
          .catch(error => {
            console.error(`Failed to mark notification ${id} as read:`, error);
            setUpdatingNotifications(prev => {
              const updated = { ...prev };
              delete updated[id];
              return updated;
            });
          });
      } else {
        // If not a Promise, clear the updating state after a short delay
        setTimeout(() => {
          setUpdatingNotifications(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        }, 500);
      }
    } catch (error) {
      console.error(`Error marking notification as read:`, error);
      setUpdatingNotifications(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  }

  

  const handleClearAllNotifications = (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent the dropdown from closing

    setIsMarkingAllRead(true)

    clearAllNotifications()
      .then(() => {
        setTimeout(() => setIsMarkingAllRead(false), 500) // Add minimum delay for UX
      })
      .catch(error => {
        console.error('Failed to mark all as read:', error)
        setIsMarkingAllRead(false)
      })
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info': return cilEnvelopeOpen
      case 'warning': return cilBell
      case 'danger': return cilX
      case 'success': return cilCheck
      default: return cilEnvelopeOpen
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'info': return '#0d6efd' // Bootstrap primary
      case 'warning': return '#ffc107' // Bootstrap warning
      case 'danger': return '#dc3545' // Bootstrap danger
      case 'success': return '#198754' // Bootstrap success
      default: return '#0d6efd' // Default to primary
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <CHeader position="relative" className="mb-4" ref={headerRef}>
      <CContainer fluid className="px-4">
        <CHeaderToggler
          className="ps-1"
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <CHeaderBrand className="mx-auto d-md-none">
          <img src={logo} height="46" alt="Logo" />
        </CHeaderBrand>

        <CHeaderNav className="ms-3 align-items-center">
          <DateTime />

          {/* Theme Switcher */}
          <CTooltip content={colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            <CNavLink onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}>
              <CIcon icon={colorMode === 'dark' ? cilSun : cilMoon} size="lg" />
            </CNavLink>
          </CTooltip>

          {/* Notifications Dropdown */}
          <CDropdown variant="nav-item" alignment="end">
            <CDropdownToggle caret={false} className="py-0 position-relative notification-toggle">
              <CIcon icon={cilBell} size="lg" />
              {unreadCount > 0 && (
                <CBadge
                  color="danger"
                  position="top-end"
                  shape="rounded-pill"
                  className="notification-badge pulse-animation"
                >
                  {unreadCount}
                </CBadge>
              )}
            </CDropdownToggle>
            <CDropdownMenu className="pt-0 notification-dropdown">
              <CDropdownHeader className="bg-light fw-semibold py-2 d-flex justify-content-between align-items-center">
                <span>
                  {unreadCount > 0 ? (
                    <>
                      <CBadge color="danger" className="me-2">{unreadCount} New</CBadge>
                      Notifications
                    </>
                  ) : (
                    'Notifications'
                  )}
                </span>
                <div className="d-flex">
                  <CButton
                    color="link"
                    size="sm"
                    className="p-0 me-2"
                    onClick={handleRefreshNotifications}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <CSpinner size="sm" color="primary" />
                    ) : (
                      <CIcon icon={cilReload} size="sm" />
                    )}
                  </CButton>
                  {notifications.length > 0 && (
                    <CButton
                      color="link"
                      size="sm"
                      className="p-0"
                      onClick={handleClearAllNotifications}
                      disabled={isMarkingAllRead || notifications.every(n => n.is_read)}
                    >
                      {isMarkingAllRead ? (
                        <CSpinner size="sm" color="primary" />
                      ) : (
                        <CIcon icon={cilCheck} size="sm" />
                      )}
                    </CButton>
                  )}
                </div>
              </CDropdownHeader>

              {notifications.length === 0 ? (
                <div className="notification-list empty-notifications" style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <CIcon icon={cilBell} size="xl" className="text-muted mb-2" />
                  <p className="text-muted mb-0">No notifications yet</p>
                </div>
              ) : (
                <>
                  <div className="notification-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.map(notification => (
                      <div
                      key={notification.id}
                      className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                        <div className="d-flex p-3 border-bottom notification-content">
                          <div
                            className="notification-icon me-3"
                            style={{
                              backgroundColor: `${getNotificationColor(notification.type)}15`,
                              color: getNotificationColor(notification.type),
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <CIcon icon={getNotificationIcon(notification.type)} size="sm" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="notification-message mb-1" style={{ wordBreak: 'break-word' }}>
                              {notification.message}
                            </div>
                            <div className="notification-time small text-muted">
                              {formatTimestamp(notification.created_at)}
                            </div>
                          </div>
                          {updatingNotifications[notification.id] ? (
                            <div className="ms-2">
                              <CSpinner size="sm" color="primary" />
                            </div>
                          ) : !notification.is_read && (
                            <div
                              className="unread-indicator ms-2"
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getNotificationColor(notification.type),
                                alignSelf: 'center',
                                flexShrink: 0
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {unreadCount > 0 && (
                    <div className="p-2 border-top text-center">
                      <CButton
                        color="primary"
                        variant="ghost"
                        size="sm"
                        className="w-100"
                        onClick={handleClearAllNotifications}
                        disabled={isMarkingAllRead}
                      >
                        {isMarkingAllRead ? (
                          <CSpinner size="sm" component="span" aria-hidden="true" />
                        ) : (
                          <>Mark all as read</>
                        )}
                      </CButton>
                    </div>
                  )}
                </>
              )}
            </CDropdownMenu>
          </CDropdown>
             
          {/* User Profile Section */}
          <CNavItem className="d-flex align-items-center ms-3">
            <div className="d-none d-md-block">
              <div className="fw-bold">{userData?.employee_name || 'Guest'}</div>
              <div className="small text-medium-emphasis">
                {userData?.employee_id ? `ID: ${userData.employee_id}` : ''}
                {userData?.position?.name ? ` - ${userData.position.name}` : ''}
              </div>
            </div>
            <AppHeaderDropdown />
          </CNavItem>
        </CHeaderNav>
      </CContainer>

      <CHeaderDivider />

      <CContainer fluid className="px-4">
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
