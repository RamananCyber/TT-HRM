import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';

// Material UI Icons
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Styled components
import { styled, alpha } from '@mui/material/styles';
import { 
  getDailyReports, 
  exportDailyReport, 
  getEmployees, 
  getProjects 
} from '../../../services/reportService';

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

const HoursChip = styled(Chip)(({ theme, hours }) => {
  const getColor = (hours) => {
    if (hours >= 8) return 'success';
    if (hours >= 6) return 'warning';
    return 'error';
  };

  return {
    fontWeight: 600,
    borderRadius: '6px',
    fontSize: '0.75rem',
    height: '24px',
    boxShadow: `0 2px 4px ${alpha(theme.palette[getColor(hours)]?.main || theme.palette.grey[500], 0.2)}`,
  };
});

// Report tab configuration
const REPORT_TABS = [
  { id: 0, label: 'Daily Reports', icon: <CalendarTodayIcon /> },
  { id: 1, label: 'Weekly Summary', icon: <AssessmentIcon /> },
  { id: 2, label: 'Project Analysis', icon: <BusinessIcon /> }
];

// Export format configuration
const EXPORT_FORMATS = [
  { id: 'excel', label: 'Excel', color: 'success' },
  { id: 'pdf', label: 'PDF', color: 'error' },
  { id: 'word', label: 'Word', color: 'info' }
];

// Table column configuration
const TABLE_COLUMNS = [
  { id: 'empId', label: 'Emp ID', align: 'left' },
  { id: 'empName', label: 'Employee', align: 'left' },
  { id: 'date', label: 'Date', align: 'left' },
  { id: 'section', label: 'Section', align: 'left' },
  { id: 'hours', label: 'Hours', align: 'left' },
  { id: 'project', label: 'Project', align: 'left' },
  { id: 'workDetails', label: 'Work Details', align: 'left' },
  { id: 'actions', label: 'Actions', align: 'right' }
];

