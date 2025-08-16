'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import FileUpload from '@/components/FileUpload'
import Link from 'next/link'

interface Upload {
  id: string
  filename: string
  file_size: number
  upload_date: string
  processing_status: string
  extracted_amount?: number
  extracted_month?: string
}

interface ReconciliationData {
  pdfSpend: number
  apiSpend: number
  variance: number
  variancePercentage: number
  status: 'within_threshold' | 'above_threshold' | 'no_data'
  recommendations: string[]
}

export default function UploadsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null)
  const [loadingReconciliation, setLoadingReconciliation] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUploadHistory()
      // Set default to current month
      const now = new Date()
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    }
  }, [user])

  useEffect(() => {
    if (selectedMonth && user) {
      performReconciliation()
    }
  }, [selectedMonth, user])

  const fetchUploadHistory = async () => {
    try {
      setHistoryError(null)
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/monthly-history`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setUploads(Array.isArray(data) ? data : [])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch upload history: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch upload history:', error)
      setHistoryError(error instanceof Error ? error.message : 'Failed to load upload history')
      setUploads([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const performReconciliation = async () => {
    if (!selectedMonth) return
    
    try {
      setLoadingReconciliation(true)
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }
      
      // Get PDF uploads for the selected month
      const monthUploads = uploads.filter(upload => {
        const uploadMonth = upload.extracted_month
        return uploadMonth === selectedMonth
      })
      
      // Calculate total PDF spend for the month
      const pdfSpend = monthUploads.reduce((total, upload) => {
        return total + (upload.extracted_amount || 0)
      }, 0)
      
      // Get Google Ads API data for the month
      const startDate = `${selectedMonth}-01`
      const endDate = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0)
        .toISOString().split('T')[0]
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/spend/google-ads?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )
      
      let apiSpend = 0
      if (response.ok) {
        const data = await response.json()
        apiSpend = data.totalSpend || 0
      }
      
      // Calculate variance
      const variance = Math.abs(pdfSpend - apiSpend)
      const variancePercentage = apiSpend > 0 ? (variance / apiSpend) * 100 : 0
      const threshold = 5 // 5% threshold
      
      // Generate recommendations
      const recommendations: string[] = []
      if (variancePercentage > threshold) {
        if (pdfSpend > apiSpend) {
          recommendations.push('PDF bills show higher spend than API. Check for manual adjustments or billing delays.')
          recommendations.push('Verify if PDF includes non-advertising charges (taxes, fees).')
        } else {
          recommendations.push('API shows higher spend than PDF bills. Check for missing PDF uploads.')
          recommendations.push('Verify API date range covers complete billing period.')
        }
        recommendations.push('Review individual campaign allocations for discrepancies.')
      } else {
        recommendations.push('Spend variance is within acceptable threshold (±5%).')
        recommendations.push('No immediate action required.')
      }
      
      if (monthUploads.length === 0) {
        recommendations.unshift('No PDF bills found for this month. Upload bills to enable reconciliation.')
      }
      
      setReconciliationData({
        pdfSpend,
        apiSpend,
        variance,
        variancePercentage,
        status: monthUploads.length === 0 ? 'no_data' : 
                variancePercentage > threshold ? 'above_threshold' : 'within_threshold',
        recommendations
      })
      
    } catch (error) {
      console.error('Reconciliation error:', error)
      setReconciliationData({
        pdfSpend: 0,
        apiSpend: 0,
        variance: 0,
        variancePercentage: 0,
        status: 'no_data',
        recommendations: ['Error performing reconciliation. Please try again.']
      })
    } finally {
      setLoadingReconciliation(false)
    }
  }

  const handleUploadSuccess = () => {
    fetchUploadHistory()
    // Refresh reconciliation for current month
    if (selectedMonth) {
      setTimeout(() => {
        performReconciliation()
      }, 1000)
    }
  }

  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      options.push({ value, label })
    }
    
    return options
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
              <h1 className="text-2xl font-bold text-gray-900">Monthly Reconciliation</h1>
              <p className="text-sm text-gray-600">Compare PDF bills with Google Ads API data</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition"
              >
                Dashboard
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
        <div className="max-w-6xl mx-auto">
          {/* Month Selector */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Month for Reconciliation</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a month...</option>
                  {generateMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-500">
                  Only complete calendar months can be reconciled
                </div>
              </div>
            </div>
          </div>

          {/* Reconciliation Results */}
          {selectedMonth && (
            <div className="mb-8">
              {loadingReconciliation ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Performing reconciliation...</p>
                </div>
              ) : reconciliationData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* PDF Bills Card */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">PDF Bills</h3>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${reconciliationData.pdfSpend.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Total from uploaded bills</p>
                  </div>

                  {/* Google Ads API Card */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Google Ads API</h3>
                      <div className="p-2 bg-green-100 rounded-full">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${reconciliationData.apiSpend.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Net spend from API</p>
                  </div>

                  {/* Variance Card */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Variance</h3>
                      <div className={`p-2 rounded-full ${
                        reconciliationData.status === 'within_threshold' ? 'bg-green-100' :
                        reconciliationData.status === 'above_threshold' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <svg className={`h-5 w-5 ${
                          reconciliationData.status === 'within_threshold' ? 'text-green-600' :
                          reconciliationData.status === 'above_threshold' ? 'text-red-600' : 'text-gray-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {reconciliationData.status === 'within_threshold' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : reconciliationData.status === 'above_threshold' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {reconciliationData.variancePercentage.toFixed(1)}%
                    </div>
                    <div className="text-lg text-gray-600 mb-2">
                      ${reconciliationData.variance.toLocaleString()}
                    </div>
                    <p className={`text-sm font-medium ${
                      reconciliationData.status === 'within_threshold' ? 'text-green-600' :
                      reconciliationData.status === 'above_threshold' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {reconciliationData.status === 'within_threshold' ? 'Within ±5% threshold' :
                       reconciliationData.status === 'above_threshold' ? 'Above ±5% threshold' : 'No data available'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {reconciliationData && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {reconciliationData.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New PDF Bill</h2>
              <FileUpload 
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(error) => console.error('Upload error:', error)}
              />
            </div>
          </div>

          {/* Upload History */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Upload History</h2>
              
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading upload history...</p>
                </div>
              ) : historyError ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">
                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-700 font-medium">Error loading upload history</p>
                  <p className="text-red-600 text-sm mt-1">{historyError}</p>
                  <button
                    onClick={fetchUploadHistory}
                    className="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : uploads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No PDF bills uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-1">Upload your first monthly bill to start reconciliation</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bill Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Extracted Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Upload Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploads.map((upload) => (
                        <tr key={upload.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                                <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{upload.filename}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(upload.file_size)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {upload.extracted_month ? 
                              new Date(`${upload.extracted_month}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) :
                              <span className="text-gray-400">Not extracted</span>
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {upload.extracted_amount ? 
                              `$${upload.extracted_amount.toLocaleString()}` :
                              <span className="text-gray-400">Processing...</span>
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(upload.upload_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              upload.processing_status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : upload.processing_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {upload.processing_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}