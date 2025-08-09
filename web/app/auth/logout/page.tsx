'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Logout() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut()
        router.push('/')
      } catch (error) {
        console.error('Logout error:', error)
        // Still redirect on error
        router.push('/')
      }
    }

    handleLogout()
  }, [signOut, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Signing out...</p>
      </div>
    </div>
  )
}