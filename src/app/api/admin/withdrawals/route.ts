import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'

export async function GET() {
  try {
    const adminCheck = await verifyAdminSession()
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { walletAddress: true } }
      }
    })

    const formattedData = withdrawals.map(w => ({
      id: w.id,
      user: w.user.walletAddress,
      amountUsd: Number(w.amountUsd),
      amountTrx: Number(w.amountTrx),
      date: w.createdAt.toISOString().split('T')[0]
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('Admin Withdrawals GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminCheck = await verifyAdminSession()
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { id, action } = await request.json()
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'CONFIRMED' : 'FAILED'

    const result = await prisma.withdrawal.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: newStatus }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Withdrawal not found or already processed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: `Withdrawal ${action}d successfully` })
  } catch (error) {
    console.error('Admin Withdrawals POST Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
