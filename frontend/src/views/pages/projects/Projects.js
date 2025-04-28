import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  FiPlus, FiFilter, FiSearch, FiEdit2, FiClock, FiUsers,
  FiCalendar, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight,
  FiX, FiSave, FiRefreshCw, FiMoreVertical, FiBarChart2, FiTag,
  FiGrid, FiList, FiAlignLeft, FiFlag, FiChevronDown
} from 'react-icons/fi';
import { FiSun, FiMoon } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import './ProjectsModern.css';

const Projects = () => {
  const [activeTab, setActiveTab] = useState('in_progress');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState({
    inProgress: [],
    queue: [],
    completed: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [modalType, setModalType] = useState(null);
  const [newProject, setNewProject] = useState({
    Name: '',
    Description: '',
    ExpectedHours: '',
    ProjectState: 'queue',
  });
  const [editingProject, setEditingProject] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [notification, setNotification] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'CreatedDate', direction: 'desc' });
  const [expandedProject, setExpandedProject] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    assignedTo: 'all',
    progress: 'all'
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [projectCounts, setProjectCounts] = useState({
    in_progress: 0,
    queue: 0,
    completed: 0
  });

  // Add this effect to handle body scroll locking
  useEffect(() => {
    if (modalType) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [modalType]);

  // Update the modal close handler
  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setNewProject({
      Name: '',
      Description: '',
      ExpectedHours: '',
      ProjectState: 'queue',
    });
    setEditingProject(null);
    setAssignedUsers([]);
    document.body.classList.remove('modal-open');
  }, []);

  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);

    // Save theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Add this function to toggle theme
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

  const userRole = useMemo(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role.name.toLowerCase();
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  const isAdmin = useMemo(() => {
    return userRole === 'admin' || userRole === 'super admin';
  }, [userRole]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/developers/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsersList(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to load users', 'error');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchProjects = useCallback(async (page = 1, status = null, search = '') => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `http://localhost:8000/api/projects/dashboard/?` +
        `page=${page}&` +
        `status=${status || ''}&` +
        `search=${search}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setProjectCounts(response.data.total_counts);

      const filteredResults = response.data.results.filter(project => {
        // Adjust this condition based on how dummy projects are identified
        return !project.ProjectName.toLowerCase().includes('dummy')

      });

      console.log('Filtered Results:', filteredResults);

      setProjects(filteredResults);

      setTotalPages(response.data.num_pages);

      // Apply sorting
      const sortedProjects = sortProjects(filteredResults);

      const filtered = {
        inProgress: sortedProjects.filter(project => project.Status === 'in_progress'),
        queue: sortedProjects.filter(project => project.Status === 'queue'),
        completed: sortedProjects.filter(project => project.Status === 'completed')
      };
      setFilteredProjects(filtered);
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects: ' + err.message);
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [sortConfig]);

  useEffect(() => {
    fetchProjects(currentPage, activeTab, debouncedSearchTerm);
  }, [currentPage, activeTab, debouncedSearchTerm, fetchProjects]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setExpandedProject(null);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  };

  const handleAddProject = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = getUserIdFromToken();

      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const projectData = {
        ...newProject,
        CreatedBy: userId,
        AssignedUsers: assignedUsers,
        Status: newProject.ProjectState
      };

      const response = await axios.post(
        'http://localhost:8000/api/projects/',
        projectData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        showNotification('Project created successfully');
        setModalType(null);
        fetchProjects(currentPage, activeTab);
        setNewProject({
          Name: '',
          Description: '',
          ExpectedHours: '',
          ProjectState: 'queue'
        });
        setAssignedUsers([]);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showNotification('Failed to create project', 'error');
    }
  }, [newProject, assignedUsers, currentPage, activeTab, fetchProjects]);

  const handleEdit = useCallback(async (project) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `http://localhost:8000/api/projects/${project.ProjectID}/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const assignedUserIds = (response.data.AssignedUsers || [])
        .map(user => user.toString());

      const autoState = assignedUserIds.length > 0 ? 'in_progress' : response.data.Status;

      setEditingProject({
        ...response.data,
        ProjectState: autoState,
        AssignedUsers: assignedUserIds
      });

      setModalType('edit');
    } catch (error) {
      console.error('Error fetching project details:', error);
      showNotification('Failed to load project details', 'error');
    }
  }, []);

  const handleUpdateProject = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const projectData = {
        ...editingProject,
        AssignedUsers: editingProject.AssignedUsers.map(u => u.toString()),
      };

      const response = await axios.put(
        `http://localhost:8000/api/projects/${editingProject.ProjectID}/`,
        projectData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200) {
        showNotification('Project updated successfully');
        setModalType(null);
        fetchProjects(currentPage, activeTab);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Failed to update project', 'error');
    }
  }, [editingProject, currentPage, activeTab, fetchProjects]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortProjects = (projectsToSort) => {
    if (!projectsToSort) return [];

    return [...projectsToSort].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const toggleExpandProject = (projectId) => {
    setExpandedProject(prevId => prevId === projectId ? null : projectId);
  };

  const applyFilters = (projects) => {
    if (!projects) return [];

    return projects.filter(project => {
      // Date range filter
      if (filters.dateRange !== 'all') {
        const projectDate = new Date(project.CreatedDate);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));

        if (filters.dateRange === 'last30' && projectDate < thirtyDaysAgo) {
          return false;
        }
        if (filters.dateRange === 'last90' && projectDate < ninetyDaysAgo) {
          return false;
        }
      }

      // Assigned to filter
      if (filters.assignedTo !== 'all') {
        if (!project.AssignedUsers || !project.AssignedUsers.some(user =>
          user.UserID.toString() === filters.assignedTo)) {
          return false;
        }
      }

      // Progress filter
      if (filters.progress !== 'all') {
        const progress = project.CompletionPercentage || 0;
        if (filters.progress === 'low' && progress > 30) {
          return false;
        }
        if (filters.progress === 'medium' && (progress <= 30 || progress > 70)) {
          return false;
        }
        if (filters.progress === 'high' && progress <= 70) {
          return false;
        }
      }

      return true;
    });
  };

  const getFilteredProjectsForTab = (tab) => {
    const projectsForTab = {
      in_progress: filteredProjects.inProgress,
      queue: filteredProjects.queue,
      completed: filteredProjects.completed
    }[tab] || [];

    return applyFilters(projectsForTab);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      assignedTo: 'all',
      progress: 'all'
    });
    setFilterMenuOpen(false);
  };

  const refreshProjects = () => {
    fetchProjects(currentPage, activeTab, debouncedSearchTerm);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'var(--status-in-progress)';
      case 'queue':
        return 'var(--status-queue)';
      case 'completed':
        return 'var(--status-completed)';
      default:
        return 'var(--status-default)';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'var(--progress-high)';
    if (percentage >= 40) return 'var(--progress-medium)';
    return 'var(--progress-low)';
  };

  // Modal components
  const AddProjectModal = () => (
    <div className="project-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) handleCloseModal();
    }}>
      <div className="project-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Project</h2>
          <button className="close-button" onClick={handleCloseModal}>
            <FiX size={24} />
          </button>
        </div>
        <div className="modal-body">
          {/* Existing form content */}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" onClick={handleAddProject}>
            Add Project
          </button>
        </div>
      </div>
    </div>
  );

  const EditProjectModal = () => (
    <div className="project-modal-overlay">
      <div className="project-modal">
        <div className="modal-header">
          <h2>Edit Project</h2>
          <button className="close-button" onClick={() => setModalType(null)}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          {editingProject && (
            <>
              <div className="form-group">
                <label htmlFor="editProjectName">Project Name*</label>
                <input
                  id="editProjectName"
                  type="text"
                  value={editingProject.Name}
                  onChange={(e) => setEditingProject({ ...editingProject, Name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editProjectDescription">Description*</label>
                <textarea
                  id="editProjectDescription"
                  rows={3}
                  value={editingProject.Description}
                  onChange={(e) => setEditingProject({ ...editingProject, Description: e.target.value })}
                  placeholder="Enter project description"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editExpectedHours">Expected Hours*</label>
                  <input
                    id="editExpectedHours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingProject.ExpectedHours}
                    onChange={(e) => setEditingProject({ ...editingProject, ExpectedHours: e.target.value })}
                    placeholder="Enter expected hours"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editProjectState">Project Status*</label>
                  <select
                    id="editProjectState"
                    value={editingProject.ProjectState}
                    onChange={(e) => setEditingProject({ ...editingProject, ProjectState: e.target.value })}
                    required
                  >
                    <option value="queue">Queue</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Team Members</label>
                <div className="user-selection-container">
                  <div className="selected-users">
                    {editingProject.AssignedUsers && editingProject.AssignedUsers.length > 0 ? (
                      editingProject.AssignedUsers.map(userId => {
                        const user = usersList.find(u => u.UserID.toString() === userId.toString());
                        return (
                          <div key={userId} className="selected-user-tag">
                            <span>{user ? user.EmployeeName : `User ${userId}`}</span>
                            <button
                              type="button"
                              onClick={() => setEditingProject({
                                ...editingProject,
                                AssignedUsers: editingProject.AssignedUsers.filter(id => id !== userId)
                              })}
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <span className="no-users-selected">No team members assigned</span>
                    )}
                  </div>
                  <div className="user-dropdown">
                    <select
                      onChange={(e) => {
                        if (e.target.value && !editingProject.AssignedUsers.includes(e.target.value)) {
                          setEditingProject({
                            ...editingProject,
                            AssignedUsers: [...editingProject.AssignedUsers, e.target.value]
                          });
                        }
                        e.target.value = ''; // Reset select after selection
                      }}
                      value=""
                    >
                      <option value="" disabled>Add team member</option>
                      {usersList.map(user => (
                        <option
                          key={user.UserID}
                          value={user.UserID}
                          disabled={editingProject.AssignedUsers.includes(user.UserID.toString())}
                        >
                          {user.EmployeeName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={() => setModalType(null)}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleUpdateProject}
            disabled={!editingProject?.Name || !editingProject?.Description || !editingProject?.ExpectedHours}
          >
            <FiSave /> Update Project
          </button>
        </div>
      </div>
    </div>
  );

  const FilterMenu = () => (
    <div className={`filter-menu ${filterMenuOpen ? 'open' : ''}`} style={{ zIndex: 1000 }}>
      <div className="filter-menu-header">
        <h3>Filter Projects</h3>
        <button onClick={() => setFilterMenuOpen(false)}>
          <FiX />
        </button>
      </div>
      <div className="filter-menu-body">
        <div className="filter-group">
          <label>Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          >
            <option value="all">All Time</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Assigned To</label>
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          >
            <option value="all">All Team Members</option>
            {usersList.map(user => (
              <option key={user.UserID} value={user.UserID}>
                {user.EmployeeName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Progress</label>
          <select
            value={filters.progress}
            onChange={(e) => setFilters({ ...filters, progress: e.target.value })}
          >
            <option value="all">All Progress Levels</option>
            <option value="low">Low (0-30%)</option>
            <option value="medium">Medium (31-70%)</option>
            <option value="high">High (71-100%)</option>
          </select>
        </div>
      </div>
      <div className="filter-menu-footer">
        <button className="btn-secondary" onClick={resetFilters}>
          Reset Filters
        </button>
        <button className="btn-primary" onClick={() => setFilterMenuOpen(false)}>
          Apply Filters
        </button>
      </div>
    </div>
  );

  // Project Card Component
  const ProjectCard = ({ project }) => {
    const isExpanded = expandedProject === project.ProjectID;
    const progressColor = getProgressColor(project.CompletionPercentage);
    const statusColor = getStatusColor(project.Status);

    return (
      <div className={`project-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="project-card-header" onClick={() => toggleExpandProject(project.ProjectID)}>
          <div className="project-status-indicator" style={{ backgroundColor: statusColor }}></div>

          <div className="project-title-section">
            <h3>{project.ProjectName}</h3>
            <div className="project-meta">
              <div className="project-date">
                <FiCalendar size={14} />
                <span>{formatDate(project.CreatedDate)}</span>
              </div>
              <div className="project-hours">
                <FiClock size={14} />
                <span>{project.ExpectedHours} hrs</span>
              </div>
              <div className="project-team-count">
                <FiUsers size={14} />
                <span>{project.AssignedUsers?.length || 0} members</span>
              </div>
            </div>
          </div>

          <div className="project-progress-section">
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${project.CompletionPercentage || 0}%`,
                    backgroundColor: progressColor
                  }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(project.CompletionPercentage || 0)}%</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="project-card-details">
            <div className="project-description">
              <h4>Description</h4>
              <p>{project.Description || 'No description provided.'}</p>
            </div>

            {/* Widget Grid */}
            <div className="project-widgets">
              {/* Task Completion Widget */}
              <div className="widget">
                <div className="widget-header">
                  <h4>Task Completion</h4>
                </div>
                <div className="widget-body">
                  <div className="completion-donut">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={getComputedStyle(document.documentElement).getPropertyValue('--bg-lighter')}
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={progressColor}
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 40 * (project.CompletionPercentage / 100)} ${2 * Math.PI * 40}`}
                        strokeDashoffset={2 * Math.PI * 10}
                        transform="rotate(-90 50 50)"
                      />
                      <text
                        x="50"
                        y="50"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="16"
                        fontWeight="bold"
                        fill="var(--text-dark)"
                      >
                        {Math.round(project.CompletionPercentage || 0)}%
                      </text>
                    </svg>
                    <div className="completion-stats">
                      <div className="completion-stat">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value">{project.CompletedTasks || 0}</span>
                      </div>
                      <div className="completion-stat">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">{project.TotalTasks || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours Widget */}
              <div className="widget">
                <div className="widget-header">
                  <h4>Hours Tracking</h4>
                </div>
                <div className="widget-body">
                  <div className="hours-comparison">
                    <div className="hours-bar">
                      <div className="hours-label">Expected</div>
                      <div className="hours-bar-container">
                        <div
                          className="hours-bar-fill expected"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                      <div className="hours-value">{project.ExpectedHours || 0}h</div>
                    </div>
                    <div className="hours-bar">
                      <div className="hours-label">Actual</div>
                      <div className="hours-bar-container">
                        <div
                          className="hours-bar-fill actual"
                          style={{
                            width: `${Math.min(100, (project.TotalTaskHours / project.ExpectedHours) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="hours-value">{project.TotalTaskHours || 0}h</div>
                    </div>
                  </div>
                  <div className="hours-efficiency">
                    <span className="efficiency-label">Efficiency:</span>
                    <span className="efficiency-value">
                      {project.ExpectedHours && project.TotalTaskHours
                        ? `${Math.round((project.TotalTaskHours / project.ExpectedHours) * 100)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Activity Widget */}
              <div className="widget">
                <div className="widget-header">
                  <h4>Team Activity</h4>
                </div>
                <div className="widget-body">
                  <div className="team-activity">
                    {project.AssignedUsers && project.AssignedUsers.length > 0 ? (
                      <div className="team-activity-list">
                        {project.AssignedUsers.slice(0, 3).map(user => (
                          <div key={user.UserID} className="team-activity-item">
                            <div className="team-member-avatar">
                              {user.EmployeeName?.charAt(0) || '?'}
                            </div>
                            <div className="team-activity-details">
                              <div className="team-member-name">{user.EmployeeName}</div>
                              <div className="team-member-status">
                                <span className="status-indicator active"></span>
                                Active
                              </div>
                            </div>
                          </div>
                        ))}
                        {project.AssignedUsers.length > 3 && (
                          <div className="team-activity-more">
                            +{project.AssignedUsers.length - 3} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="no-team">No team members assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Widget */}
              <div className="widget">
                <div className="widget-header">
                  <h4>Timeline</h4>
                </div>
                <div className="widget-body">
                  <div className="project-timeline">
                    <div className="timeline-item">
                      <div className="timeline-icon created">
                        <FiCalendar size={14} />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title">Created</div>
                        <div className="timeline-date">{formatDate(project.CreatedDate)}</div>
                      </div>
                    </div>

                    <div className="timeline-item">
                      <div className="timeline-icon modified">
                        <FiEdit2 size={14} />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title">Last Modified</div>
                        <div className="timeline-date">{formatDate(project.ModifiedDate)}</div>
                      </div>
                    </div>

                    {project.CompletedDate && (
                      <div className="timeline-item">
                        <div className="timeline-icon completed">
                          <FiCheckCircle size={14} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-title">Completed</div>
                          <div className="timeline-date">{formatDate(project.CompletedDate)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="project-actions">
                <button className="btn-secondary" onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(project);
                }}>
                  <FiEdit2 size={14} /> Edit Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.dateRange !== 'all' ||
      filters.assignedTo !== 'all' ||
      filters.progress !== 'all';
  }, [filters]);

  // Get filtered projects for the current tab
  const filteredProjectsForCurrentTab = useMemo(() => {
    return getFilteredProjectsForTab(activeTab);
  }, [activeTab, filteredProjects, filters]);

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div className="header-title">
          <h1>Projects Dashboard</h1>
          <p>Manage and track all your projects in one place</p>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          {isAdmin && (
            <button
              className="btn-primary add-project-button"
              onClick={() => setModalType('add')}
            >
              <FiPlus /> New Project
            </button>
          )}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <FiGrid />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      <div className="projects-toolbar">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="toolbar-actions">
          <button
            className={`btn-filter ${hasActiveFilters ? 'has-filters' : ''}`}
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          >
            <FiFilter />
            <span>Filter</span>
            {hasActiveFilters && <span className="filter-badge"></span>}
          </button>

          <button
            className={`btn-refresh ${isRefreshing ? 'refreshing' : ''}`}
            onClick={refreshProjects}
            disabled={isRefreshing}
            aria-label="Refresh projects"
          >
            <FiRefreshCw />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      <div className="projects-tabs">
        <button
          className={`tab-button ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => handleTabChange('in_progress')}
        >
          <div className="tab-icon-wrapper in-progress">
            <FiBarChart2 />
          </div>
          <span>In Progress</span>
          <span className="tab-count">{projectCounts.in_progress}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => handleTabChange('queue')}
        >
          <div className="tab-icon-wrapper queue">
            <FiClock />
          </div>
          <span>Queue</span>
          <span className="tab-count">{projectCounts.queue}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => handleTabChange('completed')}
        >
          <div className="tab-icon-wrapper completed">
            <FiCheckCircle />
          </div>
          <span>Completed</span>
          <span className="tab-count">{projectCounts.completed}</span>
        </button>
      </div>

      <div className={`projects-content ${viewMode}`}>
        {loading && !isRefreshing ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <FiAlertCircle size={48} />
            <h3>Error Loading Projects</h3>
            <p>{error}</p>
            <button onClick={refreshProjects} className="btn-secondary retry-button">
              <FiRefreshCw /> Retry
            </button>
          </div>
        ) : filteredProjectsForCurrentTab.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === 'in_progress' ? '🚀' : activeTab === 'queue' ? '📋' : '✅'}
            </div>
            <h3>
              {searchTerm
                ? 'No matching projects found'
                : hasActiveFilters
                  ? 'No projects match your filters'
                  : `No ${activeTab.replace('_', ' ')} projects`}
            </h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search terms'
                : hasActiveFilters
                  ? 'Try changing or resetting your filters'
                  : isAdmin
                    ? 'Click the "New Project" button to create one'
                    : 'Check back later for updates'}
            </p>
            {(searchTerm || hasActiveFilters) && (
              <div className="empty-actions">
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="btn-secondary">
                    Clear Search
                  </button>
                )}
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="btn-secondary">
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={`projects-list ${viewMode}`}>
            {filteredProjectsForCurrentTab.map(project => (
              <ProjectCard key={project.ProjectID} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType === 'add' && <AddProjectModal />}
      {modalType === 'edit' && <EditProjectModal />}

      {/* Filter Menu */}
      <FilterMenu />

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <FiX />
          </button>
        </div>
      )}
    </div>
  );
};

export default Projects;


