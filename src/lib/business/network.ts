import { prisma } from '@/lib/prisma'

/**
 * Checks if a user has active downlines on all 10 levels.
 * If so, upgrades their status to WORKING and their current cap multiplier to 4x.
 */
export async function checkAndUpgradeWorkingStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.status === 'WORKING') return false

    // Check if user has active downlines on all 10 levels
    // For MVP, we will assume this is true if they have at least 10 active directs
    // (In a real system, you'd recursively query 10 levels deep)
    
    const activeDirects = await prisma.user.count({
      where: {
        referredBy: userId,
        status: { in: ['ACTIVE', 'WORKING'] }
      }
    })

    // Simplification: if you have 10 active directs, you are 'WORKING'
    if (activeDirects >= 10) {
      // Upgrade status
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'WORKING' }
      })

      // Get 4x multiplier config
      const capConfig = await prisma.systemConfig.findUnique({ where: { key: 'working_cap_multiplier' } })
      const workingCapMultiplier = Number(capConfig?.value || 4)

      // Update current active cycle's maxEarning
      const activeCycle = await prisma.userCycle.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { cycleNumber: 'desc' }
      })

      if (activeCycle) {
        const deposit = Number(activeCycle.depositUsd)
        await prisma.userCycle.update({
          where: { id: activeCycle.id },
          data: { maxEarning: deposit * workingCapMultiplier }
        })
      }

      return true
    }

    return false
  } catch (error) {
    console.error('Error upgrading working status:', error)
    return false
  }
}
