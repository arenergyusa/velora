'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect as useAppKitDisconnect } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { bsc } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// ─── Reown AppKit Config ───
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

const metadata = {
  name: 'Velora',
  description: 'Next-Generation TRX Investment Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://velora-app.vercel.app',
  icons: ['/favicon.ico']
}

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [bsc],
})

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [bsc],
  defaultNetwork: bsc,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  }
})

const queryClient = new QueryClient()

// ─── Wallet Context (compatibility layer) ───
interface WalletContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: () => { },
  disconnect: () => { },
})

export const useWallet = () => useContext(WalletContext)

// ─── Inner Provider that consumes AppKit hooks ───
function WalletContextBridge({ children }: { children: ReactNode }) {
  const { open } = useAppKit()
  const { address, isConnected, status } = useAppKitAccount()
  const { disconnect: appKitDisconnect } = useAppKitDisconnect()

  const connect = () => {
    open()
  }

  const disconnect = () => {
    appKitDisconnect()
  }

  return (
    <WalletContext.Provider
      value={{
        address: address || null,
        isConnected: !!isConnected,
        isConnecting: status === 'connecting' || status === 'reconnecting',
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// ─── Main Provider ───
export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletContextBridge>
          {children}
        </WalletContextBridge>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
