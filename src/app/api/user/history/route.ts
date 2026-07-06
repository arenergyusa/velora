import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EarningType } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')
    const limit = Number(searchParams.get('limit')) || 20
    const page = Number(searchParams.get('page')) || 1
    const type = searchParams.get('type') || 'ALL'

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const take = limit * page
    
    // Fetch data based on selected tab (type) in parallel
    const [deposits, withdrawals, investments, earnings] = await Promise.all([
      (type === 'ALL' || type === 'DEPOSITS')
        ? prisma.deposit.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take
          }).then(res => res.map(d => ({ ...d, txType: 'DEPOSIT' })))
        : Promise.resolve([]),

      (type === 'ALL' || type === 'WITHDRAWALS')
        ? prisma.withdrawal.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take
          }).then(res => res.map(w => ({ ...w, txType: 'WITHDRAWAL' })))
        : Promise.resolve([]),

      (type === 'ALL' || type === 'INVESTMENTS')
        ? prisma.userCycle.findMany({
            where: { userId: user.id },
            orderBy: { startedAt: 'desc' },
            take
          }).then(res => res.map(i => ({ ...i, txType: 'INVESTMENT', createdAt: i.startedAt })))
        : Promise.resolve([]),

      (type === 'ALL' || ['ROI', 'LEVEL_COMMISSION', 'SALARY'].includes(type))
        ? prisma.earning.findMany({
            where: { 
              userId: user.id,
              ...(type !== 'ALL' ? { type: type as EarningType } : {})
            },
            orderBy: { createdAt: 'desc' },
            take
          }).then(res => res.map(e => ({ ...e, txType: e.type })))
        : Promise.resolve([])
    ])

    // Combine all fetched records
    const combined = [...deposits, ...withdrawals, ...investments, ...earnings]

    // Sort globally by date descending
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Slice for the exact page requested
    const startIndex = (page - 1) * limit
    const paginatedTransactions = combined.slice(startIndex, startIndex + limit)
    
    const hasMore = combined.length > startIndex + limit

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      hasMore,
      page
    })
  } catch (error) {
    console.error('History API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
