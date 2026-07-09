import { prisma } from '@/lib/prisma'

export async function getUserBalance(userId: string) {
  // 1. Run independent aggregate queries in parallel
  const [
    earnings,
    withdrawals,
    deposits,
    investments,
    activeCycle,
    networkSize
  ] = await Promise.all([
    prisma.earning.aggregate({
      where: { userId },
      _sum: { amountUsd: true }
    }),
    prisma.withdrawal.aggregate({
      where: { 
        userId,
        status: { in: ['CONFIRMED', 'PENDING'] } 
      },
      _sum: { amountUsd: true }
    }),
    prisma.deposit.aggregate({
      where: {
        userId,
        status: 'CONFIRMED'
      },
      _sum: { amountUsd: true }
    }),
    prisma.userCycle.aggregate({
      where: { userId },
      _sum: { depositUsd: true }
    }),
    prisma.userCycle.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { cycleNumber: 'desc' }
    }),
    prisma.$queryRaw<{ count: number }[]>`
      WITH RECURSIVE downline AS (
        SELECT id, "referredBy", 1 as level, status
        FROM "User"
        WHERE "referredBy" = ${userId}
        
        UNION ALL
        
        SELECT u.id, u."referredBy", d.level + 1, u.status
        FROM "User" u
        INNER JOIN downline d ON u."referredBy" = d.id
        WHERE d.level < 10
      )
      SELECT count(*)::int as count
      FROM downline
      WHERE status IN ('ACTIVE', 'WORKING')
    `
  ])

  const totalEarnedUsd = Number(earnings._sum.amountUsd || 0)
  const totalWithdrawnUsd = Number(withdrawals._sum.amountUsd || 0)
  const totalDepositedUsd = Number(deposits._sum.amountUsd || 0)
  const totalInvestedUsd = Number(investments._sum.depositUsd || 0)

  // 2. Available Internal Balance
  // Balance = Earnings + Deposits - Withdrawals - Investments
  const availableBalanceUsd = Math.max(0, totalEarnedUsd + totalDepositedUsd - totalWithdrawnUsd - totalInvestedUsd)

  // 3. Get active plan name (Sequential as it depends on activeCycle)
  let activePlanName = 'No Active Plan'
  if (activeCycle) {
    const plan = await prisma.planConfig.findUnique({ where: { id: activeCycle.planId } })
    if (plan) {
      activePlanName = plan.name
    }
  }

  return {
    totalEarnedUsd,
    totalWithdrawnUsd,
    totalDepositedUsd,
    totalInvestedUsd,
    availableBalanceUsd,
    activePlan: activePlanName,
    activeDepositUsd: Number(activeCycle?.depositUsd || 0),
    maxEarning: Number(activeCycle?.maxEarning || 0),
    currentCycleEarned: Number(activeCycle?.totalEarned || 0),
    networkSize: networkSize[0]?.count || 0
  }
}
