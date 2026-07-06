import { getSession } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { getTeamBusiness } from '@/lib/business/team'
import TeamClient from './TeamClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const session = await getSession()
  
  if (!session || !session.user || !session.user.walletAddress) {
    redirect('/')
  }

  const walletAddress = session.user.walletAddress

  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: { id: true }
  })

  if (!user) {
    redirect('/')
  }

  // Pre-fetch data on the server for SSR
  const teamData = await getTeamBusiness(user.id)

  const fallbackData = {
    success: true,
    data: teamData
  }

  return <TeamClient fallbackData={fallbackData} serverAddress={walletAddress} />
}
