'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users, Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalDeposits: number
  totalWithdrawals: number
  pendingWithdrawalsAmount: number
  pendingWithdrawalsCount: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)

  const fetchStats = () => {
    setLoading(true)
    setLoadError(false)
    fetch('/api/admin/stats')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error()
        return data
      })
      .then(data => {
        if (data.success) {
          setStats(data.data)
        }
      })
      .catch(() => {
        setLoadError(true)
        toast.error('Failed to load admin stats')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col h-64 items-center justify-center space-y-4">
        <p className="text-destructive font-medium">Failed to load admin stats.</p>
        <Button variant="outline" onClick={fetchStats}>Try Again</Button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time metrics of the Velora.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" /> {stats.activeUsers} Active IDs
            </p>
          </CardContent>
        </Card>

        {/* Total Deposits */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Total Volume (Deposits)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">${stats.totalDeposits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total USD Value in System</p>
          </CardContent>
        </Card>

        {/* Total Withdrawals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursed (Withdrawals)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">${stats.totalWithdrawals.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully paid out</p>
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Wallet className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">${stats.pendingWithdrawalsAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingWithdrawalsCount} requests in queue</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
