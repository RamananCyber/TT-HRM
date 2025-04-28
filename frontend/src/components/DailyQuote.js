import React from 'react'
import { CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLightbulb } from '@coreui/icons'

const DailyQuote = ({ quote }) => {
  return (
    <CCard className="mb-4">
      <CCardBody>
        <div className="d-flex align-items-center mb-3">
          <CIcon icon={cilLightbulb} size="xl" className="me-2 text-warning" />
          <h4 className="mb-0">Quote of the Day</h4>
        </div>
        <blockquote className="blockquote mb-0">
          <p className="mb-2">{quote.text}</p>
          <footer className="blockquote-footer">
            {quote.author || 'Unknown'}
          </footer>
        </blockquote>
      </CCardBody>
    </CCard>
  )
}

export default DailyQuote