const DailyReport = () => {
  const theme = useTheme();
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    employee: '',
    date: '',
    project: ''
  });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState({
    employees: false,
    projects: false
  });
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    severity: 'info',
  });
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch initial data
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
    fetchReports();
  }, []);
  
  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setDataLoading(prev => ({ ...prev, employees: true }));
      const data = await getEmployees();
      // Add "All Employees" option
      setEmployees([
        { id: '', name: 'All Employees' },
        ...data
      ]);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      showSnackbar('Failed to load employees', 'error');
    } finally {
      setDataLoading(prev => ({ ...prev, employees: false }));
    }
  };
  
  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setDataLoading(prev => ({ ...prev, projects: true }));
      const data = await getProjects();
      // Add "All Projects" option
      setProjects([
        { id: '', name: 'All Projects' },
        ...data
      ]);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      showSnackbar('Failed to load projects', 'error');
    } finally {
      setDataLoading(prev => ({ ...prev, projects: false }));
    }
  };
  
  // Fetch reports based on filters
  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getDailyReports(filters);
      setReports(data);
      showSnackbar('Reports loaded successfully', 'success');
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      showSnackbar('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle export in different formats
  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      const result = await exportDailyReport(format, filters);
      
      if (result.success) {
        showSnackbar(`Report exported as ${format.toUpperCase()} successfully`, 'success');
      } else {
        showSnackbar(`Export failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
      showSnackbar(`Failed to export as ${format}: ${error.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    fetchReports();
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Show snackbar notifications
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      visible: true,
      message,
      severity,
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      employee: '',
      date: '',
      project: ''
    });
  };

  // Get field value from report object
  const getReportField = (report, field) => {
    const fieldMap = {
      'empId': report["Emp ID"],
      'empName': report["Emp Name"],
      'date': report["Date"],
      'section': report["Section"],
      'hours': report["Hours"],
      'project': report["Project"],
      'workDetails': report["Work Details"]
    };
    
    return fieldMap[field] || '';
  };

  // Calculate report summary statistics
  const calculateSummary = (reports) => {
    if (!reports || reports.length === 0) return { employees: 0, totalHours: 0, avgHours: 0 };
    
    const uniqueEmployees = new Set(reports.map(r => r["Emp ID"])).size;
    const totalHours = reports.reduce((sum, r) => sum + parseFloat(r["Hours"]), 0);
    const avgHours = uniqueEmployees > 0 ? totalHours / uniqueEmployees : 0;
    
    return {
      employees: uniqueEmployees,
      totalHours: totalHours.toFixed(1),
      avgHours: avgHours.toFixed(1)
    };
  };

  // Get summary data
  const summary = calculateSummary(reports);

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
              <AssessmentIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  Work Reports
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                  Track and analyze employee work activities
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Tabs for different report types */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px 8px 0 0',
              },
              '& .Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            {REPORT_TABS.map(tab => (
              <Tab 
                key={tab.id} 
                label={tab.label} 
                icon={tab.icon} 
                iconPosition="start" 
              />
            ))}
          </Tabs>

          {/* Filters Section */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              mb: 3,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                >
                  <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
                  Filter Reports
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <StyledTextField
                  select
                  fullWidth
                  label="Employee"
                  value={filters.employee}
                  onChange={(e) => handleFilterChange('employee', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  disabled={dataLoading.employees}
                >
                  {dataLoading.employees ? (
                    <MenuItem value="">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading employees...
                      </Box>
                    </MenuItem>
                  ) : (
                    employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))
                  )}
                </StyledTextField>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <StyledTextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <StyledTextField
                  select
                  fullWidth
                  label="Project"
                  value={filters.project}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  disabled={dataLoading.projects}
                >
                  {dataLoading.projects ? (
                    <MenuItem value="">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading projects...
                      </Box>
                    </MenuItem>
                  ) : (
                    projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))
                  )}
                </StyledTextField>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Reset Filters
              </Button>
              
              <StyledButton
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Reports'}
              </StyledButton>
            </Box>
          </Paper>

          {/* Export Options */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              {REPORT_TABS[tabValue]?.label || 'Reports'}
            </Typography>
            
            <Stack direction="row" spacing={2}>
              {EXPORT_FORMATS.map(format => (
                <StyledButton
                  key={format.id}
                  variant="outlined"
                  color={format.color}
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport(format.id)}
                  disabled={exportLoading || reports.length === 0}
                  size="small"
                >
                  {format.label}
                </StyledButton>
              ))}
            </Stack>
          </Box>

          {/* Reports Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : reports.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 2,
                border: `1px dashed ${theme.palette.divider}`
              }}
            >
              <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                No reports found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try adjusting your filters or select a different date
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchReports}
              >
                Refresh
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {TABLE_COLUMNS.map(column => (
                      <StyledTableHeadCell key={column.id} align={column.align}>
                        {column.label}
                      </StyledTableHeadCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report, index) => (
                    <StyledTableRow key={index}>
                      <StyledTableCell>
                        <Chip 
                          label={getReportField(report, 'empId')} 
                          color="primary" 
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 600 }}>
                        {getReportField(report, 'empName')}
                      </StyledTableCell>
                      <StyledTableCell>
                        {getReportField(report, 'date')}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip 
                          label={getReportField(report, 'section')} 
                          color="warning" 
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <HoursChip
                          label={`${getReportField(report, 'hours')} hrs`}
                          color={
                            parseFloat(getReportField(report, 'hours')) >= 8 ? 'success' : 
                            parseFloat(getReportField(report, 'hours')) >= 6 ? 'warning' : 
                            'error'
                          }
                          size="small"
                          hours={parseFloat(getReportField(report, 'hours'))}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography color="info.main" fontWeight={500}>
                          {getReportField(report, 'project')}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Tooltip title={getReportField(report, 'workDetails')}>
                          <Typography variant="body2" color="text.secondary">
                            {getReportField(report, 'workDetails')}
                          </Typography>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Tooltip title="More Options">
                          <IconButton
                            size="small"
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
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Summary Section */}
          {reports.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mt: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <InfoOutlinedIcon color="info" sx={{ mr: 1.5, mt: 0.3 }} />
              <Box>
                <Typography variant="subtitle2" color="info.main" fontWeight="bold">
                  Report Summary
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Employees: <strong>{summary.employees}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours: <strong>{summary.totalHours}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Average Hours/Employee: <strong>{summary.avgHours}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}
        </CardContent>
      </StyledCard>

      {/* Tab Content for Other Tabs */}
      {tabValue !== 0 && (
        <StyledCard sx={{ mt: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, flexDirection: 'column' }}>
              {REPORT_TABS[tabValue]?.icon && React.cloneElement(REPORT_TABS[tabValue].icon, { 
                sx: { fontSize: 60, color: 'text.secondary', opacity: 0.3 } 
              })}
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                {REPORT_TABS[tabValue]?.label} Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', maxWidth: 500 }}>
                We're working on adding {REPORT_TABS[tabValue]?.label.toLowerCase()} to help you track productivity trends.
                This feature will be available in the next update.
              </Typography>
            </Box>
          </CardContent>
        </StyledCard>
      )}

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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Backdrop for exports */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(4px)'
        }}
        open={exportLoading}
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
              Exporting...
            </Typography>
          </Box>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default DailyReport;

