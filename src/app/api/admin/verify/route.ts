import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')

    if (!walletAddress) {
      return NextResponse.json({ isAdmin: false }, { status: 400 })
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: 'platform_wallet_address' }
    })

    const isAdmin = config?.value.toLowerCase() === walletAddress.toLowerCase()

    return NextResponse.json({ success: true, isAdmin })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
