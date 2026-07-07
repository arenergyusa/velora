'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { RefreshCw, LayoutDashboard, Settings, Users, ArrowRightLeft, ShieldAlert, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useWallet()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    if (isConnected && address) {
      fetch(`/api/admin/verify?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (mounted) setIsAdmin(data.isAdmin)
        })
        .catch(() => {
          if (mounted) setIsAdmin(false)
        })
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAdmin(false)
    }
    return () => {
      mounted = false
    }
  }, [address, isConnected])

  if (isAdmin === null) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You are not authorized to view this page. Connect the Master Wallet to access the Admin Panel.
            </p>
            <Link href="/dashboard">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navItems = [
    { name: 'Overview', href: '/mksheelasuperadmin', icon: LayoutDashboard },
    { name: 'System Config', href: '/mksheelasuperadmin/config', icon: Settings },
    { name: 'Users', href: '/mksheelasuperadmin/users', icon: Users },
    { name: 'Withdrawals', href: '/mksheelasuperadmin/withdrawals', icon: ArrowRightLeft },
    { name: 'Queries', href: '/mksheelasuperadmin/queries', icon: MessageSquare },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-8">
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 space-y-2">
        <div className="px-4 py-2 mb-4">
          <h2 className="text-lg font-bold tracking-tight text-primary">Admin Control</h2>
          <p className="text-xs text-muted-foreground">Master Wallet Connected</p>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Admin Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
