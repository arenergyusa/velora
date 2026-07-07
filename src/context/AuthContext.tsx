'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useWallet } from '@/context/WalletContext'
import { useSignMessage } from 'wagmi'
import { toast } from 'sonner'

// ─── Types ───
interface AuthUser {
  id: string
  walletAddress: string
  referralCode: string
  status: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthenticating: boolean
  authError: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAuthenticating: false,
  authError: null,
  signIn: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Ethers signer helper removed in favor of wagmi useSignMessage

// ─── Provider ───
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useWallet()
  const { signMessageAsync } = useSignMessage()

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Track which address we've already authenticated for
  const authenticatedAddressRef = useRef<string | null>(null)
  // Prevent double-triggering
  const isSigningRef = useRef(false)
  const pathname = usePathname()

  // ─── Check existing session on mount ───
  useEffect(() => {
    // Skip session check on the landing page
    if (pathname === '/') return;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        
        if (!res.ok) {
          throw new Error(`Session API returned ${res.status}`)
        }
        
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Session API returned non-JSON response')
        }

        const data = await res.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
          authenticatedAddressRef.current = data.user.walletAddress
        }
      } catch (err: unknown) {
        // Only log if it's not a 404, to avoid spamming the console on new setups
        if (err instanceof Error && !err.message.includes('404')) {
          console.error('Session check failed:', err)
        }
      }
    }
    checkSession()
  }, [pathname])

  // ─── Sign in with message signature ───
  const signIn = useCallback(async () => {
    if (!isConnected || !address) {
      setAuthError('Wallet not connected')
      return
    }

    if (isSigningRef.current) return
    isSigningRef.current = true
    setIsAuthenticating(true)
    setAuthError(null)

    try {
      // Step 1: Get nonce/challenge message from backend
      const nonceRes = await fetch(`/api/auth/nonce?address=${address}`)
      
      const nonceContentType = nonceRes.headers.get('content-type')
      if (!nonceContentType || !nonceContentType.includes('application/json')) {
        throw new Error('API returned an invalid response (non-JSON).')
      }

      const nonceData = await nonceRes.json()

      if (!nonceRes.ok) {
        throw new Error(nonceData.error || 'Failed to get nonce')
      }

      const { message, nonceToken } = nonceData

      // Step 2: Request user to sign the message using wagmi (uses correct active connector)
      toast.loading('Please check your wallet or extension to approve the signature...', { id: 'auth-sign' })
      let signature: string
      try {
        signature = await signMessageAsync({ message })
        toast.loading('Signature approved! Logging in...', { id: 'auth-sign' })
      } catch (signError: unknown) {
        toast.dismiss('auth-sign')
        const errorMsg = signError instanceof Error ? signError.message : String(signError)
        if (errorMsg.includes('cancel') ||
            errorMsg.includes('reject') ||
            errorMsg.includes('denied') ||
            errorMsg.includes('user rejected')) {
          throw new Error('Signature request was rejected. Please sign the message to log in.')
        }
        throw new Error(`Signing failed: ${errorMsg}`)
      }

      if (!signature) {
        throw new Error('No signature received from wallet')
      }

      // Step 4: Send signature to backend for verification
      const referralCode = typeof window !== 'undefined' ? localStorage.getItem('ref') : null

      const authRes = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          message,
          nonceToken,
          referralCode
        })
      })

      const authContentType = authRes.headers.get('content-type')
      if (!authContentType || !authContentType.includes('application/json')) {
        throw new Error('API returned an invalid response (non-JSON).')
      }

      const authData = await authRes.json()

      if (!authRes.ok) {
        throw new Error(authData.error || 'Authentication failed')
      }

      toast.success('Successfully logged in!', { id: 'auth-sign' })

      setUser(authData.user)
      authenticatedAddressRef.current = address

      // Clear referral code after successful registration
      if (authData.isNewUser && typeof window !== 'undefined') {
        localStorage.removeItem('ref')
      }
    } catch (error: unknown) {
      console.error('Sign-in error:', error)
      toast.error(error instanceof Error ? error.message : 'Authentication failed', { id: 'auth-sign' })
      setAuthError(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsAuthenticating(false)
      isSigningRef.current = false
    }
  }, [isConnected, address, signMessageAsync])

  // ─── Sign out ───
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout API error:', err)
    }
    setUser(null)
    authenticatedAddressRef.current = null
    setAuthError(null)
  }, [])

  // ─── Auto sign-out when wallet disconnects ───
  const wasConnectedRef = useRef(false)
  useEffect(() => {
    if (isConnected) wasConnectedRef.current = true
  }, [isConnected])

  useEffect(() => {
    // Only auto-sign out if we were previously connected and now we're not
    if (wasConnectedRef.current && !isConnected && !isConnecting && user) {
      signOut()
    }
  }, [isConnected, isConnecting, user, signOut])

  // ─── If wallet address changes (switched account), clear auth ───
  useEffect(() => {
    if (isConnected && address && authenticatedAddressRef.current && address !== authenticatedAddressRef.current) {
      signOut()
    }
  }, [address, isConnected, signOut])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthenticating,
        authError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
