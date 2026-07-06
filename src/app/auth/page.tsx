'use client'

import { useAuth } from '@/context/AuthContext'
import { useWallet } from '@/context/WalletContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Loader2, AlertCircle, Fingerprint, CheckCircle2, Wallet, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthPage() {
  const { isConnected, isConnecting, address, connect, disconnect } = useWallet()
  const { isAuthenticated, isAuthenticating, authError, signIn } = useAuth()
  const router = useRouter()
  const [hasSignedIn, setHasSignedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Redirect to dashboard if fully authenticated
  useEffect(() => {
    if (mounted && isAuthenticated && !hasSignedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSignedIn(true)
      router.push('/dashboard')
    }
  }, [mounted, isAuthenticated, hasSignedIn, router])

  // Hydration-safe values
  const safeIsConnected = mounted ? isConnected : false;
  const safeIsConnecting = mounted ? isConnecting : false;
  const safeAddress = mounted ? address : '';
  const safeAuthError = mounted ? authError : null;
  const safeIsAuthenticating = mounted ? isAuthenticating : false;
  const safeIsAuthenticated = mounted ? isAuthenticated : false;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-sky-200/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/50 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        <div className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600" />

          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center">
                  {!safeIsConnected ? (
                    <Wallet className="h-8 w-8 text-sky-500" />
                  ) : (
                    <Fingerprint className="h-8 w-8 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
              {!safeIsConnected ? 'Connect Wallet' : 'Verify Ownership'}
            </h2>
            <p className="text-sm text-center text-slate-500 mb-8 px-4">
              {!safeIsConnected 
                ? 'Connect your Binance Smart Chain wallet to access the dashboard.' 
                : 'Sign a message to securely login to your account. This is free.'}
            </p>

            {/* Error */}
            <AnimatePresence mode="wait">
              {safeAuthError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-600">{safeAuthError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!safeIsConnected ? (
              <div className="space-y-4">
                <Button
                  onClick={() => connect()}
                  disabled={safeIsConnecting}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20 transition-all duration-300"
                >
                  {safeIsConnecting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Wallet className="h-5 w-5 mr-2" />
                  )}
                  {safeIsConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  className="w-full text-slate-500 hover:text-slate-800"
                >
                  Return to Home
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Connected Wallet Info */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      B
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Connected Wallet</p>
                      <p className="text-sm font-mono font-bold text-slate-800 truncate">
                        {safeAddress ? formatAddress(safeAddress) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Connected</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={signIn}
                  disabled={safeIsAuthenticating || safeIsAuthenticated}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 disabled:opacity-60"
                >
                  {safeIsAuthenticating || safeIsAuthenticated ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {safeIsAuthenticated ? 'Redirecting...' : 'Waiting for signature...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      Sign Message & Login
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </span>
                  )}
                </Button>

                {/* Disconnect option */}
                <button
                  onClick={() => disconnect()}
                  className="w-full text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors text-center py-1"
                >
                  Use a different wallet
                </button>

                {/* Security notice */}
                <div className="pt-5 border-t border-slate-100">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                      Message signing is <span className="text-slate-800 font-semibold">completely free</span> and proves you own this wallet. No BNB is spent.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
