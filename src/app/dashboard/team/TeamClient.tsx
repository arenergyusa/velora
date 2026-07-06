'use client'

import useSWR from 'swr'
import { GitCommitVertical, BadgePercent, RefreshCw, ArrowRight } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TeamClient({ fallbackData, serverAddress }: { fallbackData?: unknown, serverAddress?: string }) {
  const { address, isConnected } = useWallet()

  const activeAddress = (isConnected && address) || serverAddress

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

  if (!activeAddress) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-slate-500 font-medium">Please connect your wallet to view your team.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-slate-500 font-medium">Loading team data...</p>
        </div>
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-rose-500 font-medium bg-rose-50 px-4 py-2 rounded-xl">Failed to load team data.</p>
      </div>
    )
  }

  const { levelStats, leftBiz, rightBiz } = teamData
  const totalBiz = leftBiz + rightBiz
  const leftPct = totalBiz > 0 ? ((leftBiz / totalBiz) * 100).toFixed(1) : '0.0'
  const rightPct = totalBiz > 0 ? ((rightBiz / totalBiz) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Team
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Track your downlines, business ratios, and salary eligibility.
        </p>
      </div>

      {/* Salary & Team Ratio Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <GitCommitVertical className="w-24 h-24 text-sky-600" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <GitCommitVertical className="w-5 h-5" />
            </div>
            <h2 className="text-slate-900 font-bold text-lg">Left Team Business</h2>
          </div>

          <div className="relative z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tight">
              ${Number(leftBiz).toFixed(2)}
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium">Business Ratio</p>
                <p className="text-sm font-bold text-sky-600">{leftPct}%</p>
              </div>
              <div className="h-8 border-r border-slate-200 mx-2"></div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Target Ratio</p>
                <p className="text-sm font-bold text-slate-700">40% - 60%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <GitCommitVertical className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <GitCommitVertical className="w-5 h-5" />
            </div>
            <h2 className="text-slate-900 font-bold text-lg">Right Team Business</h2>
          </div>

          <div className="relative z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tight">
              ${Number(rightBiz).toFixed(2)}
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium">Business Ratio</p>
                <p className="text-sm font-bold text-indigo-600">{rightPct}%</p>
              </div>
              <div className="h-8 border-r border-slate-200 mx-2"></div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Target Ratio</p>
                <p className="text-sm font-bold text-slate-700">40% - 60%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* 10-Level Breakdown */}
        <div className="glass-card bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-lg">10-Level Downline</h2>
              <p className="text-xs text-slate-500">Active user count & commission at each depth</p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto hide-scrollbar">
            {levelStats.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
                <p className="text-slate-500 text-sm font-medium">No levels generated yet</p>
              </div>
            ) : (
              <div className="space-y-2 min-w-[350px]">
                {levelStats.map((stat: { level: number; users: number; commission: number }) => (
                  <div key={stat.level} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                        L{stat.level}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{stat.users} Active Users</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
                      <div className="px-3 py-1 bg-slate-900 rounded-xl">
                        <span className="text-sm font-bold text-white">{stat.commission}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
