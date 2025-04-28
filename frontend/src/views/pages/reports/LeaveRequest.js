import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Fade,
  CircularProgress,
  Backdrop,
  Divider,
  Paper,
  Stack,
  InputAdornment,
  FormHelperText,
  Tooltip,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { differenceInDays, addDays } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
// Material UI Icons
import SendIcon from '@mui/icons-material/Send';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SubjectIcon from '@mui/icons-material/Subject';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Styled components
import { styled, alpha, useTheme } from '@mui/material/styles';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  '&:hover': {
    boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  },
  '&:active': {
    transform: 'translateY(1px)',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    '&:hover': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
      backgroundColor: theme.palette.background.paper,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
      backgroundColor: theme.palette.background.paper,
    }
  }
}));

export default function LeaveRequest() {
  const theme = useTheme();

  const [leaveRequest, setFormData] = useState({
    from_date: null,
    to_date: null,
    days: '',
    reason: '',
    is_half_day: false,
    half_day_type: 'first_half' // 'first_half' or 'second_half'
  });

  const [errors, setErrors] = useState({
    from_date: false,
    to_date: false,
    days: false,
    reason: false,
    half_day_type: false
  });


  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    severity: 'info',
  });

  // Calculate days automatically when dates change
  useEffect(() => {
    if (leaveRequest.from_date && leaveRequest.to_date) {
      const start = new Date(leaveRequest.from_date);
      const end = new Date(leaveRequest.to_date);

      if (end >= start) {
        let daysDiff = differenceInDays(end, start) + 1;

        // If half day is selected and it's a single day request, set days to 0.5
        if (leaveRequest.is_half_day && differenceInDays(end, start) === 0) {
          daysDiff = 0.5;
        }

        setFormData(prev => ({
          ...prev,
          days: daysDiff.toString()
        }));
        setErrors(prev => ({ ...prev, days: false }));
      } else {
        setFormData(prev => ({
          ...prev,
          days: ''
        }));
        setErrors(prev => ({ ...prev, days: true }));
      }
    }
  }, [leaveRequest.from_date, leaveRequest.to_date, leaveRequest.is_half_day]);

  useEffect(() => {
    if (snackbar.visible) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, visible: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.visible]);

  const handleDateChange = (name, date) => {
    if (name === 'from_date') {
      // If changing from_date and half-day is selected, set to_date to match
      if (leaveRequest.is_half_day) {
        setFormData(prev => ({
          ...prev,
          [name]: date,
          to_date: date // Force to_date to match from_date
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: date
        }));

        // If from_date is set and to_date is not, set to_date to from_date
        if (date && !leaveRequest.to_date) {
          setFormData(prev => ({
            ...prev,
            to_date: date
          }));
        }

        // If to_date is before from_date, adjust it
        if (date && leaveRequest.to_date && date > leaveRequest.to_date) {
          setFormData(prev => ({
            ...prev,
            to_date: date
          }));
        }
      }
    } else if (name === 'to_date') {
      // If changing to_date and half-day is selected, prevent change
      if (leaveRequest.is_half_day) {
        // Don't allow to_date to be different from from_date when half-day is selected
        setFormData(prev => ({
          ...prev,
          to_date: leaveRequest.from_date
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: date
        }));
      }
    }

    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleHalfDayToggle = (e) => {
    const isHalfDay = e.target.checked;

    setFormData(prev => ({
      ...prev,
      is_half_day: isHalfDay
    }));

    // If half-day is selected, ensure from_date and to_date are the same
    if (isHalfDay && leaveRequest.from_date) {
      setFormData(prev => ({
        ...prev,
        to_date: leaveRequest.from_date
      }));
    }
  };

  // 6. Add a handler for half-day type selection
  const handleHalfDayTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      half_day_type: e.target.value
    }));
    setErrors(prev => ({ ...prev, half_day_type: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const validateForm = () => {
    const newErrors = {
      from_date: !leaveRequest.from_date,
      to_date: !leaveRequest.to_date,
      days: !leaveRequest.days || parseFloat(leaveRequest.days) <= 0,
      reason: !leaveRequest.reason.trim(),
      half_day_type: leaveRequest.is_half_day && !leaveRequest.half_day_type
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showSnackbar('Please fill in all required fields correctly.', 'error');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('access_token');

    try {
      const response = await axios.post(
        'http://localhost:8000/api/leave-requests/',
        {
          FromDate: leaveRequest.from_date.toISOString().split('T')[0],
          ToDate: leaveRequest.to_date.toISOString().split('T')[0],
          Days: leaveRequest.days,
          Reason: leaveRequest.reason,
          IsHalfDay: leaveRequest.is_half_day,
          HalfDayType: leaveRequest.is_half_day ? leaveRequest.half_day_type : null
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      showSnackbar('Leave request submitted successfully!', 'success');
      handleReset();
    } catch (error) {
      console.error(error);
      showSnackbar(
        error.response?.data?.message || 'Failed to submit leave request.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      from_date: null,
      to_date: null,
      days: '',
      reason: '',
      is_half_day: false,
      half_day_type: 'first_half'
    });
    setErrors({
      from_date: false,
      to_date: false,
      days: false,
      reason: false,
      half_day_type: false
    });
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      visible: true,
      message,
      severity,
    });
  };

  const daysOptions = [
    { label: '1 Day', value: '1' },
    { label: '2 Days', value: '2' },
    { label: '3 Days', value: '3' },
    { label: '4 Days', value: '4' },
    { label: '5 Days', value: '5' },
    { label: '6 Days', value: '6' },
    { label: '7 Days', value: '7' },
    { label: '8 Days', value: '8' },
    { label: '9 Days', value: '9' },
    { label: '10 Days', value: '10' },
    { label: '11 Days', value: '11' },
    { label: '12 Days', value: '12' },
    { label: '13 Days', value: '13' },
    { label: '14 Days', value: '14' },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <StyledCard>
          {/* Header Section */}
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '16px 16px 0 0',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
                zIndex: 1,
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BeachAccessIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Request Leave
                  </Typography>
                  <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                    Submit your leave application
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Form Section */}
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                    >
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      From Date
                    </Typography>
                    <DatePicker
                      value={leaveRequest.from_date}
                      onChange={(date) => handleDateChange('from_date', date)}
                      disablePast
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          error: errors.from_date,
                          helperText: errors.from_date ? 'From date is required' : '',
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <EventIcon color="primary" />
                              </InputAdornment>
                            ),
                          }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
  <Typography 
    variant="subtitle2" 
    fontWeight="bold" 
    sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
  >
    <DateRangeIcon fontSize="small" sx={{ mr: 1 }} />
    To Date
  </Typography>
  <DatePicker
    value={leaveRequest.to_date}
    onChange={(date) => handleDateChange('to_date', date)}
    disablePast
    minDate={leaveRequest.from_date || undefined}
    slotProps={{
      textField: {
        fullWidth: true,
        variant: 'outlined',
        error: errors.to_date,
        helperText: errors.to_date ? 'To date is required' : 
                  (leaveRequest.is_half_day ? 'Locked to match From Date for half-day requests' : ''),
        InputProps: {
          startAdornment: (
            <InputAdornment position="start">
              <EventIcon color="primary" />
            </InputAdornment>
          ),
          readOnly: leaveRequest.is_half_day, // Make read-only when half-day is selected
        }
      }
    }}
    disabled={leaveRequest.is_half_day} // Disable the picker when half-day is selected
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        '&:hover': {
          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
        '&.Mui-focused': {
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
        ...(leaveRequest.is_half_day && {
          backgroundColor: alpha(theme.palette.action.disabled, 0.1)
        })
      }
    }}
  />
</Grid>

                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                    >
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                      Number of Days
                    </Typography>
                    <StyledTextField
                      select
                      fullWidth
                      name="days"
                      value={leaveRequest.days}
                      onChange={handleChange}
                      error={errors.days}
                      helperText={errors.days ? 'Please select valid number of days' : ''}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {daysOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </StyledTextField>
                    <FormHelperText sx={{ ml: 2 }}>
                      <InfoOutlinedIcon fontSize="small" sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      Automatically calculated based on date range
                    </FormHelperText>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                      >
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                        Half Day Option
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={leaveRequest.is_half_day}
                            onChange={handleHalfDayToggle}
                            color="primary"
                            disabled={!leaveRequest.from_date || (leaveRequest.from_date && leaveRequest.to_date &&
                              differenceInDays(leaveRequest.to_date, leaveRequest.from_date) !== 0)}
                          />
                        }
                        label="Request for Half Day"
                        sx={{ mb: 1 }}
                      />

                      {leaveRequest.is_half_day && (
                        <FormControl component="fieldset" error={errors.half_day_type}>
                          <RadioGroup
                            row
                            name="half_day_type"
                            value={leaveRequest.half_day_type}
                            onChange={handleHalfDayTypeChange}
                          >
                            <FormControlLabel
                              value="first_half"
                              control={<Radio color="primary" />}
                              label="First Half (Morning)"
                            />
                            <FormControlLabel
                              value="second_half"
                              control={<Radio color="primary" />}
                              label="Second Half (Afternoon)"
                            />
                          </RadioGroup>
                          {errors.half_day_type && (
                            <FormHelperText error>Please select which half of the day</FormHelperText>
                          )}
                        </FormControl>
                      )}

                      <Box sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      }}>
                        <Typography variant="caption" display="block">
                          <InfoOutlinedIcon fontSize="small" sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                          Half day option is only available for single-day requests.
                          {leaveRequest.from_date && leaveRequest.to_date &&
                            differenceInDays(leaveRequest.to_date, leaveRequest.from_date) !== 0 &&
                            " Please select the same date for From Date and To Date to enable this option."}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                    >
                      <SubjectIcon fontSize="small" sx={{ mr: 1 }} />
                      Reason for Leave
                    </Typography>
                    <StyledTextField
                      fullWidth
                      multiline
                      rows={4}
                      name="reason"
                      placeholder="Please provide a detailed reason for your leave request..."
                      value={leaveRequest.reason}
                      onChange={handleChange}
                      error={errors.reason}
                      helperText={errors.reason ? 'Please provide a reason for your leave request' : ''}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                            <SubjectIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      mb: 3
                    }}>
                      <HelpOutlineIcon color="info" sx={{ mr: 1.5, mt: 0.3 }} />
                      <Box>
                        <Typography variant="subtitle2" color="info.main" fontWeight="bold">
                          Leave Request Guidelines
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          • Submit your leave request at least 3 days in advance when possible<br />
                          • Provide a detailed reason to help with approval process<br />
                          • For emergency leaves, please contact your manager directly
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleReset}
                    startIcon={<RestartAltIcon />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Reset Form
                  </Button>
                  <StyledButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SendIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </StyledButton>
                </Box>
              </form>
            </Paper>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" align="center">
                Your leave request will be reviewed by your manager or HR department.
                You'll receive a notification once it's approved or rejected.
              </Typography>
            </Box>
          </CardContent>
        </StyledCard>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.visible}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, visible: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={Fade}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, visible: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: theme.shadows[6]
            }}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setSnackbar(prev => ({ ...prev, visible: false }))}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Loading Backdrop */}
        <Backdrop
          sx={{
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backdropFilter: 'blur(4px)'
          }}
          open={loading}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress color="inherit" size={60} thickness={4} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="inherit">
                Submitting...
              </Typography>
            </Box>
          </Box>
        </Backdrop>
      </Box>
    </LocalizationProvider>
  );
}

