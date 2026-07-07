'use client'

import useSWR from 'swr'
import { useWallet } from '@/context/WalletContext'
import Link from 'next/link'
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Layers,
  Users,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Share2,
  Link as LinkIcon,
  Gift,
  Banknote,
  PiggyBank,
  Network
} from 'lucide-react'
import CopyButton from '@/components/dashboard/CopyButton'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardClient({ fallbackData, serverAddress }: { fallbackData?: unknown, serverAddress?: string }) {
  const { address, isConnected } = useWallet()

  // Use the connected address if available, otherwise fallback to the one from session
  const activeAddress = (isConnected && address) || serverAddress

  const { data: resData, isLoading } = useSWR(
    activeAddress ? `/api/user/stats?address=${activeAddress}` : null,
    fetcher,
    {
      fallbackData,
      revalidateOnFocus: false, // Prevents unnecessary fetching on window focus
      dedupingInterval: 5000    // Don't refetch if called within 5 seconds
    }
  )

  const loading = !fallbackData && isLoading
  const data = resData?.success ? resData : null

  if (!activeAddress) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground font-medium">Please connect your wallet to view dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading your stats...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Failed to load dashboard data.</div>
  }

  const { user, stats } = data
  const progressPct = stats.maxEarning > 0 ? Math.min((stats.currentCycleEarned / stats.maxEarning) * 100, 100) : 0
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${user.referralCode}`

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Account Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Account Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your internal wallet, track active plans, and grow your network.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center space-x-3 bg-card border border-border rounded-2xl p-3 shadow-sm w-fit">
          <div className={`w-3 h-3 rounded-full ${user.status === 'ACTIVE' || user.status === 'WORKING' ? 'bg-emerald-500 animate-pulse-slow' : 'bg-accent'}`} />
          <div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Status</div>
            <div className="text-xs font-bold text-foreground">
              {user.status === 'ACTIVE' || user.status === 'WORKING' ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Inactive Alert Banner */}
      {user.status === 'INACTIVE' && (
        <div className="bg-gradient-to-r from-accent/20 via-accent/10 to-transparent border border-accent/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent border border-accent/30 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Activate Your Account</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                Your account is currently inactive. Please Add Funds to your internal wallet and Top-up a plan to start earning.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/dashboard/deposit"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold px-5 py-3.5 rounded-xl transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>Add Funds</span>
            </Link>
          </div>
        </div>
      )}

      {/* Internal Wallet Hero Card */}
      <div className="bg-gradient-to-br from-black via-zinc-900 to-black border border-primary/20 text-white border-0 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
          <Banknote className="w-48 h-48 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-primary border border-primary/20">
              <Wallet className="w-3.5 h-3.5" /> Balance
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Available to Withdraw or Top-up</div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight" aria-live="polite">
                ${stats.availableBalanceUsd.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link href="/dashboard/deposit" className="w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20">
              <ArrowDownCircle className="w-4.5 h-4.5" /> Add Funds
            </Link>
            <Link href="/dashboard/withdraw" className="w-full sm:w-auto px-6 py-3.5 bg-card/10 hover:bg-card/20 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors backdrop-blur-md">
              <ArrowUpCircle className="w-4.5 h-4.5" /> Withdraw
            </Link>
            <Link href="/dashboard/topup" className="w-full sm:w-auto px-6 py-3.5 bg-primary/30 hover:bg-primary/50 border border-primary/30 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors backdrop-blur-md">
              <Layers className="w-4.5 h-4.5" /> Top-up
            </Link>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Plan Card */}
        <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <PiggyBank className="w-16 h-16 text-primary" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Plan</span>
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <PiggyBank className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-foreground leading-tight" aria-live="polite">
              ${stats.activeDepositUsd.toFixed(2)}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground mt-1">Plan: {stats.activePlan || 'None'}</div>
          </div>
        </div>

        {/* Total Earned Card */}
        <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-16 h-16 text-primary" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Earned</span>
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-foreground leading-tight" aria-live="polite">
              ${stats.totalEarnedUsd.toFixed(2)}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground mt-1">ROI + Levels + Salary</div>
          </div>
        </div>

        {/* Network Size Card */}
        <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-16 h-16 text-primary" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Network</span>
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-foreground leading-tight" aria-live="polite">
              {stats.networkSize}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground mt-1">Active downline members</div>
          </div>
        </div>

        {/* Earning Cap Card */}
        <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden group hover:border-destructive/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers className="w-16 h-16 text-destructive" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Income Cap</span>
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/30 text-destructive">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-foreground leading-tight" aria-live="polite">
              {progressPct.toFixed(1)}%
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${progressPct >= 100 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-[10px] font-bold text-muted-foreground mt-1" aria-live="polite">
              ${stats.currentCycleEarned.toFixed(2)} / ${stats.maxEarning.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Referral Link Section */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 p-8 opacity-5">
            <Share2 className="w-48 h-48 text-primary" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary/20">
              <Gift className="w-3.5 h-3.5" /> Affiliate Program
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Invite & Earn</h3>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
              Share your unique referral link to build your Team. Earn level commissions and monthly salary rewards!
            </p>
          </div>

          <div className="relative z-10 bg-card/60 border border-border rounded-2xl p-4 backdrop-blur-md mt-4">
            {user.status === 'INACTIVE' ? (
              <div className="flex items-center gap-3 bg-accent/20 border border-accent/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <p className="text-xs text-accent font-medium">
                  Your referral link is locked. Please Top-up an active plan to unlock your link and start inviting users.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 min-w-0 bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  <code className="text-xs text-foreground font-mono truncate">{referralLink}</code>
                </div>
                <CopyButton text={referralLink} label="Copy Link" />
              </div>
            )}
          </div>
        </div>

        {/* Network Team Link Card */}
        <div className="glass-card bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
            <Network className="w-40 h-40 text-purple-600" />
          </div>

          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Manage Team</h3>
            <p className="text-muted-foreground text-xs mt-2 leading-relaxed max-w-sm">
              View your Team, track 10-level downline growth, and monitor your left and right team business required for monthly salary.
            </p>
          </div>

          <div className="bg-muted/80 backdrop-blur border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 relative z-10">
            <Users className="w-10 h-10 text-muted-foreground" />
            <Link
              href="/dashboard/team"
              className="w-full inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-sm"
            >
              <span>View Team</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
