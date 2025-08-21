'use client'

import { lazy, Suspense } from 'react'
import LoadingSpinner from './LoadingSpinner'

// Lazy load chart components
const TrafficChart = lazy(() => import('./charts/TrafficChart'))
const DeviceChart = lazy(() => import('./charts/DeviceChart'))
const GeographicChart = lazy(() => import('./charts/GeographicChart'))
const CampaignChart = lazy(() => import('./charts/CampaignChart'))

const ChartSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
)

export function LazyTrafficChart(props) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <TrafficChart {...props} />
    </Suspense>
  )
}

export function LazyDeviceChart(props) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <DeviceChart {...props} />
    </Suspense>
  )
}

export function LazyGeographicChart(props) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <GeographicChart {...props} />
    </Suspense>
  )
}

export function LazyCampaignChart(props) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <CampaignChart {...props} />
    </Suspense>
  )
}