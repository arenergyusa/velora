'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { GitCommitVertical, BadgePercent, RefreshCw, Users, UserCheck, DollarSign, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TeamClient({ fallbackData, serverAddress }: { fallbackData?: unknown, serverAddress?: string }) {
  const { user: authUser, isLoadingSession } = useAuth()
  
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')

  const activeAddress = authUser?.walletAddress || serverAddress

  const { data: resData, isLoading } = useSWR(
    activeAddress ? `/api/team?address=${activeAddress}` : null,
    fetcher,
    {
      fallbackData,
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  const loading = !fallbackData && isLoading
  const teamData = resData?.success ? resData.data : null

  if (isLoadingSession) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!activeAddress) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground font-medium">Please connect your wallet to view your team.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading team data...</p>
        </div>
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-xl">Failed to load team data.</p>
      </div>
    )
  }

  const { levelStats, leftBiz, rightBiz, totalMembers = 0, activeMembers = 0, totalTeamIncome = 0 } = teamData
  const totalBiz = leftBiz + rightBiz
  const leftPct = totalBiz > 0 ? ((leftBiz / totalBiz) * 100).toFixed(1) : '0.0'
  const rightPct = totalBiz > 0 ? ((rightBiz / totalBiz) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          My Team
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your downlines, business ratios, and salary eligibility.
        </p>
      </div>

      {/* Summary 4 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Member */}
        <div className="glass-card bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Members</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{totalMembers}</p>
        </div>

        {/* Total Active Member */}
        <div className="glass-card bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Active Members</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{activeMembers}</p>
        </div>

        {/* Team Business */}
        <div className="glass-card bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-sky-500/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Team Business</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">${Number(totalBiz).toFixed(2)}</p>
        </div>

        {/* Total Team Income */}
        <div className="glass-card bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Team Income</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">${Number(totalTeamIncome).toFixed(2)}</p>
        </div>
      </div>

      {/* Salary & Team Ratio Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <GitCommitVertical className="w-24 h-24 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GitCommitVertical className="w-5 h-5" />
            </div>
            <h2 className="text-foreground font-bold text-lg">Left Team Business</h2>
          </div>

          <div className="relative z-10">
            <div className="text-4xl font-black text-foreground tracking-tight">
              ${Number(leftBiz).toFixed(2)}
            </div>

            <div className="mt-4 p-3 bg-muted rounded-xl flex items-center justify-between border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Business Ratio</p>
                <p className="text-sm font-bold text-primary">{leftPct}%</p>
              </div>
              <div className="h-8 border-r border-border mx-2"></div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Target Ratio</p>
                <p className="text-sm font-bold text-foreground">40% - 60%</p>
              </div>
            </div>
          </div>
        </div>
        <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <GitCommitVertical className="w-24 h-24 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GitCommitVertical className="w-5 h-5" />
            </div>
            <h2 className="text-foreground font-bold text-lg">Right Team Business</h2>
          </div>

          <div className="relative z-10">
            <div className="text-4xl font-black text-foreground tracking-tight">
              ${Number(rightBiz).toFixed(2)}
            </div>

            <div className="mt-4 p-3 bg-muted rounded-xl flex items-center justify-between border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Business Ratio</p>
                <p className="text-sm font-bold text-primary">{rightPct}%</p>
              </div>
              <div className="h-8 border-r border-border mx-2"></div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Target Ratio</p>
                <p className="text-sm font-bold text-foreground">40% - 60%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* 10-Level Breakdown */}
        <div className="glass-card bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-lg">10-Level Downline</h2>
              <p className="text-xs text-muted-foreground">Expand a level to view active/inactive members</p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto hide-scrollbar">
            {levelStats.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground text-sm font-medium">No levels generated yet</p>
              </div>
            ) : (
              <div className="space-y-3 min-w-[350px]">
                {levelStats.map((stat: { level: number; users: number; totalUsers?: number; commission: number; members?: { address: string; status: string; joinedAt: string | Date; deposit: number; earned: number }[] }) => {
                  const isExpanded = expandedLevel === stat.level
                  const totalLevelUsers = stat.totalUsers ?? stat.users
                  const members = stat.members || []
                  
                  const activeCount = members.filter(m => ['ACTIVE', 'WORKING'].includes(m.status)).length
                  const inactiveCount = members.filter(m => !['ACTIVE', 'WORKING'].includes(m.status)).length
                  
                  const displayMembers = members.filter(m => activeTab === 'ACTIVE' ? ['ACTIVE', 'WORKING'].includes(m.status) : !['ACTIVE', 'WORKING'].includes(m.status))

                  return (
                    <div key={stat.level} className="flex flex-col rounded-2xl border border-border/50 hover:border-border transition-colors group overflow-hidden bg-card">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => {
                          setExpandedLevel(isExpanded ? null : stat.level)
                          setActiveTab('ACTIVE')
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-black group-hover:bg-accent/20 group-hover:text-accent transition-colors">
                            L{stat.level}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {totalLevelUsers} Total Members
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stat.users} Active Users
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 bg-primary text-primary-foreground rounded-xl">
                            <span className="text-sm font-bold">{stat.commission}%</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border/50 p-4 bg-muted/20 animate-fade-in">
                          {/* Tabs */}
                          <div className="flex gap-2 mb-4 bg-background p-1.5 rounded-xl w-max border border-border/50">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveTab('ACTIVE') }}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                              Active ({activeCount})
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveTab('INACTIVE') }}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'INACTIVE' ? 'bg-rose-500/20 text-rose-500' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                              Inactive ({inactiveCount})
                            </button>
                          </div>

                          {/* Members List */}
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {displayMembers.map((member, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-background border border-border/50">
                                <div>
                                  <p className="text-sm font-mono font-medium text-foreground">
                                    {member.address.slice(0, 6)}...{member.address.slice(-4)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Joined: {new Date(member.joinedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-2 sm:mt-0 flex gap-6 text-right">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Invested</p>
                                    <p className="text-sm font-bold text-foreground">${member.deposit.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Earned</p>
                                    <p className="text-sm font-bold text-emerald-500">${member.earned.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {displayMembers.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-6">
                                No {activeTab.toLowerCase()} users found in this level.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
