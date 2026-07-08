'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'
import Footer from '@/components/layout/Footer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthenticating, isLoadingSession, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!isLoadingSession && !isAuthenticated && !isAuthenticating) {
      router.push('/auth')
    }
  }, [isLoadingSession, isAuthenticated, isAuthenticating, router])

  if (isLoadingSession || isAuthenticating || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Verifying your session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      {/* Top Navigation - Exact match to reference dApp */}
      <DashboardNavbar userStatus={user?.status || 'INACTIVE'} />

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
