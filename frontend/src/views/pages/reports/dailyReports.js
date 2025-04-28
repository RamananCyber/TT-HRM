import React, { useState } from 'react';
import {
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CRow,
  CCol,
  CFormCheck
} from '@coreui/react';

export default function DailyReport() {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    date: '',
    hours: '',
    projectName: '',
    workDone: '',
    shift: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Daily Report data:', formData);
  };

  const handleReset = () => {
    setFormData({
      employeeId: '',
      name: '',
      date: '',
      hours: '',
      projectName: '',
      workDone: '',
      shift: ''
    });
  };

  return (
    <CCard className="p-4">
      <CCardBody>
        <h3 className="mb-4">Daily Report</h3>
        <CForm onSubmit={handleSubmit}>
          <CRow className="g-3">
            <CCol md={4}>
              <CFormInput
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="Enter Employee ID"
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Employee Name"
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                type="date"
                label="Date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                type="number"
                label="Hours"
                name="hours"
                value={formData.hours}
                onChange={handleChange}
                placeholder="Working Hours"
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                label="Project Name"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="Project Name"
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                label="Work Done"
                name="workDone"
                value={formData.workDone}
                onChange={handleChange}
                placeholder="Describe work done"
              />
            </CCol>
            <CCol xs={12}>
              <div className="mb-3">
                <label className="form-label">Shift</label>
                <div className="d-flex gap-4">
                  {['All Day', 'Morning', 'Afternoon'].map(shiftValue => (
                    <CFormCheck
                      key={shiftValue}
                      type="radio"
                      name="shift"
                      label={shiftValue}
                      value={shiftValue}
                      onChange={handleChange}
                      checked={formData.shift === shiftValue}
                    />
                  ))}
                </div>
              </div>
            </CCol>
            <CCol xs={12}>
              <div className="d-flex gap-2">
                <CButton type="submit" color="primary">
                  Submit
                </CButton>
                <CButton 
                  type="button" 
                  color="secondary"
                  onClick={handleReset}
                >
                  Reset
                </CButton>
              </div>
            </CCol>
          </CRow>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
