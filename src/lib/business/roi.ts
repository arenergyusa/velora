import { prisma } from '@/lib/prisma'

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

    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0
    let catchUpDays = 0

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

        // Determine how many days of ROI we need to process
        let daysToProcess: number

        if (lastRoi) {
          daysToProcess = getMissedDays(lastRoi.createdAt, today)
        } else {
          // First ROI ever for this cycle — start from cycle start date
          daysToProcess = getMissedDays(cycle.startedAt, today)
          // At minimum 1 day (today), but not the creation day itself since 
          // cycle was just created — ROI starts from the next day
          if (daysToProcess === 0) {
            // Cycle was created today — no ROI yet (ROI starts from next day)
            skippedCount++
            continue
          }
        }

        if (daysToProcess <= 0) {
          // Already processed today
          skippedCount++
          continue
        }

        // Cap at reasonable max to prevent abuse (e.g., max 30 days catch-up)
        const maxCatchUpDays = 30
        daysToProcess = Math.min(daysToProcess, maxCatchUpDays)

        // Monthly ROI is given in percentage (e.g., 8, 10, 12)
        // Daily ROI = (Deposit * Monthly_PCT / 100) / 30
        const depositAmount = Number(cycle.depositUsd)
        const monthlyPct = Number(plan.monthlyRoiPct)
        const dailyRoiAmount = (depositAmount * (monthlyPct / 100)) / 30

        if (dailyRoiAmount <= 0) continue

        // Process ROI for each missed day
        let currentTotal = Number(cycle.totalEarned)
        const maxCap = Number(cycle.maxEarning)
        let isCapped = false

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

          // Calculate the date this ROI belongs to
          const roiDate = new Date(today.getTime() - (dayOffset - 1) * 24 * 60 * 60 * 1000)
          const roiDateKey = roiDate.toISOString().slice(0, 10)

          await prisma.earning.create({
            data: {
              userId: cycle.userId,
              type: 'ROI',
              amountUsd: payout,
              cycleNumber: cycle.cycleNumber,
              description: `Daily ROI (${monthlyPct}% monthly plan) - ${roiDateKey}`,
              createdAt: roiDate // Set the correct date for each day's ROI
            }
          })

          currentTotal += payout

          if (dayOffset > 1) catchUpDays++
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
        // Individual user error — log and continue with next user
        console.error(`Error processing ROI for user ${cycle.userId}, cycle ${cycle.id}:`, userError)
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
