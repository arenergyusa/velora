import { getSession } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { getUserBalance } from '@/lib/business/balance'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session || !session.user || !session.user.walletAddress) {
    redirect('/')
  }

  const walletAddress = session.user.walletAddress

  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() }
  })

  if (!user) {
    redirect('/')
  }

  // Pre-fetch data on the server for SSR
  const stats = await getUserBalance(user.id)

  const fallbackData = {
    success: true,
    user: {
      id: user.id,
      status: user.status,
      referralCode: user.referralCode
    },
    stats
  }

  return <DashboardClient fallbackData={fallbackData} serverAddress={walletAddress} />
}
