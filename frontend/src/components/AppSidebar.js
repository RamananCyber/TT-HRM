import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  CSidebarNav
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import { getNavItems } from '../_nav'

const AppSidebar = ({ role }) => {
  console.log('side');
  
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const navigation = getNavItems(role) // Get navigation items based on role
console.log(navigation);

  // const [dateTime, setDateTime] = useState(new Date())
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setDateTime(new Date())
  //   }, 1000)
  //   return () => clearInterval(timer)
  // }, [])

  const customLogoStyle = {
    borderRadius: '50%', // Makes it perfectly circular
    overflow: 'hidden',
    width: '200px',           // New width
    height: '64px', 
    padding: '2px', // Optional padding
    backgroundColor: '#fff', // Optional background color
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Optional shadow
  };

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <CIcon
            customClassName="sidebar-brand-full"
            icon={logo}
            height={32}
            style={customLogoStyle}
          />
          <CIcon
            customClassName="sidebar-brand-narrow"
            icon={sygnet}
            height={32}
            style={customLogoStyle}
          />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      {/* <div className="p-3 text-center border-bottom">
        <div className="fw-bold">{dateTime.toLocaleTimeString()}</div>
        <div className="small">
          {dateTime.toLocaleDateString()} - {dateTime.toLocaleDateString(undefined, { weekday: 'long' })}
        </div>
      </div> */}
      <CSidebarNav>
        <AppSidebarNav items={navigation} />
      </CSidebarNav>
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
