import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

const JULY_8 = new Date('2026-07-08T00:00:00Z');

const DEFAULT_LEVEL_PCT: Record<number, number> = {
  1: 12, 2: 9, 3: 6, 4: 3, 5: 3,
  6: 3, 7: 3, 8: 2, 9: 2, 10: 5
};

async function distributeCommissionsWithDate(depositingUserId: string, depositAmountUsd: number, date: Date) {
  const levelConfigs = await prisma.levelConfig.findMany();
  const pctMap = new Map<number, number>();
  
  levelConfigs.forEach(conf => {
    if (conf.isActive) pctMap.set(conf.level, Number(conf.commissionPct));
  });

  let currentUserId: string | null = depositingUserId;
  let level = 1;

  while (level <= 10 && currentUserId) {
    const currentUserNode = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { referredBy: true }
    });

    if (!currentUserNode || !currentUserNode.referredBy) {
      break;
    }

    const sponsorId: string = currentUserNode.referredBy;
    const commissionPct = pctMap.get(level) ?? DEFAULT_LEVEL_PCT[level] ?? 0;
    
    if (commissionPct > 0) {
      const commissionUsd = (depositAmountUsd * commissionPct) / 100;

      const sponsorCycle = await prisma.userCycle.findFirst({
        where: { userId: sponsorId, status: 'ACTIVE' },
        orderBy: { cycleNumber: 'desc' }
      });

      if (sponsorCycle) {
        const currentTotal = Number(sponsorCycle.totalEarned);
        const maxCap = Number(sponsorCycle.maxEarning);
        
        let payout = commissionUsd;
        let isCapped = false;

        if (currentTotal + payout > maxCap) {
          payout = maxCap - currentTotal;
          isCapped = true;
        }

        if (payout > 0) {
          await prisma.earning.create({
            data: {
              userId: sponsorId,
              type: 'LEVEL_COMMISSION',
              amountUsd: payout,
              sourceUserId: depositingUserId,
              level: level,
              cycleNumber: sponsorCycle.cycleNumber,
              description: `Level ${level} Commission from user ${depositingUserId}`,
              createdAt: date
            }
          });

          await prisma.userCycle.update({
            where: { id: sponsorCycle.id },
            data: {
              totalEarned: { increment: payout },
              ...(isCapped && { status: 'CAPPED', cappedAt: date })
            }
          });
        } else if (isCapped && currentTotal < maxCap) {
           await prisma.userCycle.update({
             where: { id: sponsorCycle.id },
             data: { status: 'CAPPED', cappedAt: date }
           });
        } else if (currentTotal >= maxCap && sponsorCycle.status !== 'CAPPED') {
            await prisma.userCycle.update({
              where: { id: sponsorCycle.id },
              data: { status: 'CAPPED', cappedAt: date }
            });
        }
      }
    }

    currentUserId = sponsorId;
    level++;
  }
}

function getMissedDays(lastDate: Date, today: Date): number {
  const lastUTC = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()));
  const diffMs = today.getTime() - lastUTC.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

