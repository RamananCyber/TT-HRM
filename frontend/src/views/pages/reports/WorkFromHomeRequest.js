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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Avatar,
  ListItemIcon,
  ListItemText,
  Menu,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl
} from '@mui/material';

// Material UI Icons
import SendIcon from '@mui/icons-material/Send';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import LaptopIcon from '@mui/icons-material/Laptop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SubjectIcon from '@mui/icons-material/Subject';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CommentIcon from '@mui/icons-material/Comment';

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

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5),
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  fontWeight: 600,
  borderBottom: `2px solid ${theme.palette.primary.main}`,
  padding: theme.spacing(1.5),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.main, 0.03),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transition: 'background-color 0.2s ease',
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    const statusMap = {
      'Approved': 'success',
      'Rejected': 'error',
      'Pending': 'warning',
      'Cancelled': 'default'
    };
    return statusMap[status] || 'default';
  };

  return {
    fontWeight: 600,
    borderRadius: '6px',
    fontSize: '0.75rem',
    height: '24px',
    boxShadow: `0 2px 4px ${alpha(theme.palette[getStatusColor(status)]?.main || theme.palette.grey[500], 0.2)}`,
  };
});

export default function WorkFromHomeRequest() {
  const theme = useTheme();

  const [workFromHomeRequest, setFormData] = useState({
    from_date: '',
    to_date: '',
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

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    severity: 'info',
  });

  const [dialog, setDialog] = useState({
    open: false,
    type: '',
    requestId: null,
    comments: '',
  });

  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchUserRole();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (snackbar.visible) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, visible: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.visible]);

  // Calculate days automatically when dates change
  useEffect(() => {
    if (workFromHomeRequest.from_date && workFromHomeRequest.to_date) {
      const start = new Date(workFromHomeRequest.from_date);
      const end = new Date(workFromHomeRequest.to_date);

      if (end >= start) {
        // Calculate the difference in days
        const diffTime = Math.abs(end - start);
        let daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // If half day is selected and it's a single day request, set days to 0.5
        if (workFromHomeRequest.is_half_day && start.getTime() === end.getTime()) {
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
  }, [workFromHomeRequest.from_date, workFromHomeRequest.to_date, workFromHomeRequest.is_half_day]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/user-role/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      showSnackbar('Failed to fetch user role', 'error');
    }
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/work-from-home-requests/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showSnackbar('Failed to load work from home requests', 'error');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;

    if (name === 'from_date') {
      // If changing from_date and half-day is selected, set to_date to match
      if (workFromHomeRequest.is_half_day) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          to_date: value // Force to_date to match from_date
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));

        // If from_date is set and to_date is not, set to_date to from_date
        if (value && !workFromHomeRequest.to_date) {
          setFormData(prev => ({
            ...prev,
            to_date: value
          }));
        }

        // If to_date is before from_date, adjust it
        if (value && workFromHomeRequest.to_date && new Date(value) > new Date(workFromHomeRequest.to_date)) {
          setFormData(prev => ({
            ...prev,
            to_date: value
          }));
        }
      }
    } else if (name === 'to_date') {
      // If changing to_date and half-day is selected, prevent change
      if (workFromHomeRequest.is_half_day) {
        // Don't allow to_date to be different from from_date when half-day is selected
        setFormData(prev => ({
          ...prev,
          to_date: workFromHomeRequest.from_date
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleDialogChange = (e) => {
    setDialog(prev => ({
      ...prev,
      comments: e.target.value,
    }));
  };

  const validateForm = () => {
    const newErrors = {
      from_date: !workFromHomeRequest.from_date,
      to_date: !workFromHomeRequest.to_date,
      days: !workFromHomeRequest.days || parseFloat(workFromHomeRequest.days) <= 0,
      reason: !workFromHomeRequest.reason.trim(),
      half_day_type: workFromHomeRequest.is_half_day && !workFromHomeRequest.half_day_type
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // 7. Add a handler for half-day toggle
  const handleHalfDayToggle = (e) => {
    const isHalfDay = e.target.checked;
  
    setFormData(prev => {
      const updated = {
        ...prev,
        is_half_day: isHalfDay,
        // Always ensure half_day_type has a value when is_half_day is true
        half_day_type: isHalfDay ? (prev.half_day_type || 'first_half') : prev.half_day_type
      };
      
      if (isHalfDay && prev.from_date) {
        updated.to_date = prev.from_date;
        updated.days = "0.5";
      }
      
      return updated;
    });
  };

  const handleHalfDayTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      half_day_type: e.target.value
    }));
    setErrors(prev => ({ ...prev, half_day_type: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form state before validation:", workFromHomeRequest);

    if (!validateForm()) {
      showSnackbar('Please fill in all required fields correctly', 'error');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('access_token');

    const payload = {
      FromDate: workFromHomeRequest.from_date,
      ToDate: workFromHomeRequest.to_date,
      Days: workFromHomeRequest.days,
      Reason: workFromHomeRequest.reason,
      IsHalfDay: workFromHomeRequest.is_half_day,
      HalfDayType: workFromHomeRequest.is_half_day ? workFromHomeRequest.half_day_type : null
    };

    console.log("Payload being sent to server:", payload);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/work-from-home-requests/',
        payload,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        },
      );

      console.log("Server response:", response.data);

      showSnackbar('Work from home request submitted successfully!', 'success');
      handleReset();
      fetchRequests();
    } catch (error) {
      console.error(error);
      showSnackbar(
        error.response?.data?.error || 'Failed to submit work from home request',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };


  const handleReset = () => {
    setFormData({
      from_date: '',
      to_date: '',
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

  const handleAction = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `http://localhost:8000/api/work-from-home-requests/${dialog.requestId}/${dialog.type}/`,
        { comments: dialog.comments },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      showSnackbar(response.data.message || `Request ${dialog.type}d successfully!`, 'success');
      closeDialog();
      fetchRequests();
    } catch (error) {
      console.error(error);
      showSnackbar(
        error.response?.data?.error || `Failed to ${dialog.type} request`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type, requestId) => {
    setDialog({
      open: true,
      type,
      requestId,
      comments: '',
    });
  };

  const closeDialog = () => {
    setDialog({
      open: false,
      type: '',
      requestId: null,
      comments: '',
    });
  };

  const handleActionMenuOpen = (event, request) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedRequest(null);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      visible: true,
      message,
      severity,
    });
  };

  const getStatusChip = (status) => {
    let icon;
    switch (status) {
      case 'Approved':
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case 'Rejected':
        icon = <CancelIcon fontSize="small" />;
        break;
      case 'Cancelled':
        icon = <CloseIcon fontSize="small" />;
        break;
      default:
        icon = <AccessTimeIcon fontSize="small" />;
    }

    return (
      <StatusChip
        label={status}
        color={
          status === 'Approved' ? 'success' :
            status === 'Rejected' ? 'error' :
              status === 'Cancelled' ? 'default' : 'warning'
        }
        icon={icon}
        status={status}
        size="small"
      />
    );
  };

  const isAdmin = userRole && ['Super Admin', 'Admin', 'HR'].includes(userRole);

  // Get today's date in YYYY-MM-DD format for min attribute
  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

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
              <LaptopIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  Work From Home
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                  Submit your work from home request
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
                  <StyledTextField
                    fullWidth
                    type="date"
                    name="from_date"
                    value={workFromHomeRequest.from_date}
                    onChange={handleDateChange}
                    error={errors.from_date}
                    helperText={errors.from_date ? 'From date is required' : ''}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ min: today }}
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
                  <StyledTextField
                    fullWidth
                    type="date"
                    name="to_date"
                    value={workFromHomeRequest.to_date}
                    onChange={handleDateChange}
                    error={errors.to_date}
                    helperText={errors.to_date ? 'To date is required' :
                      (workFromHomeRequest.is_half_day ? 'Locked to match From Date for half-day requests' : '')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon color="primary" />
                        </InputAdornment>
                      ),
                      readOnly: workFromHomeRequest.is_half_day, // Make read-only when half-day is selected
                    }}
                    inputProps={{
                      min: workFromHomeRequest.from_date || today,
                      style: workFromHomeRequest.is_half_day ? { backgroundColor: alpha(theme.palette.action.disabled, 0.1) } : {}
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
                    value={workFromHomeRequest.days}
                    onChange={handleChange}
                    error={errors.days}
                    helperText={errors.days ? 'Please select valid number of days' : ''}
                    disabled={!workFromHomeRequest.from_date || !workFromHomeRequest.to_date}
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
                          checked={workFromHomeRequest.is_half_day}
                          onChange={handleHalfDayToggle}
                          color="primary"
                          disabled={workFromHomeRequest.from_date !== workFromHomeRequest.to_date}
                        />
                      }
                      label={`Request for Half Day (Currently: ${workFromHomeRequest.is_half_day ? 'Yes' : 'No'})`}
                      sx={{ mb: 1 }}
                    />

                    {workFromHomeRequest.is_half_day && (
                      <FormControl component="fieldset" error={errors.half_day_type}>
                        <RadioGroup
                          row
                          name="half_day_type"
                          value={workFromHomeRequest.half_day_type}
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
                        {!workFromHomeRequest.is_half_day && workFromHomeRequest.from_date !== workFromHomeRequest.to_date &&
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
                    Reason for Work From Home
                  </Typography>
                  <StyledTextField
                    fullWidth
                    multiline
                    rows={4}
                    name="reason"
                    placeholder="Please provide a detailed reason for your work from home request..."
                    value={workFromHomeRequest.reason}
                    onChange={handleChange}
                    error={errors.reason}
                    helperText={errors.reason ? 'Please provide a reason for your work from home request' : ''}
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
                        Work From Home Guidelines
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Submit your request at least 1 day in advance when possible<br />
                        • Ensure you have a stable internet connection and required equipment<br />
                        • Be available during regular working hours<br />
                        • Attend all scheduled meetings virtually
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
        </CardContent>
      </StyledCard>

      {/* Recent Requests Section */}
      <StyledCard sx={{ mt: 4 }}>
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.8)} 0%, ${alpha(theme.palette.secondary.dark, 0.9)} 100%)`,
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
              backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
              zIndex: 1,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                Your Recent Requests
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Track the status of your work from home requests
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="info"
              startIcon={<RefreshIcon />}
              onClick={fetchRequests}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {requestsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : requests.length > 0 ? (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableHeadCell>Status</StyledTableHeadCell>
                    <StyledTableHeadCell>From Date</StyledTableHeadCell>
                    <StyledTableHeadCell>To Date</StyledTableHeadCell>
                    <StyledTableHeadCell>Days</StyledTableHeadCell>
                    <StyledTableHeadCell>Reason</StyledTableHeadCell>
                    <StyledTableHeadCell>Created At</StyledTableHeadCell>
                    {isAdmin && <StyledTableHeadCell>Employee</StyledTableHeadCell>}
                    <StyledTableHeadCell align="right">Actions</StyledTableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <StyledTableRow key={request.WorkFromHomeRequestID}>
                      <StyledTableCell>{getStatusChip(request.Status)}</StyledTableCell>
                      <StyledTableCell>{new Date(request.FromDate).toLocaleDateString()}</StyledTableCell>
                      <StyledTableCell>{new Date(request.ToDate).toLocaleDateString()}</StyledTableCell>
                      <StyledTableCell>
                        {request.Days}
                        {request.IsHalfDay && (
                          <Tooltip title={request.HalfDayType === 'first_half' ? 'Morning Half' : 'Afternoon Half'}>
                            <Chip
                              label={request.HalfDayType === 'first_half' ? 'AM' : 'PM'}
                              size="small"
                              color="info"
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        )}
                      </StyledTableCell>
                      <StyledTableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Tooltip title={request.Reason}>
                          <span>{request.Reason}</span>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell>{new Date(request.CreatedAt).toLocaleDateString()}</StyledTableCell>
                      {isAdmin && (
                        <StyledTableCell>{request.requested_by_name}</StyledTableCell>
                      )}
                      <StyledTableCell align="right">
                        {isAdmin && request.Status === 'Pending' ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Approve">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => openDialog('approve', request.WorkFromHomeRequestID)}
                                sx={{
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.success.main, 0.2),
                                  }
                                }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => openDialog('reject', request.WorkFromHomeRequestID)}
                                sx={{
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.error.main, 0.2),
                                  }
                                }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => handleActionMenuOpen(e, request)}
                              sx={{
                                bgcolor: alpha(theme.palette.grey[500], 0.1),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.grey[500], 0.2),
                                }
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.background.default, 0.5),
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`
            }}>
              <LaptopIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                No work from home requests found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Submit a new request using the form above
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchRequests}
              >
                Refresh
              </Button>
            </Box>
          )}
        </CardContent>
      </StyledCard>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
      >
        {selectedRequest && (
          <>
            <MenuItem disabled>
              <ListItemText
                primary={`Status: ${selectedRequest.Status}`}
                secondary={`Created: ${new Date(selectedRequest.CreatedAt).toLocaleDateString()}`}
              />
            </MenuItem>
            <Divider />
            {selectedRequest.Comments && (
              <MenuItem disabled>
                <ListItemIcon>
                  <CommentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Comments"
                  secondary={selectedRequest.Comments}
                />
              </MenuItem>
            )}
            {selectedRequest.Status === 'Pending' && !isAdmin && (
              <MenuItem onClick={() => {
                handleActionMenuClose();
                openDialog('cancel', selectedRequest.WorkFromHomeRequestID);
              }}>
                <ListItemIcon>
                  <CancelIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Cancel Request" />
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={dialog.open}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialog.type === 'approve' ? 'Approve Request' :
            dialog.type === 'reject' ? 'Reject Request' : 'Cancel Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {dialog.type === 'approve' ? 'Are you sure you want to approve this work from home request?' :
              dialog.type === 'reject' ? 'Are you sure you want to reject this work from home request?' :
                'Are you sure you want to cancel your work from home request?'}
          </DialogContentText>
          <StyledTextField
            fullWidth
            label="Comments (Optional)"
            multiline
            rows={3}
            value={dialog.comments}
            onChange={handleDialogChange}
            placeholder={
              dialog.type === 'approve' ? 'Add any approval comments...' :
                dialog.type === 'reject' ? 'Please provide a reason for rejection...' :
                  'Reason for cancellation...'
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                  <CommentIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={closeDialog}
            variant="outlined"
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <StyledButton
            onClick={handleAction}
            variant="contained"
            color={dialog.type === 'approve' ? 'success' : 'error'}
            disabled={loading}
            startIcon={dialog.type === 'approve' ? <CheckCircleIcon /> : <CancelIcon />}
          >
            {loading ? 'Processing...' :
              dialog.type === 'approve' ? 'Approve' :
                dialog.type === 'reject' ? 'Reject' : 'Cancel Request'}
          </StyledButton>
        </DialogActions>
      </Dialog>

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
              Processing...
            </Typography>
          </Box>
        </Box>
      </Backdrop>
    </Box>
  );
}

