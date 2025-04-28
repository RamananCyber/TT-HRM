// NotificationPoller.js
import { useEffect, useState } from 'react';
import axios from 'axios';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 300000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('No authentication token found');
      return Promise.reject('No authentication token found');
    }
    
    console.log('Fetching notifications...');
    
    return axios.get('http://localhost:8000/api/notifications/', {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('Notifications response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        // Map API response to our notification format
        const formattedNotifications = response.data.map(notification => ({
          id: notification.id,
          message: notification.message,
          is_read: notification.is_read,
          created_at: notification.created_at,
          type: determineNotificationType(notification.message)
        }));
        
        setNotifications(formattedNotifications);
        return formattedNotifications; // Return the notifications for chaining
      }
      return [];
    })
    .catch(error => {
      console.error('Error fetching notifications:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error; // Re-throw to allow handling in the component
    });
  };

  // Simple function to determine notification type based on content
  const determineNotificationType = (message) => {
    if (!message) return 'info';
    
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('warning') || lowerMessage.includes('alert')) {
      return 'warning';
    } else if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
      return 'danger';
    } else if (lowerMessage.includes('success') || lowerMessage.includes('completed')) {
      return 'success';
    } else {
      return 'info';
    }
  };

  const markAsRead = (id) => {
    return fetch(`http://localhost:8000/api/notifications/${id}/mark_read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      return response.json();
    });
  };

  const clearAllNotifications = () => {
    const token = localStorage.getItem('access_token');
    
    return axios.post('http://localhost:8000/api/notifications/mark_all_read/', {}, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('All notifications marked as read:', response.data);
      
      // Update the state to mark all notifications as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
      
      return response.data;
    })
    .catch(error => {
      console.error('Error clearing notifications:', error);
      throw error; // Re-throw to allow handling in the component
    });
  };

  return { 
    notifications, 
    markAsRead,
    clearAllNotifications,
    fetchNotifications,
    error
  };
}
