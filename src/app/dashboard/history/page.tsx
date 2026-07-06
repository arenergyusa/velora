'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, ExternalLink, Layers, Gift, Activity, Search } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { format } from 'date-fns'
import Link from 'next/link'

type TabType = 'ALL' | 'DEPOSITS' | 'WITHDRAWALS' | 'INVESTMENTS' | 'ROI' | 'LEVEL_COMMISSION' | 'SALARY'

export default function HistoryPage() {
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('ALL')
  
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isConnected && address) {
      const fetchTransactions = async () => {
        try {
          if (page === 1) setLoading(true)
          else setLoadingMore(true)

          const res = await fetch(`/api/user/history?address=${address}&limit=20&page=${page}&type=${activeTab}`)
          const data = await res.json()

          if (data.success) {
            if (page === 1) {
              setAllTransactions(data.transactions)
            } else {
              setAllTransactions(prev => [...prev, ...data.transactions])
            }
            setHasMore(data.hasMore)
          }
        } catch (error) {
          console.error("Failed to fetch transactions", error)
        } finally {
          setLoading(false)
          setLoadingMore(false)
        }
      }
      fetchTransactions()
    }
  }, [isConnected, address, page, activeTab])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(p => p + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current)
    }
  }, [hasMore, loadingMore, loading])

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    setPage(1)
    setAllTransactions([])
    setHasMore(true)
  }

  if (!isConnected) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-slate-500 font-medium">Please connect your wallet to view history.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-slate-500 font-medium">Loading transactions...</p>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType, label: string }[] = [
    { id: 'ALL', label: 'All Transactions' },
    { id: 'DEPOSITS', label: 'Deposits' },
    { id: 'WITHDRAWALS', label: 'Withdrawals' },
    { id: 'INVESTMENTS', label: 'Plans (Top-up)' },
    { id: 'ROI', label: 'Daily ROI' },
    { id: 'LEVEL_COMMISSION', label: 'Level Income' },
    { id: 'SALARY', label: 'Salary' },
  ]

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDownToLine className="w-5 h-5 text-emerald-500" />
      case 'WITHDRAWAL': return <ArrowUpFromLine className="w-5 h-5 text-rose-500" />
      case 'INVESTMENT': return <Layers className="w-5 h-5 text-indigo-500" />
      case 'ROI': return <Activity className="w-5 h-5 text-sky-500" />
      case 'LEVEL_COMMISSION': return <Gift className="w-5 h-5 text-amber-500" />
      case 'SALARY': return <Gift className="w-5 h-5 text-fuchsia-500" />
      default: return <Activity className="w-5 h-5 text-slate-500" />
    }
  }

  const getTxDetails = (tx: any) => {
    switch (tx.txType) {
      case 'DEPOSIT':
        return {
          title: 'Internal Balance Top-up',
          amount: `+$${Number(tx.amountUsd).toFixed(2)}`,
          amountClass: 'text-emerald-600',
          desc: `TRX Equivalent: ${Number(tx.amountNative).toFixed(2)} TRX`,
          status: tx.status
        }
      case 'WITHDRAWAL':
        return {
          title: 'Withdrawal to Wallet',
          amount: `-$${Number(tx.amountUsd).toFixed(2)}`,
          amountClass: 'text-rose-600',
          desc: `Fee: $${Number(tx.feeUsd).toFixed(2)}`,
          status: tx.status
        }
      case 'INVESTMENT':
        return {
          title: `Activated Plan`,
          amount: `-$${Number(tx.depositUsd).toFixed(2)}`,
          amountClass: 'text-indigo-600',
          desc: `Cycle #${tx.cycleNumber} - Max Earn: $${Number(tx.maxEarning).toFixed(2)}`,
          status: tx.status
        }
      case 'ROI':
        return {
          title: `Daily ROI Income`,
          amount: `+$${Number(tx.amountUsd).toFixed(2)}`,
          amountClass: 'text-sky-600',
          desc: tx.description || `Cycle #${tx.cycleNumber}`,
          status: 'COMPLETED'
        }
      case 'LEVEL_COMMISSION':
        return {
          title: `Level ${tx.level} Income`,
          amount: `+$${Number(tx.amountUsd).toFixed(2)}`,
          amountClass: 'text-amber-600',
          desc: tx.description || (tx.sourceUserId ? `From User: ${tx.sourceUserId.substring(0,6)}...` : 'Level Bonus'),
          status: 'COMPLETED'
        }
      case 'SALARY':
        return {
          title: `Monthly Salary`,
          amount: `+$${Number(tx.amountUsd).toFixed(2)}`,
          amountClass: 'text-fuchsia-600',
          desc: tx.description || 'Monthly Business Reward',
          status: 'COMPLETED'
        }
      default:
        return { title: 'Unknown', amount: '$0.00', amountClass: 'text-slate-900', desc: '', status: 'UNKNOWN' }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Transaction History
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          A complete overview of your deposits, withdrawals, investments, and earnings.
        </p>
      </div>

      <div className="glass-card bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {loading && page === 1 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mb-3" />
            <p className="text-slate-500 font-medium">Loading transactions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allTransactions.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg">No Transactions Found</h3>
                <p className="text-slate-500 text-sm mt-1">There is no history available for the selected category.</p>
              </div>
            ) : (
              allTransactions.map((tx, idx) => {
                const details = getTxDetails(tx)
                return (
                <div key={`${tx.txType}-${tx.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                      {getTxIcon(tx.txType)}
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-bold text-base">{details.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-medium">
                          {format(new Date(tx.createdAt), 'MMM dd, yyyy • hh:mm a')}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-xs text-slate-500">{details.desc}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0 pl-16 sm:pl-0">
                    <div className={`text-lg font-black ${details.amountClass}`}>
                      {details.amount}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {tx.txHash && (
                        <Link href={`https://bscscan.com/tx/${tx.txHash}`} target="_blank" className="text-xs text-sky-500 hover:text-sky-600 font-bold flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-md">
                          Explorer <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                        details.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        details.status === 'ACTIVE' || details.status === 'CAPPED' || details.status === 'RETOPED' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        details.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {details.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {/* Invisible target for Intersection Observer */}
          <div ref={observerTarget} className="h-10 w-full flex items-center justify-center pt-4">
            {loadingMore && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-sky-500" />
                <span className="text-sm text-slate-500 font-medium">Loading more...</span>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
