import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import {
    Box,
    Typography,
    Button,
    Card,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Divider,
    InputAdornment,
    CircularProgress,
    Snackbar,
    Alert,
    Backdrop,
    Fade,
    Stack,
    Tabs,
    Tab,
    TablePagination,
    Menu,
    ListItemIcon,
    ListItemText,
    Switch,
    FormControlLabel,
    Skeleton,
    useMediaQuery
} from '@mui/material';

// Material UI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import BadgeIcon from '@mui/icons-material/Badge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SortIcon from '@mui/icons-material/Sort';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';
import HotelIcon from '@mui/icons-material/Hotel';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCodeIcon from '@mui/icons-material/QrCode';
// Styled components
import { styled, alpha, useTheme } from '@mui/material/styles';

// Default avatar image
import defaultAvatar from '../../../assets/images/avatars/2.jpg';



// Styled components
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

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

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: 16,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
    }
}));

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: '12px',
    padding: '10px 20px',
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

const StatusBadge = styled('div')(({ theme, status }) => {
    const getStatusColor = (status) => {
        const statusMap = {
            'on_leave': theme.palette.info.main,
            'on_break': theme.palette.warning.main,
            'punched_in': theme.palette.success.main,
            'not_punched_in': theme.palette.grey[500],
        };
        return statusMap[status] || theme.palette.grey[500];
    };

    return {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: '50%',
        backgroundColor: getStatusColor(status),
        border: `2px solid ${theme.palette.background.paper}`,
        boxShadow: theme.shadows[2],
        ...(status === 'punched_in' && {
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
                backgroundColor: getStatusColor(status),
            },
            '@keyframes pulse': {
                '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                },
                '70%': {
                    transform: 'scale(2)',
                    opacity: 0,
                },
                '100%': {
                    transform: 'scale(1)',
                    opacity: 0,
                },
            },
        }),
    };
});

