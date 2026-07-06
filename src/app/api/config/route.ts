import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany()
    const configMap = configs.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    const plans = await prisma.planConfig.findMany({
      where: { isActive: true },
      orderBy: { minDepositUsd: 'asc' }
    })

    return NextResponse.json({
      success: true,
      masterWallet: configMap['platform_wallet_address'] || '0x1F0f0980feE31EC75F188f16F1d5C7001395D3C1',
      minWithdrawalUsd: Number(configMap['min_withdrawal_usd']) || 10,
      withdrawalFeePct: Number(configMap['withdrawal_fee_pct']) || 10,
      plans: plans.map((p: any) => ({
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
