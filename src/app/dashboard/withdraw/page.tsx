import { getSession } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { getUserBalance } from '@/lib/business/balance'
import WithdrawClient from './WithdrawClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WithdrawPage() {
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
    minWithdrawalUsd: Number(configMap['min_withdrawal_usd']) || 10,
    withdrawalFeePct: Number(configMap['withdrawal_fee_pct']) || 10,
  }

  return (
    <WithdrawClient 
      fallbackStats={fallbackStats} 
      fallbackConfig={fallbackConfig}
      serverAddress={walletAddress} 
    />
  )
}
