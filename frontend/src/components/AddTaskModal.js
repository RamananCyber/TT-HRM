import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CRow,
  CCol,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CFormSelect
} from '@coreui/react'

const AddTaskModal = ({ visible, onClose, onAdd, newTask, setNewTask, projects, usersList  }) => {
  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      alignment="center"
    >
      <CModalHeader closeButton className="bg-light">
        <CModalTitle className="text-center w-100">Add New Task</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <CRow>
          <CCol xs={12} className="mb-3">
              <CFormLabel>Project*</CFormLabel>
              <CFormSelect
                value={newTask.ProjectID || ''}
                onChange={(e) => setNewTask({ ...newTask, ProjectID: e.target.value })}
                required
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.ProjectID} value={project.ProjectID}>
                    {project.Name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol xs={12} className="mb-3">
              <CFormLabel>Task Name*</CFormLabel>
              <CFormInput
                type="text"
                value={newTask.TaskName}
                onChange={(e) => setNewTask({ ...newTask, TaskName: e.target.value })}
                required
              />
            </CCol>

            <CCol xs={12} className="mb-3">
              <CFormLabel>Description*</CFormLabel>
              <CFormTextarea
                rows={3}
                value={newTask.Description}
                onChange={(e) => setNewTask({ ...newTask, Description: e.target.value })}
                required
              />
            </CCol>

            <CCol md={6} className="mb-3">
              <CFormLabel>Priority*</CFormLabel>
              <CFormSelect
                value={newTask.Priority}
                onChange={(e) => setNewTask({ ...newTask, Priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </CFormSelect>
            </CCol>

            <CCol md={6} className="mb-3">
              <CFormLabel>Initial Status*</CFormLabel>
              <CFormSelect
                value={newTask.Status}
                onChange={(e) => {
                  const newStatus = e.target.value
                  setNewTask({
                    ...newTask,
                    Status: newStatus,
                    // Clear assigned user if status changes from in_progress
                    ...(newStatus !== 'in_progress' && { AssignedUserID: null })
                  })
                }}
              >
                <option value="queue">Queue</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </CFormSelect>
            </CCol>

            {newTask.Status === 'in_progress' && (
              <CCol xs={12} className="mb-3">
                <CFormLabel>Assign User*</CFormLabel>
                <CFormSelect
                  value={newTask.AssignedUserID || ''}
                  onChange={(e) => setNewTask({ ...newTask, AssignedUserID: e.target.value })}
                  required
                >
                  <option value="">Select User</option>
                  {usersList.map(user => (
                    <option key={user.UserID} value={user.UserID}>
                      {user.EmployeeName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            )}

            <CCol md={6} className="mb-3">
              <CFormLabel>Expected Hours*</CFormLabel>
              <CFormInput
                type="number"
                min="0"
                step="0.5"
                value={newTask.ExpectedHours}
                onChange={(e) => setNewTask({ ...newTask, ExpectedHours: e.target.value })}
                required
              />
            </CCol>

            <CCol md={6} className="mb-3">
              <CFormLabel>Deadline*</CFormLabel>
              <CFormInput
                type="datetime-local"
                value={newTask.Deadline}
                onChange={(e) => setNewTask({ ...newTask, Deadline: e.target.value })}
                required
              />
            </CCol>
          </CRow>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={onAdd}
          disabled={!newTask.ProjectID ||
             !newTask.TaskName || 
             !newTask.Description ||
              !newTask.ExpectedHours ||
             !newTask.Deadline || 
             (newTask.Status === 'in_progress' && !newTask.AssignedUserID)}
        >
          Create Task
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default AddTaskModal