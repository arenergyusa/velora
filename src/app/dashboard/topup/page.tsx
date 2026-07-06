import { getSession } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { getUserBalance } from '@/lib/business/balance'
import TopUpClient from './TopUpClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TopUpPage() {
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

  const plansData = await prisma.planConfig.findMany({
    where: { isActive: true },
    orderBy: { minDepositUsd: 'asc' }
  })
  
  const fallbackPlans = plansData.map(p => ({
    id: p.id,
    name: p.name,
    min: Number(p.minDepositUsd),
    max: Number(p.maxDepositUsd),
    roi: Number(p.monthlyRoiPct)
  }))

  return (
    <TopUpClient 
      fallbackStats={fallbackStats} 
      fallbackPlans={fallbackPlans}
      serverAddress={walletAddress} 
    />
  )
}
