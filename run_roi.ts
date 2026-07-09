import { prisma } from './src/lib/prisma';

// Helper to get number of missed days between lastDate and today
function getMissedDays(lastDate: Date, today: Date): number {
  const lastUTC = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()));
  const diffMs = today.getTime() - lastUTC.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Get today's date at UTC midnight
function getUTCToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function main() {
  const today = getUTCToday();
  console.log(`Running ROI calculation up to ${today.toISOString()}`);

  const activeCycles = await prisma.userCycle.findMany({
    where: { status: 'ACTIVE' },
    include: { user: true }
  });

  const plans = await prisma.planConfig.findMany();
  const planMap = new Map(plans.map(p => [p.id, p]));

  for (const cycle of activeCycles) {
    const plan = planMap.get(cycle.planId);
    if (!plan) continue;

    const lastRoi = await prisma.earning.findFirst({
      where: {
        userId: cycle.userId,
        type: 'ROI',
        cycleNumber: cycle.cycleNumber
      },
      orderBy: { createdAt: 'desc' }
    });

    let daysToProcess: number;
    if (lastRoi) {
      daysToProcess = getMissedDays(lastRoi.createdAt, today);
    } else {
      daysToProcess = getMissedDays(cycle.startedAt, today);
      if (daysToProcess === 0) continue; 
    }

    if (daysToProcess <= 0) continue;

    // Use unlimited days instead of cap
    console.log(`User ${cycle.userId} has ${daysToProcess} missed ROI days.`);

    const depositAmount = Number(cycle.depositUsd);
    const monthlyPct = Number(plan.monthlyRoiPct);
    const dailyRoiAmount = (depositAmount * (monthlyPct / 100)) / 30;

    if (dailyRoiAmount <= 0) continue;

    let currentTotal = Number(cycle.totalEarned);
    const maxCap = Number(cycle.maxEarning);
    let isCapped = false;

    for (let dayOffset = daysToProcess; dayOffset >= 1; dayOffset--) {
      if (isCapped) break;

      let payout = dailyRoiAmount;

      if (currentTotal + payout >= maxCap) {
        payout = maxCap - currentTotal;
        isCapped = true;
      }

      if (payout <= 0) {
        isCapped = true;
        break;
      }

      const roiDate = new Date(today.getTime() - (dayOffset - 1) * 24 * 60 * 60 * 1000);
      const roiDateKey = roiDate.toISOString().slice(0, 10);

      await prisma.earning.create({
        data: {
          userId: cycle.userId,
          type: 'ROI',
          amountUsd: payout,
          cycleNumber: cycle.cycleNumber,
          description: `Daily ROI (${monthlyPct}% monthly plan) - ${roiDateKey}`,
          createdAt: roiDate
        }
      });

      currentTotal += payout;
    }

    await prisma.userCycle.update({
      where: { id: cycle.id },
      data: {
        totalEarned: currentTotal,
        status: isCapped ? 'CAPPED' : 'ACTIVE',
        ...(isCapped && { cappedAt: new Date() })
      }
    });

    console.log(`Processed ROI for user ${cycle.userId}. Capped: ${isCapped}`);
  }

  console.log('ROI calculations completed!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
