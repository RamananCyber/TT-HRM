import React from 'react'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'

const ProjectHoursChart = ({ projectData }) => {
  const labels = projectData.map(p => p.ProjectName)
  const expectedHours = projectData.map(p => p.ExpectedHours)
  const completedHours = projectData.map(p => p.CompletedHours)

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>Project Hours Overview</strong>
      </CCardHeader>
      <CCardBody>
        <div style={{ height: '400px' }}>
          <CChartBar
            data={{
              labels: labels,
              datasets: [
                {
                  label: 'Expected Hours',
                  backgroundColor: 'rgba(51, 153, 255, 0.8)',
                  borderColor: 'rgba(51, 153, 255, 1)',
                  borderWidth: 1,
                  data: expectedHours,
                  barPercentage: 0.7,
                  categoryPercentage: 0.85,
                },
                {
                  label: 'Completed Hours',
                  backgroundColor: 'rgba(46, 184, 92, 0.8)',
                  borderColor: 'rgba(46, 184, 92, 1)',
                  borderWidth: 1,
                  data: completedHours,
                  barPercentage: 0.7,
                  categoryPercentage: 0.85,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  align: 'end',
                  labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 15,
                  },
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 10,
                  intersect: false,
                  mode: 'index',
                },
              },
              scales: {
                x: {
                  grid: {
                    display: false,
                    drawBorder: false,
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    drawBorder: false,
                  },
                  ticks: {
                    maxTicksLimit: 5,
                    callback: (value) => value + ' hrs',
                  },
                },
              },
            }}
          />
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ProjectHoursChart