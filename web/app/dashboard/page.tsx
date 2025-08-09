'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import MetricCard from '@/components/MetricCard'
import Link from 'next/link'

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
  }
  warnings?: string[]
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchMetrics()
    }
  }, [user])

  const fetchMetrics = async () => {
    setMetricsLoading(true)
    setError(null)
    
    try {
      // Get the current session with access token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/metrics?startDate=2025-08-01&endDate=2025-08-07`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`)
      }
      
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch metrics')
    } finally {
      setMetricsLoading(false)
    }
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/uploads"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition"
              >
                Upload PDF
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
        {metrics && !metricsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Campaigns"
              value={metrics.totalCampaigns}
              description="Active advertising campaigns"
            />
            
            <MetricCard
              title="Total Impressions"
              value={metrics.totalImpressions}
              isMockData={metrics.mockDataFields.includes('totalImpressions')}
              description="Ad views and displays"
            />
            
            <MetricCard
              title="Click Rate"
              value={metrics.clickRate}
              unit="%"
              isMockData={metrics.mockDataFields.includes('clickRate')}
              description="Percentage of users who clicked"
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
              value={metrics.totalSpend}
              unit="USD"
              description="Your advertising spend from PDFs"
            />
          </div>
        )}

        {/* Mock Data Notice */}
        {metrics && metrics.mockDataFields.length > 0 && (
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
      </div>
    </div>
  )
}