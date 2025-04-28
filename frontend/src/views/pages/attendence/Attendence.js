import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
// Material-UI components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// Material-UI icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CoffeeIcon from '@mui/icons-material/Coffee';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import TimerIcon from '@mui/icons-material/Timer';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';

// Styled components
import { styled, alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

// Styled components with enhanced visual design
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme?.spacing(3) || '24px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
  borderRadius: '12px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.08)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
  }
}));

const StatCard = styled(Paper)(({ color, theme }) => ({
  padding: '24px',
  textAlign: 'center',
  height: '100%',
  backgroundColor: color ? alpha(color, 0.05) : theme.palette.background.default,
  border: `1px solid ${color ? alpha(color, 0.2) : theme.palette.divider}`,
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: `0 8px 16px ${alpha(color || '#000', 0.1)}`,
    transform: 'translateY(-4px)',
  }
}));

const TaskListItem = styled(ListItem)(({ theme }) => ({
  marginBottom: '10px',
  borderRadius: '8px',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderColor: alpha(theme.palette.primary.main, 0.3),
  }
}));

const PriorityBadge = styled(Chip)(({ color, theme }) => ({
  fontWeight: 600,
  borderRadius: '6px',
  fontSize: '0.75rem',
  height: '24px',
  boxShadow: `0 2px 4px ${alpha(color || theme.palette.grey[500], 0.2)}`,
}));

const ProgressBar = styled(LinearProgress)(({ value, theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
  }
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
    }
  }
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '10px 24px',
  fontWeight: 600,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }
}));

