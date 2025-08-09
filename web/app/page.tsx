'use client'

import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Google Analytics Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          MVP with Supabase Authentication
        </p>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-green-600">Welcome, {user.email}!</p>
            <div className="space-x-4">
              <Link 
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/auth/logout"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition"
              >
                Sign Out
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-x-4">
            <Link 
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
        
        <div className="mt-12 text-sm text-gray-500">
          <p>API Server: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}</p>
        </div>
      </div>
    </div>
  )
}