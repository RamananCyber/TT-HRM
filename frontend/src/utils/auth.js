import axios from 'axios';

// Remove the api instance creation with withCredentials

// export const login = async (username, password) => {
//   try {
//     const response = await axios.post('http://localhost:8000/auth/login/', {
//       username,
//       password
//     });
    
//     console.log('Login response:', response.data);
    
//     if (response.data.token) {
//       localStorage.setItem('access_token', response.data.token);
//       return response.data;
//     }
//     return null;
//   } catch (error) {
//     console.error('Login error:', error);
//     throw error;
//   }
// };

export const getUserRole = async () => {
  try {
    const token = localStorage.getItem('access_token'); // Fix: use access_token consistently
    if (!token) {
      console.log('No token found');
      return null;
    }
    
    console.log('Token:', token); // Debug log

    const response = await fetch('http://localhost:8000/api/auth/user-role/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status); // Debug log
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      return null;
    }

    if (!response.ok) {
      console.error('Server error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};
