import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CForm,
  CFormSelect,
  CButton,
} from '@coreui/react'

const AllocationList = () => {
  const [allocations, setAllocations] = useState([])
  const [searchProject, setSearchProject] = useState('')
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchAllocations()
    fetchProjects()
  }, [])

  const fetchAllocations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/allocations')
      setAllocations(response.data)
    } catch (error) {
      console.error('Error fetching allocations:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.get(`http://localhost:5000/api/allocations/search?project=${searchProject}`)
      setAllocations(response.data)
    } catch (error) {
      console.error('Error searching allocations:', error)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Project Allocations</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSearch} className="mb-4">
              <CRow>
                <CCol md={4}>
                  <CFormSelect
                    value={searchProject}
                    onChange={(e) => setSearchProject(e.target.value)}
                    className="mb-3"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CButton type="submit" color="primary">
                    Search
                  </CButton>
                </CCol>
              </CRow>
            </CForm>

            <CTable hover bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Project Name</CTableHeaderCell>
                  <CTableHeaderCell>Start Date</CTableHeaderCell>
                  <CTableHeaderCell>Deadline</CTableHeaderCell>
                  <CTableHeaderCell>Assign By</CTableHeaderCell>
                  <CTableHeaderCell>Assign To</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {allocations.map((allocation) => (
                  <CTableRow key={allocation.id}>
                    <CTableDataCell>{allocation.projectName}</CTableDataCell>
                    <CTableDataCell>{new Date(allocation.startDate).toLocaleDateString()}</CTableDataCell>
                    <CTableDataCell>{new Date(allocation.deadline).toLocaleDateString()}</CTableDataCell>
                    <CTableDataCell>{allocation.assignBy}</CTableDataCell>
                    <CTableDataCell>{allocation.assignTo}</CTableDataCell>
                    <CTableDataCell>{allocation.status}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default AllocationList
