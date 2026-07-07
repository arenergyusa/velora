import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'

export async function GET() {
  try {
    const adminCheck = await verifyAdminSession()
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to recent 500 users for performance
    })

    const formattedData = users.map(user => ({
      id: user.id,
      walletAddress: user.walletAddress,
      sponsorId: user.referredBy,
      status: user.status,
      date: user.createdAt.toISOString().split('T')[0]
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('Admin Users GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
