import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilChartPie,
  cilTask,
  cilPeople,
  cilNotes,
  cilBriefcase,
  cilBullhorn,
  cilCalendar,
  cilUserFollow,
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'
import { useMemo } from 'react';  
// Role constants
const SUPER_ADMIN = 1;
const ADMIN = 2;
const Developer = 3;
const System_Admin = 4;

// Base nav items for Developer role
// Base nav items for all roles
const baseNavItems = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Punch In/Out',
    to: '/attendence',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Projects',
    to: '/projects/projects-dashboard',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Tasks',
    to: '/projects/tasks-dashboard',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Marketing',
    icon: <CIcon icon={cilBullhorn} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Leads',
        to: '/marketing/customers/list',
      }
    ],
  },
]

// Items for Developer role
const developerNavItems = [
  {
    component: CNavGroup,
    name: 'Reports',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Leave List',
        to: '/reports/leave-list',
      },
    ],  
  }
]

// HR items for Admin and higher roles
const hrNavItems = [
  {
    component: CNavGroup,
    name: 'HR',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Employees',
        to: '/employees',
      }
    ],
  },
]

// Additional items for Admin role
const adminNavItems = [
  {
    component: CNavGroup,
    name: 'Reports',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Report Status',
        to: '/reports/report-status',
      },
      // {
      //   component: CNavItem,
      //   name: 'Daily Report',
      //   to: '/reports/daily',
      // },
      {
        component: CNavItem,
        name: 'Leave List',
        to: '/reports/leave-list',
      },
      {
        component: CNavItem,
        name: 'WFH List',
        to: '/reports/wfh-list',
      },
      // {
      //   component: CNavItem,
      //   name: 'Projects',
      //   to: '/reports/projects',
      // },
    ],
  },
]

// Update the getNavItems function
export const getNavItems = (role) => {
  
  console.log('role', role)

  switch (role) {
    case SUPER_ADMIN:
    case System_Admin:
      return [...baseNavItems, ...hrNavItems, ...adminNavItems]

    case ADMIN:
      return [
        ...baseNavItems,
        ...adminNavItems,
      ]

    case Developer:
      return [...baseNavItems, ...developerNavItems]

    default:
      return baseNavItems
  }
}
