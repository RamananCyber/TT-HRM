import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  Link,
  Fade,
  Grid,
  Avatar,
  useMediaQuery
} from '@mui/material';

// Material UI Icons
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';

// Styled components
import { styled, alpha, useTheme } from '@mui/material/styles';

// Import your logo image
import logo from '../../../assets/brand/ico-format/blue-64X64.ico';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 24,
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  transition: 'all 0.3s ease',
  maxWidth: 1000,
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  '&:hover': {
    boxShadow: '0 25px 70px rgba(0,0,0,0.2)',
    transform: 'translateY(-5px)'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    transition: 'all 0.3s ease',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    '&:hover': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
      backgroundColor: theme.palette.background.paper,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`,
      backgroundColor: theme.palette.background.paper,
    }
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  padding: '14px 32px',
  fontWeight: 700,
  fontSize: '1rem',
  textTransform: 'none',
  boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  '&:hover': {
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: '0 15px 30px rgba(0,0,0,0.18)',
    background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
  },
  '&:active': {
    transform: 'translateY(1px) scale(0.98)',
  }
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.4)} 0%, ${alpha(theme.palette.primary.light, 0.4)} 100%)`,
    filter: 'blur(15px)',
    zIndex: 0,
  },
  '& img': {
    width: 64, // Set exact width to 64px
    height: 64, // Set exact height to 64px
    position: 'relative',
    zIndex: 1,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    '&:hover': {
      transform: 'scale(1.15) rotate(10deg)',
    }
  }
}));  

const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  borderRadius: 16,
  backgroundColor: alpha('#ffffff', 0.15),
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha('#ffffff', 0.25),
    transform: 'translateX(5px)',
  },
  '& .MuiAvatar-root': {
    backgroundColor: '#ffffff',
    color: theme.palette.secondary.dark,
    marginRight: theme.spacing(2),
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  }
}));

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({
    username: false,
    password: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    severity: 'error'
  });

  useEffect(() => {
    // Clear any existing auth data when visiting login page
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      navigate('/dashboard', { replace: true });  // Redirect to dashboard if already logged in
    } else {
      // Clear any existing auth data only if NOT already logged in.
      localStorage.removeItem('access_token');
      sessionStorage.clear();
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setErrors({
      ...errors,
      [name]: false
    });
  };

  const validateForm = () => {
    const newErrors = {
      username: !formData.username.trim(),
      password: !formData.password.trim()
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      setAlert({
        show: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.token);
        setAlert({
          show: true,
          message: 'Login successful! Redirecting...',
          severity: 'success'
        });
        
        // Short delay before redirecting for better UX
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        setAlert({
          show: true,
          message: data.error || 'Invalid username or password',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setAlert({
        show: true,
        message: 'An error occurred during login. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      show: false
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`,
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%239C92AC\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          zIndex: 0,
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={800}>
          <Box>
            <StyledCard sx={{ flexDirection: isMobile ? 'column' : 'row' }}>
              {/* Left side - Illustration and features */}
              {!isMobile && (
                <Box 
                  sx={{ 
                    flex: '1 1 50%',
                    background: `linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)`,
                    p: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'52\' height=\'26\' viewBox=\'0 0 52 26\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                      opacity: 0.8,
                      zIndex: 0,
                    }
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h3" fontWeight="800" sx={{ mb: 3, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                      Welcome to <br/> Your CRM Dashboard
                    </Typography>
                    
                    <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, fontSize: '1.1rem', textShadow: '0 1px 5px rgba(0,0,0,0.1)' }}>
                      Manage your business relationships and the data associated with them all in one place.
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <FeatureItem>
                        <Avatar sx={{ width: 48, height: 48 }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                            Centralized Management
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                            Access all your business data from a single dashboard
                          </Typography>
                        </Box>
                      </FeatureItem>
                      
                      <FeatureItem>
                        <Avatar sx={{ width: 48, height: 48 }}>
                          <SecurityIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                            Secure Access
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                            Your data is protected with enterprise-grade security
                          </Typography>
                        </Box>
                      </FeatureItem>
                      
                      <FeatureItem>
                        <Avatar sx={{ width: 48, height: 48 }}>
                          <EmailIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                            Seamless Communication
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                            Stay connected with your team and clients
                          </Typography>
                        </Box>
                      </FeatureItem>
                    </Box>
                  </Box>
                </Box>
              )}
              
              {/* Right side - Login form */}
              <Box 
                sx={{ 
                  flex: '1 1 50%',
                  p: { xs: 3, sm: 5 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'relative',
                  background: 'white',
                }}
              >
                <LogoContainer>
                  <img src={logo} alt="Brand Logo" />
                </LogoContainer>
                
                <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>
                  Sign In
                </Typography>
                
                <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
                  Access your account to continue
                </Typography>
                
                {alert.show && (
                  <Alert 
                    severity={alert.severity} 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 3,
                      boxShadow: alert.severity === 'error' 
                        ? `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`
                        : `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`,
                    }}
                    onClose={handleCloseAlert}
                  >
                    {alert.message}
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      Username
                    </Typography>
                    <StyledTextField
                      fullWidth
                      name="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                      error={errors.username}
                      helperText={errors.username ? 'Username is required' : ''}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      Password
                    </Typography>
                    <StyledTextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      helperText={errors.password ? 'Password is required' : ''}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  
                  <StyledButton
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </StyledButton>
                  
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Link 
                      href="#" 
                      underline="none" 
                      color="primary"
                      sx={{ 
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: theme.palette.primary.dark,
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Forgot your password?
                    </Link>
                  </Box>
                </form>
                
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 3, 
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}>
                    <HelpOutlineIcon color="info" sx={{ mr: 1.5, mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle2" color="info.main" fontWeight="bold">
                        Need Help?
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Contact your administrator or IT support if you're having trouble logging in.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </StyledCard>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ mt: 3 }}
            >
              © {new Date().getFullYear()} Your Company Name. All rights reserved.
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;

