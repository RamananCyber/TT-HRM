import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CFormSelect,
} from '@coreui/react'

const Allocation = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    startDate: '',
    deadline: '',
    assignBy: '',
    assignTo: '',
    status: ''
  })
  const [employees, setEmployees] = useState([])
  const [managers, setManagers] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    // Fetch employees, managers, and projects
    const fetchData = async () => {
      try {
        const [empResponse, mgrResponse, projResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/employees'),
          axios.get('http://localhost:5000/api/managers'),
          axios.get('http://localhost:5000/api/projects')
        ])
        setEmployees(empResponse.data)
        setManagers(mgrResponse.data)
        setProjects(projResponse.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/api/allocations', formData)
      alert('Allocation created successfully!')
      setFormData({
        projectName: '',
        startDate: '',
        deadline: '',
        assignBy: '',
        assignTo: '',
        status: ''
      })
    } catch (error) {
      console.error('Error creating allocation:', error)
      alert('Failed to create allocation')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleClear = () => {
    setFormData({
      projectName: '',
      startDate: '',
      deadline: '',
      assignBy: '',
      assignTo: '',
      status: ''
    })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Project Allocation</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Project Name</CFormLabel>
                    <CFormSelect
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                    >
                      <option value="">Select Project</option>
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
                    <CFormLabel>Start Date</CFormLabel>
                    <CFormInput
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Deadline</CFormLabel>
                    <CFormInput
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Assign By</CFormLabel>
                    <CFormSelect
                      name="assignBy"
                      value={formData.assignBy}
                      onChange={handleChange}
                    >
                      <option value="">Select Manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Assign To</CFormLabel>
                    <CFormSelect
                      name="assignTo"
                      value={formData.assignTo}
                      onChange={handleChange}
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </CFormSelect>
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
                      <option value="">Select Status</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </CFormSelect>
                  </div>
                </CCol>
              </CRow>
              <div className="d-flex gap-2">
                <CButton type="submit" color="primary">
                  Allocate
                </CButton>
                <CButton type="button" color="secondary" onClick={handleClear}>
                  Clear
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Allocation
