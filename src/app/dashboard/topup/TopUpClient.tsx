'use client'

import { useState } from 'react'
import { ArrowRight, RefreshCw, Layers, ShieldCheck, DollarSign, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import useSWR, { mutate } from 'swr'
import { useWallet } from '@/context/WalletContext'
import { useRouter } from 'next/navigation'

export default function TopUpClient({
  fallbackStats,
  fallbackPlans,
  serverAddress
}: {
  fallbackStats?: unknown,
  fallbackPlans?: { id: string; min: number; max?: number; name: string; roi: number }[],
  serverAddress?: string
}) {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [amountUsd, setAmountUsd] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const activeAddress = (isConnected && address) || serverAddress

  const { data: resData, mutate: mutateStats } = useSWR(
    activeAddress ? `/api/user/stats?address=${activeAddress}` : null,
    (url: string) => fetch(url).then(res => res.json()),
    { fallbackData: fallbackStats, revalidateOnFocus: false }
  )

  const userData = resData?.success ? resData.user : null
  const availableBalance = resData?.success ? resData.stats.availableBalanceUsd : 0

  const { data: configData, isLoading: isLoadingConfigData } = useSWR(
    '/api/config',
    (url: string) => fetch(url).then(res => res.json()),
    { fallbackData: { success: true, plans: fallbackPlans }, revalidateOnFocus: false }
  )

  const plans = configData?.success ? configData.plans : []
  const isLoadingConfig = !fallbackPlans && isLoadingConfigData

  const activePlanDetails = plans.find((p: { id: string; min: number; max?: number; name: string; roi: number }) => p.id === selectedPlan)

  const handleMax = () => {
    if (activePlanDetails) {
      const isUnlimited = !activePlanDetails.max || activePlanDetails.max === 100000 || activePlanDetails.max === 0;
      const maxAllowed = isUnlimited ? availableBalance : Math.min(availableBalance, activePlanDetails.max)
      setAmountUsd(maxAllowed.toString())
    }
  }

  const handleInvest = async () => {
    if (!selectedPlan || !amountUsd || !userData?.id || !activePlanDetails) {
      toast.error('Missing details or user not loaded.')
      return
    }

    const amount = parseFloat(amountUsd)
    const isUnlimited = !activePlanDetails.max || activePlanDetails.max === 100000 || activePlanDetails.max === 0;

    if (amount < activePlanDetails.min || (!isUnlimited && amount > activePlanDetails.max!)) {
      toast.error(`Amount must be between $${activePlanDetails.min} and ${isUnlimited ? 'Unlimited' : `$${activePlanDetails.max}`}`)
      return
    }

    if (amount > availableBalance) {
      toast.error('Insufficient internal balance. Please add funds.')
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          planId: selectedPlan,
          amountUsd: amount
        })
      })

      const result = await res.json()

      if (result.success) {
        toast.success(`Successfully invested $${amount.toFixed(2)} in ${activePlanDetails?.name}!`)

        // Optimistic UI Update: Deduct balance locally before refetching
        mutateStats(
          (prev: { stats?: { availableBalanceUsd: number; activeDepositUsd: number; activePlan: string } }) => {
            if (!prev || !prev.stats) return prev;
            return {
              ...prev,
              stats: {
                ...prev.stats,
                availableBalanceUsd: prev.stats.availableBalanceUsd - amount,
                activeDepositUsd: prev.stats.activeDepositUsd + amount,
                activePlan: activePlanDetails?.name || prev.stats.activePlan
              }
            }
          },
          false // Don't revalidate immediately
        )

        setAmountUsd('')
        setSelectedPlan(null)
        // Global update
        mutate(`/api/team?address=${address}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to process investment')
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error('An error occurred during investment.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoadingConfig) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading investment plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Top-up
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choose a plan to top-up using your available balance.
          </p>
        </div>

        {/* Internal Balance Card */}
        <div className="flex items-center space-x-4 bg-card border border-border rounded-2xl p-4 shadow-sm w-fit">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Balance</div>
            <div className="text-lg font-black text-foreground">
              ${availableBalance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-3 text-center text-muted-foreground py-8">No active plans available</div>
        ) : plans.map((plan: { id: string; min: number; max?: number; name: string; roi: number }) => (
          <div
            key={plan.id}
            className={`glass-card bg-card border rounded-3xl p-6 transition-all cursor-pointer group ${selectedPlan === plan.id
              ? 'border-primary ring-4 ring-primary/10 shadow-md transform -translate-y-1'
              : 'border-border hover:border-primary/50 hover:shadow-sm'
              }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${selectedPlan === plan.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'} transition-colors`}>
                <Layers className="w-6 h-6" />
              </div>
              {selectedPlan === plan.id && (
                <div className="bg-primary/20 text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">Selected</div>
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
            <p className="text-primary font-bold mt-1 text-sm">{plan.roi}% Monthly ROI</p>

            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Deposit Range</div>
              <div className="text-lg font-black text-foreground">
                ${plan.min} - {(!plan.max || plan.max === 100000 || plan.max === 0) ? 'Unlimited' : `$${plan.max}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="glass-card bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl mx-auto mt-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="w-48 h-48 text-primary" />
          </div>

          <div className="relative z-10">
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Activate {activePlanDetails?.name}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Enter the USD amount you want to top-up. This will be deducted from your available balance.
            </p>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="amount" className="text-sm font-bold text-foreground">
                    Top-up Amount (USD)
                  </label>
                  <button
                    onClick={handleMax}
                    className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors"
                  >
                    Max Allowed
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
                    placeholder={`Min: $${activePlanDetails?.min}`}
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-muted border border-border rounded-2xl p-4 flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Your Balance</span>
                <span className={`font-bold ${availableBalance < parseFloat(amountUsd || '0') ? 'text-rose-500' : 'text-foreground'}`}>
                  ${availableBalance.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleInvest}
                disabled={!amountUsd || isProcessing || parseFloat(amountUsd) > availableBalance}
                className="w-full relative group overflow-hidden rounded-2xl bg-primary text-primary-foreground font-bold text-base py-4 px-6 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl active:scale-[0.98]"
              >
                <div className="relative flex items-center justify-center gap-2 z-10">
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-primary-foreground/50" />
                      <span>Activating Plan...</span>
                    </>
                  ) : (
                    <>
                      <span>Top-up Now</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
