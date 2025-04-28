import React from 'react';

export default function ProjectStatusList() {
  // Mock data
  const projectStatusData = [
    {
      id: 1,
      projectName: 'Project Alpha',
      name: 'John Doe',
      percentage: '50%',
      status: 'In Progress',
      description: 'Initial phase of Project Alpha.'
    },
    {
      id: 2,
      projectName: 'Project Beta',
      name: 'Jane Smith',
      percentage: '75%',
      status: 'Near Completion',
      description: 'Most tasks completed for Project Beta.'
    }
    // ...more rows if needed
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Project Status List</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">Project Name</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Percentage</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          {projectStatusData.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="p-2">{row.projectName}</td>
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.percentage}</td>
              <td className="p-2">{row.status}</td>
              <td className="p-2">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
