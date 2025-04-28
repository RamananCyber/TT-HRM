import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import defaultAvatar from '../../../assets/images/avatars/2.jpg'
import './ProfileEnhanced.css'
import { useNotifications } from '../../hooks/NotificationPoller'
const Profile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation() // Add this to access location state
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [saveLoading, setSaveLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const skillsRef = useRef(null)
  const { notifications, markAsRead, clearAllNotifications, fetchNotifications } = useNotifications()
  const handleGoBack = () => {
    // Check if we have state indicating we came from employees page
    if (location.state && location.state.fromEmployees) {
      navigate('/employees') // Navigate directly to employees page
    } else {
      // Optional: fallback to general navigation or do nothing
      navigate('/employees') // You can still redirect to employees as a default
    }
  }
  // Animation observer for skills section
  useEffect(() => {
    if (skillsRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-skills');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(skillsRef.current);

      return () => {
        if (skillsRef.current) {
          observer.unobserve(skillsRef.current);
        }
      };
    }
  }, [profile, activeTab]);

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

  const handleButtonClicked = (action) => {
    if (action === 'save') {
      handleUpdate();
    } else if (action === 'cancel') {
      setIsEditing(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem('access_token');
      const userId = getCurrentUser();

      if (!token || !userId) {
        setError('Authentication error. Please login again.');
        return;
      }

      const formDataToSend = new FormData();

      if (photoFile) {
        formDataToSend.append('Photo', photoFile);
      }

      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.put(
        `http://localhost:8000/api/user/profile/${userId}/`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setProfile(response.data);
      window.dispatchEvent(new CustomEvent('photoUpdate'));

      setIsEditing(false); // Uncommented this line
      setPhotoFile(null);
      setPhotoPreview(null);
      setError(null);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + (error.response?.data?.message || error.message));
      showNotification('Failed to update profile', 'error');
    } finally {
      setSaveLoading(false);
    }
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        showNotification('Image size should be less than 5MB', 'error')
        return
      }

      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file')
        showNotification('Please select an image file', 'error')
        return
      }

      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
    setPhotoPreview(null);
    setPhotoFile(null);
    setError(null);
  };


  const startEditing = () => {
    setFormData({
      UserName: profile.UserName || '',
      Email: profile.Email || '',
      EmployeeName: profile.EmployeeName || '',
      PositionID: profile.PositionID || '',
      RoleID: profile.RoleID || '',
      // Don't include Photo here as it's handled separately
    });
    setIsEditing(true);
    // Reset any previous photo preview
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const userId = getCurrentUser()
        if (!token) {
          setError('No authentication token found')
          return
        }

        if (!userId) {
          setError('No user ID found in token')
          return
        }

        const response = await axios.get(`http://localhost:8000/api/user/profile/${userId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        setProfile(response.data)
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Session expired. Please login again.')
          localStorage.removeItem('token')  // Clear invalid token
          // Redirect to login
          window.location.href = '/login'
        } else {
          setError('Failed to load profile: ' + (error.response?.data?.message || error.message))
        }
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
  }, [])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    // Apply dark mode to body for global styling if needed
    if (darkMode) {
      document.body.classList.add('dark-mode-body')
    } else {
      document.body.classList.remove('dark-mode-body')
    }
  }, [darkMode])

  const getPositionName = (positionId) => {
    const positions = {
      1: 'CEO',
      2: 'Manager',
      3: 'HR Specialist',
      4: 'Sales Representative',
      5: 'Developer',
    }
    return positions[positionId] || 'Unknown Position'
  }

  const getRoleName = (roleId) => {
    const roles = {
      1: 'Super Admin',
      2: 'Admin',
      3: 'Developer',
      4: 'System Admin'
    }
    return roles[roleId] || 'Unknown Role'
  }

  // Mock data for stats and activity - replace with real data from API
  const userStats = {
    projects: 12,
    taskCompletion: 85,
    daysPresent: 24
  }

  const userSkills = [
    { name: 'Project Management', level: 85 },
    { name: 'React Development', level: 92 },
    { name: 'UI/UX Design', level: 78 },
    { name: 'Team Collaboration', level: 95 },
    { name: 'Problem Solving', level: 88 }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'completion',
      title: 'Completed Project X',
      description: 'Successfully delivered all requirements ahead of schedule',
      date: '2 days ago',
      icon: 'check-circle-fill'
    },
    {
      id: 2,
      type: 'meeting',
      title: 'Joined Team Meeting',
      description: 'Participated in weekly sprint planning',
      date: '5 days ago',
      icon: 'calendar-event'
    },
    {
      id: 3,
      type: 'task',
      title: 'Started New Task',
      description: 'Began work on implementing new feature',
      date: '1 week ago',
      icon: 'list-task'
    }
  ]

  if (loading) {
    return (
      <div className="profile-enhanced-loading">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-enhanced-error">
        <div className="error-container">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (

    <div className={`profile-enhanced-container ${darkMode ? 'dark-mode' : ''}`}>

      {notification.show && (
        <div className={`profile-notification ${notification.type}`}>
          <div className="notification-icon">
            {notification.type === 'success' ? (
              <i className="bi bi-check-circle"></i>
            ) : (
              <i className="bi bi-exclamation-circle"></i>
            )}
          </div>
          <div className="notification-message">{notification.message}</div>
        </div>
      )}

      <button
        className="dark-mode-toggle"
        onClick={() => setDarkMode(!darkMode)}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <i className="bi bi-sun-fill"></i>
        ) : (
          <i className="bi bi-moon-fill"></i>
        )}
      </button>

      <div className="profile-enhanced-header">
        <div className="profile-enhanced-cover">
          <div className="profile-enhanced-avatar-container">
            <div className="profile-enhanced-avatar">
              <img
                src={photoPreview || (profile?.Photo ? `http://localhost:8000/api${profile.Photo}` : defaultAvatar)}
                alt="Profile"
                className="profile-enhanced-avatar-img"

                loading="lazy"
              />

              {isEditing && (
                <div className="profile-enhanced-avatar-edit">
                  <label htmlFor="photo-upload" className="profile-enhanced-avatar-edit-btn">
                    <i className="bi bi-camera"></i>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="profile-enhanced-avatar-input"
                    aria-label="Upload profile photo"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="profile-enhanced-user-info">
            <h2>{profile?.EmployeeName || profile?.UserName}</h2>
            <div className="profile-enhanced-badges">
              <span className="profile-enhanced-badge position">
                {getPositionName(profile?.PositionID)}
              </span>
              <span className="profile-enhanced-badge role">
                {getRoleName(profile?.RoleID)}
              </span>
            </div>
          </div>

          <div className="profile-enhanced-actions">
            {(location.state && location.state.fromEmployees) && (
              <button
                className="profile-back-button"
                onClick={handleGoBack}
                aria-label="Go back to Employees"
                style={{
                  cursor: 'pointer',
                  zIndex: 100,
                  position: 'relative',
                  pointerEvents: 'auto'
                }}
              >
                <i className="bi bi-arrow-left"></i> Back
              </button>
            )}
            {!isEditing ? (
              <button
                className="profile-enhanced-edit-btn"
                onClick={startEditing}
                aria-label="Edit profile"
              >
                <i className="bi bi-pencil"></i> Edit Profile
              </button>
            ) : (
              <div className="profile-enhanced-edit-actions">
                <button
                  className="profile-enhanced-save-btn"
                  onClick={handleUpdate}  // Direct handler
                  disabled={saveLoading}
                  aria-label="Save profile changes"
                >
                  {saveLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span className="ms-2">Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2"></i> Save Changes
                    </>
                  )}
                </button>
                <button
                  className="profile-enhanced-cancel-btn"
                  onClick={() => handleButtonClicked('cancel')}
                  disabled={saveLoading}
                  aria-label="Cancel editing"
                  style={{ cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

            )}
          </div>
        </div>

        <div className="profile-enhanced-tabs">
          <button
            className={`profile-enhanced-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
            aria-selected={activeTab === 'personal'}
            role="tab"
          >
            <i className="bi bi-person"></i> Personal Info
          </button>
          <button
            className={`profile-enhanced-tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
            aria-selected={activeTab === 'skills'}
            role="tab"
          >
            <i className="bi bi-graph-up"></i> Skills & Stats
          </button>
          <button
            className={`profile-enhanced-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
            aria-selected={activeTab === 'activity'}
            role="tab"
          >
            <i className="bi bi-clock-history"></i> Activity
          </button>
          <button
            className={`profile-enhanced-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
            aria-selected={activeTab === 'account'}
            role="tab"
          >
            <i className="bi bi-shield-lock"></i> Account
          </button>
        </div>
      </div>

      <div className="profile-enhanced-content">
        {activeTab === 'personal' && (
          <div className="profile-enhanced-section fade-in">
            <h3 className="profile-enhanced-section-title">Personal Information</h3>

            <div className="profile-enhanced-form">
              <div className="profile-enhanced-form">
                <div className="profile-enhanced-form-group">
                  <label className="profile-enhanced-label">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-enhanced-input"
                      name="EmployeeName"
                      value={formData?.EmployeeName || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      aria-label="Full name"
                    />
                  ) : (
                    <div className="profile-enhanced-value">
                      {profile?.EmployeeName || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="profile-enhanced-form-group">
                  <label className="profile-enhanced-label">Position</label>
                  <div className="profile-enhanced-value">
                    {getPositionName(profile?.PositionID)}
                  </div>
                </div>

                <div className="profile-enhanced-form-group">
                  <label className="profile-enhanced-label">Role</label>
                  <div className="profile-enhanced-value">
                    {getRoleName(profile?.RoleID)}
                  </div>
                </div>

                <div className="profile-enhanced-form-group">
                  <label className="profile-enhanced-label">Employee ID</label>
                  <div className="profile-enhanced-value">
                    {profile?.EmployeeID || 'Not assigned'}
                  </div>
                </div>

                <div className="profile-enhanced-form-group">
                  <label className="profile-enhanced-label">Join Date</label>
                  <div className="profile-enhanced-value">
                    {profile?.CreatedDateUTC ? new Date(profile.CreatedDateUTC).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <>
            <div className="profile-enhanced-section fade-in">
              <h3 className="profile-enhanced-section-title">Performance Overview</h3>

              <div className="profile-enhanced-stats">
                <div className="profile-stat-item">
                  <div className="stat-value">{userStats.projects}</div>
                  <div className="stat-label">Projects</div>
                </div>
                <div className="profile-stat-item">
                  <div className="stat-value">{userStats.taskCompletion}%</div>
                  <div className="stat-label">Task Completion</div>
                </div>
                <div className="profile-stat-item">
                  <div className="stat-value">{userStats.daysPresent}</div>
                  <div className="stat-label">Days Present</div>
                </div>
              </div>
            </div>

            <div className="profile-enhanced-section fade-in" ref={skillsRef}>
              <h3 className="profile-enhanced-section-title">Skills & Expertise</h3>
              <div className="profile-skills">
                {userSkills.map((skill, index) => (
                  <div className="skill-item" key={index}>
                    <div className="skill-info">
                      <span>{skill.name}</span>
                      <span>{skill.level}%</span>
                    </div>
                    <div className="skill-progress">
                      <div
                        className="skill-progress-bar"
                        style={{ width: `0%` }}
                        data-width={`${skill.level}%`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="profile-enhanced-section fade-in">
            <h3 className="profile-enhanced-section-title">Recent Activity</h3>

            {/* Notifications Section */}
            <div className="profile-timeline">
              {/* Notifications header with counter */}
              <div className="timeline-header">
                <div className="timeline-header-title">
                  <i className="bi bi-bell"></i>
                  <h4>Notifications</h4>
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="notification-counter">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </div>
                <div className="timeline-actions">
                  <button
                    className="timeline-action-btn"
                    onClick={fetchNotifications}
                    title="Refresh notifications"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                  {notifications.length > 0 && (
                    <button
                      className="timeline-action-btn"
                      onClick={clearAllNotifications}
                      title="Mark all as read"
                    >
                      <i className="bi bi-check-all"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      
      {/* Notifications list with animation */}
        <div className="notifications-container">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div
                className={`timeline-item notification-item ${notification.is_read ? 'read' : 'unread'}`}
                key={notification.id}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="timeline-icon notification-icon" data-type={notification.type}>
                  <i className={`bi bi-${notification.type === 'success' ? 'check-circle-fill' :
                      notification.type === 'warning' ? 'exclamation-triangle-fill' :
                        notification.type === 'danger' ? 'x-circle-fill' : 'bell-fill'
                    }`}></i>
                </div>
                <div className="timeline-content">
                  <h4>{notification.message}</h4>
                  <span className="timeline-date">
                    {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                  </span>
                  {!notification.is_read && (
                    <button
                      className="mark-read-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Mark as read"
                    >
                      <i className="bi bi-check2"></i>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="timeline-empty">
              <div className="empty-icon-container">
                <i className="bi bi-bell-slash"></i>
              </div>
              <p>You're all caught up!</p>
              <span>No new notifications at this time</span>
            </div>
          )}
        </div>
        {activeTab === 'account' && (
          <div className="profile-enhanced-section fade-in">
            <h3 className="profile-enhanced-section-title">Account Information</h3>

            <div className="profile-enhanced-form">
              <div className="profile-enhanced-form-group">
                <label className="profile-enhanced-label">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="profile-enhanced-input"
                    name="UserName"
                    value={formData?.UserName || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    aria-label="Username"
                  />
                ) : (
                  <div className="profile-enhanced-value">
                    {profile?.UserName}
                  </div>
                )}
              </div>

              <div className="profile-enhanced-form-group">
                <label className="profile-enhanced-label">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    className="profile-enhanced-input"
                    name="Email"
                    value={formData?.Email || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                  />
                ) : (
                  <div className="profile-enhanced-value">
                    {profile?.Email}
                  </div>
                )}
              </div>

              <div className="profile-enhanced-form-group">
                <label className="profile-enhanced-label">Account Created</label>
                <div className="profile-enhanced-value">
                  {profile?.CreatedDateUTC ? new Date(profile.CreatedDateUTC).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div className="profile-enhanced-form-group">
                <label className="profile-enhanced-label">Last Login</label>
                <div className="profile-enhanced-value">
                  {profile?.LastLoginDateUTC ? new Date(profile.LastLoginDateUTC).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            <div className="account-security-section">
              <h4 className="account-section-subtitle">Security Settings</h4>

              <div className="security-options">
                <button className="security-option-btn">
                  <i className="bi bi-key"></i>
                  Change Password
                </button>

                <button className="security-option-btn">
                  <i className="bi bi-shield-lock"></i>
                  Two-Factor Authentication
                </button>

                <button className="security-option-btn">
                  <i className="bi bi-clock-history"></i>
                  Login History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
