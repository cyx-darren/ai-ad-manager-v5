'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

interface TrafficData {
  name: string
  value: number
  percentage?: number
}

interface TrafficChartProps {
  data: TrafficData[] | null
}

export default function TrafficChart({ data }: TrafficChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  // Calculate percentages if not provided
  const total = data.reduce((sum, entry) => sum + entry.value, 0)
  const chartData = data.map(entry => ({
    ...entry,
    percentage: entry.percentage || ((entry.value / total) * 100).toFixed(1)
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
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
            label={({ percentage }) => `${percentage}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => value.toLocaleString()}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="font-semibold">{payload[0].name}</p>
                    <p>Sessions: {payload[0].value?.toLocaleString()}</p>
                    <p>Percentage: {payload[0].payload.percentage}%</p>
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