'use client'

import { useWallet } from '@/context/WalletContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'
import Footer from '@/components/layout/Footer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet()
  const { isAuthenticated, isAuthenticating, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!isConnected) {
      router.push('/auth')
      return
    }

    if (isConnected && !isAuthenticated && !isAuthenticating) {
      const timer = setTimeout(() => {
        if (!isAuthenticating) {
          router.push('/auth')
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, isAuthenticated, isAuthenticating, router])

  if (isAuthenticating || !isConnected || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto" />
          <p className="text-slate-500 font-medium">Verifying your wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation - Exact match to reference dApp */}
      <DashboardNavbar userStatus={user?.status || 'inactive'} />

      {/* Main Content wrapper */}
      <main className="flex-grow flex flex-col min-w-0 overflow-x-hidden pt-32 md:pt-36 pb-12 animate-fade-in">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
