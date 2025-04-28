import React, { useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormCheck,
  CListGroup,
  CListGroupItem
} from '@coreui/react'

const AddTaskToAttendanceModal = ({ visible, onClose, tasks, selectedTaskIdsForAttendance, setSelectedTaskIdsForAttendance,  onAddTask}) => {

    const handleTaskSelectionChange = (TaskID) => {
        setSelectedTaskIdsForAttendance(prevSelectedTasks => {
          if (prevSelectedTasks.includes(TaskID)) {
            return prevSelectedTasks.filter(id => id !== TaskID);
          } else {
            return [...prevSelectedTasks, TaskID];
          }
        });
      };
  
  return (
    <CModal visible={visible} onClose={onClose}  alignment="center">
      <CModalHeader>
        <CModalTitle>Add Tasks to Today's Attendance</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CListGroup>
          {tasks.map(task => (
            <CListGroupItem key={task.TaskID}>
             <CFormCheck
                id={`add-task-attendance-${task.TaskID}`}
                label={task.TaskName}
                value={task.TaskID}
                checked={selectedTaskIdsForAttendance.includes(task.TaskID)}
                onChange={() => handleTaskSelectionChange(task.TaskID)}
              />
            </CListGroupItem>
          ))}
        </CListGroup>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={() => {
          onAddTask(selectedTaskIdsForAttendance);
        }}>
          Add Tasks to Attendance
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default AddTaskToAttendanceModal;