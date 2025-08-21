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
  description?: string | React.ReactNode
  loading?: boolean
  dataSource?: 'google_ads_api' | 'cache' | 'mock' | 'ga4' | 'live'
  isLive?: boolean
  cachedAt?: string
}

export default function MetricCard({ 
  title, 
  value, 
  unit = '', 
  isMockData = false, 
  icon, 
  trend,
  description,
  loading = false,
  dataSource,
  isLive,
  cachedAt
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (val === undefined || val === null) {
      return '—';
    }
    if (typeof val === 'number') {
      return val.toLocaleString()
    }
    return val
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
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
        <div className="text-xs text-gray-500 mt-2">{description}</div>
      )}
      
      {(isMockData || dataSource) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Legacy mock data indicator */}
          {isMockData && !dataSource && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
              Mock Data
            </div>
          )}
          
          {/* Enhanced data source indicators */}
          {dataSource && (
            <>
              {dataSource === 'google_ads_api' || (dataSource === 'live' && isLive !== false) ? (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  Live API
                </div>
              ) : dataSource === 'cache' ? (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                  Cached
                  {cachedAt && (
                    <span className="ml-1 text-blue-600">
                      ({new Date(cachedAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })})
                    </span>
                  )}
                </div>
              ) : dataSource === 'mock' ? (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                  Mock Data
                </div>
              ) : dataSource === 'ga4' ? (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                  GA4
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}