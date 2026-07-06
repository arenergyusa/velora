import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTeamBusiness } from '@/lib/business/team'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')

    if (!walletAddress) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const teamData = await getTeamBusiness(user.id)

    return NextResponse.json({
      success: true,
      data: teamData
    })
  } catch (error) {
    console.error('Team API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