const EmployeeCard = styled(Card)(({ theme }) => ({
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

const StatusChip = styled(Chip)(({ theme, status }) => {
    const getStatusColor = (status) => {
        const statusMap = {
            'on_leave': theme.palette.info.main,
            'on_break': theme.palette.warning.main,
            'punched_in': theme.palette.success.main,
            'not_punched_in': theme.palette.error.main
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

const Employees = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [editEmployee, setEditEmployee] = useState(null);
    const [deleteEmployee, setDeleteEmployee] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPosition, setFilterPosition] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [sortField, setSortField] = useState('EmployeeName');
    const [sortDirection, setSortDirection] = useState('asc');
    const [tabValue, setTabValue] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [showPassword, setShowPassword] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
    const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState(null);
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [actionEmployee, setActionEmployee] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [bankDetailsValid, setBankDetailsValid] = useState(true);
    const [bankDetailsError, setBankDetailsError] = useState('');
    // Assume we have user permissions
    const userPermissions = ['add_user', 'change_user' ]; //'delete_user'

    const handleViewProfile = (employeeId) => {
        navigate(`/profile/${employeeId}`, { 
            state: { fromEmployees: true } 
          });
    };

    const [newEmployee, setNewEmployee] = useState({
        UserName: '',
        Email: '',
        Password: '',
        EmployeeName: '',
        PositionID: '',
        RoleID: '',
        bank_name: '',
        account_number: '',
        ifsc_code: ''
    });

    const validateBankDetails = (bankName, accountNumber, ifscCode) => {
        if (!bankName || !accountNumber || !ifscCode) {
          setBankDetailsError('All bank details fields are required');
          setBankDetailsValid(false);
          return false;
        }
        
        // Validate account number (9-18 digits)
        if (!/^\d{9,18}$/.test(accountNumber)) {
          setBankDetailsError('Account number must be 9-18 digits');
          setBankDetailsValid(false);
          return false;
        }
        
        // Validate IFSC code (format: AAAA0XXXXXX - 4 letters, 0, 6 alphanumeric)
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
          setBankDetailsError('IFSC code must be in format AAAA0XXXXXX');
          setBankDetailsValid(false);
          return false;
        }
        
        setBankDetailsValid(true);
        setBankDetailsError('');
        return true;
      };

    // Add this function to parse bank details JSON
    const parseBankDetails = (bankDetailsJson) => {
        if (!bankDetailsJson) return { bank_name: '', account_number: '', ifsc_code: '' };

        try {
            if (typeof bankDetailsJson === 'string') {
                return JSON.parse(bankDetailsJson);
            }
            return bankDetailsJson;
        } catch (error) {
            console.error('Error parsing bank details:', error);
            return { bank_name: '', account_number: '', ifsc_code: '' };
        }
    };

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await axios.get(
                `http://localhost:8000/api/employees/?page=${currentPage}&page_size=${rowsPerPage}&include_break_status=true`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setEmployees(response.data.results || []);
            setTotalPages(response.data.num_pages || 1);
            showSnackbar('Employees loaded successfully', 'success');
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
            showSnackbar('Failed to load employees', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Add a function to get break details for an employee
    const getBreakDetails = (employee) => {
        if (employee.Status === 'on_break') {
            const breakStartTime = employee.break_start_time;
            const breakDuration = employee.break_duration || 0;

            if (breakStartTime) {
                const startTime = new Date(breakStartTime);
                const formattedTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `Since ${formattedTime} (${breakDuration} min)`;
            }
            return 'Currently on break';
        }
        return null;
    };

    const fetchPositionsAndRoles = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const [positionsRes, rolesRes] = await Promise.all([
                axios.get('http://localhost:8000/api/positions/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get('http://localhost:8000/api/roles/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            setPositions(positionsRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error('Error fetching positions and roles:', error);
            showSnackbar('Failed to load positions and roles', 'error');
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchPositionsAndRoles();
    }, [currentPage, rowsPerPage]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);

        // Create preview URL for the selected image
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(null);
        }
    };

    const handleAddEmployee = async () => {
        try {
            if (newEmployee.bank_name || newEmployee.account_number || newEmployee.ifsc_code) {
                const isValid = validateBankDetails(
                    newEmployee.bank_name,
                    newEmployee.account_number,
                    newEmployee.ifsc_code
                );

                if (!isValid) return;
            }

            setLoading(true);
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            Object.keys(newEmployee).forEach(key => {
                if (!['bank_name', 'account_number', 'ifsc_code'].includes(key)) {
                    formData.append(key, newEmployee[key]);
                }
            });

            // Add bank details as JSON if all fields are provided
            if (newEmployee.bank_name && newEmployee.account_number && newEmployee.ifsc_code) {
                const bankDetailsJson = JSON.stringify({
                    bank_name: newEmployee.bank_name,
                    account_number: newEmployee.account_number,
                    ifsc_code: newEmployee.ifsc_code
                });
                formData.append('bank_details', bankDetailsJson);
            }

            if (selectedFile) {
                formData.append('Photo', selectedFile);
            }

            await axios.post('http://localhost:8000/api/employees/', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowAddModal(false);
            fetchEmployees();
            setNewEmployee({
                UserName: '',
                Email: '',
                Password: '',
                EmployeeName: '',
                PositionID: '',
                RoleID: '',
                bank_name: '',
                account_number: '',
                ifsc_code: ''
            });
            setSelectedFile(null);
            setPreviewImage(null);
            showSnackbar('Employee added successfully!', 'success');
        } catch (error) {
            console.error('Error adding employee:', error);
            showSnackbar('Failed to add employee', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee) => {
        const bankDetails = parseBankDetails(employee.bank_details);
        console.log(bankDetails);
        
        setEditEmployee({
            ...employee,
            Password: '', // Don't show the current password,
            PositionID: employee.Position?.id || '',
            RoleID: employee.Role?.id || '',
            bank_name: bankDetails.bank_name || '',
            account_number: bankDetails.account_number || '',
            ifsc_code: bankDetails.ifsc_code || ''
        });
        setPreviewImage(employee.Photo || null);
        setSelectedFile(null); // Reset selected file for edit
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        try {
          // Validate bank details if any of the fields are filled
          if (editEmployee.bank_name || editEmployee.account_number || editEmployee.ifsc_code) {
            const isValid = validateBankDetails(
              editEmployee.bank_name,
              editEmployee.account_number,
              editEmployee.ifsc_code
            );
            
            if (!isValid) return;
          }
          
          setLoading(true);
          const token = localStorage.getItem('access_token');
          
          // Create a data object for better handling
          const employeeData = { ...editEmployee };
          
          // Remove the individual bank detail fields and create the bank_details JSON string
          // in the exact format required by the validator
          if (employeeData.bank_name && employeeData.account_number && employeeData.ifsc_code) {
            // Create the JSON string in the exact format required by the validator
            employeeData.bank_details = JSON.stringify({
              bank_name: employeeData.bank_name,
              account_number: employeeData.account_number,
              ifsc_code: employeeData.ifsc_code
            });
          }
          
          // Remove the individual fields from the payload
          delete employeeData.bank_name;
          delete employeeData.account_number;
          delete employeeData.ifsc_code;
          
          // Remove password if it's empty
          if (!employeeData.Password) {
            delete employeeData.Password;
          }
          
          // For file upload, we still need FormData
          const formData = new FormData();
          
          // Add all employee data to formData
          Object.keys(employeeData).forEach(key => {
            if (key !== 'Photo') {  // Skip Photo as we'll handle it separately
              formData.append(key, employeeData[key]);
            }
          });
          
          if (selectedFile) {
            formData.append('Photo', selectedFile);
          }
          
          // Send the update request
          await axios.put(`http://localhost:8000/api/employees/${editEmployee.UserID}/`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
      
          setShowEditModal(false);
          fetchEmployees();
          setSelectedFile(null);
          setPreviewImage(null);
          showSnackbar('Employee updated successfully!', 'success');
        } catch (error) {
          console.error('Error updating employee:', error);
          if (error.response && error.response.data && error.response.data.error) {
            showSnackbar(`Error: ${error.response.data.error}`, 'error');
          } else {
            showSnackbar('Failed to update employee', 'error');
          }
        } finally {
          setLoading(false);
        }
      };

    const handleDelete = (employeeId) => {
        const employee = employees.find(emp => emp.UserID === employeeId);
        setDeleteEmployee(employee);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            await axios.delete(`http://localhost:8000/api/employees/${deleteEmployee.UserID}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setShowDeleteModal(false);
            fetchEmployees();
            showSnackbar('Employee deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting employee:', error);
            showSnackbar('Failed to delete employee', 'error');
        } finally {
            setLoading(false);
        }
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

    const handleActionMenuOpen = (event, employee) => {
        setActionMenuAnchorEl(event.currentTarget);
        setActionEmployee(employee);
    };

    const handleActionMenuClose = () => {
        setActionMenuAnchorEl(null);
        setActionEmployee(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

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

    const getStatusColor = (status) => {
        const statusMap = {
            'on_leave': 'info',
            'on_break': 'warning',
            'punched_in': 'success',
            'not_punched_in': 'error'
        };
        return statusMap[status] || 'default';
    };

    const getStatusLabel = (status) => {
        console.log(status);

        const statusMap = {
            'on_leave': 'On Leave',
            'on_break': 'On Break',
            'punched_in': 'Active',
            'not_punched_in': 'Offline'
        };
        return statusMap[status] || 'Unknown';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'punched_in':
                return <CheckCircleIcon fontSize="small" />;
            case 'not_punched_in':
                return <CancelIcon fontSize="small" />;
            case 'on_leave':
                return <HotelIcon fontSize="small" />;
            case 'on_break':
                return <TimerIcon fontSize="small" />;
            default:
                return <FiberManualRecordIcon fontSize="small" />;
        }
    };

    // Filter and sort employees
    const filteredEmployees = employees
        .filter(employee => {
            // Search filter
            const matchesSearch =
                employee.EmployeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.UserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.Email?.toLowerCase().includes(searchQuery.toLowerCase());

            // Position filter
            const matchesPosition =
                filterPosition === 'all' ||
                employee.Position?.id === parseInt(filterPosition);

            // Role filter
            const matchesRole =
                filterRole === 'all' ||
                employee.Role?.id === parseInt(filterRole);

            // Tab filter
            if (tabValue === 1) return employee.Status === 'punched_in'; // Active
            if (tabValue === 2) return employee.Status === 'not_punched_in'; // Inactive
            if (tabValue === 3) return employee.Status === 'on_leave'; // On Leave
            if (tabValue === 4) return employee.Status === 'on_break'; // On Break

            return matchesSearch && matchesPosition && matchesRole;
        })
        .sort((a, b) => {
            // Sort logic
            const direction = sortDirection === 'asc' ? 1 : -1;

            if (sortField === 'EmployeeName') {
                return direction * (a.EmployeeName || '').localeCompare(b.EmployeeName || '');
            } else if (sortField === 'UserName') {
                return direction * (a.UserName || '').localeCompare(b.UserName || '');
            } else if (sortField === 'Email') {
                return direction * (a.Email || '').localeCompare(b.Email || '');
            } else if (sortField === 'Position') {
                return direction * (a.Position?.name || '').localeCompare(b.Position?.name || '');
            } else if (sortField === 'Role') {
                return direction * (a.Role?.name || '').localeCompare(b.Role?.name || '');
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
                                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Employees
                                </Typography>
                                <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                                    Manage your organization's team members
                                </Typography>
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
                                    {userPermissions?.includes('add_user') && (
                                        <StyledButton
                                            variant="contained"
                                            color="secondary"
                                            startIcon={<AddIcon />}
                                            onClick={() => setShowAddModal(true)}
                                            sx={{
                                                fontWeight: 'bold',
                                                bgcolor: theme.palette.secondary.main,
                                                color: 'white'
                                            }}
                                        >
                                            Add Employee
                                        </StyledButton>
                                    )}
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
                                placeholder="Search employees by name, username or email..."
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
                                        Position
                                    </Typography>
                                    <MenuItem onClick={() => { setFilterPosition('all'); handleFilterMenuClose(); }}>
                                        All Positions
                                    </MenuItem>
                                    <Divider />
                                    {positions.map(position => (
                                        <MenuItem
                                            key={position.id}
                                            onClick={() => { setFilterPosition(position.id.toString()); handleFilterMenuClose(); }}
                                        >
                                            {position.position_name}
                                        </MenuItem>
                                    ))}
                                    <Divider />
                                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
                                        Role
                                    </Typography>
                                    <MenuItem onClick={() => { setFilterRole('all'); handleFilterMenuClose(); }}>
                                        All Roles
                                    </MenuItem>
                                    <Divider />
                                    {roles.map(role => (
                                        <MenuItem
                                            key={role.id}
                                            onClick={() => { setFilterRole(role.id.toString()); handleFilterMenuClose(); }}
                                        >
                                            {role.RoleName}
                                        </MenuItem>
                                    ))}
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
                                    <MenuItem onClick={() => { handleSort('EmployeeName'); handleSortMenuClose(); }}>
                                        <ListItemIcon>
                                            {sortField === 'EmployeeName' && (
                                                sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText>Name</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleSort('UserName'); handleSortMenuClose(); }}>
                                        <ListItemIcon>
                                            {sortField === 'UserName' && (
                                                sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText>Username</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleSort('Email'); handleSortMenuClose(); }}>
                                        <ListItemIcon>
                                            {sortField === 'Email' && (
                                                sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText>Email</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleSort('Position'); handleSortMenuClose(); }}>
                                        <ListItemIcon>
                                            {sortField === 'Position' && (
                                                sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText>Position</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleSort('Role'); handleSortMenuClose(); }}>
                                        <ListItemIcon>
                                            {sortField === 'Role' && (
                                                sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText>Role</ListItemText>
                                    </MenuItem>
                                </Menu>

                                <Tooltip title="Refresh">
                                    <IconButton
                                        onClick={fetchEmployees}
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
                                label="All Employees"
                                icon={<PersonIcon />}
                                iconPosition="start"
                            />
                            <Tab
                                label="Active"
                                icon={<CheckCircleIcon color="success" />}
                                iconPosition="start"
                            />
                            <Tab
                                label="Offline"
                                icon={<CancelIcon color="error" />}
                                iconPosition="start"
                            />
                            <Tab
                                label="On Leave"
                                icon={<HotelIcon color="info" />}
                                iconPosition="start"
                            />
                            <Tab
                                label="On Break"
                                icon={<TimerIcon color="warning" />}
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
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                            <Card sx={{ p: 2, borderRadius: 3 }}>
                                                <Stack spacing={2} alignItems="center">
                                                    <Skeleton variant="circular" width={80} height={80} />
                                                    <Skeleton variant="text" width="70%" height={30} />
                                                    <Skeleton variant="text" width="50%" />
                                                    <Skeleton variant="text" width="80%" />
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
                                                <StyledTableHeadCell>Employee</StyledTableHeadCell>
                                                <StyledTableHeadCell>Username</StyledTableHeadCell>
                                                <StyledTableHeadCell>Email</StyledTableHeadCell>
                                                <StyledTableHeadCell>Position</StyledTableHeadCell>
                                                <StyledTableHeadCell>Role</StyledTableHeadCell>
                                                <StyledTableHeadCell align="center">Actions</StyledTableHeadCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Array.from(new Array(5)).map((_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Skeleton variant="circular" width={50} height={50} />
                                                            <Box sx={{ ml: 2 }}>
                                                                <Skeleton variant="text" width={120} />
                                                                <Skeleton variant="text" width={80} />
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                                    <TableCell align="center">
                                                        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )
                        ) : filteredEmployees.length ? (
                            viewMode === 'grid' ? (
                                <Grid container spacing={3}>
                                    {filteredEmployees.map((employee) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={employee.UserID}>
                                            <EmployeeCard elevation={2}>
                                                <Box sx={{ p: 3, position: 'relative', textAlign: 'center' }}>
                                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                        <Avatar
                                                            src={employee.Photo || defaultAvatar}
                                                            alt={employee.EmployeeName}
                                                            sx={{
                                                                width: 100,
                                                                height: 100,
                                                                mx: 'auto',
                                                                border: `3px solid ${theme.palette.background.paper}`,
                                                                boxShadow: theme.shadows[3]
                                                            }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = defaultAvatar;
                                                            }}
                                                        />
                                                        <StatusBadge status={employee.Status} />
                                                    </Box>

                                                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                                                        {employee.EmployeeName}
                                                    </Typography>

                                                  

                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                        {employee.Email}
                                                    </Typography>

                                                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                                                        <Chip
                                                            label={employee.Position?.name || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                color: theme.palette.primary.main,
                                                                fontWeight: 500
                                                            }}
                                                        />
                                                        <Chip
                                                            label={employee.Role?.name || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                color: theme.palette.secondary.main,
                                                                fontWeight: 500
                                                            }}
                                                        />
                                                    </Stack>
                                                </Box>

                                                <Divider />

                                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-around' }}>
                                                    {userPermissions?.includes('change_user') && (
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                color="primary"
                                                                size="small"
                                                                onClick={() => handleEdit(employee)}
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                                    }
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {userPermissions?.includes('delete_user') && (
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleDelete(employee.UserID)}
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.error.main, 0.2),
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title="View Details">
                                                        <IconButton
                                                            color="info"
                                                            size="small"
                                                            onClick={() => handleViewProfile(employee.UserID)}
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                                                '&:hover': {
                                                                    bgcolor: alpha(theme.palette.info.main, 0.2),
                                                                }
                                                            }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* <Tooltip title="More Actions">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleActionMenuOpen(e, employee)}
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.grey[500], 0.1),
                                                                '&:hover': {
                                                                    bgcolor: alpha(theme.palette.grey[500], 0.2),
                                                                }
                                                            }}
                                                        >
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip> */}
                                                </Box>
                                            </EmployeeCard>
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
                                                <StyledTableHeadCell>
                                                    <Box
                                                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                                        onClick={() => handleSort('EmployeeName')}
                                                    >
                                                        Employee
                                                        {sortField === 'EmployeeName' && (
                                                            sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                                        )}
                                                    </Box>
                                                </StyledTableHeadCell>
                                                <StyledTableHeadCell>
                                                    <Box
                                                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                                        onClick={() => handleSort('UserName')}
                                                    >
                                                        Username
                                                        {sortField === 'UserName' && (
                                                            sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                                        )}
                                                    </Box>
                                                </StyledTableHeadCell>
                                                <StyledTableHeadCell>
                                                    <Box
                                                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                                        onClick={() => handleSort('Email')}
                                                    >
                                                        Email
                                                        {sortField === 'Email' && (
                                                            sortDirection === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
                                                        )}
                                                    </Box>
                                                </StyledTableHeadCell>
                                                <StyledTableHeadCell>Position</StyledTableHeadCell>
                                                <StyledTableHeadCell>Role</StyledTableHeadCell>
                                                <StyledTableHeadCell align="center">Actions</StyledTableHeadCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredEmployees.map((employee) => (
                                                <StyledTableRow key={employee.UserID}>
                                                    <StyledTableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{ position: 'relative' }}>
                                                                <Avatar
                                                                    src={employee.Photo || defaultAvatar}
                                                                    alt={employee.EmployeeName}
                                                                    sx={{
                                                                        width: 50,
                                                                        height: 50,
                                                                        border: `2px solid ${theme.palette.background.paper}`,
                                                                        boxShadow: theme.shadows[2]
                                                                    }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = defaultAvatar;
                                                                    }}
                                                                />
                                                                <StatusBadge status={employee.Status} />
                                                            </Box>
                                                            <Box sx={{ ml: 2 }}>
                                                                <Typography variant="body1" fontWeight="medium">
                                                                    {employee.EmployeeName}
                                                                </Typography>
                                                                <StatusChip
                                                                    label={getStatusLabel(employee.Status)}
                                                                    status={employee.Status}
                                                                    size="small"
                                                                    icon={getStatusIcon(employee.Status)}
                                                                    sx={{ mt: 0.5 }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </StyledTableCell>
                                                    <StyledTableCell>{employee.UserName}</StyledTableCell>
                                                    <StyledTableCell>{employee.Email}</StyledTableCell>
                                                    <StyledTableCell>
                                                        <Chip
                                                            label={employee.Position?.name || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                color: theme.palette.primary.main,
                                                                fontWeight: 500,
                                                                borderRadius: '8px'
                                                            }}
                                                        />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Chip
                                                            label={employee.Role?.name || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                color: theme.palette.secondary.main,
                                                                fontWeight: 500,
                                                                borderRadius: '8px'
                                                            }}
                                                        />
                                                    </StyledTableCell>
                                                    <StyledTableCell align="center">
                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                            {userPermissions?.includes('change_user') && (
                                                                <Tooltip title="Edit">
                                                                    <IconButton
                                                                        color="primary"
                                                                        size="small"
                                                                        onClick={() => handleEdit(employee)}
                                                                        sx={{
                                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                            '&:hover': {
                                                                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                                            }
                                                                        }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {userPermissions?.includes('delete_user') && (
                                                                <Tooltip title="Delete">
                                                                    <IconButton
                                                                        color="error"
                                                                        size="small"
                                                                        onClick={() => handleDelete(employee.UserID)}
                                                                        sx={{
                                                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                                                            '&:hover': {
                                                                                bgcolor: alpha(theme.palette.error.main, 0.2),
                                                                            }
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip title="More Actions">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleActionMenuOpen(e, employee)}
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
                                                        </Stack>
                                                    </StyledTableCell>
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
                                    <PersonIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.5) }} />
                                </Box>
                                <Typography variant="h5" color="text.secondary" gutterBottom>
                                    No employees found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                                    We couldn't find any employees matching your search criteria. Try adjusting your filters or add a new employee.
                                </Typography>
                                <StyledButton
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={fetchEmployees}
                                >
                                    Refresh
                                </StyledButton>
                            </Box>
                        )}
                    </Box>

                    {/* Pagination */}
                    {!loading && filteredEmployees.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Showing {filteredEmployees.length} of {employees.length} employees
                            </Typography>
                            <TablePagination
                                component="div"
                                count={-1} // We don't know the total count from the backend
                                page={currentPage - 1}
                                onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                labelDisplayedRows={({ page }) => `Page ${page + 1}`}
                                sx={{
                                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                        m: 0
                                    }
                                }}
                            />
                        </Box>
                    )}
                </Box>
            </StyledCard>

            {/* Add Employee Modal */}
            <Dialog
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                fullWidth
                maxWidth="md"
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 500 }}
                PaperProps={{
                    elevation: 24,
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                            <AddIcon />
                        </Avatar>
                        <Typography variant="h6" component="div" fontWeight="bold">
                            Add New Employee
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar
                                src={previewImage || defaultAvatar}
                                sx={{
                                    width: 150,
                                    height: 150,
                                    mb: 2,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    border: `4px solid ${theme.palette.background.paper}`
                                }}
                            />
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                sx={{
                                    mb: 1,
                                    borderRadius: '10px',
                                    textTransform: 'none'
                                }}
                            >
                                Upload Photo
                                <VisuallyHiddenInput type="file" onChange={handleFileChange} accept="image/*" />
                            </Button>
                            <Typography variant="caption" color="text.secondary" align="center">
                                Recommended: 300x300px JPG or PNG
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Username"
                                        fullWidth
                                        required
                                        value={newEmployee.UserName}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, UserName: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BadgeIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Full Name"
                                        fullWidth
                                        required
                                        value={newEmployee.EmployeeName}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, EmployeeName: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Email Address"
                                        type="email"
                                        fullWidth
                                        required
                                        value={newEmployee.Email}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, Email: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Password"
                                        type={showPassword ? "text" : "password"}
                                        fullWidth
                                        required
                                        value={newEmployee.Password}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, Password: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BadgeIcon color="primary" />
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
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                {/* <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Employee ID"
                                        fullWidth
                                        required
                                        value={newEmployee.EmployeeID}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, EmployeeID: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BadgeIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid> */}
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                                        <InputLabel>Position</InputLabel>
                                        <Select
                                            value={newEmployee.PositionID}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, PositionID: e.target.value }
                                            )}
                                            label="Position"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <WorkIcon color="primary" />
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="">
                                                <em>Select Position</em>
                                            </MenuItem>
                                            {positions.map(position => (
                                                <MenuItem key={position.id} value={position.id}>
                                                    {position.position_name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                                        <InputLabel>Role</InputLabel>
                                        <Select
                                            value={newEmployee.RoleID}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, RoleID: e.target.value })}
                                            label="Role"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <BadgeIcon color="primary" />
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="">
                                                <em>Select Role</em>
                                            </MenuItem>
                                            {roles.filter(role => role.id !== 1 && role.id !== 4).map(role => (
                                                <MenuItem key={role.id} value={role.id}>
                                                    {role.RoleName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}>
                                <Chip
                                    label="Bank Details (Optional)"
                                    icon={<AccountBalanceIcon />}
                                    sx={{ px: 1 }}
                                />
                            </Divider>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Bank Name"
                                fullWidth
                                value={newEmployee.bank_name || ''}
                                onChange={(e) => setNewEmployee({ ...newEmployee, bank_name: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccountBalanceIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Account Number"
                                fullWidth
                                value={newEmployee.account_number || ''}
                                onChange={(e) => setNewEmployee({ ...newEmployee, account_number: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CreditCardIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                helperText="Must be 9-18 digits"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="IFSC Code"
                                fullWidth
                                value={newEmployee.ifsc_code || ''}
                                onChange={(e) => setNewEmployee({ ...newEmployee, ifsc_code: e.target.value.toUpperCase() })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <QrCodeIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                helperText="Format: AAAA0XXXXXX"
                            />
                        </Grid>
                    </Grid>

                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setShowAddModal(false)}
                        startIcon={<CloseIcon />}
                        sx={{ borderRadius: '10px', textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <StyledButton
                        variant="contained"
                        color="primary"
                        onClick={handleAddEmployee}
                        disabled={!newEmployee.UserName || !newEmployee.Email || !newEmployee.Password ||
                            !newEmployee.EmployeeName || !newEmployee.PositionID || !newEmployee.RoleID 
                            }


                        startIcon={<AddIcon />}
                    >
                        Add Employee
                    </StyledButton>
                </DialogActions>
            </Dialog>

            {/* Edit Employee Modal */}
            <Dialog
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                fullWidth
                maxWidth="md"
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 500 }}
                PaperProps={{
                    elevation: 24,
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                            <EditIcon />
                        </Avatar>
                        <Typography variant="h6" component="div" fontWeight="bold">
                            Edit Employee
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {editEmployee && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Avatar
                                    src={previewImage || editEmployee.Photo || defaultAvatar}
                                    sx={{
                                        width: 150,
                                        height: 150,
                                        mb: 2,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        border: `4px solid ${theme.palette.background.paper}`
                                    }}
                                />
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        mb: 1,
                                        borderRadius: '10px',
                                        textTransform: 'none'
                                    }}
                                >
                                    Change Photo
                                    <VisuallyHiddenInput type="file" onChange={handleFileChange} accept="image/*" />
                                </Button>
                                <Typography variant="caption" color="text.secondary" align="center">
                                    Recommended: 300x300px JPG or PNG
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Username"
                                            fullWidth
                                            required
                                            value={editEmployee.UserName || ''}
                                            onChange={(e) => setEditEmployee({ ...editEmployee, UserName: e.target.value })}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BadgeIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Full Name"
                                            fullWidth
                                            required
                                            value={editEmployee.EmployeeName || ''}
                                            onChange={(e) => setEditEmployee({ ...editEmployee, EmployeeName: e.target.value })}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PersonIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Email Address"
                                            type="email"
                                            fullWidth
                                            required
                                            value={editEmployee.Email || ''}
                                            onChange={(e) => setEditEmployee({ ...editEmployee, Email: e.target.value })}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Password (leave blank to keep current)"
                                            type={showPassword ? "text" : "password"}
                                            fullWidth
                                            value={editEmployee.Password || ''}
                                            onChange={(e) => setEditEmployee({ ...editEmployee, Password: e.target.value })}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BadgeIcon color="primary" />
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
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                                            <InputLabel>Position</InputLabel>
                                            <Select
                                                value={editEmployee.PositionID || ''}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, PositionID: e.target.value })}
                                                label="Position"
                                                startAdornment={
                                                    <InputAdornment position="start">
                                                        <WorkIcon color="primary" />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value="">
                                                    <em>Select Position</em>
                                                </MenuItem>
                                                {positions.map(position => (
                                                    <MenuItem key={position.id} value={position.id}>
                                                        {position.position_name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                                            <InputLabel>Role</InputLabel>
                                            <Select
                                                value={editEmployee.RoleID || ''}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, RoleID: e.target.value })}
                                                label="Role"
                                                startAdornment={
                                                    <InputAdornment position="start">
                                                        <BadgeIcon color="primary" />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value="">
                                                    <em>Select Role</em>
                                                </MenuItem>
                                                {roles.map(role => (
                                                    <MenuItem key={role.id} value={role.id}>
                                                        {role.RoleName}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }}>
                                    <Chip
                                        label="Bank Details"
                                        icon={<AccountBalanceIcon />}
                                        sx={{ px: 1 }}
                                    />
                                </Divider>
                            </Grid>

                            {bankDetailsError && (
                                <Grid item xs={12}>
                                    <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                                        {bankDetailsError}
                                    </Alert>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    label="Bank Name"
                                    fullWidth
                                    value={editEmployee.bank_name || ''}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, bank_name: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountBalanceIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    error={!bankDetailsValid && editEmployee.bank_name === ''}
                                    helperText={!bankDetailsValid && editEmployee.bank_name === '' ? 'Bank name is required' : ''}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Account Number"
                                    fullWidth
                                    value={editEmployee.account_number || ''}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, account_number: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CreditCardIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    error={!bankDetailsValid && !/^\d{9,18}$/.test(editEmployee.account_number || '')}
                                    helperText={!bankDetailsValid && !/^\d{9,18}$/.test(editEmployee.account_number || '') ? 'Account number must be 9-18 digits' : ''}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="IFSC Code"
                                    fullWidth
                                    value={editEmployee.ifsc_code || ''}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, ifsc_code: e.target.value.toUpperCase() })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <QrCodeIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    error={!bankDetailsValid && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(editEmployee.ifsc_code || '')}
                                    helperText={!bankDetailsValid && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(editEmployee.ifsc_code || '') ? 'IFSC code must be in format AAAA0XXXXXX' : 'Format: AAAA0XXXXXX'}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setShowEditModal(false)}
                        startIcon={<CloseIcon />}
                        sx={{ borderRadius: '10px', textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <StyledButton
                        variant="contained"
                        color="primary"
                        onClick={handleEditSubmit}
                        disabled={!editEmployee?.UserName || !editEmployee?.Email ||
                            !editEmployee?.EmployeeName || !editEmployee?.PositionID || !editEmployee?.RoleID}
                        startIcon={<CheckCircleIcon />}
                    >
                        Save Changes
                    </StyledButton>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 500 }}
                PaperProps={{
                    elevation: 24,
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.error.main, mr: 2 }}>
                            <DeleteIcon />
                        </Avatar>
                        <Typography variant="h6" component="div" fontWeight="bold">
                            Confirm Delete
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar
                            src={deleteEmployee?.Photo || defaultAvatar}
                            sx={{ width: 60, height: 60, mr: 2 }}
                        />
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {deleteEmployee?.EmployeeName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {deleteEmployee?.Email}
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Are you sure you want to delete this employee? This action cannot be undone.
                    </Typography>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        All data associated with this employee will be permanently removed from the system.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setShowDeleteModal(false)}
                        startIcon={<CloseIcon />}
                        sx={{ borderRadius: '10px', textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteConfirm}
                        startIcon={<DeleteIcon />}
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            boxShadow: theme.shadows[3],
                            '&:hover': {
                                boxShadow: theme.shadows[5],
                            }
                        }}
                    >
                        Delete Employee
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Action Menu */}
            {/* <Menu
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
                <MenuItem onClick={() => {
                    handleEdit(actionEmployee);
                    handleActionMenuClose();
                }} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText>Edit Employee</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { c
                    handleDelete(actionEmployee?.UserID);
                    handleActionMenuClose();
                }} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Delete Employee" primaryTypographyProps={{ color: 'error' }} />
                </MenuItem>
                <Divider />

                <MenuItem sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <VisibilityIcon fontSize="small" color="info" />
                    </ListItemIcon>
                    <ListItemText>View Details</ListItemText>
                </MenuItem>
                <MenuItem sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <EmailIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText>Send Email</ListItemText>
                </MenuItem>
            </Menu> */}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                TransitionComponent={Fade}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarSeverity}
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
                            onClick={handleCloseSnackbar}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {/* Loading Backdrop */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backdropFilter: 'blur(4px)'
                }}
                open={loading && (showAddModal || showEditModal || showDeleteModal)}
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
                            {showAddModal ? 'Adding...' : showEditModal ? 'Saving...' : 'Deleting...'}
                        </Typography>
                    </Box>
                </Box>
            </Backdrop>
        </Box>
    );
};

export default Employees;
