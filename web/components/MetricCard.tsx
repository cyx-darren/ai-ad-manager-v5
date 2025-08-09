'use client'

interface MetricCardProps {
  title: string
  value: number | string
  unit?: string
  isMockData?: boolean
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  description?: string
}

export default function MetricCard({ 
  title, 
  value, 
  unit = '', 
  isMockData = false, 
  icon, 
  trend,
  description 
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString()
    }
    return val
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline">
        <p className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </p>
        {unit && (
          <span className="ml-1 text-sm text-gray-500">{unit}</span>
        )}
      </div>
      
      {trend && (
        <div className="flex items-center mt-2">
          <span className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500 ml-1">from last week</span>
        </div>
      )}
      
      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
      
      {isMockData && (
        <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
          Mock Data
        </div>
      )}
    </div>
  )
}