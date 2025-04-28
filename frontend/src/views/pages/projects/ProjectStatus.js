import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormSelect,
  CButton,
} from '@coreui/react'

const ProjectStatus = () => {
  const [projects, setProjects] = useState([]) // Available projects list
  const [tasks, setTasks] = useState([]) // Tasks for selected project
  const [formData, setFormData] = useState({
    projectId: '',
    selectedTaskId: '', // Add this new field
    taskName: '',
    percentage: '',
    status: '',
    description: '',
  })

  // Simulated projects data - replace with actual API call
  useEffect(() => {
    setProjects([
      { id: '1', name: 'Project A' },
      { id: '2', name: 'Project B' },
      // ...more projects
    ])
  }, [])

  const handleProjectChange = async (projectId) => {
    setFormData({
      ...formData,
      projectId,
      taskName: '',
      percentage: '',
      status: '',
      description: '',
    })
    
    if (projectId) {
      // Simulated tasks data - replace with actual API call
      const sampleTasks = [
        { id: 1, taskName: 'Task 1', percentage: 30, status: 'In Progress', description: 'Sample task 1' },
        { id: 2, taskName: 'Task 2', percentage: 0, status: 'Not Started', description: 'Sample task 2' },
      ]
      setTasks(sampleTasks)
    } else {
      setTasks([])
    }
  }

  const handleTaskChange = (taskId) => {
    const selectedTask = tasks.find(task => task.id.toString() === taskId)
    if (selectedTask) {
      setFormData({
        ...formData,
        selectedTaskId: taskId, // Add this to track selected task ID
        taskName: selectedTask.taskName,
        percentage: selectedTask.percentage,
        status: selectedTask.status,
        description: selectedTask.description,
      })
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/update-task-status/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: formData.projectId,
          task_id: formData.selectedTaskId,
          percentage: formData.percentage,
          status: formData.status,
          description: formData.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const result = await response.json();
      alert('Task status updated successfully');
      
      // Refresh the tasks list
      handleProjectChange(formData.projectId);
    } catch (error) {
      console.error('Error submitting task status:', error);
      alert('Failed to update task status: ' + error.message);
    }
  }

  const handleClear = () => {
    setFormData({
      projectId: '',
      selectedTaskId: '', // Add this field
      taskName: '',
      percentage: '',
      status: '',
      description: '',
    })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Task Status Update</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Project Name</CFormLabel>
                    <CFormSelect
                      name="projectId"
                      value={formData.projectId}
                      onChange={(e) => handleProjectChange(e.target.value)}
                    >
                      <option value="">Select project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Task Name</CFormLabel>
                    <CFormSelect
                      name="taskName"
                      value={formData.selectedTaskId || ''} // Change this line
                      onChange={(e) => handleTaskChange(e.target.value)}
                      disabled={!formData.projectId}
                    >
                      <option value="">Select task...</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.taskName}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </CCol>
              </CRow>

              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Percentage Complete</CFormLabel>
                    <CFormInput
                      type="number"
                      name="percentage"
                      value={formData.percentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      placeholder="Enter percentage complete"
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Status</CFormLabel>
                    <CFormSelect
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="">Select status...</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </CFormSelect>
                  </div>
                </CCol>
              </CRow>

              <CRow>
                <CCol md={12}>
                  <div className="mb-3">
                    <CFormLabel>Description</CFormLabel>
                    <CFormTextarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter task description..."
                    />
                  </div>
                </CCol>
              </CRow>

              <CRow className="mt-3">
                <CCol xs={12}>
                  <CButton type="submit" color="primary" className="me-2">
                    Update
                  </CButton>
                  <CButton type="button" color="secondary" onClick={handleClear}>
                    Clear
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ProjectStatus
