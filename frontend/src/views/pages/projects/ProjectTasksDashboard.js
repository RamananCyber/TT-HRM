import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiClock, FiCalendar,
  FiCheckCircle, FiAlertCircle, FiChevronDown, FiChevronUp,
  FiFilter, FiX, FiRefreshCw, FiCheck, FiXCircle, FiGrid,
  FiList, FiSun, FiMoon, FiActivity, FiFolder, FiUser, FiMoreVertical, FiTag, FiBarChart2, FiArrowRightCircle
} from 'react-icons/fi';
import './TasksDashboard.css';

const ProjectTasksDashboard = () => {
  const [activeTab, setActiveTab] = useState('inProgress');
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState({
    inProgress: [],
    queue: [],
    completed: [],
    pendingApproval: []
  });
  const [projects, setProjects] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ projectName: '' });
  const [taskCounts, setTaskCounts] = useState({
    queue: 0,
    in_progress: 0,
    completed: 0,
    pending_approval: 0
  });
  const [paginationState, setPaginationState] = useState({
    inProgress: { currentPage: 1, totalPages: 1, totalItems: 0 },
    queue: { currentPage: 1, totalPages: 1, totalItems: 0 },
    completed: { currentPage: 1, totalPages: 1, totalItems: 0 },
    pendingApproval: { currentPage: 1, totalPages: 1, totalItems: 0 }
  });
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    TaskName: '',
    Description: '',
    Priority: 'medium',
    Status: 'queue',
    ExpectedHours: '',
    Deadline: '',
    ProjectID: '',
    AssignedUserID: ''
  });
  const [usersList, setDevelopers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const ITEMS_PER_PAGE = 10;
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [selectedTaskIdsForAttendance, setSelectedTaskIdsForAttendance] = useState([]);
  const [punchedInTasks, setPunchedInTasks] = useState([]);
  const [showAddTaskToAttendanceModal, setShowAddTaskToAttendanceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    priority: 'all',
    assignedTo: 'all',
    deadline: 'all',
    project: 'all'
  });

  // Theme toggle functionality
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };



  const ThemeToggle = () => (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
    </button>
  );

  // Display toast notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    checkPunchInStatus();
  }, []);

  // Add this useEffect to refetch tasks when filters change
  useEffect(() => {
    if (userRole !== null) {
      fetchTasks();
    }
  }, [filters, activeTab, paginationState[activeTab].currentPage, userRole, isPunchedIn]);



  useEffect(() => {
    getUserRole();
    const fetchData = async () => {
      setIsLoading(true);
      await fetchProjects();
      await fetchTasks();
      await fetchDevelopers();
      setIsLoading(false);
    };

    if (userRole !== null) {
      fetchData();
    }
  }, [activeTab, paginationState[activeTab].currentPage, userRole, isPunchedIn]);

  const checkPunchInStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/punch-in/status/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setIsPunchedIn(response.data.is_punched_in);
      setPunchedInTasks(response.data.tasks || []);
      if (response.data.is_punched_in) {
        setSelectedTaskIdsForAttendance(response.data.tasks.map(task => task.TaskID));
      }
    } catch (error) {
      console.error('Error checking punch-in status:', error);
    }
  };

  const getUserRole = () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role.name.toLowerCase());
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const isAdmin = useMemo(() => {
    return userRole === 'admin' || userRole === 'super admin' || userRole === 'hr';
  }, [userRole]);

  const fetchDevelopers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        'http://localhost:8000/api/developers/',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setDevelopers(response.data);
    } catch (error) {
      console.error('Error fetching developers:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        'http://localhost:8000/api/projects/',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const getStateValue = (tab) => {
    const states = {
      inProgress: 'in_progress',
      queue: 'queue',
      completed: 'completed',
      pendingApproval: 'pending_approval'
    };
    return states[tab];
  };


  const filtered = {
    inProgress: [],
    queue: [],
    completed: [],
    pendingApproval: []
  };

  const fetchTasks = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('access_token');
      const currentPage = paginationState[activeTab].currentPage;
      let url = `http://localhost:8000/api/tasks/dashboard/?page=${currentPage}&page_size=${ITEMS_PER_PAGE}&state=${getStateValue(activeTab)}`;

      if (userRole === 'developer') {
        url += '&mine=true';
      }

      // Add filter parameters to the URL
      if (filters.priority !== 'all') {
        url += `&priority=${encodeURIComponent(filters.priority)}`;
      }

      if (filters.project !== 'all') {
        url += `&project_id=${encodeURIComponent(filters.project)}`;
      }

      if (filters.assignedTo !== 'all') {
        url += `&assigned_to=${encodeURIComponent(filters.assignedTo)}`;
      }

      if (filters.deadline === 'overdue') {
        url += '&overdue=true';
      } else if (filters.deadline === 'upcoming') {
        url += '&upcoming=true';
      }

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      console.log('Fetching tasks with URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Received data:', data);

      // Apply client-side filtering if needed
      const filteredResults = applyClientSideFilters(data.results);
      setTasks(filteredResults);

      setTaskCounts(data.total_counts);
      setPaginationState(prev => ({
        ...prev,
        [activeTab]: {
          currentPage: currentPage,
          totalPages: Math.ceil(data.count / ITEMS_PER_PAGE),
          totalItems: data.count
        }
      }));

      // Initialize filtered object BEFORE using it
      const filtered = {
        inProgress: [],
        queue: [],
        completed: [],
        pendingApproval: []
      };


      // Now use the filtered object
      filteredResults.forEach(task => {
        if (task.Status === 'in_progress') {
          filtered.inProgress.push(task);
        } else if (task.Status === 'queue') {
          filtered.queue.push(task);
        } else if (task.Status === 'completed' && task.IsTaskVerified === true) {
          filtered.completed.push(task);
        } else if (task.Status === 'pending_approval' && task.IsTaskVerified === false) { // Direct status check
          filtered.pendingApproval.push(task);
        }
      });

      console.log('Filtered results:', filtered.pendingApproval);


      setFilteredTasks(filtered);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showNotification('Failed to load tasks', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Make sure to add this function if it doesn't exist
  const applyClientSideFilters = (tasksData) => {
    let filteredData = [...tasksData];

    // Apply priority filter
    if (filters.priority !== 'all') {
      filteredData = filteredData.filter(task =>
        task.Priority?.toLowerCase() === filters.priority.toLowerCase()
      );
    }

    // Apply project filter
    if (filters.project !== 'all') {
      filteredData = filteredData.filter(task =>
        task.ProjectID === filters.project
      );
    }

    // Apply assignedTo filter
    if (filters.assignedTo !== 'all') {
      filteredData = filteredData.filter(task =>
        task.AssignedTo?.UserID === filters.assignedTo
      );
    }

    // Apply deadline filter
    if (filters.deadline === 'overdue') {
      filteredData = filteredData.filter(task =>
        isTaskOverdue(task.Deadline)
      );
    } else if (filters.deadline === 'upcoming') {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      filteredData = filteredData.filter(task => {
        if (!task.Deadline) return false;
        const deadlineDate = new Date(task.Deadline);
        return deadlineDate > today && deadlineDate <= nextWeek;
      });
    }

    return filteredData;
  };

  const handleAddTaskToAttendance = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:8000/api/punch-in/',
        { tasks: selectedTaskIdsForAttendance },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      showNotification('Tasks added to today\'s attendance successfully');
      setShowAddTaskToAttendanceModal(false);
      setSelectedTaskIdsForAttendance([]);
      checkPunchInStatus();
    } catch (error) {
      console.error('Error adding tasks to attendance:', error);
      showNotification('Failed to add tasks to attendance', 'error');
    }
  };

  const getAvailableTasksForAttendance = () => {
    return tasks.filter(task => !punchedInTasks.some(punchedInTask => punchedInTask.TaskID === task.TaskID));
  };

  const handlePageChange = (page) => {
    setPaginationState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        currentPage: page
      }
    }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setExpandedTaskId(null);
  };

  const setCurrentPage = (page) => {
    setPaginationState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        currentPage: page
      }
    }));
  };

  const getPriorityDetails = (priority) => {
    const priorities = {
      urgent: { color: '#e74c3c', bgColor: 'rgba(231, 76, 60, 0.1)', text: 'Urgent' },
      high: { color: '#f39c12', bgColor: 'rgba(243, 156, 18, 0.1)', text: 'High' },
      medium: { color: '#3498db', bgColor: 'rgba(52, 152, 219, 0.1)', text: 'Medium' },
      low: { color: '#7f8c8d', bgColor: 'rgba(127, 140, 141, 0.1)', text: 'Low' }
    };
    return priorities[priority?.toLowerCase()] || priorities.low;
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      ProjectID: task.ProjectID,
      TaskName: task.TaskName,
      Description: task.Description,
      Priority: task.Priority,
      Status: task.Status,
      AssignedUserID: task.AssignedTo ? task.AssignedTo.UserID : '',
      ExpectedHours: task.ExpectedHours,
      Deadline: task.Deadline
    });
    setShowEditModal(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        showNotification('Task deleted successfully');
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task', 'error');
      }
    }
  };

  const handleAddTask = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = getUserIdFromToken();

      const taskData = {
        ...newTask,
        CreatedBy: userId,
      };

      const response = await axios.post(
        'http://localhost:8000/api/tasks/',
        taskData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        showNotification('Task created successfully');
        setShowAddTaskModal(false);
        fetchTasks();
        setNewTask({
          TaskName: '',
          Description: '',
          Priority: 'medium',
          Deadline: '',
          ExpectedHours: '',
          Status: 'queue'
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification('Failed to create task', 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        ProjectID: editForm.ProjectID,
        TaskName: editForm.TaskName,
        Description: editForm.Description,
        Priority: editForm.Priority,
        Status: editForm.Status,
        ExpectedHours: editForm.ExpectedHours,
        Deadline: editForm.Deadline,
      };

      if (editForm.Status === 'in_progress') {
        payload.AssignedUserID = editForm.AssignedUserID;
      }

      const response = await axios.put(
        `http://localhost:8000/api/tasks/${editingTask.TaskID}/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        showNotification('Task updated successfully');
        setShowEditModal(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification('Failed to update task', 'error');
    }
  };

  const handleApprove = async (taskId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:8000/api/tasks/${taskId}/approve/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        showNotification('Task approved successfully');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error approving task:', error);
      showNotification('Failed to approve task', 'error');
    }
  };

  const handleReject = async (taskId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:8000/api/tasks/${taskId}/reject/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        showNotification('Task rejected successfully');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
      showNotification('Failed to reject task', 'error');
    }
  };

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        return payload.user_id;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  };

  const filterAndSortTasks = (tasksList) => {
    // This function is now simpler since we're filtering on the server side
    const filtered = {
      inProgress: [],
      queue: [],
      completed: [],
      pendingApproval: []
    };

    tasksList.forEach(task => {
      if (task.Status === 'in_progress') {
        filtered.inProgress.push(task);
      } else if (task.Status === 'queue') {
        filtered.queue.push(task);
      } else if (task.Status === 'completed' && task.IsTaskVerified == true) {
        filtered.completed.push(task);
      } else if (task.Status === 'completed' && task.IsTaskVerified == false) {
        filtered.pendingApproval.push(task);
      }
    });

    setFilteredTasks(filtered);
  };


  const toggleTaskExpansion = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const isTaskOverdue = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate < today;
  };

  const resetFilters = () => {
    // Reset filter state
    setFilters({
      priority: 'all',
      assignedTo: 'all',
      deadline: 'all',
      project: 'all'
    });

    // Re-fetch tasks with no filters
    fetchTasks();

    // Close the filter menu
    setFilterMenuOpen(false);
  };



  const renderFilterMenu = () => (
    <div className={`filter-menu ${filterMenuOpen ? 'open' : ''}`}>
      <div className="filter-header">
        <h3>Filter Tasks</h3>
        <button className="close-button" onClick={() => setFilterMenuOpen(false)}>
          <FiX size={18} />
        </button>
      </div>

      <div className="filter-section">
        <label className="filter-label">Priority</label>
        <div className="filter-options">
          <button
            className={`filter-option ${filters.priority === 'all' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, priority: 'all' })}
          >
            All
          </button>
          <button
            className={`filter-option ${filters.priority === 'low' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, priority: 'low' })}
          >
            Low
          </button>
          <button
            className={`filter-option ${filters.priority === 'medium' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, priority: 'medium' })}
          >
            Medium
          </button>
          <button
            className={`filter-option ${filters.priority === 'high' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, priority: 'high' })}
          >
            High
          </button>
          <button
            className={`filter-option ${filters.priority === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, priority: 'urgent' })}
          >
            Urgent
          </button>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Project</label>
        <select
          className="filter-select"
          value={filters.project}
          onChange={(e) => setFilters({ ...filters, project: e.target.value })}
        >
          <option value="all">All Projects</option>
          {projects.map(project => (
            <option key={project.ProjectID} value={project.ProjectID}>
              {project.Name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">Assigned To</label>
        <select
          className="filter-select"
          value={filters.assignedTo}
          onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
        >
          <option value="all">All Users</option>
          {usersList.map(user => (
            <option key={user.UserID} value={user.UserID}>
              {user.EmployeeName}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">Deadline</label>
        <div className="filter-options">
          <button
            className={`filter-option ${filters.deadline === 'all' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, deadline: 'all' })}
          >
            All
          </button>
          <button
            className={`filter-option ${filters.deadline === 'overdue' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, deadline: 'overdue' })}
          >
            Overdue
          </button>
          <button
            className={`filter-option ${filters.deadline === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, deadline: 'upcoming' })}
          >
            Next 7 Days
          </button>
        </div>
      </div>

      <div className="filter-actions">
        <button className="btn-secondary" onClick={resetFilters}>
          Reset Filters
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            console.log('Applying filters:', filters); // Debug log
            fetchTasks(); // This will use the current filters state
            setFilterMenuOpen(false);
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );


  const renderTaskCard = (task) => {
    const isExpanded = expandedTaskId === task.TaskID;
    const priorityDetails = getPriorityDetails(task.Priority);
    const isOverdue = isTaskOverdue(task.Deadline);
    const isPunchedInTask = punchedInTasks.some(t => t.TaskID === task.TaskID);

    return (
      <motion.div
        className={`task-card ${viewMode} ${isExpanded ? 'expanded' : ''} ${isOverdue ? 'overdue' : ''}`}
        key={task.TaskID}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="task-card-header" onClick={() => toggleTaskExpansion(task.TaskID)}>
          <div className="task-card-top">
            <div className="task-priority-badge" style={{ backgroundColor: priorityDetails.bgColor, color: priorityDetails.color }}>
              <span className="priority-dot" style={{ backgroundColor: priorityDetails.color }}></span>
              {priorityDetails.text}
            </div>

            {isPunchedInTask && (
              <div className="task-status-badge active">
                <FiClock size={12} />
                <span>Active</span>
              </div>
            )}
          </div>

          <h3 className="task-title">{task.TaskName}</h3>

          <div className="task-project">
            <FiFolder size={14} />
            <span>{task.ProjectName || 'No Project'}</span>
          </div>

          <div className="task-meta">
            <div className="task-meta-item">
              <FiUser size={14} />
              <span>{task.AssignedTo?.EmployeeName || 'Unassigned'}</span>
            </div>

            {task.Deadline && (
              <div className={`task-meta-item ${isOverdue ? 'overdue' : ''}`}>
                <FiCalendar size={14} />
                <span>{formatDate(task.Deadline)}</span>
                {isOverdue && <span className="overdue-label">Overdue</span>}
              </div>
            )}

            <div className="task-meta-item">
              <FiClock size={14} />
              <span>{task.ExpectedHours || 0} hrs</span>
            </div>
          </div>

          <div className="task-expand-icon">
            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="task-card-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="task-description">
                <h4>Description</h4>
                <p>{task.Description || 'No description provided.'}</p>
              </div>

              <div className="task-progress">
                <h4>Progress</h4>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, (task.HoursWorked / task.ExpectedHours) * 100 || 0)}%`,
                      backgroundColor: priorityDetails.color
                    }}
                  ></div>
                </div>
                <div className="progress-stats">
                  <span>{task.HoursWorked || 0} of {task.ExpectedHours || 0} hours</span>
                  <span>{Math.min(100, Math.round((task.HoursWorked / task.ExpectedHours) * 100) || 0)}%</span>
                </div>
              </div>

              <div className="task-info-grid">
                <div className="task-info-item">
                  <span className="info-label">Status</span>
                  <span className={`info-value status-${task.Status}`}>
                    {task.Status === 'in_progress' ? 'In Progress' :
                      task.Status === 'queue' ? 'Queue' :
                        task.Status === 'completed' ? 'Completed' :
                          task.Status === 'pending_approval' ? 'Pending Approval' : 'Unknown'}
                  </span>
                </div>

                <div className="task-info-item">
                  <span className="info-label">Created</span>
                  <span className="info-value">{formatDate(task.CreatedDateUTC)}</span>
                </div>

                {task.CompletedDateUTC && (
                  <div className="task-info-item">
                    <span className="info-label">Completed On</span>
                    <span className="info-value">{formatDate(task.CompletedDateUTC)}</span>
                  </div>
                )}
              </div>

              <div className="task-actions">
                {isAdmin && (
                  <>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(task);
                      }}
                      title="Edit Task"
                    >
                      <FiEdit2 size={16} />
                    </button>

                    <button
                      className="btn-icon danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(task.TaskID);
                      }}
                      title="Delete Task"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </>
                )}

                {activeTab === 'pendingApproval' && isAdmin && (
                  <>
                    <button
                      className="btn-success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(task.TaskID);
                      }}
                    >
                      <FiCheckCircle size={14} /> Approve
                    </button>

                    <button
                      className="btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(task.TaskID);
                      }}
                    >
                      <FiXCircle size={14} /> Reject
                    </button>
                  </>
                )}

                {isPunchedIn && !isPunchedInTask && task.Status !== 'completed' && (
                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTaskIdsForAttendance([...selectedTaskIdsForAttendance, task.TaskID]);
                      handleAddTaskToAttendance();
                    }}
                  >
                    <FiClock size={14} /> Add to Today's Work
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderTasksList = () => {
    const currentTasks = filteredTasks[activeTab] || [];

    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      );
    }

    if (currentTasks.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <FiAlertCircle size={48} />
          </div>
          <h3>No tasks found</h3>
          <p>
            {searchTerm
              ? `No tasks matching "${searchTerm}" in this category.`
              : `There are no tasks in the ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()} category.`}
          </p>
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowAddTaskModal(true)}>
              <FiPlus size={16} /> Create New Task
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={`tasks-list ${viewMode}`}>
        <AnimatePresence>
          {currentTasks.map(task => renderTaskCard(task))}
        </AnimatePresence>
      </div>
    );
  };

  const renderPagination = () => {
    const { currentPage, totalPages } = paginationState[activeTab];

    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          &laquo;
        </button>

        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lsaquo;
        </button>

        {pages.map(page => (
          <button
            key={page}
            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &rsaquo;
        </button>

        <button
          className="pagination-button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  const renderDashboardStats = () => (
    <div className="dashboard-stats">
      <div className="stat-card">
        <div className="stat-icon queue">
          <FiList size={20} />
        </div>
        <div className="stat-content">
          <span className="stat-value">{taskCounts.queue || 0}</span>
          <span className="stat-label">Queue</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon in-progress">
          <FiActivity size={20} />
        </div>
        <div className="stat-content">
          <span className="stat-value">{taskCounts.in_progress || 0}</span>
          <span className="stat-label">In Progress</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon completed">
          <FiCheckCircle size={20} />
        </div>
        <div className="stat-content">
          <span className="stat-value">{taskCounts.completed || 0}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon pending">
          <FiClock size={20} />
        </div>
        <div className="stat-content">
          <span className="stat-value">{taskCounts.pending_approval || 0}</span>
          <span className="stat-label">Pending Approval</span>
        </div>
      </div>
    </div>
  );

  // Update the return statement to include the stats
  return (
    <div className="tasks-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Task Dashboard</h1>
          <p className="header-subtitle">Manage and track all your project tasks</p>
        </div>

        <div className="header-actions">
          <ThemeToggle />
          {isAdmin && (
            <button
              className="btn-primary add-task-button"
              onClick={() => setShowAddTaskModal(true)}
            >
              <FiPlus size={16} /> New Task
            </button>
          )}


          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <FiGrid size={16} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <FiList size={16} />
            </button>
          </div>

          {isPunchedIn && (
            <button
              className="btn-secondary add-to-attendance-button"
              onClick={() => setShowAddTaskToAttendanceModal(true)}
            >
              <FiClock size={16} /> Add to Today's Work
            </button>
          )}


        </div>
      </div>

      <div className="dashboard-toolbar">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by name, description, or project..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="toolbar-actions">

          <button
            className="btn-filter"
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            aria-label="Filter tasks"
          >
            <FiFilter size={16} />
          </button>

          <button
            className={`btn-refresh ${isRefreshing ? 'spinning' : ''}`}
            onClick={fetchTasks}
            disabled={isRefreshing}
            aria-label="Refresh tasks"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="tasks-tabs">
        <button
          className={`tab-button ${activeTab === 'inProgress' ? 'active' : ''}`}
          onClick={() => handleTabChange('inProgress')}
        >
          <FiBarChart2 />
          <span>In Progress</span>
          <span className="tab-count">{taskCounts.in_progress || 0}</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => handleTabChange('queue')}
        >
          <FiClock />
          <span>Queue</span>
          <span className="tab-count">{taskCounts.queue || 0}</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => handleTabChange('completed')}
        >
          <FiCheckCircle />
          <span>Completed</span>
          <span className="tab-count">{taskCounts.completed || 0}</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'pendingApproval' ? 'active' : ''}`}
          onClick={() => handleTabChange('pendingApproval')}
        >
          <FiArrowRightCircle />
          <span>Pending Approval</span>
          <span className="tab-count">{taskCounts.pending_approval || 0}</span>
        </button>
      </div>
      <div className="tasks-container">
        {renderTasksList()}
        {renderPagination()}
      </div>

      {/* Filter Menu */}
      {renderFilterMenu()}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button className="close-button" onClick={() => setShowAddTaskModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="taskName">Task Name</label>
                <input
                  type="text"
                  id="taskName"
                  value={newTask.TaskName}
                  onChange={(e) => setNewTask({ ...newTask, TaskName: e.target.value })}
                  placeholder="Enter task name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="projectId">Project</label>
                <select
                  id="projectId"
                  value={newTask.ProjectID}
                  onChange={(e) => setNewTask({ ...newTask, ProjectID: e.target.value })}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.ProjectID} value={project.ProjectID}>
                      {project.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newTask.Description}
                  onChange={(e) => setNewTask({ ...newTask, Description: e.target.value })}
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={newTask.Priority}
                    onChange={(e) => setNewTask({ ...newTask, Priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={newTask.Status}
                    onChange={(e) => setNewTask({ ...newTask, Status: e.target.value })}
                  >
                    <option value="queue">Queue</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expectedHours">Expected Hours</label>
                  <input
                    type="number"
                    id="expectedHours"
                    value={newTask.ExpectedHours}
                    onChange={(e) => setNewTask({ ...newTask, ExpectedHours: e.target.value })}
                    placeholder="Enter expected hours"
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    type="date"
                    id="deadline"
                    value={newTask.Deadline}
                    onChange={(e) => setNewTask({ ...newTask, Deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="assignedUser">Assign To</label>
                <select
                  id="assignedUser"
                  value={newTask.AssignedUserID}
                  onChange={(e) => setNewTask({ ...newTask, AssignedUserID: e.target.value })}
                >
                  <option value="">Select a user</option>
                  {usersList.map((user) => (
                    <option key={user.UserID} value={user.UserID}>
                      {user.EmployeeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddTaskModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddTask}
                disabled={!newTask.TaskName || !newTask.ProjectID}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Task</h2>
              <button className="close-button" onClick={() => setShowEditModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="editTaskName">Task Name</label>
                <input
                  type="text"
                  id="editTaskName"
                  value={editForm.TaskName}
                  onChange={(e) => setEditForm({ ...editForm, TaskName: e.target.value })}
                  placeholder="Enter task name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editProjectId">Project</label>
                <select
                  id="editProjectId"
                  value={editForm.ProjectID}
                  onChange={(e) => setEditForm({ ...editForm, ProjectID: e.target.value })}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.ProjectID} value={project.ProjectID}>
                      {project.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editDescription">Description</label>
                <textarea
                  id="editDescription"
                  value={editForm.Description}
                  onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })}
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editPriority">Priority</label>
                  <select
                    id="editPriority"
                    value={editForm.Priority}
                    onChange={(e) => setEditForm({ ...editForm, Priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editStatus">Status</label>
                  <select
                    id="editStatus"
                    value={editForm.Status}
                    onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}
                  >
                    <option value="queue">Queue</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editExpectedHours">Expected Hours</label>
                  <input
                    type="number"
                    id="editExpectedHours"
                    value={editForm.ExpectedHours}
                    onChange={(e) => setEditForm({ ...editForm, ExpectedHours: e.target.value })}
                    placeholder="Enter expected hours"
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editDeadline">Deadline</label>
                  <input
                    type="date"
                    id="editDeadline"
                    value={editForm.Deadline ? editForm.Deadline.split('T')[0] : ''}
                    onChange={(e) => setEditForm({ ...editForm, Deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editAssignedUser">Assign To</label>
                <select
                  id="editAssignedUser"
                  value={editForm.AssignedUserID}
                  onChange={(e) => setEditForm({ ...editForm, AssignedUserID: e.target.value })}
                >
                  <option value="">Select a user</option>
                  {usersList.map((user) => (
                    <option key={user.UserID} value={user.UserID}>
                      {user.EmployeeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpdate}
                disabled={!editForm.TaskName || !editForm.ProjectID}
              >
                Update Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task to Attendance Modal */}
      {showAddTaskToAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskToAttendanceModal(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Tasks to Today's Work</h2>
              <button className="close-button" onClick={() => setShowAddTaskToAttendanceModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Select the tasks you want to work on today. These tasks will be added to your attendance.
              </p>

              <div className="task-selection-list">
                {getAvailableTasksForAttendance().length === 0 ? (
                  <div className="empty-task-list">
                    <p>No available tasks to add. All your tasks are already in today's work.</p>
                  </div>
                ) : (
                  getAvailableTasksForAttendance().map(task => (
                    <div className="task-selection-item" key={task.TaskID}>
                      <label className="checkbox-container">
                        <div className="task-selection-details">
                          <span className="task-selection-name">{task.TaskName}</span>
                          <span className="task-selection-project">{task.ProjectName}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedTaskIdsForAttendance.includes(task.TaskID)}
                          onChange={() => {
                            if (selectedTaskIdsForAttendance.includes(task.TaskID)) {
                              setSelectedTaskIdsForAttendance(
                                selectedTaskIdsForAttendance.filter(id => id !== task.TaskID)
                              );
                            } else {
                              setSelectedTaskIdsForAttendance([...selectedTaskIdsForAttendance, task.TaskID]);
                            }
                          }}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddTaskToAttendanceModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddTaskToAttendance}
                disabled={selectedTaskIdsForAttendance.length === 0}
              >
                Add to Today's Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`toast-notification ${notification.type}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="toast-icon">
              {notification.type === 'success' && <FiCheckCircle size={20} />}
              {notification.type === 'error' && <FiAlertCircle size={20} />}
              {notification.type === 'warning' && <FiAlertCircle size={20} />}
            </div>
            <div className="toast-message">{notification.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectTasksDashboard;



