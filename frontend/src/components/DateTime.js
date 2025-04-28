// DateTime.js
import React, { useState, useEffect } from 'react'
import { CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar } from '@coreui/icons'

const DateTime = () => {
  const [dateTime, setDateTime] = useState(new Date())

  useEffect(() => {
    const updateDateTime = () => {
      setDateTime(new Date())
    }

    const timer = setInterval(updateDateTime, 1000)
    updateDateTime() // Initial update
    
    return () => clearInterval(timer)
  }, [])

  return (
    <CCard className="text-center border-0 bg-light me-3 d-none d-lg-block">
      <CCardBody className="p-2">
        <div className="d-flex align-items-center">
          <CIcon icon={cilCalendar} className="me-2 text-primary" />
          <div>
            <div className="fw-bold">{dateTime.toLocaleTimeString()}</div>
            <div className="small text-medium-emphasis">
              {dateTime.toLocaleDateString()} - {dateTime.toLocaleDateString(undefined, { weekday: 'long' })}
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default React.memo(DateTime)
