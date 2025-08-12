'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

interface GeographicData {
  country: string
  sessions: number
  users: number
}

interface GeographicChartProps {
  data: GeographicData[] | null
}

export default function GeographicChart({ data }: GeographicChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  // Take top 7 countries and group the rest as "Others"
  const sortedData = [...data].sort((a, b) => b.sessions - a.sessions)
  const topCountries = sortedData.slice(0, 7)
  const othersData = sortedData.slice(7)
  
  const chartData = topCountries.map(item => ({
    name: item.country,
    value: item.sessions,
    users: item.users
  }))

  if (othersData.length > 0) {
    const othersSessions = othersData.reduce((sum, item) => sum + item.sessions, 0)
    const othersUsers = othersData.reduce((sum, item) => sum + item.users, 0)
    chartData.push({
      name: 'Others',
      value: othersSessions,
      users: othersUsers
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="font-semibold">{payload[0].name}</p>
                    <p>Sessions: {payload[0].value?.toLocaleString()}</p>
                    <p>Users: {payload[0].payload.users?.toLocaleString()}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}