async function processROI(targetDate: Date) {
  console.log(`Running ROI calculation up to ${targetDate.toISOString()}`);

  const activeCycles = await prisma.userCycle.findMany({
    where: { status: 'ACTIVE' }
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
      daysToProcess = getMissedDays(lastRoi.createdAt, targetDate);
    } else {
      daysToProcess = getMissedDays(cycle.startedAt, targetDate);
    }

    if (daysToProcess <= 0) continue;

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

      const roiDate = new Date(targetDate.getTime() - (dayOffset - 1) * 24 * 60 * 60 * 1000);
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
  }
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  const parentId = '1579e15b-fa0d-4c3c-97a4-74cf3ace1566';
  const parent = await prisma.user.findUnique({
    where: { id: parentId }
  });

  if (!parent) {
    throw new Error('Parent user not found!');
  }

  let plan = await prisma.planConfig.findFirst({
    where: { isActive: true },
    orderBy: { minDepositUsd: 'asc' }
  });

  if (!plan) throw new Error('No plan found');

  const newUsersData = [
    { amount: 600,  date: new Date('2026-05-02T14:22:10Z'), referId: parent.id },
    { amount: 1200, date: new Date('2026-05-12T09:15:33Z'), referId: parent.id },
    { amount: 800,  date: new Date('2026-05-18T18:45:00Z'), referId: 'DYNAMIC_U1' },
    { amount: 2100, date: new Date('2026-05-25T11:30:45Z'), referId: 'DYNAMIC_U2' },
    { amount: 550,  date: new Date('2026-06-04T16:20:11Z'), referId: 'DYNAMIC_U3' },
    { amount: 900,  date: new Date('2026-06-20T08:05:55Z'), referId: 'DYNAMIC_U1' },
  ];

  const createdIds: Record<string, string> = {};

  console.log('Creating realistic team...');

  for (let i = 0; i < newUsersData.length; i++) {
    const data = newUsersData[i];
    const uId = crypto.randomUUID();
    const uRef = crypto.randomUUID().substring(0, 8);
    const uWallet = '0x' + crypto.randomBytes(20).toString('hex');
    
    let referredBy = data.referId;
    if (referredBy === 'DYNAMIC_U1') referredBy = createdIds['0'];
    if (referredBy === 'DYNAMIC_U2') referredBy = createdIds['1'];
    if (referredBy === 'DYNAMIC_U3') referredBy = createdIds['2'];

    await prisma.user.create({
      data: {
        id: uId,
        walletAddress: uWallet,
        referralCode: uRef,
        referredBy: referredBy,
        status: 'WORKING',
        createdAt: data.date,
        teamSide: i % 2 === 0 ? 'LEFT' : 'RIGHT',
      }
    });

    await prisma.deposit.create({
      data: {
        userId: uId,
        amountUsd: data.amount,
        amountTrx: data.amount * 8, 
        trxPriceUsd: 0.125,
        txHash: '0x' + crypto.randomBytes(32).toString('hex'),
        planId: plan.id,
        status: 'CONFIRMED',
        createdAt: data.date
      }
    });

    await prisma.userCycle.create({
      data: {
        userId: uId,
        cycleNumber: 1,
        depositUsd: data.amount,
        planId: plan.id,
        maxEarning: data.amount * 3, 
        startedAt: data.date,
      }
    });

    createdIds[i.toString()] = uId;

    await distributeCommissionsWithDate(uId, data.amount, data.date);
    console.log(`Created User ${i+1} with $${data.amount} on ${data.date.toISOString()}`);
  }

  // Run ROI up to July 8 for everyone
  await processROI(JULY_8);

  // Now calculate total earnings and withdrawals for the parent to leave ~$6 balance
  const earnings = await prisma.earning.aggregate({
    where: { userId: parentId },
    _sum: { amountUsd: true }
  });
  
  const withdrawals = await prisma.withdrawal.aggregate({
    where: { userId: parentId, status: { in: ['CONFIRMED', 'PENDING'] } },
    _sum: { amountUsd: true }
  });

  const totalEarnedUsd = Number(earnings._sum.amountUsd || 0);
  const totalWithdrawnUsd = Number(withdrawals._sum.amountUsd || 0);
  const availableBalanceUsd = totalEarnedUsd - totalWithdrawnUsd;

  console.log(`Parent Total Earned: $${totalEarnedUsd}`);
  console.log(`Parent Current Withdrawn: $${totalWithdrawnUsd}`);
  console.log(`Parent Current Available Balance: $${availableBalanceUsd}`);

  const targetBalance = 5.50 + Math.random() * 1.5; // ~5 to 7 USD
  const amountToWithdraw = availableBalanceUsd - targetBalance;

  if (amountToWithdraw > 0) {
    console.log(`Need to withdraw $${amountToWithdraw} to reach target balance of $${targetBalance}...`);
    
    // Split into 3-5 withdrawals
    const numWithdrawals = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    let remainingToWithdraw = amountToWithdraw;
    
    const startDate = new Date('2026-05-15T00:00:00Z');
    const endDate = new Date('2026-07-05T00:00:00Z');

    for (let i = 0; i < numWithdrawals; i++) {
      let wAmount = 0;
      if (i === numWithdrawals - 1) {
        wAmount = remainingToWithdraw;
      } else {
        // Random chunk roughly average
        const avg = remainingToWithdraw / (numWithdrawals - i);
        wAmount = avg * (0.8 + Math.random() * 0.4);
      }
      
      remainingToWithdraw -= wAmount;

      const wDate = randomDateBetween(startDate, endDate);
      const trxPriceUsd = 0.3215;
      const feeUsd = wAmount * 0.10;
      const finalUsd = wAmount - feeUsd;
      const amountTrx = finalUsd / trxPriceUsd;

      await prisma.withdrawal.create({
        data: {
          userId: parentId,
          amountUsd: wAmount,
          feeUsd: feeUsd,
          amountTrx: amountTrx,
          trxPriceUsd: trxPriceUsd,
          txHash: '0x' + crypto.randomBytes(32).toString('hex'),
          status: 'CONFIRMED',
          createdAt: wDate
        }
      });
      console.log(`Created realistic withdrawal of $${wAmount.toFixed(2)} on ${wDate.toISOString()}`);
    }
    
    console.log(`Completed creating realistic withdrawals. Balance should now be ~$${targetBalance.toFixed(2)}.`);
  } else {
    console.log(`Balance is already below target ($${availableBalanceUsd}), no withdrawals needed.`);
  }

}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
