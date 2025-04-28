import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
} from '@coreui/react'

const EditCustomer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState({
    company_name: '',
    customer_name: '',
    industry_segment: '',
    contact_person: '',
    phone_no: '',
    mail_id: '',
  })

  useEffect(() => {
    fetchCustomer()
  }, [])

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`http://localhost:8000/api/customers/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      setCustomer(response.data)
    } catch (error) {
      console.error('Error fetching customer:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('access_token')
      await axios.put(`http://localhost:8000/api/customers/${id}/`, customer, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      navigate('/marketing/customers/list')
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const handleChange = (e) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value
    })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Edit Customer</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel>Company Name</CFormLabel>
                <CFormInput
                  type="text"
                  name="company_name"
                  value={customer.company_name}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Customer Name</CFormLabel>
                <CFormInput
                  type="text"
                  name="customer_name"
                  value={customer.customer_name}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Industry</CFormLabel>
                <CFormInput
                  type="text"
                  name="industry_segment"
                  value={customer.industry_segment}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Contact Person</CFormLabel>
                <CFormInput
                  type="text"
                  name="contact_person"
                  value={customer.contact_person}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Phone</CFormLabel>
                <CFormInput
                  type="text"
                  name="phone_no"
                  value={customer.phone_no}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  type="email"
                  name="mail_id"
                  value={customer.mail_id}
                  onChange={handleChange}
                />
              </div>
              <CButton type="submit" color="primary">
                Update Customer
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default EditCustomer
