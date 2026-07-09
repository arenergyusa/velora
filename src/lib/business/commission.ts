import { prisma } from '@/lib/prisma'



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

        await prisma.$transaction(async (tx) => {
          // Check if sponsor's ID is active/working and hasn't hit cap (inside transaction to prevent stale read)
          const sponsorCycle = await tx.userCycle.findFirst({
            where: { userId: sponsorId, status: 'ACTIVE' },
            orderBy: { cycleNumber: 'desc' }
          })

          if (!sponsorCycle) return

          // Check if this new commission will exceed their cap
          const currentTotal = Number(sponsorCycle.totalEarned)
          const maxCap = Number(sponsorCycle.maxEarning)

          let payout = commissionUsd
          let cappedStatus = false

          if (currentTotal + payout >= maxCap) {
            payout = Math.max(0, maxCap - currentTotal)
            cappedStatus = true
          }

          if (payout > 0) {
            if (cappedStatus) {
              await tx.userCycle.update({
                where: { id: sponsorCycle.id },
                data: { status: 'CAPPED', cappedAt: new Date(), totalEarned: { increment: payout } }
              })
            } else {
              await tx.userCycle.update({
                where: { id: sponsorCycle.id },
                data: { totalEarned: { increment: payout } }
              })
            }

            // Record the earning
            await tx.earning.create({
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
          } else if (cappedStatus) {
            // Mark cycle as capped if no new payout can be given
            await tx.userCycle.update({
              where: { id: sponsorCycle.id },
              data: { status: 'CAPPED', cappedAt: new Date() }
            })
          }
        })
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
 * Calculate 10-level commission upwards based on ROI earned by a user
 * Returns an array of payouts to be aggregated by the caller.
 */
export async function calculateRoiLevelCommissions(
  earningUserId: string,
  roiAmountUsd: number,
  pctMap: Map<number, number>
): Promise<{ uplineId: string; amountUsd: number }[]> {
  try {
    const payouts: { uplineId: string; amountUsd: number }[] = []
    
    // Start traversing upwards (up to 10 levels)
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

      // FIX: referredBy holds the UUID of the sponsor
      const sponsorId: string = currentUserNode.referredBy

      // Get the commission % for this level from DB only
      const commissionPct = pctMap.get(level) ?? 0
      
      if (commissionPct > 0) {
        const commissionUsd = (roiAmountUsd * commissionPct) / 100
        payouts.push({ uplineId: sponsorId, amountUsd: commissionUsd })
      }

      // Move up to the next level
      currentUserId = sponsorId
      level++
    }

    return payouts
  } catch (error) {
    console.error('Error calculating ROI level commissions:', error)
    throw error // Propagate exception instead of swallowing
  }
}
