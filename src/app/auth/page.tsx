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
    <div className="min-h-screen flex items-center justify-center bg-muted p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                  {!safeIsConnected ? (
                    <Wallet className="h-8 w-8 text-primary" />
                  ) : (
                    <Fingerprint className="h-8 w-8 text-primary" />
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-foreground mb-2">
              {!safeIsConnected ? 'Connect Wallet' : 'Verify Ownership'}
            </h2>
            <p className="text-sm text-center text-muted-foreground mb-8 px-4">
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
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{safeAuthError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!safeIsConnected ? (
              <div className="space-y-4">
                <Button
                  onClick={() => connect()}
                  disabled={safeIsConnecting}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
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
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Return to Home
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Connected Wallet Info */}
                <div className="rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
                      B
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Connected Wallet</p>
                      <p className="text-sm font-mono font-bold text-foreground truncate">
                        {safeAddress ? formatAddress(safeAddress) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Connected</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={signIn}
                  disabled={safeIsAuthenticating || safeIsAuthenticated}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-60"
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
                  className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-center py-1"
                >
                  Use a different wallet
                </button>

                {/* Security notice */}
                <div className="pt-5 border-t border-border/50">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Message signing is <span className="text-foreground font-semibold">completely free</span> and proves you own this wallet. No BNB is spent.
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
