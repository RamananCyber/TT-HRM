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
  CFormCheck,
  CRow,
  CButton,
} from '@coreui/react'

const AddCustomer = () => {
  const [formData, setFormData] = useState({
    customerID: '',
    companyName: '',
    customerName: '',
    createdDate: '',
    industrySegment: '',
    manufacturersOf: '',
    reference: '',
    repeatedClient: '',
    contactPerson: '',
    gstNo: '',
    phoneNo: '',
    mailID: '',
    address: ''
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
      // Get token from localStorage
      const token = localStorage.getItem('access_token')
      
      // Prepare the data in the format backend expects
      const customerData = {
        customer_id: formData.customerID,
        company_name: formData.companyName,
        customer_name: formData.customerName,
        created_date: formData.createdDate,
        industry_segment: formData.industrySegment,
        manufacturers_of: formData.manufacturersOf,
        reference: formData.reference,
        repeated_client: formData.repeatedClient,
        contact_person: formData.contactPerson,
        gst_no: formData.gstNo,
        phone_no: formData.phoneNo,
        mail_id: formData.mailID,
        address: formData.address
      }

      // Make API call to save customer
      const response = await axios.post(
        'http://localhost:8000/api/customers/',
        customerData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.status === 201) {
        alert('Customer added successfully!')
        handleReset() // Clear the form
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error saving customer. Please try again.')
    }
  }

  const handleReset = () => {
    setFormData({
      customerID: '',
      companyName: '',
      customerName: '',
      createdDate: '',
      industrySegment: '',
      manufacturersOf: '',
      reference: '',
      repeatedClient: '',
      contactPerson: '',
      gstNo: '',
      phoneNo: '',
      mailID: '',
      address: ''
    })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Add Customer</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Customer ID</CFormLabel>
                  <CFormInput 
                    name="customerID"
                    value={formData.customerID}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Company Name</CFormLabel>
                  <CFormInput 
                    name="companyName"
                    value={formData.companyName}
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
                  <CFormLabel>Created Date</CFormLabel>
                  <CFormInput 
                    type="date"
                    name="createdDate"
                    value={formData.createdDate}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Industry Segment</CFormLabel>
                  <CFormInput 
                    name="industrySegment"
                    value={formData.industrySegment}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Manufacturers Of</CFormLabel>
                  <CFormInput 
                    name="manufacturersOf"
                    value={formData.manufacturersOf}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Reference</CFormLabel>
                  <CFormInput 
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Repeated Client</CFormLabel>
                  <div className="mt-2">
                    <CFormCheck
                      inline
                      type="radio"
                      name="repeatedClient"
                      value="Yes"
                      label="Yes"
                      onChange={handleInputChange}
                      checked={formData.repeatedClient === 'Yes'}
                    />
                    <CFormCheck
                      inline
                      type="radio"
                      name="repeatedClient"
                      value="No"
                      label="No"
                      onChange={handleInputChange}
                      checked={formData.repeatedClient === 'No'}
                    />
                  </div>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Contact Person</CFormLabel>
                  <CFormInput 
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>GST No</CFormLabel>
                  <CFormInput 
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Phone No</CFormLabel>
                  <CFormInput 
                    name="phoneNo"
                    value={formData.phoneNo}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Mail ID</CFormLabel>
                  <CFormInput 
                    type="email"
                    name="mailID"
                    value={formData.mailID}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormLabel>Address</CFormLabel>
                  <CFormTextarea 
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol xs={12}>
                  <CButton type="submit" color="primary" className="me-2">
                    Add Customer
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

export default AddCustomer
