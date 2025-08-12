'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

interface CampaignData {
  name: string
  spend: number
  impressions?: number
  clicks?: number
}

interface CampaignChartProps {
  data: CampaignData[] | null
}

export default function CampaignChart({ data }: CampaignChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No campaign data available
        </div>
      </div>
    )
  }

  // Sort by spend and take top campaigns
  const sortedData = [...data].sort((a, b) => b.spend - a.spend)
  const topCampaigns = sortedData.slice(0, 7)
  const otherCampaigns = sortedData.slice(7)
  
  const chartData = topCampaigns.map(item => ({
    name: item.name,
    value: item.spend,
    impressions: item.impressions || 0,
    clicks: item.clicks || 0
  }))

  if (otherCampaigns.length > 0) {
    const othersSpend = otherCampaigns.reduce((sum, item) => sum + item.spend, 0)
    const othersImpressions = otherCampaigns.reduce((sum, item) => sum + (item.impressions || 0), 0)
    const othersClicks = otherCampaigns.reduce((sum, item) => sum + (item.clicks || 0), 0)
    chartData.push({
      name: 'Others',
      value: othersSpend,
      impressions: othersImpressions,
      clicks: othersClicks
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
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
                const data = payload[0].payload
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="font-semibold">{data.name}</p>
                    <p>Spend: ${data.value?.toLocaleString()}</p>
                    {data.impressions > 0 && (
                      <p>Impressions: {data.impressions.toLocaleString()}</p>
                    )}
                    {data.clicks > 0 && (
                      <p>Clicks: {data.clicks.toLocaleString()}</p>
                    )}
                  </div>
                )
              }
              return null
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}