import { prisma } from '@/lib/prisma'
import { calculateRoiLevelCommissions } from '@/lib/business/commission'

/**
 * Get today's date at UTC midnight
 */
function getUTCToday(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * Get the number of missed days between lastDate and today (inclusive of today, exclusive of lastDate)
 * Returns 0 if lastDate is today, 1 if lastDate was yesterday, etc.
 */
function getMissedDays(lastDate: Date, today: Date): number {
  const lastUTC = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()))
  const diffMs = today.getTime() - lastUTC.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export async function processDailyROI() {
  const today = getUTCToday()
  const todayKey = today.toISOString().slice(0, 10) // YYYY-MM-DD

  try {
    // 1. Get all active cycles with their associated plans
    const activeCycles = await prisma.userCycle.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true }
    })

    const plans = await prisma.planConfig.findMany()
    const planMap = new Map(plans.map(p => [p.id, p]))

    const levelConfigs = await prisma.levelConfig.findMany()
    const pctMap = new Map<number, number>()
    levelConfigs.forEach(conf => {
      if (conf.isActive) pctMap.set(conf.level, Number(conf.commissionPct))
    })

    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0
    let catchUpDays = 0

    // aggregatedCommissions map: uplineId -> total combined USD to pay out
    const aggregatedCommissions = new Map<string, number>()

    for (const cycle of activeCycles) {
      try {
        const plan = planMap.get(cycle.planId)
        if (!plan) continue

        // Find the LAST ROI earning for this specific cycle
        const lastRoi = await prisma.earning.findFirst({
          where: {
            userId: cycle.userId,
            type: 'ROI',
            cycleNumber: cycle.cycleNumber
          },
          orderBy: { createdAt: 'desc' }
        })

        let daysToProcess: number

        if (lastRoi) {
          daysToProcess = getMissedDays(lastRoi.createdAt, today)
        } else {
          // ROI is calculated starting from the day AFTER the cycle starts
          daysToProcess = getMissedDays(cycle.startedAt, today)
          if (daysToProcess === 0) {
            skippedCount++
            continue
          }
        }

        if (daysToProcess <= 0) {
          skippedCount++
          continue
        }

        // Cap at reasonable max to prevent abuse
        const maxCatchUpDays = 30
        daysToProcess = Math.min(daysToProcess, maxCatchUpDays)

        const depositAmount = Number(cycle.depositUsd)
        const monthlyPct = Number(plan.monthlyRoiPct)
        const dailyRoiAmount = (depositAmount * (monthlyPct / 100)) / 30

        if (dailyRoiAmount <= 0) continue

        let currentTotal = Number(cycle.totalEarned)
        const maxCap = Number(cycle.maxEarning)
        let isCapped = false
        
        let totalDailyRoiPaid = 0

        for (let dayOffset = daysToProcess; dayOffset >= 1; dayOffset--) {
          if (isCapped) break

          let payout = dailyRoiAmount

          if (currentTotal + payout >= maxCap) {
            payout = maxCap - currentTotal
            isCapped = true
          }

          if (payout <= 0) {
            isCapped = true
            break
          }

          const roiDate = new Date(today.getTime() - (dayOffset - 1) * 24 * 60 * 60 * 1000)
          const roiDateKey = roiDate.toISOString().slice(0, 10)

          await prisma.earning.create({
            data: {
              userId: cycle.userId,
              type: 'ROI',
              amountUsd: payout,
              cycleNumber: cycle.cycleNumber,
              description: `Daily ROI (${monthlyPct}% monthly plan) - ${roiDateKey}`,
              createdAt: roiDate 
            }
          })
          
          totalDailyRoiPaid += payout
          currentTotal += payout

          if (dayOffset > 1) catchUpDays++
        }

        // Calculate and aggregate ROI level commissions for whatever ROI they got today
        if (totalDailyRoiPaid > 0) {
          try {
            const payouts = await calculateRoiLevelCommissions(cycle.userId, totalDailyRoiPaid, pctMap)
            for (const p of payouts) {
              const currentAgg = aggregatedCommissions.get(p.uplineId) || 0
              aggregatedCommissions.set(p.uplineId, currentAgg + p.amountUsd)
            }
          } catch (e) {
            console.error('Failed to calculate ROI level commissions', e)
            errorCount++
            continue // Skip updating the cycle so it can be retried later
          }
        }

        // Update cycle total in one shot
        await prisma.userCycle.update({
          where: { id: cycle.id },
          data: {
            totalEarned: currentTotal,
            status: isCapped ? 'CAPPED' : 'ACTIVE',
            ...(isCapped && { cappedAt: new Date() })
          }
        })

        processedCount++

      } catch (userError) {
        console.error(`Error processing ROI for user ${cycle.userId}, cycle ${cycle.id}:`, userError)
        errorCount++
      }
    }

    // Process aggregated ROI_LEVEL_COMMISSIONS
    for (const [uplineId, totalCommission] of Array.from(aggregatedCommissions.entries())) {
      try {
        const uplineCycle = await prisma.userCycle.findFirst({
          where: { userId: uplineId, status: 'ACTIVE' },
          orderBy: { cycleNumber: 'desc' }
        })

        if (uplineCycle) {
          const currentTotal = Number(uplineCycle.totalEarned)
          const maxCap = Number(uplineCycle.maxEarning)

          let payout = totalCommission
          let cappedStatus = false

          if (currentTotal + payout >= maxCap) {
            payout = Math.max(0, maxCap - currentTotal)
            cappedStatus = true
          }

          if (payout > 0) {
            await prisma.$transaction([
              ...(cappedStatus ? [
                prisma.userCycle.update({
                  where: { id: uplineCycle.id },
                  data: { status: 'CAPPED', cappedAt: new Date() }
                })
              ] : []),
              prisma.earning.create({
                data: {
                  userId: uplineId,
                  type: 'ROI_LEVEL_COMMISSION',
                  amountUsd: payout,
                  cycleNumber: uplineCycle.cycleNumber,
                  description: `Daily Team ROI Commission - ${todayKey}`,
                  createdAt: today
                }
              }),
              prisma.userCycle.update({
                where: { id: uplineCycle.id },
                data: {
                  totalEarned: { increment: payout }
                }
              })
            ])
          } else if (cappedStatus) {
            // Already capped or just hit cap without any new payout
            await prisma.userCycle.update({
              where: { id: uplineCycle.id },
              data: { status: 'CAPPED', cappedAt: new Date() }
            })
          }
        }
      } catch (e) {
        console.error(`Error processing aggregated commission for upline ${uplineId}:`, e)
        errorCount++
      }
    }

    return { 
      success: true, 
      processedCount, 
      skippedCount,
      errorCount,
      catchUpDays,
      date: todayKey 
    }
  } catch (error) {
    console.error('Error processing Daily ROI:', error)
    return { success: false, error: 'Internal Error' }
  }
}
