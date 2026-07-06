import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { status: { in: ['ACTIVE', 'WORKING'] } } })
    
    const depositSum = await prisma.deposit.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amountUsd: true }
    })
    
    const withdrawalSum = await prisma.withdrawal.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amountUsd: true }
    })

    const pendingWithdrawalSum = await prisma.withdrawal.aggregate({
      where: { status: 'PENDING' },
      _sum: { amountUsd: true }
    })

    const pendingWithdrawalCount = await prisma.withdrawal.count({
      where: { status: 'PENDING' }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalDeposits: Number(depositSum._sum.amountUsd || 0),
        totalWithdrawals: Number(withdrawalSum._sum.amountUsd || 0),
        pendingWithdrawalsAmount: Number(pendingWithdrawalSum._sum.amountUsd || 0),
        pendingWithdrawalsCount: pendingWithdrawalCount
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
