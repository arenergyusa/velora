import { prisma } from '@/lib/prisma'

export async function getTeamBusiness(userId: string) {
  // 1. Run independent initial queries in parallel
  const [directReferrals, configs] = await Promise.all([
    prisma.user.findMany({
      where: { referredBy: userId },
      include: {
        cycles: {
          where: { status: 'ACTIVE' },
          orderBy: { cycleNumber: 'desc' },
          take: 1
        }
      }
    }),
    prisma.levelConfig.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' }
    })
  ])

  const formattedDirects = directReferrals.map(dr => ({
    id: dr.id,
    address: dr.walletAddress,
    deposit: dr.cycles.length > 0 ? Number(dr.cycles[0].depositUsd) : 0,
    status: dr.status,
    team: dr.teamSide
  }))

  // 2. 10-Level Downline Counter
  const levelStats = []
  let currentLevelIds = [userId]
  const pctMap = new Map(configs.map(c => [c.level, Number(c.commissionPct)]))

  for (let i = 1; i <= 10; i++) {
    if (currentLevelIds.length === 0) {
      levelStats.push({ level: i, users: 0, commission: pctMap.get(i) || 0 })
      continue
    }

    // Find users whose referredBy is in currentLevelIds
    const nextLevelUsers = await prisma.user.findMany({
      where: {
        referredBy: { in: currentLevelIds },
        status: { in: ['ACTIVE', 'WORKING'] }
      },
      select: { id: true }
    })

    levelStats.push({ 
      level: i, 
      users: nextLevelUsers.length,
      commission: pctMap.get(i) || 0
    })

    currentLevelIds = nextLevelUsers.map(u => u.id)
  }

  // 3. Left and Right Team Business
  let leftBiz = 0
  let rightBiz = 0

  for (const dr of formattedDirects) {
    if (dr.team === 'LEFT') leftBiz += dr.deposit
    if (dr.team === 'RIGHT') rightBiz += dr.deposit
  }

  return {
    directReferrals: formattedDirects,
    levelStats,
    leftBiz,
    rightBiz
  }
}
