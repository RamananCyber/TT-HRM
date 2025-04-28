import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity, FiUsers, FiCheckCircle, FiClock, FiPieChart,
  FiTrendingUp, FiBarChart2, FiAlertCircle, FiBriefcase,
  FiSun, FiMoon, FiFilter, FiRefreshCw
} from 'react-icons/fi';
import './DashboardEnhanced.css';
import { FiUserCheck, FiUserX, FiCoffee, FiCalendar } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeUsers: 0,
    completedTasks: 0,
    totalTasks: 0,
    totalHours: 0,
    projectDistribution: {},
    userPerformance: [],
    taskPriorityDistribution: {},
    overdueTasks: [],
    overdueProjects: [],
    taskCompletionRate: 0,
    taskVerificationRate: 0,
    avgTaskCompletionTime: 0,
    projectVsUserPerformance: [],
    tasksWithBlockers: [],
    overdueTasksByProject: [],
    overdueTasksByPriority: [],
    userHoursOverTime: [],
    projectProgressOverTime: [],
    expectedVsActualData: [],
    userPerformanceDetailed: [],
    totalActiveHours: 0,
    totalInactiveHours: 0,
    trends: {
      totalProjects: 0,
      activeUsers: 0,
      completedTasks: 0,
      totalHours: 0,
      taskCompletionRate: 0,
      taskVerificationRate: 0,
      avgTaskCompletionTime: 0,
      activeVsInactiveHours: 0
    }
  });

  const [userStatusCounts, setUserStatusCounts] = useState({
    punched_in: 0,
    on_break: 0,
    on_leave: 0,
    offline: 0,
    total: 0
  });


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Theme colors based on mode
  const theme = {
    primary: darkMode ? '#60a5fa' : '#3b82f6',
    secondary: darkMode ? '#a78bfa' : '#8b5cf6',
    success: darkMode ? '#34d399' : '#10b981',
    warning: darkMode ? '#fbbf24' : '#f59e0b',
    danger: darkMode ? '#f87171' : '#ef4444',
    info: darkMode ? '#93c5fd' : '#3b82f6',
    background: darkMode ? '#1f2937' : '#ffffff',
    surface: darkMode ? '#111827' : '#f9fafb',
    text: darkMode ? '#f9fafb' : '#111827',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
  };

  // Chart colors
  const chartColors = {
    pieColors: [
      theme.primary,
      theme.success,
      theme.warning,
      theme.danger,
      theme.secondary,
    ],
    barColors: [
      theme.primary,
      theme.success,
      theme.warning,
      theme.danger,
    ],
    lineColors: {
      primary: {
        fill: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        stroke: theme.primary
      },
      success: {
        fill: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        stroke: theme.success
      }
    }
  };

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch (e) {
      return {}
    }
  }

  const fetchUserStatusCounts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/user-status-counts/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStatusCounts(response.data);
    } catch (err) {
      console.error('Error fetching user status counts:', err);
    }
  };

  // Add this function to get the current user's information
  const getCurrentUserInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userInfo = parseJwt(token);


      setCurrentUser(userInfo.employee_name);
      setUserRole(userInfo.role.id);

      // If user is a developer (role ID 3), automatically set selectedUser to their name
      if (userInfo.role.id === 3) {
        setSelectedUser(userInfo.employee_name);
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('dashboardDarkMode') === 'true';
    setDarkMode(savedDarkMode);

    getCurrentUserInfo();
    fetchDashboardData();
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('dashboardDarkMode', darkMode);
    // Apply dark mode to body for global styling
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeRange }
      });
      setStats(response.data);
      setError(null);
      if (userRole !== 1) {
        await fetchUserStatusCounts();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const UserStatusSection = () => {
    if (userRole === 1 || userRole === 3) return null; // Only show for super admin

    return (
      <div className="user-status-section">
        <h3 className="section-title">User Status Overview</h3>
        <div className="user-status-grid">
          <motion.div
            className="user-status-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }}
          >
            <div className="status-icon" style={{ backgroundColor: `${theme.success}20`, color: theme.success }}>
              <FiUserCheck size={24} />
            </div>
            <div className="status-content">
              <h4>Punched In</h4>
              <div className="status-count">{userStatusCounts.punched_in}</div>
              <div className="status-percentage">
                {userStatusCounts.total > 0
                  ? `${Math.round((userStatusCounts.punched_in / userStatusCounts.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="user-status-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }}
          >
            <div className="status-icon" style={{ backgroundColor: `${theme.warning}20`, color: theme.warning }}>
              <FiCoffee size={24} />
            </div>
            <div className="status-content">
              <h4>On Break</h4>
              <div className="status-count">{userStatusCounts.on_break}</div>
              <div className="status-percentage">
                {userStatusCounts.total > 0
                  ? `${Math.round((userStatusCounts.on_break / userStatusCounts.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="user-status-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }}
          >
            <div className="status-icon" style={{ backgroundColor: `${theme.info}20`, color: theme.info }}>
              <FiCalendar size={24} />
            </div>
            <div className="status-content">
              <h4>On Leave</h4>
              <div className="status-count">{userStatusCounts.on_leave}</div>
              <div className="status-percentage">
                {userStatusCounts.total > 0
                  ? `${Math.round((userStatusCounts.on_leave / userStatusCounts.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="user-status-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }}
          >
            <div className="status-icon" style={{ backgroundColor: `${theme.danger}20`, color: theme.danger }}>
              <FiUserX size={24} />
            </div>
            <div className="status-content">
              <h4>Offline</h4>
              <div className="status-count">{userStatusCounts.offline}</div>
              <div className="status-percentage">
                {userStatusCounts.total > 0
                  ? `${Math.round((userStatusCounts.offline / userStatusCounts.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };
  // Helper function to get selected user's data
  const getSelectedUserData = () => {
    if (!selectedUser) return null;
    return stats.userPerformance.find(user => user.EmployeeName === selectedUser);
  };

  // Helper functions to filter data by selected user
  const filterTasksByUser = (tasks) => {
    if (!selectedUser || !tasks) return tasks;
    return tasks.filter(task =>
      task.AssignedUserID && task.AssignedUserID.EmployeeName === selectedUser
    );
  };

  const filterProjectsByUser = (projects) => {
    if (!selectedUser || !projects) return projects;
    return projects.filter(project =>
      project.AssignedUsers &&
      project.AssignedUsers.some(user => user.EmployeeName === selectedUser)
    );
  };

  // Get user-specific stats
  const getUserSpecificStats = () => {
    if (!selectedUser) return stats;

    // Find the user's detailed performance data
    const userData = stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser) || {};

    // Get user-specific task priority distribution
    const userTasks = filterTasksByUser(stats.tasks || []);
    const userTaskPriorityDistribution = userTasks.reduce((acc, task) => {
      acc[task.Priority] = (acc[task.Priority] || 0) + 1;
      return acc;
    }, {});

    // Calculate user-specific metrics
    return {
      ...stats,
      totalTasks: userData.total_tasks_assigned || 0,
      completedTasks: userData.completed_tasks || 0,
      totalHours: userData.total_actual_hours || 0,
      taskCompletionRate: userData.total_tasks_assigned
        ? (userData.completed_tasks / userData.total_tasks_assigned) * 100
        : 0,
      taskPriorityDistribution: Object.keys(stats.taskPriorityDistribution).length > 0
        ? userTaskPriorityDistribution
        : stats.taskPriorityDistribution,
      overdueTasks: filterTasksByUser(stats.overdueTasks || []),
      overdueProjects: filterProjectsByUser(stats.overdueProjects || []),
      overdueTasksByProject: stats.overdueTasksByProject.filter(item =>
        userTasks.some(task => task.ProjectID && task.ProjectID.Name === item.Name)
      ),
      overdueTasksByPriority: Object.fromEntries(
        Object.entries(stats.overdueTasksByPriority).filter(([priority]) =>
          userTasks.some(task => task.Priority === priority)
        )
      ),
      userHoursOverTime: stats.userHoursOverTime.filter(item =>
        item.employee_name === selectedUser
      ),
      totalActiveHours: userData.total_actual_hours || 0,
      totalInactiveHours: userData.total_inactive_hours || 0,
    };
  };

  // Use filtered stats based on selected user
  const displayStats = selectedUser ? getUserSpecificStats() : stats;

  // Format number with commas
  const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    return num.toLocaleString('en-US');
  };

  // Chart data preparation
  const projectDistributionData = {
    labels: Object.keys(displayStats.projectDistribution || {}),
    datasets: [{
      data: Object.values(displayStats.projectDistribution || {}),
      backgroundColor: chartColors.pieColors,
      borderColor: chartColors.pieColors.map(color => color.replace('0.8', '1')),
      borderWidth: 1,
      hoverOffset: 10
    }],
  };

  const taskPriorityDistributionData = {
    labels: Object.keys(displayStats.taskPriorityDistribution || {}),
    datasets: [{
      data: Object.values(displayStats.taskPriorityDistribution || {}),
      backgroundColor: chartColors.barColors,
      borderColor: chartColors.barColors.map(color => color.replace('0.7', '1')),
      borderWidth: 1,
      borderRadius: 6,
      hoverBackgroundColor: chartColors.barColors.map(color => color.replace('0.7', '0.9')),
    }],
  };

  const overdueTasksByProjectData = {
    labels: (displayStats.overdueTasksByProject || []).map(item => item.Name),
    datasets: [{
      label: 'Overdue Tasks',
      data: (displayStats.overdueTasksByProject || []).map(item => item.overdue_count),
      backgroundColor: theme.danger,
      borderRadius: 6,
    }],
  };

  // User performance data
  const userPerformanceData = selectedUser ? {
    labels: ['Tasks Assigned', 'Tasks Completed', 'Hours Worked'],
    datasets: [{
      label: selectedUser,
      data: [
        getSelectedUserData()?.tasks_assigned || 0,
        getSelectedUserData()?.tasks_completed || 0,
        getSelectedUserData()?.total_hours_worked || 0,
      ],
      backgroundColor: [theme.warning, theme.success, theme.info],
      borderRadius: 6,
    }]
  } : {
    labels: (stats.userPerformance || []).map(user => user.EmployeeName),
    datasets: [
      {
        label: 'Tasks Assigned',
        data: (stats.userPerformance || []).map(user => user.tasks_assigned || 0),
        backgroundColor: theme.warning,
        borderRadius: 6,
        stack: 'Stack 0',
      },
      {
        label: 'Tasks Completed',
        data: (stats.userPerformance || []).map(user => user.tasks_completed || 0),
        backgroundColor: theme.success,
        borderRadius: 6,
        stack: 'Stack 1',
      },
      {
        label: 'Hours Worked',
        data: (stats.userPerformance || []).map(user => user.total_hours_worked || 0),
        backgroundColor: theme.info,
        borderRadius: 6,
        stack: 'Stack 2',
      },
    ],
  };

  const overdueTasksByPriorityData = {
    labels: Object.keys(displayStats.overdueTasksByPriority || {}),
    datasets: [{
      label: 'Overdue Tasks by Priority',
      data: Object.values(displayStats.overdueTasksByPriority || {}),
      backgroundColor: chartColors.pieColors,
      borderWidth: 0,
    }],
  };

  const userHoursOverTimeData = {
    labels: (displayStats.userHoursOverTime || []).map(item => item.day),
    datasets: selectedUser
      ? [{
        label: selectedUser,
        data: (displayStats.userHoursOverTime || []).map(item => item.total_hours),
        borderColor: chartColors.lineColors.primary.stroke,
        backgroundColor: chartColors.lineColors.primary.fill,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.lineColors.primary.stroke,
        pointBorderColor: theme.background,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
      : (stats.userPerformanceDetailed || []).slice(0, 5).map((user, index) => {
        const colorIndex = index % chartColors.pieColors.length;
        return {
          label: user.EmployeeName,
          data: (stats.userHoursOverTime || [])
            .filter(item => item.employee_name === user.EmployeeName)
            .map(item => item.total_hours),
          borderColor: chartColors.pieColors[colorIndex],
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: chartColors.pieColors[colorIndex],
          pointBorderColor: theme.background,
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        };
      }),
  };

  const projectProgressOverTimeData = {
    labels: (displayStats.projectProgressOverTime || []).map(item => item.day),
    datasets: [{
      label: 'Project Progress',
      data: (displayStats.projectProgressOverTime || []).map(item => item.progress),
      borderColor: chartColors.lineColors.success.stroke,
      backgroundColor: chartColors.lineColors.success.fill,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: chartColors.lineColors.success.stroke,
      pointBorderColor: theme.background,
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const expectedVsActualData = {
    labels: selectedUser
      ? [selectedUser]
      : (stats.userPerformanceDetailed || [])
        .filter(user => user.total_expected_hours > 0 || user.total_actual_hours > 0)
        .map(user => user.EmployeeName),
    datasets: [
      {
        label: 'Expected Hours',
        data: selectedUser
          ? [stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_expected_hours || 0]
          : (stats.userPerformanceDetailed || [])
            .filter(user => user.total_expected_hours > 0 || user.total_actual_hours > 0)
            .map(user => user.total_expected_hours),
        backgroundColor: theme.info,
        borderRadius: 6,
      },
      {
        label: 'Actual Hours',
        data: selectedUser
          ? [stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_actual_hours || 0]
          : (stats.userPerformanceDetailed || [])
            .filter(user => user.total_expected_hours > 0 || user.total_actual_hours > 0)
            .map(user => user.total_actual_hours),
        backgroundColor: theme.primary,
        borderRadius: 6,
      },
    ],
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.text,
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11,
          }
        }
      },
      tooltip: {
        backgroundColor: theme.surface,
        titleColor: theme.text,
        bodyColor: theme.textSecondary,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        displayColors: true,
        boxPadding: 5,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${formatNumber(value)} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    cutout: '60%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.text,
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11,
          }
        }
      },
      tooltip: {
        backgroundColor: theme.surface,
        titleColor: theme.text,
        bodyColor: theme.textSecondary,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        displayColors: true,
        boxPadding: 5,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatNumber(value)}`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: theme.textSecondary,
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: theme.border,
          drawBorder: false,
          lineWidth: 0.5
        },
        ticks: {
          color: theme.textSecondary,
          font: {
            size: 11
          },
          callback: (value) => formatNumber(value)
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.text,
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11,
          }
        }
      },
      tooltip: {
        backgroundColor: theme.surface,
        titleColor: theme.text,
        bodyColor: theme.textSecondary,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        displayColors: true,
        boxPadding: 5,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatNumber(value)}`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: theme.textSecondary,
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: theme.border,
          drawBorder: false,
          lineWidth: 0.5
        },
        ticks: {
          color: theme.textSecondary,
          font: {
            size: 11
          },
          callback: (value) => formatNumber(value)
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  // Stat card component
  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <motion.div
      className="dashboard-stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text
      }}
    >
      <div className="stat-card-icon" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title" style={{ color: theme.textSecondary }}>{title}</h3>
        <div className="stat-card-value" style={{ color: theme.text }}>{value}</div>
        {trend && (
          <div className={`stat-card-trend ${trendValue >= 0 ? 'positive' : 'negative'}`}>
            {trendValue >= 0 ? '↑' : '↓'} {Math.abs(trendValue)}%
          </div>
        )}
      </div>
    </motion.div>
  );

  // Chart card component
  const ChartCard = ({ title, children, subtitle }) => (
    <motion.div
      className="dashboard-chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text
      }}
    >
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {subtitle && <div className="chart-card-subtitle">{subtitle}</div>}
      </div>
      <div className="chart-card-body">
        {children}
      </div>
    </motion.div>
  );

  if (loading && !refreshing) {
    return (
      <div className="dashboard-loading" style={{ color: theme.text }}>
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="dashboard-error" style={{ color: theme.text }}>
        <FiAlertCircle size={48} color={theme.danger} />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          className="dashboard-retry-button"
          onClick={fetchDashboardData}
          style={{ backgroundColor: theme.primary }}
        >
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Performance Dashboard</h1>
          <p>Overview of project metrics and team performance</p>
        </div>
        <div className="dashboard-actions">
          <div className="dashboard-filters">
            <div className="filter-group">
              <label>Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text
                }}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            {userRole !== 3 && (
              <div className="filter-group">
                <label>User:</label>
                <select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(e.target.value || null)}
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text
                  }}
                >
                  <option value="">All Users</option>
                  {stats.userPerformance?.map(user => (
                    <option key={user.EmployeeName} value={user.EmployeeName}>
                      {user.EmployeeName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="dashboard-controls">
            <button
              className="refresh-button"
              onClick={fetchDashboardData}
              disabled={refreshing}
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text
              }}
            >
              <FiRefreshCw className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text
              }}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Projects"
          value={formatNumber(displayStats.totalProjects)}
          icon={<FiBriefcase />}
          color={theme.primary}
          trend={true}
          trendValue={displayStats.trends?.totalProjects || 0}
        />
        {userRole === 1 && (<StatCard
          title="Active Users"
          value={formatNumber(selectedUser ? 1 : displayStats.activeUsers)}
          icon={<FiUsers />}
          color={theme.info}
          trend={true}
          trendValue={displayStats.trends?.activeUsers || 0}
        />)}
        <StatCard
          title="Tasks Completed"
          value={formatNumber(displayStats.completedTasks)}
          icon={<FiCheckCircle />}
          color={theme.success}
          trend={true}
          trendValue={displayStats.trends?.completedTasks || 0}
        />
        <StatCard
          title="Total Hours Worked"
          value={formatNumber(displayStats.totalHours)}
          icon={<FiClock />}
          color={theme.warning}
          trend={true}
          trendValue={displayStats.trends?.taskCompletionRate || 0}
        />
        <StatCard
          title="Task Completion Rate"
          value={`${formatNumber(displayStats.taskCompletionRate)}%`}
          icon={<FiPieChart />}
          color={theme.success}
          trend={true}
          trendValue={displayStats.trends?.taskCompletionRate || 0}
        />
        <StatCard
          title="Task Verification Rate"
          value={`${formatNumber(displayStats.taskVerificationRate)}%`}
          icon={<FiTrendingUp />}
          color={theme.info}
          trend={true}
          trendValue={displayStats.trends?.taskVerificationRate || 0}
        />
        <StatCard
          title="Avg. Task Completion Time"
          value={`${formatNumber(displayStats.avgTaskCompletionTime)} hrs`}
          icon={<FiBarChart2 />}
          color={theme.warning}
          trend={true}
          trendValue={displayStats.trends?.avgTaskCompletionTime || 0}
        />
        <StatCard
          title="Active vs Inactive Hours"
          value={`${formatNumber(displayStats.totalActiveHours)}/${formatNumber(displayStats.totalInactiveHours)}`}
          icon={<FiActivity />}
          color={theme.danger}
          trend={true}
          trendValue={displayStats.trends?.activeVsInactiveHours || 0}
        />
      </div>
      {userRole !== 1 && (
        <UserStatusSection />

      )}
      <div className="dashboard-charts-grid">
        <ChartCard title="Project State Distribution">
          <div className="chart-container">
            <Doughnut data={projectDistributionData} options={pieChartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Task Priority Distribution">
          <div className="chart-container">
            <Bar data={taskPriorityDistributionData} options={barChartOptions} />
          </div>
        </ChartCard>

        <ChartCard
          title="User Performance"
          subtitle={selectedUser ? `Performance metrics for ${selectedUser}` : 'Team performance comparison'}
        >
          <div className="chart-container">
            <Bar
              data={userPerformanceData}
              options={{
                ...barChartOptions,
                indexAxis: selectedUser ? 'y' : 'x',
                scales: {
                  ...barChartOptions.scales,
                  x: {
                    ...barChartOptions.scales.x,
                    stacked: false
                  },
                  y: {
                    ...barChartOptions.scales.y,
                    stacked: false
                  }
                }
              }}
            />
          </div>
          {selectedUser && (
            <div className="user-metrics">
              <div className="metric">
                <span className="metric-label">Completion Ratio:</span>
                <span className="metric-value">
                  {((getSelectedUserData()?.tasks_completed / getSelectedUserData()?.tasks_assigned || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Hours per Task:</span>
                <span className="metric-value">
                  {(getSelectedUserData()?.total_hours_worked / getSelectedUserData()?.tasks_completed || 0).toFixed(1)}
                  {(getSelectedUserData()?.total_hours_worked / getSelectedUserData()?.tasks_completed || 0).toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Overdue Tasks by Project">
          <div className="chart-container">
            <Bar data={overdueTasksByProjectData} options={barChartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Overdue Tasks by Priority">
          <div className="chart-container">
            <Pie data={overdueTasksByPriorityData} options={pieChartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="User Hours Over Time">
          <div className="chart-container">
            <Line data={userHoursOverTimeData} options={lineChartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Project Progress Over Time">
          <div className="chart-container">
            <Line data={projectProgressOverTimeData} options={lineChartOptions} />
          </div>
        </ChartCard>

        <ChartCard title="Expected vs. Actual Hours" className="full-width">
          <div className="chart-container">
            <Bar
              data={expectedVsActualData}
              options={{
                ...barChartOptions,
                scales: {
                  ...barChartOptions.scales,
                  x: {
                    ...barChartOptions.scales.x,
                    ticks: {
                      ...barChartOptions.scales.x.ticks,
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                }
              }}
            />
          </div>
        </ChartCard>
      </div>

      {selectedUser && (
        <div className="user-detail-section">
          <h2 className="section-title">Detailed Performance for {selectedUser}</h2>
          <div className="user-detail-grid">
            <div className="user-detail-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
              <h3>Task Completion</h3>
              <div className="progress-container">
                <div className="progress-label">
                  <span>Completion Rate</span>
                  <span>{((getSelectedUserData()?.tasks_completed / getSelectedUserData()?.tasks_assigned || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="progress-bar-bg" style={{ backgroundColor: `${theme.success}30` }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${((getSelectedUserData()?.tasks_completed / getSelectedUserData()?.tasks_assigned || 0) * 100)}%`,
                      backgroundColor: theme.success
                    }}
                  ></div>
                </div>
              </div>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-stat-value">{getSelectedUserData()?.tasks_assigned || 0}</span>
                  <span className="detail-stat-label">Assigned</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-value">{getSelectedUserData()?.tasks_completed || 0}</span>
                  <span className="detail-stat-label">Completed</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-value">{getSelectedUserData()?.tasks_assigned - getSelectedUserData()?.tasks_completed || 0}</span>
                  <span className="detail-stat-label">Pending</span>
                </div>
              </div>
            </div>

            <div className="user-detail-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
              <h3>Time Utilization</h3>
              <div className="progress-container">
                <div className="progress-label">
                  <span>Efficiency Ratio</span>
                  <span>
                    {(stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_expected_hours > 0
                      ? (stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_actual_hours /
                        stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_expected_hours) * 100
                      : 0).toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar-bg" style={{ backgroundColor: `${theme.info}30` }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min((stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_expected_hours > 0
                        ? (stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_actual_hours /
                          stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_expected_hours) * 100
                        : 0), 100)}%`,
                      backgroundColor: theme.info
                    }}
                  ></div>
                </div>
              </div>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-stat-value">
                    {formatNumber(stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_expected_hours || 0)}
                  </span>
                  <span className="detail-stat-label">Expected Hours</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-value">
                    {formatNumber(stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.total_actual_hours || 0)}
                  </span>
                  <span className="detail-stat-label">Actual Hours</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-value">
                    {formatNumber(stats.userPerformanceDetailed.find(u => u.EmployeeName === selectedUser)?.avg_hours_per_task || 0)}
                  </span>
                  <span className="detail-stat-label">Avg Hours/Task</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-footer">
        <p>Data last updated: {new Date().toLocaleString()}</p>
        {refreshing && <div className="footer-loading">Refreshing data <span className="loading-dots">...</span></div>}
      </div>
    </div>
  );
};

export default Dashboard;
