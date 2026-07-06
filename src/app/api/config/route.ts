import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany()
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)
    
    const plans = await prisma.planConfig.findMany({
      where: { isActive: true },
      orderBy: { minDepositUsd: 'asc' }
    })

    return NextResponse.json({ 
      success: true, 
      masterWallet: configMap['platform_wallet_address'] || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      minWithdrawalUsd: Number(configMap['min_withdrawal_usd']) || 10,
      withdrawalFeePct: Number(configMap['withdrawal_fee_pct']) || 10,
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        min: Number(p.minDepositUsd),
        max: Number(p.maxDepositUsd),
        roi: Number(p.monthlyRoiPct)
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
