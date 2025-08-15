'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'

interface SpendBreakdown {
  gross: {
    sgd: number
    usd: number
    description: string
  }
  credits: {
    sgd: number
    usd: number
    description: string
  }
  net: {
    sgd: number
    usd: number
    description: string
  }
}

interface ReconciliationData {
  account: {
    name: string
    currency: string
  }
  spend: SpendBreakdown
  exchangeRate: number
  reconciliation: {
    matchesInvoice: boolean
    expectedInvoiceAmount: number
    actualNetSpend: number
    difference: number
  }
  period: {
    start: string
    end: string
  }
}

interface SpendBreakdownProps {
  dateRange: {
    startDate: Date
    endDate: Date
  }
  isVisible: boolean
  onClose: () => void
}

export default function SpendBreakdown({ dateRange, isVisible, onClose }: SpendBreakdownProps) {
  const { user } = useAuth()
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReconciliation = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      const startStr = dateRange.startDate.toISOString().split('T')[0]
      const endStr = dateRange.endDate.toISOString().split('T')[0]
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/spend/reconciliation?startDate=${startStr}&endDate=${endStr}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reconciliation: ${response.status}`)
      }
      
      const reconciliationData = await response.json()
      setData(reconciliationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spending breakdown')
      console.error('Reconciliation error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isVisible && user) {
      fetchReconciliation()
    }
  }, [isVisible, user, dateRange])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Spend Breakdown & Reconciliation</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading reconciliation data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Account Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Account:</span>
                    <span className="ml-2 font-medium">{data.account?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Currency:</span>
                    <span className="ml-2 font-medium">{data.account?.currency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Period:</span>
                    <span className="ml-2 font-medium">{data.period.start} to {data.period.end}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Exchange Rate:</span>
                    <span className="ml-2 font-medium">1 SGD = {data.exchangeRate.toFixed(3)} USD</span>
                  </div>
                </div>
              </div>

              {/* Spend Breakdown */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Spending Breakdown</h3>
                <div className="space-y-3">
                  {/* Gross Spend */}
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <div>
                      <p className="font-medium text-blue-900">Gross Spend</p>
                      <p className="text-xs text-blue-700">{data.spend.gross.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-900">SGD ${data.spend.gross.sgd.toFixed(2)}</p>
                      <p className="text-sm text-blue-700">USD ${data.spend.gross.usd.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <div>
                      <p className="font-medium text-green-900">Invalid Activity Credits</p>
                      <p className="text-xs text-green-700">{data.spend.credits.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-900">-SGD ${data.spend.credits.sgd.toFixed(2)}</p>
                      <p className="text-sm text-green-700">-USD ${data.spend.credits.usd.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Net Spend */}
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded border-2 border-gray-300">
                    <div>
                      <p className="font-bold text-gray-900">Net Spend (Final Amount)</p>
                      <p className="text-xs text-gray-700">{data.spend.net.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">SGD ${data.spend.net.sgd.toFixed(2)}</p>
                      <p className="text-sm text-gray-700">USD ${data.spend.net.usd.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reconciliation Status */}
              <div className={`p-4 rounded-lg ${
                data.reconciliation.matchesInvoice 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <h3 className="font-medium mb-2 flex items-center">
                  {data.reconciliation.matchesInvoice ? (
                    <span className="text-green-600">✅ Invoice Reconciliation</span>
                  ) : (
                    <span className="text-yellow-600">⚠️ Reconciliation Alert</span>
                  )}
                </h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Invoice Amount:</span>
                    <span className="font-medium">SGD ${data.reconciliation.expectedInvoiceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actual Net Spend:</span>
                    <span className="font-medium">SGD ${data.reconciliation.actualNetSpend.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difference:</span>
                    <span className={`font-medium ${
                      Math.abs(data.reconciliation.difference) < 1 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      SGD ${data.reconciliation.difference.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {!data.reconciliation.matchesInvoice && (
                  <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                    <strong>Note:</strong> There's a discrepancy between the API data and expected invoice amount. 
                    This could be due to timing differences, pending adjustments, or data processing delays.
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>How we calculate spending:</strong>
                <br />
                1. Fetch gross spend from Google Ads API in original currency (SGD)
                <br />
                2. Apply invalid activity credits (refunds for fraudulent clicks)
                <br />
                3. Convert final amount to USD for dashboard display
                <br />
                4. The "Net Spend" should match your Google Ads invoice
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}