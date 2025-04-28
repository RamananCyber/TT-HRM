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

const EditTaskModal = ({ visible, onClose, onUpdate, editForm, setEditForm, projects, usersList }) => {
  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center">
      <CModalHeader closeButton className="bg-light">
        <CModalTitle className="text-center w-100">Edit Task</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <CRow>
            {/* Project */}
            <CCol xs={12} className="mb-3">
              <CFormLabel>Project*</CFormLabel>
              <CFormSelect
                value={editForm.ProjectID || ''}
                onChange={(e) => setEditForm({ ...editForm, ProjectID: e.target.value })}
                required
              >
                <option value="">Select Project</option>
                {projects && projects.map(project => (
                  <option key={project.ProjectID} value={project.ProjectID}>
                    {project.Name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            {/* Task Name */}
            <CCol xs={12} className="mb-3">
              <CFormLabel>Task Name*</CFormLabel>
              <CFormInput
                type="text"
                value={editForm.TaskName || ''}
                onChange={(e) => setEditForm({ ...editForm, TaskName: e.target.value })}
                required
              />
            </CCol>

            {/* Description */}
            <CCol xs={12} className="mb-3">
              <CFormLabel>Description*</CFormLabel>
              <CFormTextarea
                rows={3}
                value={editForm.Description || ''}
                onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })}
                required
              />
            </CCol>

            {/* Priority */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Priority*</CFormLabel>
              <CFormSelect
                value={editForm.Priority || 'medium'}
                onChange={(e) => setEditForm({ ...editForm, Priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </CFormSelect>
            </CCol>

            {/* Status */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Initial Status*</CFormLabel>
              <CFormSelect
                value={editForm.Status || 'queue'}
                onChange={(e) => {
                  const newStatus = e.target.value
                  setEditForm({
                    ...editForm,
                    Status: newStatus,
                    ...(newStatus !== 'in_progress' ? { AssignedUserID: '' } : {})
                  })
                }}
              >
                <option value="queue">Queue</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </CFormSelect>
            </CCol>

            {/* Assigned User - shown only if status is in_progress */}
            {editForm.Status === 'in_progress' && (
              <CCol xs={12} className="mb-3">
                <CFormLabel>Assign User*</CFormLabel>
                <CFormSelect
                  value={editForm.AssignedUserID || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, AssignedUserID: e.target.value })
                  }
                  required
                >
                  <option value="">Select User</option>
                  {usersList && usersList.map(user => (
                    <option key={user.UserID} value={user.UserID}>
                      {user.EmployeeName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            )}

            {/* Expected Hours */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Expected Hours*</CFormLabel>
              <CFormInput
                type="number"
                min="0"
                step="0.5"
                value={editForm.ExpectedHours || ''}
                onChange={(e) => setEditForm({ ...editForm, ExpectedHours: e.target.value })}
                required
              />
            </CCol>

            {/* Deadline */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Deadline*</CFormLabel>
              <CFormInput
                type="datetime-local"
                value={editForm.Deadline || ''}
                onChange={(e) => setEditForm({ ...editForm, Deadline: e.target.value })}
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
        <CButton color="primary" onClick={onUpdate}>
          Save Changes
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default EditTaskModal
