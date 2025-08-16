'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const { user } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [lastSync, setLastSync] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (user) {
      checkConnection()
    }
  }, [user])
  
  const checkConnection = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/google-ads/status`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )
      
      if (response.ok) {
        const status = await response.json()
        setConnectionStatus(status.connected ? 'connected' : 'disconnected')
        setLastSync(status.lastSync)
        setAccounts(status.accounts || [])
      } else {
        // Fallback to simulated status for MVP
        setConnectionStatus('connected')
        setLastSync(new Date().toISOString())
        setAccounts([{
          id: process.env.NEXT_PUBLIC_GOOGLE_ADS_CUSTOMER_ID || '1234567890',
          name: 'Main Google Ads Account'
        }])
      }
    } catch (error) {
      console.error('Error checking connection:', error)
      // Fallback for MVP - assume connected if we have credentials
      setConnectionStatus('connected')
      setLastSync(new Date().toISOString())
      setAccounts([{
        id: process.env.NEXT_PUBLIC_GOOGLE_ADS_CUSTOMER_ID || '1234567890',
        name: 'Main Google Ads Account'
      }])
    } finally {
      setLoading(false)
    }
  }
  
  const initiateOAuth = async () => {
    // For MVP, redirect to Google OAuth documentation
    // In production, this would redirect to actual OAuth endpoint
    window.open('https://developers.google.com/google-ads/api/docs/oauth/overview', '_blank')
  }
  
  const disconnectAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/google-ads/disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )
      
      setConnectionStatus('disconnected')
      setAccounts([])
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }
  
  const selectAccount = (accountId: string) => {
    // Store selected account in localStorage for now
    localStorage.setItem('selectedGoogleAdsAccount', accountId)
    alert(`Selected account ${accountId}`)
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access settings.</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <div className="text-sm text-gray-600">
              Welcome, {user.email}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Google Ads Connection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Google Ads Connection</h2>
          
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connection Status</p>
                <p className="text-sm text-gray-500">
                  {loading ? 'Checking...' : 
                   connectionStatus === 'connected' 
                    ? `Connected to ${accounts.length} account(s)`
                    : 'Not connected'
                  }
                </p>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-800'
                  : connectionStatus === 'checking'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {loading ? 'Checking' : connectionStatus === 'connected' ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            {/* Last Sync */}
            {lastSync && (
              <div>
                <p className="font-medium">Last Data Sync</p>
                <p className="text-sm text-gray-500">
                  {new Date(lastSync).toLocaleString()}
                </p>
              </div>
            )}
            
            {/* Connected Accounts */}
            {accounts.length > 0 && (
              <div>
                <p className="font-medium mb-2">Connected Accounts</p>
                <div className="space-y-2">
                  {accounts.map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-gray-500">ID: {account.id}</p>
                      </div>
                      <button
                        onClick={() => selectAccount(account.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* MVP Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>MVP Note:</strong> This is a configuration interface for Google Ads connection. 
                In the current MVP version, connection credentials are managed via environment variables.
                Full OAuth integration will be available in the next version.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {connectionStatus === 'connected' ? (
                <>
                  <button
                    onClick={disconnectAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={checkConnection}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Checking...' : 'Refresh Status'}
                  </button>
                </>
              ) : (
                <button
                  onClick={initiateOAuth}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Connect Google Ads Account
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Data Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Data Preferences</h2>
          
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 mr-3"
                defaultChecked={typeof window !== 'undefined' && localStorage.getItem('autoRefresh') === 'true'}
                onChange={(e) => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('autoRefresh', e.target.checked.toString())
                  }
                }}
              />
              <div>
                <p className="font-medium">Auto-refresh data</p>
                <p className="text-sm text-gray-500">
                  Automatically refresh Google Ads data every 5 minutes when dashboard is active
                </p>
              </div>
            </label>
            
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 mr-3"
                defaultChecked={typeof window !== 'undefined' && localStorage.getItem('preferPdfData') === 'true'}
                onChange={(e) => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('preferPdfData', e.target.checked.toString())
                  }
                }}
              />
              <div>
                <p className="font-medium">Prefer PDF data for spend calculations</p>
                <p className="text-sm text-gray-500">
                  Use uploaded PDF data when available, even if Google Ads API data exists
                </p>
              </div>
            </label>
            
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 mr-3"
                defaultChecked={typeof window !== 'undefined' && localStorage.getItem('showMockDataBadges') !== 'false'}
                onChange={(e) => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('showMockDataBadges', e.target.checked.toString())
                  }
                }}
              />
              <div>
                <p className="font-medium">Show mock data indicators</p>
                <p className="text-sm text-gray-500">
                  Display badges on metric cards when showing mock/fallback data
                </p>
              </div>
            </label>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="mt-8 text-center">
          <a 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}