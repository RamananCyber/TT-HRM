import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiClock, FiCalendar, 
  FiCheckCircle, FiAlertCircle, FiChevronDown, FiChevronUp,
  FiFilter, FiX, FiRefreshCw, FiCheck, FiXCircle
} from 'react-icons/fi';
import AddTaskModal from '../../../components/AddTaskModal';
import EditTaskModal from '../../../components/EditTaskModal';
import AddTaskToAttendanceModal from '../../../components/AddTaskToAttendanceModal';
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
  const [toast, setToast] = useState(null);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [selectedTaskIdsForAttendance, setSelectedTaskIdsForAttendance] = useState([]);
  const [punchedInTasks, setPunchedInTasks] = useState([]);
  const [showAddTaskToAttendanceModal, setShowAddTaskToAttendanceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [showToast, setShowToast] = useState({ visible: false, message: '', type: '' });

  // Display toast notification
  const displayToast = (message, type = 'success') => {
    setShowToast({ visible: true, message, type });
    setTimeout(() => {
      setShowToast({ visible: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    checkPunchInStatus();
  }, []);

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

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const currentPage = paginationState[activeTab].currentPage;
      let url = `http://localhost:8000/api/tasks/dashboard/?page=${currentPage}&page_size=${ITEMS_PER_PAGE}&state=${getStateValue(activeTab)}`;

      if (userRole === 'developer') {
        url += '&mine=true';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      setTasks(data.results);
      setTaskCounts(data.total_counts);
      setPaginationState(prev => ({
        ...prev,
        [activeTab]: {
          currentPage: currentPage,
          totalPages: Math.ceil(data.count / ITEMS_PER_PAGE),
          totalItems: data.count
        }
      }));

      filterAndSortTasks(data.results);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAddTaskToAttendance = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:8000/api/punch-in/',
        { tasks: selectedTaskIdsForAttendance },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      displayToast('Tasks added to today\'s attendance successfully');
      setShowAddTaskToAttendanceModal(false);
      setSelectedTaskIdsForAttendance([]);
      checkPunchInStatus();
    } catch (error) {
      console.error('Error adding tasks to attendance:', error);
      displayToast('Failed to add tasks to attendance', 'error');
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
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    const filteredResults = {
      inProgress: tasks
        .filter((task) => task.Status === 'in_progress')
        .filter(
          (task) =>
            task.ProjectName?.toLowerCase().includes(searchValue) ||
            task.TaskName?.toLowerCase().includes(searchValue) ||
            task.Description?.toLowerCase().includes(searchValue),
        ),
      queue: tasks
        .filter((task) => task.Status === 'queue')
        .filter(
          (task) =>
            task.ProjectName?.toLowerCase().includes(searchValue) ||
            task.TaskName?.toLowerCase().includes(searchValue) ||
            task.Description?.toLowerCase().includes(searchValue),
        ),
      completed: tasks
        .filter((task) => task.Status === 'completed')
        .filter(
          (task) =>
            task.ProjectName?.toLowerCase().includes(searchValue) ||
            task.TaskName?.toLowerCase().includes(searchValue) ||
            task.Description?.toLowerCase().includes(searchValue),
        ),
      pendingApproval: tasks
        .filter((task) => task.Status === 'pending_approval')
        .filter(
          (task) =>
            task.ProjectName?.toLowerCase().includes(searchValue) ||
            task.TaskName?.toLowerCase().includes(searchValue) ||
            task.Description?.toLowerCase().includes(searchValue),
        ),
    };

    setFilteredTasks(filteredResults);
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
        displayToast('Task deleted successfully');
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        displayToast('Failed to delete task', 'error');
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
        displayToast('Task created successfully');
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
      displayToast('Failed to create task', 'error');
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
      
      if(editForm.Status === 'in_progress') {
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
      
      if(response.status === 200) {
        displayToast('Task updated successfully');
        setShowEditModal(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      displayToast('Failed to update task', 'error');
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
        displayToast('Task approved successfully');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error approving task:', error);
      displayToast('Failed to approve task', 'error');
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
        displayToast('Task rejected successfully');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
      displayToast('Failed to reject task', 'error');
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
      } else if (task.Status === 'completed' && task.IsTaskVerified === 1) {
        filtered.completed.push(task);
      } else if (task.Status === 'completed' && task.IsTaskVerified === 0) {
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

  const renderTaskCard = (task) => {
    const isExpanded = expandedTaskId === task.TaskID;
    const priorityDetails = getPriorityDetails(task.Priority);
    const isOverdue = isTaskOverdue(task.Deadline);
    const isPunchedInTask = punchedInTasks.some(t => t.TaskID === task.TaskID);
    
    return (
      <motion.div 
        className={`task-card ${isExpanded ? 'expanded' : ''} ${isOverdue ? 'overdue' : ''}`}
        key={task.TaskID}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="task-card-header" onClick={() => toggleTaskExpansion(task.TaskID)}>
          <div className="task-priority" style={{ backgroundColor: priorityDetails.bgColor, color: priorityDetails.color }}>
            {priorityDetails.text}
          </div>
          
          <div className="task-title-section">
            <h3 className="task-title">{task.TaskName}</h3>
            <div className="task-project">{task.ProjectName || 'No Project'}</div>
          </div>
          
          <div className="task-meta">
            {task.Deadline && (
              <div className={`task-deadline ${isOverdue ? 'overdue' : ''}`}>
                <FiCalendar size={14} />
                <span>{formatDate(task.Deadline)}</span>
              </div>
            )}
            
            <div className="task-hours">
              <FiClock size={14} />
              <span>{task.ExpectedHours || 0} hrs</span>
            </div>
            
            {isPunchedInTask && (
              <div className="task-punched-in">
                <FiCheck size={14} />
                <span>Punched In</span>
              </div>
            )}
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
              
              <div className="task-info-grid">
                <div className="task-info-item">
                  <span className="info-label">Assigned To</span>
                  <span className="info-value">{task.AssignedTo?.EmployeeName || 'Unassigned'}</span>
                </div>
                
                <div className="task-info-item">
                  <span className="info-label">Expected Hours</span>
                  <span className="info-value">{task.ExpectedHours || 0} hours</span>
                </div>
                
                <div className="task-info-item">
                  <span className="info-label">Hours Worked</span>
                  <span className="info-value">{task.HoursWorked || 0} hours</span>
                </div>
                
                <div className="task-info-item">
                  <span className="info-label">Deadline</span>
                  <span className={`info-value ${isOverdue ? 'overdue' : ''}`}>
                    {formatDate(task.Deadline)}
                  </span>
                </div>
                
                {task.CompletedDateUTC && (
                  <div className="task-info-item">
                    <span className="info-label">Completed On</span>
                    <span className="info-value">{formatDate(task.CompletedDateUTC)}</span>
                  </div>
                )}
              </div>
              
              <div className="task-actions">
                {(userRole === 'super admin' || userRole === 'admin' || userRole === 'hr') && (
                  <>
                    <button 
                      className="btn-secondary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(task);
                      }}
                    >
                      <FiEdit2 size={14} /> Edit
                    </button>
                    
                    <button 
                      className="btn-danger" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(task.TaskID);
                      }}
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </>
                )}
                
                {activeTab === 'pendingApproval' && (userRole === 'super admin' || userRole === 'admin' || userRole === 'hr') && (
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
                      setSelectedTaskIdsForAttendance([task.TaskID]);
                      setShowAddTaskToAttendanceModal(true);
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

  return (
    <div className="tasks-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Tasks Dashboard</h1>
          <p className="header-subtitle">Manage and track all your tasks in one place</p>
        </div>
        
        <div className="header-actions">
          {(userRole === 'super admin' || userRole === 'admin' || userRole === 'hr') && (
            <button 
              className="btn-primary add-task-button" 
              onClick={() => setShowAddTaskModal(true)}
            >
              <FiPlus size={16} /> New Task
            </button>
          )}
          
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
          <FiSearch className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FiX size={18} />
            </button>
          )}
        </div>
        
        <div className="toolbar-actions">
          <button 
            className="btn-refresh" 
            onClick={() => fetchTasks()}
            aria-label="Refresh tasks"
          >
            <FiRefreshCw size={16} />
          </button>
          
          <button className="btn-filter" aria-label="Filter tasks">
            <FiFilter size={16} />
          </button>
        </div>
      </div>
      
      <div className="tasks-tabs">
        <button 
          className={`tab-button ${activeTab === 'inProgress' ? 'active' : ''}`} 
          onClick={() => setActiveTab('inProgress')}
        >
          In Progress
          <span className="tab-count">{taskCounts.in_progress || 0}</span>
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`} 
          onClick={() => setActiveTab('queue')}
        >
          Queue
          <span className="tab-count">{taskCounts.queue || 0}</span>
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('completed')}
        >
          Completed
          <span className="tab-count">{taskCounts.completed || 0}</span>
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'pendingApproval' ? 'active' : ''}`} 
          onClick={() => setActiveTab('pendingApproval')}
        >
          Pending Approval
          <span className="tab-count">{taskCounts.pending_approval || 0}</span>
        </button>
      </div>
      
      <div className="tasks-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : filteredTasks[activeTab].length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiAlertCircle size={48} />
            </div>
            <h3>No tasks found</h3>
            <p>
              {searchTerm 
                ? "No tasks match your search criteria. Try a different search term." 
                : `You don't have any ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()} tasks.`}
            </p>
            {(userRole === 'super admin' || userRole === 'admin' || userRole === 'hr') && (
              <button 
                className="btn-primary" 
                onClick={() => setShowAddTaskModal(true)}
              >
                <FiPlus size={16} /> Create New Task
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <div className="tasks-list">
              {filteredTasks[activeTab].map(task => renderTaskCard(task))}
            </div>
          </AnimatePresence>
        )}
      </div>
      
      {paginationState[activeTab].totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(paginationState[activeTab].currentPage - 1)}
            disabled={paginationState[activeTab].currentPage === 1}
          >
            &laquo;
          </button>
          
          {[...Array(paginationState[activeTab].totalPages)].map((_, i) => (
            <button
              key={i}
              className={`pagination-button ${paginationState[activeTab].currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(paginationState[activeTab].currentPage + 1)}
            disabled={paginationState[activeTab].currentPage === paginationState[activeTab].totalPages}
          >
            &raquo;
          </button>
        </div>
      )}
      
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
                Select the tasks you want to work on today. These tasks will be added to your attendance record.
              </p>
              
              <div className="task-selection-list">
                {getAvailableTasksForAttendance().length === 0 ? (
                  <div className="empty-task-list">
                    <p>No available tasks to add. All your tasks are already in today's work.</p>
                  </div>
                ) : (
                  getAvailableTasksForAttendance().map(task => (
                    <div key={task.TaskID} className="task-selection-item">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={selectedTaskIdsForAttendance.includes(task.TaskID)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaskIdsForAttendance([...selectedTaskIdsForAttendance, task.TaskID]);
                            } else {
                              setSelectedTaskIdsForAttendance(
                                selectedTaskIdsForAttendance.filter(id => id !== task.TaskID)
                              );
                            }
                          }}
                        />
                        <span className="checkmark"></span>
                        <div className="task-selection-details">
                          <div className="task-selection-name">{task.TaskName}</div>
                          <div className="task-selection-project">{task.ProjectName}</div>
                        </div>
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
      {showToast.visible && (
        <div className={`toast-notification ${showToast.type}`}>
          <div className="toast-icon">
            {showToast.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
          </div>
          <div className="toast-message">{showToast.message}</div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasksDashboard;


