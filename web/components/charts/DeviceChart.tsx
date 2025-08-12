'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  desktop: '#3B82F6',
  mobile: '#10B981',
  tablet: '#F59E0B',
  other: '#8B5CF6'
}

interface DeviceData {
  name: string
  sessions: number
  users: number
}

interface DeviceChartProps {
  data: DeviceData[] | null
}

export default function DeviceChart({ data }: DeviceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  const chartData = data.map(item => ({
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    value: item.sessions,
    users: item.users
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
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
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || COLORS.other} 
              />
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