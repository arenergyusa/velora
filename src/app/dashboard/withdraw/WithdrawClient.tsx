'use client'

import { useState, useEffect } from 'react'
import { ArrowUpFromLine, RefreshCw, Wallet, AlertCircle, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import useSWR, { mutate } from 'swr'
import { useWallet } from '@/context/WalletContext'

export default function WithdrawClient({
  fallbackStats,
  fallbackConfig,
  serverAddress
}: {
  fallbackStats?: unknown,
  fallbackConfig?: unknown,
  serverAddress?: string
}) {
  const { address, isConnected } = useWallet()
  const [amountUsd, setAmountUsd] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [trxPriceUsd, setTrxPriceUsd] = useState<number>(0.15)

  const activeAddress = (isConnected && address) || serverAddress

  // SWR for user stats
  const { data: resData, mutate: mutateStats, isLoading: isLoadingStats } = useSWR(
    activeAddress ? `/api/user/stats?address=${activeAddress}` : null,
    (url: string) => fetch(url).then(res => res.json()),
    { fallbackData: fallbackStats, revalidateOnFocus: false }
  )

  const stats = resData?.success ? resData.stats : null
  const userData = resData?.success ? resData.user : null

  // SWR for config
  const { data: configData, isLoading: isLoadingConfigData } = useSWR(
    '/api/config',
    (url: string) => fetch(url).then(res => res.json()),
    { fallbackData: fallbackConfig, revalidateOnFocus: false }
  )

  const minWithdrawalUsd = configData?.success ? configData.minWithdrawalUsd : 10
  const withdrawalFeePct = configData?.success ? configData.withdrawalFeePct : 10

  const loadingStats = !fallbackStats && isLoadingStats
  const isLoadingConfig = !fallbackConfig && isLoadingConfigData

  // Fetch Live TRX Price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/trx-price')
        const data = await res.json()
        if (data && data.price) {
          setTrxPriceUsd(parseFloat(data.price))
        }
      } catch (error: unknown) {
        console.error('Failed to fetch TRX price:', error)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  const availableBalanceUsd = stats?.availableBalanceUsd || 0
  const amount = parseFloat(amountUsd) || 0
  const fee = (amount * withdrawalFeePct) / 100
  const finalAmountUsd = amount - fee
  const finalAmountTrx = finalAmountUsd > 0 ? (finalAmountUsd / trxPriceUsd).toFixed(2) : '0.00'

  const handleMax = () => {
    setAmountUsd(availableBalanceUsd.toString())
  }

  const handleWithdraw = async () => {
    if (!amountUsd || amount <= 0 || !userData?.id) return

    if (amount < minWithdrawalUsd) {
      toast.error(`Minimum withdrawal is $${minWithdrawalUsd}`)
      return
    }

    if (amount > availableBalanceUsd) {
      toast.error('Insufficient available balance')
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, amountUsd: amount })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Withdrawal successful! Funds have been sent to your wallet.')
        setAmountUsd('')
        // Update local available balance optimistically
        mutateStats(
          (prev: { stats?: { availableBalanceUsd: number } }) => {
            if (!prev || !prev.stats) return prev;
            return {
              ...prev,
              stats: {
                ...prev.stats,
                availableBalanceUsd: prev.stats.availableBalanceUsd - amount
              }
            }
          },
          false // Don't revalidate immediately
        )
        // Optimistic UI Update: Revalidate dashboard stats across the app
        mutate(`/api/user/stats?address=${address}`)
      } else {
        toast.error(data.error || 'Failed to submit withdrawal request')
      }
    } catch {
      toast.error('An error occurred during submission')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loadingStats || isLoadingConfig) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading withdrawal data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8 animate-fade-in pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Withdraw Funds
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Request your funds directly to your connected wallet.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 w-full min-w-0">

        {/* Left Column: Balance & Info */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          <div className="gradient-bg rounded-3xl p-6 sm:p-8 shadow-lg shadow-primary/20 relative overflow-hidden text-white h-full flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Wallet className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/20 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 border border-white/20 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Withdrawal
              </div>

              <div className="space-y-1 mb-8">
                <p className="text-primary-foreground/70 font-medium text-sm">Available Balance</p>
                <div className="text-4xl sm:text-5xl font-black tracking-tight truncate">
                  ${availableBalanceUsd.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="space-y-3 bg-black/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary-foreground/50 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary-foreground/80 leading-relaxed">
                      Withdrawals are subject to a <strong className="text-primary-foreground">{withdrawalFeePct}% platform fee</strong>.
                      Minimum withdrawal amount is <strong className="text-primary-foreground">${minWithdrawalUsd}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-3 w-full min-w-0">
          <div className="glass-card bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-6 flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-primary" />
              Request Payout
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label htmlFor="amount" className="text-sm font-bold text-foreground">
                    Amount (USD)
                  </label>
                  <button
                    onClick={handleMax}
                    className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    Max Amount
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="amount"
                    type="number"
                    className="block w-full pl-11 pr-4 py-4 bg-muted border border-border rounded-2xl text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder={`Min: $${minWithdrawalUsd}`}
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                  />
                </div>
              </div>

              {/* Connected Wallet Display */}
              <div className="bg-muted border border-border rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 overflow-hidden">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-muted-foreground/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Receiving Address</p>
                  <p className="text-xs sm:text-sm font-mono text-foreground truncate">{address || 'Not connected'}</p>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${amount > 0 ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-primary/10/50 border border-primary/20 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap justify-between items-center text-sm gap-2">
                    <span className="text-muted-foreground font-medium">Requested Amount</span>
                    <span className="text-foreground font-bold">${amount.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center text-sm gap-2">
                    <span className="text-muted-foreground font-medium flex-shrink-0">Platform Fee ({withdrawalFeePct}%)</span>
                    <span className="text-destructive font-bold">-${fee.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-primary/30 w-full my-1 sm:my-2"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-foreground font-bold">You Receive (Approx)</span>
                    <div className="text-left sm:text-right w-full min-w-0">
                      <div className="text-lg sm:text-xl font-black text-primary truncate">{finalAmountTrx} TRX <span className="text-sm font-bold text-primary/70 whitespace-nowrap">(BEP-20)</span></div>
                      <div className="text-xs font-bold text-muted-foreground mt-0.5">≈ ${finalAmountUsd.toFixed(2)} USD</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!amountUsd || amount <= 0 || amount > availableBalanceUsd || isProcessing}
                className="w-full relative group overflow-hidden rounded-2xl bg-primary text-primary-foreground font-bold text-base py-4 px-6 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl active:scale-[0.98]"
              >
                <div className="relative flex items-center justify-center gap-2 z-10 w-full min-w-0">
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                      <span className="truncate">Processing Request...</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">Submit Withdrawal</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
