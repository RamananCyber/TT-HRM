import React, { useState } from 'react'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormSelect,
  CRow,
  CButton,
} from '@coreui/react'

const AddProject = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    customerID: '',
    customerName: '',
    contactPerson: '',
    contactNumber: '',
    projectType: '',
    division: '',
    category: '',
    inDate: '',
    deadline: '',
    status: '',
    specifications: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('access_token')
      
      const projectData = {
        project_name: formData.projectName,
        customer_id: formData.customerID,
        customer_name: formData.customerName,
        contact_person: formData.contactPerson,
        contact_number: formData.contactNumber,
        project_type: formData.projectType,
        division: formData.division,
        category: formData.category,
        in_date: formData.inDate,
        deadline: formData.deadline,
        status: formData.status,
        specifications: formData.specifications
      }

      const response = await axios.post(
        'http://localhost:8000/api/projects/',
        projectData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.status === 201) {
        alert('Project added successfully!')
        handleReset()
      }
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Error saving project. Please try again.')
    }
  }

  const handleReset = () => {
    setFormData({
      projectName: '',
      customerID: '',
      customerName: '',
      contactPerson: '',
      contactNumber: '',
      projectType: '',
      division: '',
      category: '',
      inDate: '',
      deadline: '',
      status: '',
      specifications: ''
    })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Add Project</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Project Name</CFormLabel>
                  <CFormInput
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Customer ID</CFormLabel>
                  <CFormInput
                    name="customerID"
                    value={formData.customerID}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Customer Name</CFormLabel>
                  <CFormInput
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Contact Person</CFormLabel>
                  <CFormInput
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Contact Number</CFormLabel>
                  <CFormInput
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Project Type</CFormLabel>
                  <CFormSelect
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Project Type</option>
                    <option value="type1">Type 1</option>
                    <option value="type2">Type 2</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Division</CFormLabel>
                  <CFormSelect
                    name="division"
                    value={formData.division}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Division</option>
                    <option value="division1">Division 1</option>
                    <option value="division2">Division 2</option>
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Category</CFormLabel>
                  <CFormSelect
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category</option>
                    <option value="category1">Category 1</option>
                    <option value="category2">Category 2</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>In Date</CFormLabel>
                  <CFormInput
                    type="date"
                    name="inDate"
                    value={formData.inDate}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Deadline</CFormLabel>
                  <CFormInput
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormLabel>Status</CFormLabel>
                  <CFormInput
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    placeholder="To do"
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormLabel>Specifications</CFormLabel>
                  <CFormTextarea
                    rows={4}
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol xs={12}>
                  <CButton type="submit" color="primary" className="me-2">
                    Add Project
                  </CButton>
                  <CButton type="button" color="secondary" onClick={handleReset}>
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

export default AddProject
