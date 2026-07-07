'use client'

import { useState, useEffect } from 'react'
import { ArrowDownToLine, RefreshCw, DollarSign, Coins, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import useSWR, { mutate } from 'swr'
import { useWallet } from '@/context/WalletContext'
import { useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits, isAddress, parseAbi } from 'viem'

export default function DepositClient({
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

  const [trxPriceUsd, setTrxPriceUsd] = useState<number>(0.3268)
  const [isLoadingPrice, setIsLoadingPrice] = useState(true)

  const { writeContractAsync } = useWriteContract()
  const config = useConfig()

  const activeAddress = (isConnected && address) || serverAddress

  // SWR for user stats
  const { data: resData } = useSWR(
    activeAddress ? `/api/user/stats?address=${activeAddress}` : null,
    (url: string) => fetch(url).then(res => res.json()),
    { fallbackData: fallbackStats, revalidateOnFocus: false }
  )

  const userData = resData?.success ? resData.user : null

  // SWR for config
  const { data: configData, isLoading: isLoadingConfigData } = useSWR(
    '/api/config',
    (url: string) => fetch(url).then(res => res.json()),
    { fallbackData: fallbackConfig, revalidateOnFocus: false }
  )

  const masterWallet = configData?.success ? configData.masterWallet : ''
  const isLoadingConfig = !fallbackConfig && isLoadingConfigData

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/trx-price')
        const data = await res.json()
        if (data && data.price) {
          setTrxPriceUsd(parseFloat(data.price))
        }
      } catch (error) {
        console.error('Failed to fetch TRX price:', error)
      } finally {
        setIsLoadingPrice(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  const amountTrx = amountUsd ? (parseFloat(amountUsd) / trxPriceUsd).toFixed(2) : '0.00'
  const minDeposit = 1;

  const handleDeposit = async () => {
    if (!amountUsd || !address || !userData?.id || !masterWallet) {
      toast.error('Wallet not connected, missing details, or system config loading.')
      return
    }

    const amount = parseFloat(amountUsd)
    if (amount < minDeposit) {
      toast.error(`Minimum deposit is $${minDeposit}`)
      return
    }

    if (!isAddress(masterWallet)) {
      toast.error(`Platform error: Invalid Master Wallet Address configured in system (${masterWallet}). Please contact admin.`)
      return
    }

    if (masterWallet.toLowerCase() === address.toLowerCase()) {
      toast.error("Platform error: Master wallet and your address cannot be the same. Please update the platform wallet address.")
      return
    }

    setIsProcessing(true)
    try {
      // ERC20 Transfer for Binance-Peg TRX on BSC
      const trxContractAddress = (process.env.NEXT_PUBLIC_TRX_CONTRACT_ADDRESS || '0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3') as `0x${string}`
      const amountWei = parseUnits(amountTrx, 6) // TRX on BSC uses 6 decimals

      toast.loading('Please confirm the transaction in your wallet...', { id: 'tx-toast' })

      const erc20Abi = parseAbi([
        "function transfer(address to, uint256 amount) returns (bool)"
      ])

      // 1. Execute Real Blockchain Transaction (TRX BEP20 transfer)
      const txHash = await writeContractAsync({
        address: trxContractAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [masterWallet as `0x${string}`, amountWei],
      })

      // Wait for confirmation
      toast.loading('Transaction submitted! Waiting for confirmation...', { id: 'tx-toast' })
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      })

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed on the network.')
      }

      const finalTxHash = txHash

      toast.loading('Transaction confirmed! Saving to database...', { id: 'tx-toast' })

      // 2. Call Backend API to verify and record Deposit
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          amountUsd: amount,
          txHash: finalTxHash,
          amountNative: parseFloat(amountTrx),
          nativePriceUsd: trxPriceUsd
        })
      })

      const result = await res.json()

      if (result.success) {
        toast.success(`Successfully deposited $${amount.toFixed(2)} to your Internal Balance!`, { id: 'tx-toast' })
        setAmountUsd('')
        // Optimistic UI Update: Revalidate dashboard stats across the app
        mutate(`/api/user/stats?address=${address}`)
      } else {
        toast.error(result.error || 'Failed to save deposit record', { id: 'tx-toast' })
      }

    } catch (error: unknown) {
      console.error(error)
      const msg = (error instanceof Error ? error.message : String(error)) || 'Transaction failed or rejected'

      if (msg.includes('user rejected') || msg.includes('denied')) {
        toast.error('Transaction was rejected by user.', { id: 'tx-toast' })
      } else if (msg.includes('CALL_EXCEPTION') || msg.includes('missing revert data')) {
        toast.error('Insufficient TRX balance or BNB for gas fee. Please check your wallet.', { id: 'tx-toast' })
      } else if (msg.includes('insufficient funds')) {
        toast.error('Insufficient BNB to cover the network gas fee.', { id: 'tx-toast' })
      } else {
        toast.error('Transaction failed. Make sure you have enough TRX and BNB for gas.', { id: 'tx-toast' })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoadingConfig) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading deposit module...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8 animate-fade-in pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Add Funds
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Deposit TRX (BEP-20) to your Internal Balance.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 w-full min-w-0">

        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          <div className="gradient-bg rounded-3xl p-6 sm:p-8 shadow-lg shadow-primary/20 relative overflow-hidden h-full flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Coins className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/20 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 border border-white/20 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" /> Instant Funding
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-2xl font-bold">Top-Up Your Balance</h3>
                <p className="text-emerald-100 text-sm leading-relaxed max-w-[90%]">
                  Funds are converted to USD at the live TRX market price and credited instantly to your internal wallet.
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="space-y-3 bg-black/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <ul className="space-y-2 text-sm text-emerald-50">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Minimum Deposit: ${minDeposit}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Supported Network: BSC (BEP-20)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Asset: TRX
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-3 w-full min-w-0">
          <div className="glass-card bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-6 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-primary" />
              Deposit
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="amount" className="text-sm font-bold text-foreground">
                    Amount (USD)
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="amount"
                    type="number"
                    className="block w-full pl-11 pr-4 py-4 bg-muted border border-border rounded-2xl text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder={`Min: $${minDeposit}`}
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${parseFloat(amountUsd) > 0 ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Live TRX Price</span>
                    <span className="text-foreground font-bold">
                      {isLoadingPrice ? <RefreshCw className="h-4 w-4 animate-spin text-primary" /> : `$${trxPriceUsd.toFixed(4)}`}
                    </span>
                  </div>
                  <div className="h-px bg-primary/20 w-full my-1 sm:my-2"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-foreground font-bold">You Pay (Approx)</span>
                    <div className="text-left sm:text-right">
                      <div className="text-lg sm:text-xl font-black text-primary">
                        {amountTrx} TRX <span className="text-sm font-bold text-primary/70">(BEP-20)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={!amountUsd || parseFloat(amountUsd) < minDeposit || isProcessing || isLoadingPrice}
                className="w-full relative group overflow-hidden rounded-2xl bg-primary text-primary-foreground font-bold text-base py-4 px-6 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl active:scale-[0.98]"
              >
                <div className="relative flex items-center justify-center gap-2 z-10">
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
                      <span>Processing Transaction...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Pay</span>
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
