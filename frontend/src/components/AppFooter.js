import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <a href="https://tailortrix.com/" target="_blank" rel="noopener noreferrer">
            Tailortrix
        </a>
        <span className="ms-1">&copy; 2025 .</span>
      </div>
      <div className="ms-auto">
        <span className="me-1"> </span>
        <a href="#" rel="noopener noreferrer">
          
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
