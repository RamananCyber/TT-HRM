import React, { useState, useEffect } from 'react'
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
} from '@coreui/react'
import { cilPencil } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Add these states in the ProjectStatus component



const ProjectStatus = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: '',
    assignedTo: '',
    dueDate: '',
    completionPercentage: '0',
    status: 'pending',
    description: ''
  })

  const [location, setLocation] = useState({
    postalCode: '',
    loading: true,
    error: null
  });


  const [projects, setProjects] = useState([])
  const [currentUser, setCurrentUser] = useState(null)


  // const getUserLocation = () => {

  
 
  //   if ("geolocation" in navigator) {
  //     navigator.geolocation.getCurrentPosition(
  //       async (position) => {
  //         try {
  //           const { latitude, longitude } = position.coords;
  //           const response = await axios.get(
  //             `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=0f7421b7d16449f99348b6dc9fbcbceb&language=en`
  //           );
  
  //           const result = response.data.results[0];
  //           const postalCode = result.components.postcode;
  
  //           setLocation({
  //             postalCode,
  //             loading: false,
  //             error: null
  //           });
  //         } catch (error) {
  //           setLocation({
  //             postalCode: '',
  //             loading: false,
  //             error: 'Failed to get postal code'
  //           });
  //         }
  //       },
  //       (error) => {
  //         setLocation({
  //           postalCode: '',
  //           loading: false,
  //           error: 'Geolocation permission denied'
  //         });
  //       }
  //     );
  //   } else {
  //     setLocation({
  //       postalCode: '',
  //       loading: false,
  //       error: 'Geolocation not supported'
  //     });
  //   }
  // };
  
    

  const getCurrentUser = () => {
    const token = localStorage.getItem('token')
    if (token) {
      // Decode JWT token to get user info
      try {
        const tokenParts = token.split('.')
        const payload = JSON.parse(atob(tokenParts[1]))
        return payload.user_id // Assuming your token contains user_id
      } catch (error) {
        console.error('Error decoding token:', error)
        return null
      }
    }
    return null
  }


  // Add useEffect to fetch projects
  useEffect(() => {
    // getUserLocation();
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token')
        const userId = getCurrentUser()

        if (!userId) {
          console.error('No user ID found')
          return
        }
        const response = await axios.get(`http://localhost:8000/api/tasks/user/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setProjects(response.data)
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    fetchProjects()
  }, [])


  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ]

  const percentageOptions = Array.from({ length: 11 }, (_, i) => ({
    value: (i * 10).toString(),
    label: `${i * 10}%`
  }))

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/project-status/update/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Handle success (e.g., show notification)
    } catch (error) {
      console.error('Error updating project status:', error)
      // Handle error (e.g., show error message)
    }
  }

  const handleEdit = (project) => {
    setFormData({
      projectName: project.title,
      assignedTo: project.assignedTo,
      dueDate: new Date(project.dueDate),
      completionPercentage: project.completionPercentage || 0,
      status: project.status,
      description: project.description
    })

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'in_progress':
        return 'info'
      case 'completed':
        return 'success'
      default:
        return 'secondary'
    }
  }


  return (
    <>
      {/* <CCard className="mb-4">
        <CCardBody>
          <h3 className="mb-3">Location Information</h3>
          {location.loading ? (
            <p>Loading location...</p>
          ) : location.error ? (
            <p className="text-danger">{location.error}</p>
          ) : (
            <p>Your Postal Code: {location.postalCode}</p>
          )}
        </CCardBody>
      </CCard> */}
      {/* <CCard>
        <CCardBody>
          <h2 className="mb-4">Project Status Update</h2>
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
                <CButton type="submit" color="primary">
                  Update Project Status
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard> */}
      <CCard>
        <CCardBody>
          <h3 className="mb-4">Project List</h3>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Project Name</CTableHeaderCell>
                <CTableHeaderCell>Assigned To</CTableHeaderCell>
                <CTableHeaderCell>Due Date</CTableHeaderCell>
                <CTableHeaderCell>Progress</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Description</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {projects.map((project) => (
                <CTableRow key={project.id}>
                  <CTableDataCell>{project.title}</CTableDataCell>
                  <CTableDataCell>{project.assignedTo}</CTableDataCell>
                  <CTableDataCell>
                    {new Date(project.dueDate).toLocaleDateString()}
                  </CTableDataCell>
                  <CTableDataCell>
                    {project.completionPercentage}%
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={getBadgeColor(project.status)}>
                      {project.status}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{project.description}</CTableDataCell>
                  <CTableDataCell>
                    <CButtonGroup>
                      {/* <CButton
                        color="info"
                        size="sm"
                        onClick={() => handleEdit(project)}
                      >
                      </CButton> */}
                      <CButton
                        color="info"
                        size="sm"
                        onClick={() => navigate(`/project/${project.id}/edit`)}
                      >
                        {/* <CIcon icon={cilPencil} /> */}
                      </CButton>
                    </CButtonGroup>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ProjectStatus