import { prisma } from '@/lib/prisma'
import { calculateDownlineBusiness } from '@/lib/business/salary'

export async function getTeamBusiness(userId: string) {
  // 1. Run independent initial queries in parallel
  const [directReferrals, configs, teamIncomeAgg] = await Promise.all([
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
    }),
    prisma.earning.aggregate({
      where: {
        userId,
        type: { in: ['LEVEL_COMMISSION'] }
      },
      _sum: {
        amountUsd: true
      }
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
  
  let totalMembers = 0
  let activeMembers = 0

  for (let i = 1; i <= 10; i++) {
    if (currentLevelIds.length === 0) {
      levelStats.push({ level: i, users: 0, commission: pctMap.get(i) || 0 })
      continue
    }

    // Find all users in next level
    const nextLevelUsers = await prisma.user.findMany({
      where: {
        referredBy: { in: currentLevelIds }
      },
      select: { 
        id: true, 
        status: true,
        walletAddress: true,
        createdAt: true,
        cycles: {
          orderBy: { cycleNumber: 'desc' },
          take: 1,
          select: { depositUsd: true, totalEarned: true }
        }
      }
    })
    
    const activeInLevel = nextLevelUsers.filter(u => ['ACTIVE', 'WORKING'].includes(u.status))

    totalMembers += nextLevelUsers.length
    activeMembers += activeInLevel.length

    levelStats.push({ 
      level: i, 
      users: activeInLevel.length, // Keep for backward compatibility
      totalUsers: nextLevelUsers.length,
      commission: pctMap.get(i) || 0,
      members: nextLevelUsers.map(u => ({
        address: u.walletAddress,
        status: u.status,
        joinedAt: u.createdAt,
        deposit: u.cycles.length > 0 ? Number(u.cycles[0].depositUsd) : 0,
        earned: u.cycles.length > 0 ? Number(u.cycles[0].totalEarned) : 0
      }))
    })

    currentLevelIds = nextLevelUsers.map(u => u.id)
  }

  // 3. Left and Right Team Business
  let leftBiz = 0
  let rightBiz = 0

  for (const dr of formattedDirects) {
    if (dr.team === 'LEFT') {
      leftBiz += await calculateDownlineBusiness(dr.id)
    }
    if (dr.team === 'RIGHT') {
      rightBiz += await calculateDownlineBusiness(dr.id)
    }
  }
  
  const totalTeamIncome = Number(teamIncomeAgg._sum.amountUsd || 0)

  return {
    directReferrals: formattedDirects,
    levelStats,
    leftBiz,
    rightBiz,
    totalMembers,
    activeMembers,
    totalTeamIncome
  }
}
