import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButtonGroup
  // ...existing imports
} from '@coreui/react'
import axios from 'axios'


const ProjectEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    projectName: '',
    assignedTo: '',
    dueDate: '',
    completionPercentage: '0',
    status: 'pending',
    description: ''
  })

    // Add the missing options
    const statusOptions = [
      { label: 'Pending', value: 'pending' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Completed', value: 'completed' }
    ]
  
    const percentageOptions = Array.from({ length: 11 }, (_, i) => ({
      label: `${i * 10}%`,
      value: (i * 10).toString()
    }))
  
  
  
    // Add success/error state
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/tasks/${id}/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/project')
      }, 1500)
    } catch (error) {
      setError('Failed to update project')
      console.error('Error updating project:', error)
    }
  }

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://localhost:8000/api/tasks/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setFormData({
          projectName: response.data.title,
          assignedTo: response.data.assignedTo,
          dueDate: new Date(response.data.dueDate),
          completionPercentage: response.data.completionPercentage || 0,
          status: response.data.status,
          description: response.data.description
        })
      } catch (error) {
        console.error('Error fetching project:', error)
      }
    }
    fetchProject()
  }, [id])

  return (
    <CCard>
    <CCardBody>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Edit Project</h2>
        <CButton 
          color="primary" 
          variant="outline" 
          onClick={() => navigate('/projectStatus')}
        >
          Back to Projects
        </CButton>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" role="alert">
          Project updated successfully! Redirecting...
        </div>
      )}




      <CForm onSubmit={handleSubmit}>
       <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormInput
                        label="Project Name"
                        type="text"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleChange}
                        required
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormInput
                        label="Assigned To"
                        type="text"
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleChange}
                        required
                      />
                    </CCol>
                  </CRow>
      
                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormInput
                        label="Due Date"
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormSelect
                        label="Completion Percentage"
                        name="completionPercentage"
                        value={formData.completionPercentage}
                        onChange={handleChange}
                        options={percentageOptions}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormSelect
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
                      />
                    </CCol>
                  </CRow>
      
                  <CRow className="mb-3">
                    <CCol>
                      <CFormTextarea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                      />
                    </CCol>
                  </CRow>
        
        <CRow>
          <CCol>
            <CButton type="submit" color="primary" className="me-2">
              Update Project
            </CButton>
            <CButton 
              type="button" 
              color="secondary" 
              onClick={() => navigate('/projectStatus')}
            >
              Cancel
            </CButton>
          </CCol>
        </CRow>
      </CForm>
    </CCardBody>
  </CCard>
  )
}

export default ProjectEdit