import React from 'react';
import { useBugs } from '../context/BugContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function Dashboard() {
  const { state } = useBugs();
  const { bugs } = state;

  // Calculate statistics
  const statusStats = {
    open: bugs.filter(bug => bug.status === 'open').length,
    'in-progress': bugs.filter(bug => bug.status === 'in-progress').length,
    closed: bugs.filter(bug => bug.status === 'closed').length,
  };

  const severityStats = {
    high: bugs.filter(bug => bug.severity === 'high').length,
    medium: bugs.filter(bug => bug.severity === 'medium').length,
    low: bugs.filter(bug => bug.severity === 'low').length,
  };

  const statusData = Object.entries(statusStats).map(([name, value]) => ({
    name,
    value,
  }));

  const severityData = Object.entries(severityStats).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#FF8042', '#FFBB28', '#00C49F'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Bug Status Distribution</h2>
        <div className="flex justify-center">
          <PieChart width={300} height={300}>
            <Pie
              data={statusData}
              cx={150}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Bug Severity Distribution</h2>
        <BarChart width={400} height={300} data={severityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </div>
    </div>
  );
}