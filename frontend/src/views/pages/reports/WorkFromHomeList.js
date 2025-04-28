import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Fade,
  Backdrop,
  Tabs,
  Tab,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Skeleton
} from '@mui/material';

// Material UI Icons
// Material UI Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import CommentIcon from '@mui/icons-material/Comment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import SortIcon from '@mui/icons-material/Sort';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';


// Styled components
import { styled, alpha, useTheme } from '@mui/material/styles';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '8px 16px',
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

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    transition: 'all 0.2s ease',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(8px)',
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

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 10px ${alpha(theme.palette.common.black, 0.05)}`,
    transition: 'all 0.2s ease',
  },
  transition: 'all 0.2s ease',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  padding: theme.spacing(1.5),
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  fontWeight: 600,
  borderBottom: `2px solid ${theme.palette.primary.main}`,
  padding: theme.spacing(1.5),
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': theme.palette.warning.main,
      'Approved': theme.palette.success.main,
      'Rejected': theme.palette.error.main
    };
    return statusMap[status] || theme.palette.grey[500];
  };

  return {
    backgroundColor: alpha(getStatusColor(status), 0.1),
    color: getStatusColor(status),
    fontWeight: 600,
    borderRadius: '12px',
    border: `1px solid ${alpha(getStatusColor(status), 0.3)}`,
    '& .MuiChip-icon': {
      color: getStatusColor(status),
    }
  };
});

const RequestCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  }
}));

export default function WorkFromHomeList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [workFromHomeData, setWorkFromHomeData] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [sortField, setSortField] = useState('FromDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState(null);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decoded.role?.name || '');
      setUserId(decoded.user_id);
      setShowActions(['Super Admin', 'Admin', 'HR'].includes(decoded.role?.name));
    }
    fetchWorkFromHomeData();
  }, [userId, showActions]);

  useEffect(() => {
    if (snackbar.visible) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.visible]);

  const fetchWorkFromHomeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      let url = 'http://localhost:8000/api/work-from-home-requests/';

      if (!showActions && userId) {
        url += `?user_id=${userId}`;
      }

      console.log("Fetching work from home data...");
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Received data:", response.data);

      // Make sure we're handling the data correctly
      if (Array.isArray(response.data)) {
        setWorkFromHomeData(response.data);
      } else {
        console.error("Expected array but got:", typeof response.data);
        setWorkFromHomeData([]);
      }

      showSnackbar('Work from home requests loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching work from home data:', error);
      setWorkFromHomeData([]);
      showSnackbar('Failed to fetch work from home requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId, reason = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `http://localhost:8000/api/work-from-home-requests/${requestId}/reject/`,
        { Comments: reason }, // Include rejection reason
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      console.log("Reject response:", response.data);

      // Update the local state immediately for better UX
      setWorkFromHomeData(prevData =>
        prevData.map(item =>
          item.WorkFromHomeRequestID === requestId
            ? { ...item, Status: 'Rejected', Comments: reason }
            : item
        )
      );

      showSnackbar(response.data.message || 'Request rejected successfully!', 'success');

      // Also fetch fresh data from the server
      fetchWorkFromHomeData();
    } catch (error) {
      console.error('Error rejecting work from home request:', error);
      showSnackbar(error.response?.data?.error || 'Failed to reject request', 'error');
    } finally {
      setLoading(false);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `http://localhost:8000/api/work-from-home-requests/${requestId}/approve/`,
        {}, // Empty object for request body
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      console.log("Approve response:", response.data);

      // Update the local state immediately for better UX
      setWorkFromHomeData(prevData =>
        prevData.map(item =>
          item.WorkFromHomeRequestID === requestId
            ? { ...item, Status: 'Approved' }
            : item
        )
      );

      showSnackbar(response.data.message || 'Request approved successfully!', 'success');

      // Also fetch fresh data from the server
      fetchWorkFromHomeData();
    } catch (error) {
      console.error(error);
      showSnackbar(error.response?.data?.error || 'Failed to approve request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };

  const handleSortMenuOpen = (event) => {
    setSortMenuAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchorEl(null);
  };

  const handleActionMenuOpen = (event, request) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedRequest(null);
  };

  const openRejectDialog = (request) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
    handleActionMenuClose();
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      visible: true,
      message,
      severity,
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon fontSize="small" />;
      case 'Rejected':
        return <CancelIcon fontSize="small" />;
      case 'Pending':
      default:
        return <CalendarTodayIcon fontSize="small" />;
    }
  };

  // Filter and sort work from home requests
  const filteredRequests = workFromHomeData
    .filter(request => {
      // Search filter
      const matchesSearch =
        request.requested_by_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.Reason?.toLowerCase().includes(searchQuery.toLowerCase());

      // Tab filter
      if (tabValue === 1) return request.Status === 'Pending';
      if (tabValue === 2) return request.Status === 'Approved';
      if (tabValue === 3) return request.Status === 'Rejected';

      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort logic
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (sortField === 'FromDate') {
        return direction * (new Date(a.FromDate) - new Date(b.FromDate));
      } else if (sortField === 'ToDate') {
        return direction * (new Date(a.ToDate) - new Date(b.ToDate));
      } else if (sortField === 'Days') {
        return direction * (a.Days - b.Days);
      } else if (sortField === 'Employee') {
        return direction * (a.requested_by_name || '').localeCompare(b.requested_by_name || '');
      } else if (sortField === 'Status') {
        return direction * (a.Status || '').localeCompare(b.Status || '');
      }
      return 0;
    });

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
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HomeWorkIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                      Work From Home Requests
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                      {showActions ? 'Manage all work from home requests' : 'Your work from home requests'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Tooltip title={viewMode === 'grid' ? 'Table View' : 'Grid View'}>
                    <IconButton
                      color="inherit"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                      sx={{
                        bgcolor: alpha('#fff', 0.1),
                        '&:hover': { bgcolor: alpha('#fff', 0.2) }
                      }}
                    >
                      {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                    </IconButton>
                  </Tooltip>
                  <StyledButton
                    variant="contained"
                    color="secondary"
                    startIcon={<RefreshIcon />}
                    onClick={fetchWorkFromHomeData}
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: theme.palette.secondary.main,
                      color: 'white'
                    }}
                  >
                    Refresh
                  </StyledButton>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Filters and Search Section */}
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <SearchField
                fullWidth
                placeholder="Search by employee name or reason..."
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
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack
                direction="row"
                spacing={1}
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                sx={{ overflowX: 'auto', pb: 1 }}
              >
                <Tooltip title="Filter">
                  <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={handleFilterMenuOpen}
                    size="small"
                    sx={{ borderRadius: '10px' }}
                  >
                    Filter
                  </Button>
                </Tooltip>
                <Menu
                  anchorEl={filterMenuAnchorEl}
                  open={Boolean(filterMenuAnchorEl)}
                  onClose={handleFilterMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: '12px', mt: 1 }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
                    Date Range
                  </Typography>
                  <MenuItem onClick={() => { handleFilterMenuClose(); }}>
                    This Week
                  </MenuItem>
                  <MenuItem onClick={() => { handleFilterMenuClose(); }}>
                    This Month
                  </MenuItem>
                  <MenuItem onClick={() => { handleFilterMenuClose(); }}>
                    Last Month
                  </MenuItem>
                  <MenuItem onClick={() => { handleFilterMenuClose(); }}>
                    Custom Range
                  </MenuItem>
                </Menu>

                <Tooltip title="Sort">
                  <Button
                    variant="outlined"
                    startIcon={<SortIcon />}
                    onClick={handleSortMenuOpen}
                    size="small"
                    sx={{ borderRadius: '10px' }}
                  >
                    Sort
                  </Button>
                </Tooltip>
                <Menu
                  anchorEl={sortMenuAnchorEl}
                  open={Boolean(sortMenuAnchorEl)}
                  onClose={handleSortMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: '12px', mt: 1 }
                  }}
                >
                  <MenuItem onClick={() => { handleSort('FromDate'); handleSortMenuClose(); }}>
                    <ListItemIcon>
                      {sortField === 'FromDate' && (
                        sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText>Start Date</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { handleSort('ToDate'); handleSortMenuClose(); }}>
                    <ListItemIcon>
                      {sortField === 'ToDate' && (
                        sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText>End Date</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { handleSort('Days'); handleSortMenuClose(); }}>
                    <ListItemIcon>
                      {sortField === 'Days' && (
                        sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText>Number of Days</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { handleSort('Employee'); handleSortMenuClose(); }}>
                    <ListItemIcon>
                      {sortField === 'Employee' && (
                        sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText>Employee Name</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { handleSort('Status'); handleSortMenuClose(); }}>
                    <ListItemIcon>
                      {sortField === 'Status' && (
                        sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText>Status</ListItemText>
                  </MenuItem>
                </Menu>

                <Tooltip title="Refresh">
                  <IconButton
                    onClick={fetchWorkFromHomeData}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                      borderRadius: '10px'
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>

          {/* Tabs for filtering by status */}
          <Box sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  px: 3,
                  py: 1.5,
                  borderRadius: '10px 10px 0 0',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                },
                '& .Mui-selected': {
                  fontWeight: 'bold',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <Tab
                label="All Requests"
                icon={<HomeWorkIcon />}
                iconPosition="start"
              />
              <Tab
                label="Pending"
                icon={<CalendarTodayIcon color="warning" />}
                iconPosition="start"
              />
              <Tab
                label="Approved"
                icon={<CheckCircleIcon color="success" />}
                iconPosition="start"
              />
              <Tab
                label="Rejected"
                icon={<CancelIcon color="error" />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Main Content - Grid or Table View */}
          <Box sx={{ mt: 3 }}>
            {loading ? (
              viewMode === 'grid' ? (
                <Grid container spacing={3}>
                  {Array.from(new Array(6)).map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ p: 2, borderRadius: 3 }}>
                        <Stack spacing={2}>
                          <Skeleton variant="text" width="70%" height={30} />
                          <Skeleton variant="text" width="50%" />
                          <Skeleton variant="text" width="80%" />
                          <Skeleton variant="rectangular" width="100%" height={60} />
                          <Skeleton variant="rectangular" width="100%" height={40} />
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {showActions && <StyledTableHeadCell>Employee</StyledTableHeadCell>}
                        <StyledTableHeadCell>From Date</StyledTableHeadCell>
                        <StyledTableHeadCell>To Date</StyledTableHeadCell>
                        <StyledTableHeadCell>Days</StyledTableHeadCell>
                        <StyledTableHeadCell>Reason</StyledTableHeadCell>
                        <StyledTableHeadCell>Status</StyledTableHeadCell>
                        {showActions && <StyledTableHeadCell align="center">Actions</StyledTableHeadCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from(new Array(5)).map((_, index) => (
                        <TableRow key={index}>
                          {showActions && <TableCell><Skeleton variant="text" width={120} /></TableCell>}
                          <TableCell><Skeleton variant="text" width={100} /></TableCell>
                          <TableCell><Skeleton variant="text" width={100} /></TableCell>
                          <TableCell><Skeleton variant="text" width={50} /></TableCell>
                          <TableCell><Skeleton variant="text" width={150} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" width={80} height={30} sx={{ borderRadius: 1 }} /></TableCell>
                          {showActions && <TableCell align="center"><Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} /></TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : filteredRequests.length ? (
              viewMode === 'grid' ? (
                <Grid container spacing={3}>
                  {filteredRequests.map((request) => (
                    <Grid item xs={12} sm={6} md={4} key={request.WorkFromHomeRequestID}>
                      <RequestCard elevation={2}>
                        <CardContent sx={{ p: 3, flexGrow: 1 }}>
                          {showActions && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1 }}>
                                <PersonIcon />
                              </Avatar>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {request.requested_by_name}
                              </Typography>
                            </Box>
                          )}

                          <StatusChip
                            label={request.Status}
                            status={request.Status}
                            size="small"
                            icon={getStatusIcon(request.Status)}
                            sx={{ mb: 2 }}
                          />

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                From Date
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {new Date(request.FromDate).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                To Date
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {new Date(request.ToDate).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Duration
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {request.IsHalfDay ? (
                                <>
                                  Half Day ({request.HalfDayType === 'first_half' ? 'Morning' : 'Afternoon'})
                                </>
                              ) : (
                                <>
                                  {request.Days} {request.Days === 1 ? 'day' : 'days'}
                                </>
                              )}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Reason
                            </Typography>
                            <Typography variant="body2" sx={{
                              p: 1.5,
                              bgcolor: alpha(theme.palette.background.default, 0.7),
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              maxHeight: '80px',
                              overflow: 'auto'
                            }}>
                              {request.Reason}
                            </Typography>
                          </Box>

                          {request.Status !== 'Pending' && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {request.Status === 'Approved' ? 'Approved by' : 'Rejected by'}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {request.approved_by_name} on {new Date(request.ApprovedAt).toLocaleDateString()}
                              </Typography>

                              {request.Status === 'Rejected' && request.Comments && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Rejection Reason
                                  </Typography>
                                  <Typography variant="body2" color="error" sx={{
                                    p: 1,
                                    bgcolor: alpha(theme.palette.error.light, 0.1),
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                                  }}>
                                    {request.Comments}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                        </CardContent>

                        {showActions && request.Status === 'Pending' && (
                          <Box sx={{
                            p: 2,
                            borderTop: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <StyledButton
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleApprove(request.WorkFromHomeRequestID)}
                              sx={{ flex: 1, mr: 1 }}
                            >
                              Approve
                            </StyledButton>
                            <StyledButton
                              variant="contained"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => openRejectDialog(request)}
                              sx={{ flex: 1, ml: 1 }}
                            >
                              Reject
                            </StyledButton>
                          </Box>
                        )}

                        {!showActions && (
                          <Box sx={{
                            p: 2,
                            borderTop: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            justifyContent: 'flex-end'
                          }}>
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
                          </Box>
                        )}
                      </RequestCard>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: alpha(theme.palette.primary.main, 0.05),
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: alpha(theme.palette.primary.main, 0.3),
                    }
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        {showActions && (
                          <StyledTableHeadCell>
                            <Box
                              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                              onClick={() => handleSort('Employee')}
                            >
                              Employee
                              {sortField === 'Employee' && (
                                sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                              )}
                            </Box>
                          </StyledTableHeadCell>
                        )}
                        <StyledTableHeadCell>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('FromDate')}
                          >
                            From Date
                            {sortField === 'FromDate' && (
                              sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                            )}
                          </Box>
                        </StyledTableHeadCell>
                        <StyledTableHeadCell>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('ToDate')}
                          >
                            To Date
                            {sortField === 'ToDate' && (
                              sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                            )}
                          </Box>
                        </StyledTableHeadCell>
                        <StyledTableHeadCell>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('Days')}
                          >
                            Days
                            {sortField === 'Days' && (
                              sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                            )}
                          </Box>
                        </StyledTableHeadCell>
                        <StyledTableHeadCell>Reason</StyledTableHeadCell>
                        <StyledTableHeadCell>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('Status')}
                          >
                            Status
                            {sortField === 'Status' && (
                              sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                            )}
                          </Box>
                        </StyledTableHeadCell>
                        {showActions && <StyledTableHeadCell align="center">Actions</StyledTableHeadCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <StyledTableRow key={request.WorkFromHomeRequestID}>
                          {showActions && (
                            <StyledTableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    mr: 1,
                                    bgcolor: theme.palette.primary.main
                                  }}
                                >
                                  {request.requested_by_name?.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" fontWeight="medium">
                                  {request.requested_by_name}
                                </Typography>
                              </Box>
                            </StyledTableCell>
                          )}
                          <StyledTableCell>
                            {new Date(request.FromDate).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </StyledTableCell>
                          <StyledTableCell>
                            {new Date(request.ToDate).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </StyledTableCell>
                          <StyledTableCell>
                            {request.IsHalfDay ? (
                              <Tooltip title={`Half Day (${request.HalfDayType === 'first_half' ? 'Morning' : 'Afternoon'})`}>
                                <Chip
                                  label={`0.5 day (${request.HalfDayType === 'first_half' ? 'AM' : 'PM'})`}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    fontWeight: 'bold',
                                    borderRadius: '8px'
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                label={`${request.Days} ${request.Days === 1 ? 'day' : 'days'}`}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  fontWeight: 'bold',
                                  borderRadius: '8px'
                                }}
                              />
                            )}
                          </StyledTableCell>
                          <StyledTableCell>
                            <Tooltip title={request.Reason}>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {request.Reason}
                              </Typography>
                            </Tooltip>
                          </StyledTableCell>
                          <StyledTableCell>
                            <StatusChip
                              label={request.Status}
                              status={request.Status}
                              size="small"
                              icon={getStatusIcon(request.Status)}
                            />
                          </StyledTableCell>
                          {showActions && (
                            <StyledTableCell align="center">
                              {request.Status === 'Pending' ? (
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="Approve">
                                    <IconButton
                                      color="success"
                                      size="small"
                                      onClick={() => handleApprove(request.WorkFromHomeRequestID)}
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
                                      onClick={() => openRejectDialog(request)}
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
                                <Tooltip
                                  title={`${request.Status} by ${request.approved_by_name} on ${new Date(request.ApprovedAt).toLocaleDateString()}`}
                                >
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(request.ApprovedAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                            </StyledTableCell>
                          )}
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : (
              <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    display: 'inline-flex',
                    mb: 2
                  }}
                >
                  <HomeWorkIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.5) }} />
                </Box>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No work from home requests found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                  {searchQuery
                    ? "We couldn't find any requests matching your search criteria. Try adjusting your filters."
                    : "There are no work from home requests to display at this time."}
                </Typography>
                <StyledButton
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchWorkFromHomeData}
                >
                  Refresh
                </StyledButton>
              </Box>
            )}
          </Box>
        </Box>
      </StyledCard>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          elevation: 24,
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.error.main, mr: 2 }}>
              <CancelIcon />
            </Avatar>
            <Typography variant="h6" component="div" fontWeight="bold">
              Reject Work From Home Request
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    mr: 2,
                    width: 40,
                    height: 40
                  }}
                >
                  {selectedRequest.requested_by_name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedRequest.requested_by_name}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(selectedRequest.FromDate).toLocaleDateString()} - {new Date(selectedRequest.ToDate).toLocaleDateString()}
                    {' '}
                    {selectedRequest.IsHalfDay ? (
                      <Chip
                        label={selectedRequest.HalfDayType === 'first_half' ? 'Morning Half' : 'Afternoon Half'}
                        size="small"
                        color="info"
                        sx={{ ml: 1 }}
                      />
                    ) : (
                      `(${selectedRequest.Days} ${selectedRequest.Days === 1 ? 'day' : 'days'})`
                    )}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                p: 2,
                bgcolor: alpha(theme.palette.background.default, 0.7),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                mb: 3
              }}>
                <Typography variant="body2" fontWeight="medium">
                  <strong>Reason:</strong> {selectedRequest.Reason}
                </Typography>
              </Box>

              <TextField
                label="Rejection Reason"
                fullWidth
                multiline
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this request..."
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: theme.palette.background.paper
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowRejectDialog(false)}
            startIcon={<CloseIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <StyledButton
            variant="contained"
            color="error"
            onClick={() => handleReject(selectedRequest?.WorkFromHomeRequestID, rejectReason)}
            disabled={!rejectReason.trim()}
            startIcon={<CancelIcon />}
          >
            Reject Request
          </StyledButton>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: '12px', mt: 1, minWidth: 180 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem sx={{ py: 1.5 }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {selectedRequest?.Status === 'Pending' && (
          <MenuItem sx={{ py: 1.5 }}>
            <ListItemIcon>
              <SendIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText>Send Reminder</ListItemText>
          </MenuItem>
        )}
      </Menu>

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
              Loading...
            </Typography>
          </Box>
        </Box>
      </Backdrop>
    </Box>
  );
}

