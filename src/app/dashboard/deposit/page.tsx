import { getSession } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { getUserBalance } from '@/lib/business/balance'
import DepositClient from './DepositClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DepositPage() {
  const session = await getSession()

  if (!session || !session.user || !session.user.walletAddress) {
    redirect('/')
  }

  const walletAddress = session.user.walletAddress

  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: { id: true, status: true, referralCode: true }
  })

  if (!user) {
    redirect('/')
  }

  // Pre-fetch data on the server for SSR
  const stats = await getUserBalance(user.id)

  const fallbackStats = {
    success: true,
    user: {
      id: user.id,
      status: user.status,
      referralCode: user.referralCode
    },
    stats
  }

  const configs = await prisma.systemConfig.findMany()
  const configMap = configs.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)

  const fallbackConfig = {
    success: true,
    masterWallet: configMap['platform_wallet_address'] || '0x1F0f0980feE31EC75F188f16F1d5C7001395D3C1',
  }

  return (
    <DepositClient
      fallbackStats={fallbackStats}
      fallbackConfig={fallbackConfig}
      serverAddress={walletAddress}
    />
  )
}
