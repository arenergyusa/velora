import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserBalance } from '@/lib/business/balance'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')

    if (!walletAddress) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stats = await getUserBalance(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        status: user.status,
        referralCode: user.referralCode,
        isProfileComplete: !!(user.fullName && user.phone && user.email && user.country && user.state && user.city && user.pinCode)
      },
      stats
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
