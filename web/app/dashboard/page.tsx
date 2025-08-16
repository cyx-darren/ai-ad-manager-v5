'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import MetricCard from '@/components/MetricCard'
import DateRangePicker from '@/components/DateRangePicker'
import TrafficChart from '@/components/charts/TrafficChart'
import DeviceChart from '@/components/charts/DeviceChart'
import GeographicChart from '@/components/charts/GeographicChart'
import CampaignChart from '@/components/charts/CampaignChart'
import SpendBreakdown from '@/components/SpendBreakdown'
import CampaignPerformanceTable from '@/components/CampaignPerformanceTable'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

interface DashboardMetrics {
  totalCampaigns: number
  totalImpressions: number
  clickRate: number
  totalSessions: number
  totalUsers: number
  avgBounceRate: number
  conversions: number
  totalSpend: number
  mockDataFields: string[]
  dataSource?: string
  currency?: {
    display: string
    original: string
    exchangeRate: number
    conversionApplied: boolean
  }
  metadata?: {
    dateRange: {
      startDate: string
      endDate: string
    }
    dataSource: {
      ga4: string
      spend: string
      ga4Error: string | null
    }
    user: string
    timestamp: string
    adsMetadata?: any
  }
  warnings?: string[]
}

interface SpendData {
  total: number
  source: string
  campaigns: Array<{
    id?: string
    name: string
    spend: number
    impressions?: number
    clicks?: number
    conversions?: number
    date?: string
  }>
  currency: string
}

