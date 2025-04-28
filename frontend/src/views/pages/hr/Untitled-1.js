// import React, { useState, useEffect } from 'react'
// import axios from 'axios'
// import { useNavigate } from 'react-router-dom'
// import {
//   CCard,
//   CCardBody,
//   CCardHeader,
//   CCol,
//   CRow,
//   CTable,
//   CTableHead,
//   CTableRow,
//   CTableHeaderCell,
//   CTableBody,
//   CTableDataCell,
//   CSpinner,
//   CButton,
// } from '@coreui/react'

// const CustomersList = () => {
//   const navigate = useNavigate()
//   const [customers, setCustomers] = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchCustomers()
//   }, [])

//   const fetchCustomers = async () => {
//     try {
//       const token = localStorage.getItem('access_token')
//       const response = await axios.get('http://localhost:8000/api/customers/', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         }
//       })
//       setCustomers(response.data)
//       setLoading(false)
//     } catch (error) {
//       console.error('Error fetching customers:', error)
//       setLoading(false)
//     }
//   }

//   const handleEdit = (customerId) => {
//     navigate(`/marketing/customers/edit/${customerId}`)
//   }

//   const handleDelete = async (customerId) => {
//     if (window.confirm('Are you sure you want to delete this customer?')) {
//       try {
//         const token = localStorage.getItem('access_token')
//         await axios.delete(`http://localhost:8000/api/customers/${customerId}/`, {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//           }
//         })
//         fetchCustomers() // Refresh the list
//       } catch (error) {
//         console.error('Error deleting customer:', error)
//       }
//     }
//   }

//   if (loading) {
//     return (
//       <div className="text-center">
//         <CSpinner color="primary" />
//       </div>
//     )
//   }

//   return (
//     <CRow>
//       <CCol xs={12}>
//         <CCard className="mb-4">
//           <CCardHeader>
//             <strong>Customers List</strong>
//           </CCardHeader>
//           <CCardBody>
//             <CTable hover responsive>
//               <CTableHead>
//                 <CTableRow>
//                   <CTableHeaderCell>Customer ID</CTableHeaderCell>
//                   <CTableHeaderCell>Company Name</CTableHeaderCell>
//                   <CTableHeaderCell>Customer Name</CTableHeaderCell>
//                   <CTableHeaderCell>Industry</CTableHeaderCell>
//                   <CTableHeaderCell>Contact Person</CTableHeaderCell>
//                   <CTableHeaderCell>Phone</CTableHeaderCell>
//                   <CTableHeaderCell>Email</CTableHeaderCell>
//                   <CTableHeaderCell>Actions</CTableHeaderCell>
//                 </CTableRow>
//               </CTableHead>
//               <CTableBody>
//                 {customers.map((customer) => (
//                   <CTableRow key={customer.customer_id}>
//                     <CTableDataCell>{customer.customer_id}</CTableDataCell>
//                     <CTableDataCell>{customer.company_name}</CTableDataCell>
//                     <CTableDataCell>{customer.customer_name}</CTableDataCell>
//                     <CTableDataCell>{customer.industry_segment}</CTableDataCell>
//                     <CTableDataCell>{customer.contact_person}</CTableDataCell>
//                     <CTableDataCell>{customer.phone_no}</CTableDataCell>
//                     <CTableDataCell>{customer.mail_id}</CTableDataCell>
//                     <CTableDataCell>
//                       <CButton 
//                         color="primary" 
//                         size="sm" 
//                         onClick={() => handleEdit(customer.customer_id)}
//                         className="me-2"
//                       >
//                         Edit
//                       </CButton>
//                       <CButton 
//                         color="danger" 
//                         size="sm" 
//                         onClick={() => handleDelete(customer.customer_id)}
//                       >
//                         Delete
//                       </CButton>
//                     </CTableDataCell>
//                   </CTableRow>
//                 ))}
//               </CTableBody>
//             </CTable>
//           </CCardBody>
//         </CCard>
//       </CCol>
//     </CRow>
//   )
// }

// export default CustomersList


// src/App.js (React Component)