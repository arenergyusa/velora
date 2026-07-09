import { prisma } from '@/lib/prisma'

// Default percentages if not set in DB
const DEFAULT_LEVEL_PCT: Record<number, number> = {
  1: 12, 2: 9, 3: 6, 4: 3, 5: 3,
  6: 3, 7: 3, 8: 2, 9: 2, 10: 5
}

/**
 * Distribute 2-level commission upwards when a user deposits/retops
 */
export async function distributeTopupReferralCommissions(
  depositingUserId: string,
  depositAmountUsd: number
) {
  try {
    // 1. Fetch Referral configs from DB
    const referralConfigs = await prisma.referralConfig.findMany()
    const pctMap = new Map<number, number>()
    
    referralConfigs.forEach(conf => {
      if (conf.isActive) pctMap.set(conf.level, Number(conf.commissionPct))
    })

    // Fallback if not configured in DB:
    if (pctMap.size === 0) {
      pctMap.set(1, 6)
      pctMap.set(2, 2)
    }

    // 2. Start traversing upwards (up to 2 levels)
    let currentUserId: string | null = depositingUserId
    let level = 1

    while (level <= 2 && currentUserId) {
      // Find current user's sponsor
      const currentUserNode = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { referredBy: true }
      })

      if (!currentUserNode || !currentUserNode.referredBy) {
        break // Reached the top of the chain
      }

      const sponsorId: string = currentUserNode.referredBy
      const commissionPct = pctMap.get(level) ?? 0
      
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
                type: 'LEVEL_COMMISSION', // keeping same enum to display on UI or change to TOPUP_COMMISSION if needed, wait, let's keep LEVEL_COMMISSION
                amountUsd: payout,
                sourceUserId: depositingUserId,
                level: level,
                cycleNumber: sponsorCycle.cycleNumber,
                description: `Level ${level} Topup Commission from user ${depositingUserId}`
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

      currentUserId = sponsorId
      level++
    }

    return true
  } catch (error) {
    console.error('Error distributing topup referral commissions:', error)
    return false
  }
}

/**
 * Distribute 10-level commission upwards based on ROI earned by a user
 */
export async function distributeRoiLevelCommissions(
  earningUserId: string,
  roiAmountUsd: number
) {
  try {
    // 1. Fetch all level configs from DB
    const levelConfigs = await prisma.levelConfig.findMany()
    const pctMap = new Map<number, number>()
    
    levelConfigs.forEach(conf => {
      if (conf.isActive) pctMap.set(conf.level, Number(conf.commissionPct))
    })

    // 2. Start traversing upwards (up to 10 levels)
    let currentUserId: string | null = earningUserId
    let level = 1

    while (level <= 10 && currentUserId) {
      // Find current user's sponsor
      const currentUserNode = await prisma.user.findUnique({
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
        // Here we calculate based on the ROI Amount
        const commissionUsd = (roiAmountUsd * commissionPct) / 100

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
                type: 'ROI_LEVEL_COMMISSION',
                amountUsd: payout,
                sourceUserId: earningUserId,
                level: level,
                cycleNumber: sponsorCycle.cycleNumber,
                description: `Level ${level} ROI Commission from user ${earningUserId}`
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
    console.error('Error distributing ROI level commissions:', error)
    return false
  }
}