const Attendance = () => {
  const theme = useTheme();

  // State variables (same as before)
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskHours, setTaskHours] = useState({});
  const [taskComments, setTaskComments] = useState({});
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [punchedInTasks, setPunchedInTasks] = useState([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakHours, setBreakHours] = useState("");
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [taskCompletionStatus, setTaskCompletionStatus] = useState({});
  const [totalInactiveTime, setTotalInactiveTime] = useState(() => {
    const isPunchedIn = localStorage.getItem('isPunchedIn') === 'true';
    const savedInactiveTime = localStorage.getItem('totalInactiveTime');
    return isPunchedIn && savedInactiveTime ? parseFloat(savedInactiveTime) : 0;
  });
  const [currentIdleTime, setCurrentIdleTime] = useState(0);

  // New state variables for enhanced UI
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [anchorEl, setAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const totalInactiveTimeRef = useRef(totalInactiveTime);
  const isPunchedInRef = useRef(isPunchedIn);

  // Update refs when state changes
  useEffect(() => {
    isPunchedInRef.current = isPunchedIn;
  }, [isPunchedIn]);

  useEffect(() => {
    totalInactiveTimeRef.current = totalInactiveTime;
  }, [totalInactiveTime]);

  // Existing useEffects and functions (same as before)
  const handleCurrentIdleTime = useCallback((idleTime) => {
    console.log('Current idle time received:', idleTime);
    // Your idle time handling logic here
  }, []); // No dependencies!

  // Set up listeners ONCE with a single useEffect
  useEffect(() => {
    console.log('Setting up ALL listeners');

    // Set up both listeners
    const inactiveCleanup = window.electronAPI?.onInactiveTime(handleInactiveTime);
    const idleCleanup = window.electronAPI?.onCurrentIdleTime(handleCurrentIdleTime);

    // Return a cleanup function that handles both
    return () => {
      console.log('Cleaning up ALL listeners');
      if (inactiveCleanup) inactiveCleanup();
      if (idleCleanup) idleCleanup();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleInactiveTime = useCallback((inactiveTime) => {
    console.log('Inactive time received:', inactiveTime);

    // Use the ref instead of the state directly
    if (!isPunchedInRef.current) return;

    if (typeof inactiveTime === 'number') {
      const newTotalInactiveTime = totalInactiveTimeRef.current + inactiveTime;
      setTotalInactiveTime(newTotalInactiveTime);
      localStorage.setItem('totalInactiveTime', newTotalInactiveTime.toString());
    }
  }, []); // No dependencies!




  useEffect(() => {
    const storedIsOnBreak = localStorage.getItem('isOnBreak');
    if (storedIsOnBreak === 'true') {
      setIsOnBreak(true);
      setBreakStartTime(new Date());
    }
    checkPunchInStatus();
    if (!isPunchedIn) {
      fetchTasks();
    }

    const handleSystemStats = (stats) => {
      console.log(stats);
    };

    const cleanupSystemStats = window.electronAPI?.onSystemStats(handleSystemStats);

    return () => {
      cleanupSystemStats?.();
    };
  }, [isPunchedIn]);

  useEffect(() => {
    const handleSystemEvent = (_, eventType) => {
      console.log('System event:', eventType);

      if (eventType === 'System Wake') {
        checkPunchInStatus();
      }
    };

    const cleanup = window.electronAPI?.onSystemEvent(handleSystemEvent);
    return () => {
      cleanup?.();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/tasks/?mine=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        //throw new Error('Failed to fetch tasks');
      }



      const activeTasks = response.data.filter(task => task.Status !== 'completed');

      setTasks(isPunchedIn ? punchedInTasks : activeTasks);

      // Show success message
      showSnackbar('Tasks loaded successfully', 'success');
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
      showSnackbar('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (taskId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:8000/api/task-hours/',
        {
          taskId,
          hoursWorked: parseFloat(taskHours[taskId]) || 0,
          comments: taskComments[taskId] || ''
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setCompletedTaskIds(prev => [...prev, taskId]);
      showSnackbar('Task submitted successfully', 'success');
    } catch (err) {
      setError('Failed to submit task hours: ' + err.response.data.error);
      showSnackbar('Failed to submit task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakStart = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:8000/api/break-start/',
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      localStorage.setItem('isOnBreak', 'true');
      setIsOnBreak(true);
      setBreakStartTime(new Date());
      showSnackbar('Break started', 'info');
    } catch (err) {
      setError('Failed to start break: ' + err.message);
      showSnackbar('Failed to start break', 'error');
    }
  };

  const handleBreakEnd = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const breakEndTime = new Date();
      const breakDuration = Math.round((breakEndTime - breakStartTime) / (1000 * 60));

      await axios.post(
        'http://localhost:8000/api/break-end/',
        { duration: breakDuration },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      localStorage.removeItem('isOnBreak');
      setIsOnBreak(false);
      setBreakStartTime(null);
      setTotalBreakTime(prev => prev + breakDuration);
      showSnackbar(`Break ended: ${Math.floor(breakDuration / 60)}h ${breakDuration % 60}m recorded`, 'info');
    } catch (err) {
      setError('Failed to end break: ' + err.message);
      showSnackbar('Failed to end break', 'error');
    }
  };

  const checkPunchInStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No access token found, skipping punch-in status check');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/punch-in/status/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.is_punched_in) {
        setIsPunchedIn(true);
        localStorage.setItem('isPunchedIn', 'true');
        setSelectedTaskIds(response.data.tasks.map(t => t.TaskID));
        setPunchedInTasks(response.data.tasks);

        const initialHours = {};
        const initialComments = {};
        const initialCompletionStatus = {};
        response.data.tasks.forEach(task => {
          initialHours[task.TaskID] = task.hours_worked || '';
          initialComments[task.TaskID] = task.comments || '';
          initialCompletionStatus[task.TaskID] = task.is_completed || false;
        });
        setTaskHours(initialHours);
        setTaskComments(initialComments);
        setTaskCompletionStatus(initialCompletionStatus);
        setTotalBreakTime(response.data.BreakHours || 0);
        setCompletedTaskIds(response.data.tasks
          .filter(t => t.is_completed)
          .map(t => t.TaskID)
        );

        if (response.data.tasks.length > 0) {
          fetchTasks();
        } else {
          // Clear punch-in flag if not punched in
          localStorage.removeItem('isPunchedIn');
          setTotalInactiveTime(0);
          localStorage.removeItem('totalInactiveTime');
        }
      }
    } catch (err) {
      console.error('Failed to check punch-in status:', err);
      setError('Failed to check punch-in status: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleTaskSelectionChange = async (taskId) => {
    setTaskCompletionStatus((prevStatus) => ({
      ...prevStatus,
      [taskId]: !prevStatus[taskId],
    }));
  };

  const handlePunchIn = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:8000/api/punch-in/',
        { tasks: selectedTaskIds },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setIsPunchedIn(true);
      localStorage.setItem('isPunchedIn', 'true');
      // Reset inactive time when punching in
      setTotalInactiveTime(0);
      localStorage.setItem('totalInactiveTime', '0');

      const initialHours = {};
      if (selectedTaskIds.length === 0) {
        selectedTaskIds.push(response.dummyTaskId);
      }
      selectedTaskIds.forEach(id => {
        initialHours[id] = '';
      });
      setTaskHours(initialHours);
      showSnackbar('Punched in successfully!', 'success');
    } catch (err) {
      setError('Failed to punch in: ' + err.message);
      showSnackbar('Failed to punch in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskPunchOut = async (taskId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const isCompleted = taskCompletionStatus[taskId] || false;

      await axios.post(
        'http://localhost:8000/api/task-punch-out/',
        {
          taskId,
          hoursWorked: parseFloat(taskHours[taskId]) || 0,
          comments: taskComments[taskId] || '',
          markCompleted: isCompleted
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setCompletedTaskIds(prev => [...prev, taskId]);
      showSnackbar('Task submitted successfully', 'success');

      if (selectedTaskIds.length === completedTaskIds.length + 1) {
        setIsPunchedIn(false);
      }
    } catch (err) {
      setError('Failed to punch out task: ' + err.response?.data?.error || err.message);
      showSnackbar('Failed to submit task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const totalActiveTime = Object.values(taskHours).reduce((sum, hours) => sum + (parseFloat(hours) || 0), 0);
      console.log('Sending total inactive time (seconds):', totalInactiveTime);

      const taskDetails = selectedTaskIds.map(taskId => ({
        taskId: taskId,
        hoursWorked: parseFloat(taskHours[taskId]) || 0,
        comments: taskComments[taskId] || '',
        markCompleted: taskCompletionStatus[taskId]
      }));

      await axios.post(
        'http://localhost:8000/api/punch-out/',
        {
          tasks: taskDetails,
          totalActiveTime,
          totalInactiveTime: totalInactiveTime
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setIsPunchedIn(false);
      localStorage.removeItem('isPunchedIn');
      setSelectedTaskIds([]);
      setTaskHours({});
      setTaskComments({});
      setCompletedTaskIds([]);
      setTotalInactiveTime(0);
      localStorage.removeItem('totalInactiveTime');
      showSnackbar('Punched out successfully!', 'success');
    } catch (err) {
      setError('Failed to punch out: ' + (err.response?.data?.error || err.message));
      showSnackbar('Failed to punch out', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskHours = (taskId, hours) => {
    setTaskHours(prev => ({
      ...prev,
      [taskId]: hours
    }));
  };

  const updateTaskComments = (taskId, comment) => {
    setTaskComments(prev => ({
      ...prev,
      [taskId]: comment
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <LocalFireDepartmentIcon color="error" />;
      case 'medium':
        return <PriorityHighIcon color="warning" />;
      case 'low':
        return <HourglassEmptyIcon color="info" />;
      default:
        return <HourglassEmptyIcon color="action" />;
    }
  };

  // New helper functions for enhanced UI
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
    handleMenuClose();
  };

  const handleFilterChange = (filterOption) => {
    setFilterPriority(filterOption);
    handleMenuClose();
  };

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      const matchesSearch =
        task.TaskName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.Description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Priority filter
      const matchesPriority =
        filterPriority === 'all' ||
        task.Priority?.toLowerCase() === filterPriority.toLowerCase();

      return matchesSearch && matchesPriority;
    }).sort((a, b) => {
      // Sort logic
      switch (sortBy) {
        case 'deadline':
          return new Date(a.Deadline) - new Date(b.Deadline);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.Priority?.toLowerCase()] - priorityOrder[b.Priority?.toLowerCase()];
        case 'hours':
          return b.ExpectedHours - a.ExpectedHours;
        case 'name':
          return a.TaskName.localeCompare(b.TaskName);
        default:
          return 0;
      }
    });
  }, [tasks, searchQuery, filterPriority, sortBy]);

  // Memoize task rendering to improve performance
  const renderTask = useCallback((taskId) => {
    const task = tasks.find(t => t.TaskID === taskId);
    const isCompleted = completedTaskIds.includes(taskId);

    const taskName = task && task.TaskName ? task.TaskName : "Dummy Task - Auto Generated";
    const projectName = task && task.project_name ? task.project_name : "Dummy Project - Auto Generated";
    const taskDescription = task && task.Description ? task.Description : "Created automatically as no tasks were selected.";
    const ExpectedHours = task && task.ExpectedHours ? task.ExpectedHours : 0;
    const Priority = task && task.Priority ? task.Priority : "Low";
    const Deadline = task && task.Deadline ? task.Deadline : new Date();

    // Calculate progress percentage
    const hoursWorked = parseFloat(taskHours[taskId]) || 0;
    const progressPercentage = Math.min(Math.round((hoursWorked / ExpectedHours) * 100), 100);

    // Calculate days remaining
    const daysRemaining = Math.ceil((new Date(Deadline) - new Date()) / (1000 * 60 * 60 * 24)) - 1;

    const isOverdue = daysRemaining < 0;

    return (
      <Zoom in={true} key={taskId} style={{ transitionDelay: '100ms' }}>
        <StyledCard>
          <CardHeader
            avatar={
              <Avatar sx={{
                bgcolor: getPriorityColor(Priority),
                boxShadow: `0 2px 8px ${alpha(getPriorityColor(Priority), 0.4)}`
              }}>
                {getPriorityIcon(Priority)}
              </Avatar>
            }
            action={
              <Box>
                {isCompleted && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Completed"
                    color="success"
                    size="small"
                    sx={{ mr: 2, fontWeight: 600 }}
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={taskCompletionStatus[taskId] || false}
                      onChange={() => handleTaskSelectionChange(taskId)}
                      color="primary"
                    />
                  }
                  label="Mark as Completed"
                />
              </Box>
            }
            title={
              <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                {taskName}
              </Typography>
            }
            subheader={
              <Box display="flex" alignItems="center" gap={1}>
                <BusinessIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {projectName}
                </Typography>
              </Box>
            }
            sx={{
              backgroundColor: isCompleted
                ? alpha(theme.palette.success.main, 0.08)
                : alpha(theme.palette.primary.main, 0.05),
              borderBottom: `1px solid ${isCompleted
                ? alpha(theme.palette.success.main, 0.2)
                : alpha(theme.palette.primary.main, 0.1)}`
            }}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Progress
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box width="100%" mr={2}>
                      <ProgressBar
                        variant="determinate"
                        value={progressPercentage}
                        color={progressPercentage >= 100 ? "success" : "primary"}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {progressPercentage}%
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  label="Hours Worked"
                  type="number"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon fontSize="small" color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="body2" color="text.secondary">
                          / {ExpectedHours} hrs
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    step: 0.5,
                    min: 0,
                    max: ExpectedHours * 1.5, // Allow some overtime
                    sx: { fontWeight: 500 }
                  }}
                  value={taskHours[taskId] || ''}
                  onChange={(e) => updateTaskHours(taskId, e.target.value)}
                  required
                  disabled={isCompleted}
                  variant="outlined"
                  sx={{ mb: 3 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Progress Update & Comments"
                  fullWidth
                  multiline
                  rows={3}
                  value={taskComments[taskId] || ''}
                  onChange={(e) => updateTaskComments(taskId, e.target.value)}
                  placeholder="What did you accomplish? Any blockers or challenges? Next steps?"
                  disabled={isCompleted}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                        <DescriptionIcon fontSize="small" color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Box mt={4}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: '8px'
                  }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Project</Typography>
                    <Box display="flex" alignItems="center" mt={0.5}>
                      <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight="medium">{projectName}</Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{
                    p: 2,
                    bgcolor: isOverdue
                      ? alpha(theme.palette.error.main, 0.03)
                      : alpha(theme.palette.info.main, 0.03),
                    border: `1px solid ${isOverdue
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.info.main, 0.1)}`,
                    borderRadius: '8px'
                  }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Due Date</Typography>
                    <Box display="flex" alignItems="center" mt={0.5}>
                      <CalendarTodayIcon fontSize="small" sx={{
                        mr: 1,
                        color: isOverdue ? 'error.main' : 'info.main'
                      }} />
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(Deadline).toLocaleDateString()}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            ml: 1,
                            fontWeight: 'bold',
                            color: isOverdue ? 'error.main' : 'info.main'
                          }}
                        >
                          {isOverdue
                            ? `(${Math.abs(daysRemaining)} days overdue)`
                            : daysRemaining === 0
                              ? '(Today)'
                              : daysRemaining === 1
                                ? '(Tomorrow)'
                                : `(${daysRemaining} days left)`}
                        </Typography>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{
                    p: 2,
                    bgcolor: alpha(getPriorityColor(Priority), 0.03),
                    border: `1px solid ${alpha(getPriorityColor(Priority), 0.1)}`,
                    borderRadius: '8px'
                  }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Priority</Typography>
                    <Box display="flex" alignItems="center" mt={0.5}>
                      {getPriorityIcon(Priority)}
                      <Box ml={1}>
                        <PriorityBadge
                          label={Priority}
                          color={getPriorityColor(Priority)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Paper elevation={0} sx={{
                p: 2,
                mt: 2,
                bgcolor: alpha(theme.palette.background.default, 0.7),
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px'
              }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Description</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6 }}>{taskDescription}</Typography>
              </Paper>
            </Box>

            {!isCompleted && (
              <Box mt={3}>
                <AnimatedButton
                  variant="contained"
                  color="primary"
                  startIcon={<DoneAllIcon />}
                  onClick={() => handleTaskPunchOut(taskId)}
                  disabled={!taskHours[taskId]}
                >
                  Submit Task
                </AnimatedButton>
              </Box>
            )}
          </CardContent>
        </StyledCard>
      </Zoom>
    );
  }, [tasks, completedTaskIds, taskCompletionStatus, taskHours, taskComments, handleTaskSelectionChange, handleTaskPunchOut, theme]);

  // Memoize the task list to prevent unnecessary re-renders
  const TaskList = useMemo(() => {
    return (
      <List sx={{ p: 0 }}>
        {filteredTasks.map((task, index) => (
          <Fade in={true} style={{ transitionDelay: `${index * 50}ms` }} key={task.TaskID}>
            <Box>
              <TaskListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedTaskIds.includes(task.TaskID)}
                    onChange={() => {
                      setSelectedTaskIds(prev =>
                        prev.includes(task.TaskID)
                          ? prev.filter(id => id !== task.TaskID)
                          : [...prev, task.TaskID]
                      );
                    }}
                    inputProps={{ 'aria-labelledby': `task-${task.TaskID}` }}
                    sx={{
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  id={`task-${task.TaskID}`}
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="subtitle1" fontWeight="600">
                        {task.TaskName}
                      </Typography>
                      {new Date(task.Deadline) < new Date() && (
                        <Chip
                          label="Overdue"
                          color="error"
                          size="small"
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, mt: 0.5 }}>
                        {task.Description?.length > 120
                          ? `${task.Description.substring(0, 120)}...`
                          : task.Description}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Box display="flex" alignItems="center">
                          <BusinessIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {task.project_name}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {task.ExpectedHours} hrs
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(task.Deadline).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  }
                />
                <PriorityBadge
                  label={task.Priority}
                  color={getPriorityColor(task.Priority)}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </TaskListItem>
              <Divider variant="inset" component="li" />
            </Box>
          </Fade>
        ))}
      </List>
    );
  }, [filteredTasks, selectedTaskIds, theme]);

  // Memoize the summary stats to prevent unnecessary re-renders
  const SummaryStats = useMemo(() => {
    const totalHours = Object.values(taskHours)
      .reduce((sum, hours) => sum + (parseFloat(hours) || 0), 0)
      .toFixed(1);

    return (
      <Grid container spacing={3}>
        <Grid item xs={6} sm={3}>
          <StatCard color={theme.palette.primary.main}>
            <Badge
              badgeContent={selectedTaskIds.length}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '1rem',
                  height: '1.5rem',
                  minWidth: '1.5rem',
                  fontWeight: 'bold'
                }
              }}
            >
              <WorkIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            </Badge>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {selectedTaskIds.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tasks
            </Typography>
          </StatCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color={theme.palette.info.main}>
            <AccessTimeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {totalHours}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Hours
            </Typography>
          </StatCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color={theme.palette.warning.main}>
            <CoffeeIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {Math.floor(totalBreakTime / 60)}h {totalBreakTime % 60}m
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Break Time
            </Typography>
          </StatCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color={theme.palette.error.main}>
            <HourglassEmptyIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {Math.floor(totalInactiveTime / 60)}m {Math.floor(totalInactiveTime % 60)}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inactive Time
            </Typography>
          </StatCard>
        </Grid>
      </Grid>
    );
  }, [selectedTaskIds.length, taskHours, totalBreakTime, totalInactiveTime, theme]);

  // Loading state with reduced UI complexity
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            Daily Attendance
          </Typography>

          <Box>
            {isPunchedIn && (
              <Chip
                icon={<TimerIcon />}
                label="Punched In"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 'bold', mr: 1 }}
              />
            )}
            <Tooltip title="System Status">
              <IconButton color="primary">
                <Badge color="secondary" variant="dot" invisible={currentIdleTime < 60}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
            variant="filled"
          >
            {error}
          </Alert>
        )}

        {isPunchedIn ? (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" sx={{ fontWeight: 500 }}>
                Task Time Allocation
              </Typography>

              {/* <Box>
                <Tooltip title="Filter Tasks">
                  <IconButton onClick={handleMenuOpen} size="small" sx={{ mr: 1 }}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => handleFilterChange('all')}>
                    All Priorities
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterChange('high')}>
                    High Priority Only
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterChange('medium')}>
                    Medium Priority Only
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterChange('low')}>
                    Low Priority Only
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => handleSortChange('deadline')}>
                    Sort by Deadline
                  </MenuItem>
                  <MenuItem onClick={() => handleSortChange('priority')}>
                    Sort by Priority
                  </MenuItem>
                  <MenuItem onClick={() => handleSortChange('hours')}>
                    Sort by Hours
                  </MenuItem>
                </Menu>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={showCompletedTasks}
                      onChange={(e) => setShowCompletedTasks(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Show Completed"
                  sx={{ ml: 1 }}
                />
              </Box> */}
            </Box>

            <Alert
              severity="info"
              sx={{ mb: 4 }}
              icon={<ScheduleIcon />}
              variant="outlined"
            >
              Please enter the hours worked for each task you worked on today.
            </Alert>

            {/* Search field for tasks */}
            <Box mb={3}>
              <SearchField
                placeholder="Search tasks..."
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Tabs for task categories */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All Tasks" />
                <Tab label="In Progress" />
                <Tab label="Completed" />
                <Tab label="High Priority" />
              </Tabs>
            </Box>

            {/* Task list with virtualization for large lists */}
            {selectedTaskIds.length > 0 ? (
              <Box>
                {selectedTaskIds.length > 10 ? (
                  <Box sx={{ height: '70vh', overflow: 'auto' }}>
                    {selectedTaskIds
                      .filter(taskId => {
                        // Filter based on tab selection
                        if (tabValue === 0) return true; // All tasks
                        if (tabValue === 1) return !completedTaskIds.includes(taskId); // In progress
                        if (tabValue === 2) return completedTaskIds.includes(taskId); // Completed
                        if (tabValue === 3) { // High priority
                          const task = tasks.find(t => t.TaskID === taskId);
                          return task?.Priority?.toLowerCase() === 'high';
                        }
                        return true;
                      })
                      .filter(taskId => {
                        // Filter based on showCompleted setting
                        return showCompletedTasks || !completedTaskIds.includes(taskId);
                      })
                      .map(taskId => renderTask(taskId))
                    }
                  </Box>
                ) : (
                  selectedTaskIds
                    .filter(taskId => {
                      // Filter based on tab selection
                      if (tabValue === 0) return true; // All tasks
                      if (tabValue === 1) return !completedTaskIds.includes(taskId); // In progress
                      if (tabValue === 2) return completedTaskIds.includes(taskId); // Completed
                      if (tabValue === 3) { // High priority
                        const task = tasks.find(t => t.TaskID === taskId);
                        return task?.Priority?.toLowerCase() === 'high';
                      }
                      return true;
                    })
                    .filter(taskId => {
                      // Filter based on showCompleted setting
                      return showCompletedTasks || !completedTaskIds.includes(taskId);
                    })
                    .map(taskId => renderTask(taskId))
                )}
              </Box>
            ) : (
              <Box textAlign="center" py={5}>
                <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No tasks selected</Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't selected any tasks for today.
                </Typography>
              </Box>
            )}

            <StyledCard sx={{ mt: 4 }}>
              <CardHeader
                avatar={<BarChartIcon color="primary" />}
                title={
                  <Typography variant="h6">Daily Summary</Typography>
                }
                sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}
              />
              <CardContent>
                {SummaryStats}

                <Box display="flex" justifyContent="center" mt={4}>
                  {isOnBreak ? (
                    <AnimatedButton
                      variant="contained"
                      color="warning"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleBreakEnd}
                      size="large"
                      sx={{ px: 4 }}
                    >
                      Resume Work
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton
                      variant="contained"
                      color="info"
                      startIcon={<CoffeeIcon />}
                      onClick={handleBreakStart}
                      size="large"
                      sx={{ px: 4 }}
                    >
                      Take a Break
                    </AnimatedButton>
                  )}
                </Box>
              </CardContent>
            </StyledCard>

            <Box mt={4} display="flex" justifyContent="center">
              <AnimatedButton
                variant="contained"
                color="error"
                size="large"
                startIcon={<ExitToAppIcon />}
                onClick={handlePunchOut}
                disabled={selectedTaskIds.some(id => !taskHours[id])}
                sx={{ px: 4, py: 1.5 }}
              >
                Punch Out & Submit Hours
              </AnimatedButton>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
                Select Tasks for Today
              </Typography>

              <Box>
                <Tooltip title="Filter Tasks">
                  <IconButton onClick={handleMenuOpen} size="small" sx={{ mr: 1 }}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => handleFilterChange('all')}>
                    All Priorities
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterChange('high')}>
                    High Priority Only
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterChange('medium')}>
                    Medium Priority Only
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterChange('low')}>
                    Low Priority Only
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => handleSortChange('deadline')}>
                    Sort by Deadline
                  </MenuItem>
                  <MenuItem onClick={() => handleSortChange('priority')}>
                    Sort by Priority
                  </MenuItem>
                  <MenuItem onClick={() => handleSortChange('hours')}>
                    Sort by Hours
                  </MenuItem>
                </Menu>

                <SearchField
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>

            <Paper
              elevation={2}
              sx={{
                mb: 3,
                borderRadius: 2,
                overflow: 'hidden',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}
            >
              {filteredTasks.length > 0 ? (
                TaskList
              ) : (
                <Box textAlign="center" py={5}>
                  <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No tasks found</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or filters.
                  </Typography>
                </Box>
              )}
            </Paper>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
              </Typography>

              <AnimatedButton
                variant="contained"
                color="primary"
                size="large"
                startIcon={<TimerIcon />}
                onClick={handlePunchIn}
                disabled={loading}
                sx={{ px: 4, py: 1.5 }}
              >
                Punch In
              </AnimatedButton>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default React.memo(Attendance);



