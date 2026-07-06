import { prisma } from '@/lib/prisma'

// Default percentages if not set in DB
const DEFAULT_LEVEL_PCT: Record<number, number> = {
  1: 12, 2: 9, 3: 6, 4: 3, 5: 3,
  6: 3, 7: 3, 8: 2, 9: 2, 10: 5
}

/**
 * Distribute 10-level commission upwards when a user deposits/retops
 */
export async function distributeLevelCommissions(
  depositingUserId: string,
  depositAmountUsd: number,
  _cycleNumber: number
) {
  try {
    // 1. Fetch all level configs from DB
    const levelConfigs = await prisma.levelConfig.findMany()
    const pctMap = new Map<number, number>()
    
    levelConfigs.forEach(conf => {
      if (conf.isActive) pctMap.set(conf.level, Number(conf.commissionPct))
    })

    // 2. Start traversing upwards (up to 10 levels)
    let currentUserId: string | null = depositingUserId
    let level = 1

    while (level <= 10 && currentUserId) {
      // Find current user's sponsor
      const currentUserNode: { referredBy: string | null } | null = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { referredBy: true }
      })

      if (!currentUserNode || !currentUserNode.referredBy) {
        break // Reached the top of the chain
      }

      const sponsorId: string = currentUserNode.referredBy

      // Get the commission % for this level
      const commissionPct = pctMap.get(level) ?? DEFAULT_LEVEL_PCT[level] ?? 0
      
      if (commissionPct > 0) {
        const commissionUsd = (depositAmountUsd * commissionPct) / 100

        // Check if sponsor's ID is active/working and hasn't hit cap
        const sponsorCycle = await prisma.userCycle.findFirst({
          where: { userId: sponsorId, status: 'ACTIVE' },
          orderBy: { cycleNumber: 'desc' }
        })

        if (sponsorCycle) {
          // Check if this new commission will exceed their cap
          const currentTotal = Number(sponsorCycle.totalEarned)
          const maxCap = Number(sponsorCycle.maxEarning)
          
          let payout = commissionUsd

          if (currentTotal + payout > maxCap) {
            payout = maxCap - currentTotal
            
            // Mark cycle as capped
            if (payout >= 0) {
              await prisma.userCycle.update({
                where: { id: sponsorCycle.id },
                data: { status: 'CAPPED', cappedAt: new Date() }
              })
            }
          }

          if (payout > 0) {
            // Record the earning
            await prisma.earning.create({
              data: {
                userId: sponsorId,
                type: 'LEVEL_COMMISSION',
                amountUsd: payout,
                sourceUserId: depositingUserId,
                level: level,
                cycleNumber: sponsorCycle.cycleNumber,
                description: `Level ${level} Commission from user ${depositingUserId}`
              }
            })

            // Update sponsor's cycle total
            await prisma.userCycle.update({
              where: { id: sponsorCycle.id },
              data: {
                totalEarned: { increment: payout }
              }
            })
          }
        }
      }

      // Move up to the next level
      currentUserId = sponsorId
      level++
    }

    return true
  } catch (error) {
    console.error('Error distributing level commissions:', error)
    return false
  }
}