interface AdsMetrics {
  impressions: number
  clicks: number
  ctr: number
  source: string
  conversions?: number
  avgCpc?: number
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [charts, setCharts] = useState({
    traffic: null,
    devices: null,
    geographic: null,
    campaigns: null
  })
  const [chartsLoading, setChartsLoading] = useState(false)
  const [spendData, setSpendData] = useState<SpendData>({
    total: 0,
    source: 'loading',
    campaigns: [],
    currency: 'USD'
  })
  const [adsMetrics, setAdsMetrics] = useState<AdsMetrics>({
    impressions: 0,
    clicks: 0,
    ctr: 0,
    source: 'loading'
  })
  const [campaignDetails, setCampaignDetails] = useState([])
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const fetchAllData = useCallback(async () => {
    if (!user) return
    
    setMetricsLoading(true)
    setChartsLoading(true)
    setError(null)
    
    try {
      // Get the current session with access token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }
      
      // Format dates for API
      const startStr = dateRange.startDate.toISOString().split('T')[0]
      const endStr = dateRange.endDate.toISOString().split('T')[0]
      
      const headers = {
        'Authorization': `Bearer ${session.access_token}`
      }
      
      // Fetch all data in parallel including Google Ads data
      const [metricsRes, spendRes, adsRes, trafficRes, devicesRes, geoRes, campaignsRes, campaignDetailsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/metrics?startDate=${startStr}&endDate=${endStr}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/spend/google-ads?startDate=${startStr}&endDate=${endStr}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/ads-metrics?startDate=${startStr}&endDate=${endStr}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/charts/traffic?startDate=${startStr}&endDate=${endStr}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/charts/devices?startDate=${startStr}&endDate=${endStr}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/charts/geographic?startDate=${startStr}&endDate=${endStr}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/charts/campaigns?startDate=${startStr}&endDate=${endStr}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/campaigns/details?startDate=${startStr}&endDate=${endStr}`, { headers })
      ])
      
      if (!metricsRes.ok) {
        throw new Error(`Failed to fetch metrics: ${metricsRes.status}`)
      }
      
      const [metricsData, spendDataRes, adsDataRes, trafficData, devicesData, geoData, campaignsData, campaignDetailsData] = await Promise.all([
        metricsRes.json(),
        spendRes.ok ? spendRes.json() : null,
        adsRes.ok ? adsRes.json() : null,
        trafficRes.ok ? trafficRes.json() : null,
        devicesRes.ok ? devicesRes.json() : null,
        geoRes.ok ? geoRes.json() : null,
        campaignsRes.ok ? campaignsRes.json() : null,
        campaignDetailsRes.ok ? campaignDetailsRes.json() : []
      ])
      
      setMetrics(metricsData)
      
      // Set Google Ads spend data
      if (spendDataRes) {
        setSpendData({
          total: spendDataRes.totalSpend || 0,
          source: spendDataRes.source || 'mock_data',
          campaigns: spendDataRes.campaigns || [],
          currency: spendDataRes.currency || 'USD'
        })
      }
      
      // Set Google Ads metrics data
      if (adsDataRes) {
        setAdsMetrics({
          impressions: adsDataRes.impressions || 0,
          clicks: adsDataRes.clicks || 0,
          ctr: adsDataRes.ctr || 0,
          source: adsDataRes.source || 'mock_data',
          conversions: adsDataRes.conversions,
          avgCpc: adsDataRes.avgCpc
        })
      }
      
      // Use Google Ads campaign data if available, otherwise use chart data
      setCharts({
        traffic: trafficData,
        devices: devicesData,
        geographic: geoData,
        campaigns: spendDataRes?.campaigns?.length > 0 ? spendDataRes.campaigns : campaignsData
      })
      
      // Set campaign details for the table
      setCampaignDetails(campaignDetailsData || [])
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data')
    } finally {
      setMetricsLoading(false)
      setChartsLoading(false)
    }
  }, [user, dateRange])

  // Legacy function for compatibility
  const fetchMetrics = fetchAllData

  // Fetch metrics when user or date range changes
  useEffect(() => {
    if (user) {
      fetchMetrics()
    }
  }, [user, dateRange])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(() => {
      if (user) {
        fetchMetrics()
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Welcome back, {user.email}</span>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    • Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <button
                onClick={fetchMetrics}
                disabled={metricsLoading}
                className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                title="Refresh all data"
              >
                <RefreshCw className={`h-4 w-4 ${metricsLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={async () => {
                  // Manual refresh for Google Ads data
                  const { supabase } = await import('@/lib/supabase')
                  const { data: { session } } = await supabase.auth.getSession()
                  if (session?.access_token) {
                    // Clear cache by calling refresh endpoint if it exists
                    fetchMetrics()
                  }
                }}
                className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                title="Refresh Google Ads data"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Link
                href="/uploads"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition"
              >
                Upload PDF
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Date Range Info */}
        {metrics?.metadata && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Data for {metrics.metadata.dateRange.startDate} to {metrics.metadata.dateRange.endDate}
            </p>
            {metrics.warnings && metrics.warnings.length > 0 && (
              <div className="mt-2">
                {metrics.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-orange-600">⚠ {warning}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {metricsLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard metrics...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800">Error loading metrics</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchMetrics}
              className="mt-2 px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricsLoading && !metrics ? (
            // Loading skeletons
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))
          ) : metrics && (
            <>
            <MetricCard
              title="Total Campaigns"
              value={metrics.totalCampaigns}
              isMockData={metrics.mockDataFields?.includes('totalCampaigns') || false}
              description="Active advertising campaigns"
            />
            
            <MetricCard
              title="Total Impressions"
              value={adsMetrics.impressions || metrics.totalImpressions}
              isMockData={adsMetrics.source === 'mock_data' || metrics.mockDataFields?.includes('totalImpressions') || false}
              description={`Ad views from ${adsMetrics.source === 'google_ads_api' ? 'Google Ads' : 'mock data'}`}
            />
            
            <MetricCard
              title="Click Rate"
              value={adsMetrics.ctr || metrics.clickRate}
              unit="%"
              isMockData={adsMetrics.source === 'mock_data' || metrics.mockDataFields?.includes('clickRate') || false}
              description={`CTR from ${adsMetrics.source === 'google_ads_api' ? 'Google Ads' : 'mock data'}`}
            />
            
            <MetricCard
              title="Total Sessions"
              value={metrics.totalSessions}
              description="Paid channel visits (Paid Search, Display, Paid Video)"
            />
            
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers}
              description="Unique paid channel visitors (Paid Search, Display, Paid Video)"
            />
            
            <MetricCard
              title="Bounce Rate"
              value={metrics.avgBounceRate}
              unit="%"
              description="Percentage of single-page visits"
            />
            
            <MetricCard
              title="Conversions"
              value={metrics.conversions}
              description="Goal completions"
            />
            
            <MetricCard
              title="Total Spend"
              value={spendData.total || metrics.totalSpend}
              unit={metrics?.currency?.display || spendData.currency || "SGD"}
              description={
                <div className="space-y-1">
                  <div>{`Net spend from ${spendData.source === 'google_ads_api' ? 'Google Ads API' : spendData.source === 'mock_data' ? 'mock data' : 'loading...'}`}</div>
                  <div className="text-xs text-gray-600">
                    Account currency: {metrics?.currency?.display || 'SGD'}
                  </div>
                  {spendData.source === 'google_ads_api' && (
                    <button
                      onClick={() => setShowBreakdown(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                    >
                      View breakdown & reconciliation
                    </button>
                  )}
                </div>
              }
              isMockData={spendData.source === 'mock_data' || metrics.mockDataFields?.includes('totalSpend')}
            />
            </>
          )}
        </div>

        {/* Charts Section */}
        {!metricsLoading && metrics && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Analytics Charts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartsLoading ? (
                // Loading skeletons for charts
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                  </div>
                ))
              ) : (
                <>
                  <TrafficChart data={charts.traffic} />
                  <DeviceChart data={charts.devices} />
                  <GeographicChart data={charts.geographic} />
                  <CampaignChart 
                    data={charts.campaigns} 
                    isLiveData={spendData.source === 'google_ads_api'}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Campaign Performance Table */}
        {!metricsLoading && metrics && (
          <div className="mt-8">
            <CampaignPerformanceTable 
              campaigns={campaignDetails} 
              currency="SGD"
            />
          </div>
        )}

        {/* Mock Data Notice */}
        {metrics && metrics.mockDataFields && metrics.mockDataFields.length > 0 && (
          <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-sm font-medium text-orange-800">MVP Notice</h3>
            <p className="text-sm text-orange-600 mt-1">
              Mock data fields ({metrics.mockDataFields.join(', ')}) will be replaced with real data in post-MVP version.
            </p>
          </div>
        )}

        {/* No Data State */}
        {!metrics && !metricsLoading && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No metrics available</h3>
            <p className="text-gray-600">Click "Retry" to load your dashboard data.</p>
            <button
              onClick={fetchMetrics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Load Metrics
            </button>
          </div>
        )}
        
        {/* Spend Breakdown Modal */}
        <SpendBreakdown
          dateRange={dateRange}
          isVisible={showBreakdown}
          onClose={() => setShowBreakdown(false)}
        />
      </div>
    </div>
  )
}