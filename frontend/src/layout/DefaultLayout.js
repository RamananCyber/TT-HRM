import React, { useEffect, useState } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import { getUserRole } from '../utils/auth' // Import a utility function to get user role

const DefaultLayout = () => {
  const [role, setRole] = useState(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const userRole = await getUserRole()
      console.log('User role:', userRole);
      
      setRole(userRole)
    }
    fetchUserRole()
  }, [])

  if (role === null) {
    //return <div>Loading...</div>
  }

  return (
    <div>
      <AppSidebar role={role} />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
