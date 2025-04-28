import React, { useState, useEffect, useCallback } from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilCalendar,
  cilUser,
  cilAccountLogout,
  cilHome
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import defaultAvatar from '../../assets/images/avatars/2.jpg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const getCurrentUser = () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const tokenParts = token.split('.')
        const payload = JSON.parse(atob(tokenParts[1]))
        return payload.user_id
      } catch (error) {
        console.error('Error decoding token:', error)
        return null
      }
    }
    return null
  }

  const ExitButton = () => {
    const handleExit = () => {
      if (window.electronAPI && window.electronAPI.requestExitApp) {
        window.electronAPI.requestExitApp();
      }
    };

    return (
      <div
        onClick={handleExit}
        style={{ cursor: 'pointer' }}
        className="text-danger"
      >
        <div className="d-flex align-items-center">
          <div className="bg-danger bg-opacity-10 p-2 rounded-circle me-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-danger">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          Exit Kiosk
        </div>
      </div>
    );
  };

  const fetchUserPhoto = useCallback(async () => {
    if (isLoading || userPhoto) return;

    try {
      setIsLoading(true);
      const userId = getCurrentUser();
      if (!userId) return;

      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `http://localhost:8000/api/user/profile/${userId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(response.data);
      // Only update if photo exists and is different
      if (response.data.Photo && response.data.Photo !== userPhoto) {
        console.log('Setting user photo:', response.data.Photo);

        setUserPhoto(response.data.Photo);
      }
    } catch (error) {
      console.error('Error fetching user photo:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    if (!userPhoto) { // Only fetch if no photo exists
      fetchUserPhoto();
    }
  }, [fetchUserPhoto, userPhoto]); // Add userPhoto to dependencies

  useEffect(() => {
    const handlePhotoUpdate = () => {
      fetchUserPhoto();
    };
    window.addEventListener('photoUpdate', handlePhotoUpdate);
    return () => window.removeEventListener('photoUpdate', handlePhotoUpdate);
  }, [fetchUserPhoto]);

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar
          src={(userPhoto ? `http://localhost:8000/api${userPhoto}` : defaultAvatar)}
          size="md"
          className="border border-2 border-primary shadow-sm"
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            e.target.src = defaultAvatar;
          }}
        />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-primary text-white fw-semibold py-2">
          My Account
        </CDropdownHeader>

        <CDropdownItem onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} className="text-primary">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
              <CIcon icon={cilUser} className="text-primary" />
            </div>
            Profile
          </div>
        </CDropdownItem>

        <CDropdownItem onClick={() => navigate('/reports/leave-requests')} style={{ cursor: 'pointer' }} className="text-success">
          <div className="d-flex align-items-center">
            <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2">
              <CIcon icon={cilCalendar} className="text-success" />
            </div>
            Leave Request
          </div>
        </CDropdownItem>

        <CDropdownItem onClick={() => navigate('/reports/wfh-requests')} style={{ cursor: 'pointer' }} className="text-info">
          <div className="d-flex align-items-center">
            <div className="bg-info bg-opacity-10 p-2 rounded-circle me-2">
              <CIcon icon={cilHome} className="text-info" />
            </div>
            WFH Request
          </div>
        </CDropdownItem>

        <CDropdownDivider />

        <CDropdownItem onClick={handleLogout} style={{ cursor: 'pointer' }} className="text-danger">
          <div className="d-flex align-items-center">
            <div className="bg-danger bg-opacity-10 p-2 rounded-circle me-2">
              <CIcon icon={cilAccountLogout} className="text-danger" />
            </div>
            Logout
          </div>
        </CDropdownItem>
        <CDropdownItem onClick={() => {
          if (window.electronAPI && window.electronAPI.requestExitApp) {
            window.electronAPI.requestExitApp();
          }
        }} style={{ cursor: 'pointer' }} className="text-danger">
          <div className="d-flex align-items-center">
            <div className="bg-danger bg-opacity-10 p-2 rounded-circle me-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-danger">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            Exit Kiosk
          </div>
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
