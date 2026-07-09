import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

const MAY_17 = new Date('2026-05-17T00:00:00Z');

// Default percentages if not set in DB
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

async function main() {
  // 1. Check parent user
  const parentId = 'be2d2108-17f7-42a5-bce7-f87908d8dd15';
  const parent = await prisma.user.findUnique({
    where: { id: parentId },
    include: { cycles: true, deposits: true }
  });

  if (!parent) {
    throw new Error('Parent user not found!');
  }

  console.log('Found Parent User:', parent.walletAddress);

  // 2. Set parent user's dates to May 17, 2026
  await prisma.user.update({
    where: { id: parentId },
    data: { createdAt: MAY_17, status: 'WORKING' } 
  });

  // Update parent's cycle to May 17
  for (const cycle of parent.cycles) {
    await prisma.userCycle.update({
      where: { id: cycle.id },
      data: { startedAt: MAY_17 }
    });
  }
  for (const deposit of parent.deposits) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { createdAt: MAY_17, status: 'CONFIRMED' }
    });
  }

  // Find a plan config to use for deposits
  let plan = await prisma.planConfig.findFirst({
    where: { isActive: true },
    orderBy: { minDepositUsd: 'asc' }
  });

  if (!plan) {
    // Creating dummy plan if not exists
    plan = await prisma.planConfig.create({
      data: {
        name: 'Basic Plan',
        minDepositUsd: 10,
        monthlyRoiPct: 10,
        sortOrder: 1
      }
    });
  }

  // 3. Create User 1 (200 USD)
  const u1Id = crypto.randomUUID();
  const u1Ref = crypto.randomUUID().substring(0, 8);
  const u1Wallet = '0x' + crypto.randomBytes(20).toString('hex');
  
  await prisma.user.create({
    data: {
      id: u1Id,
      walletAddress: u1Wallet,
      referralCode: u1Ref,
      referredBy: parent.id,
      status: 'WORKING',
      createdAt: MAY_17,
      teamSide: 'LEFT',
    }
  });

  await prisma.deposit.create({
    data: {
      userId: u1Id,
      amountUsd: 200,
      amountTrx: 1600, 
      trxPriceUsd: 0.125,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      planId: plan.id,
      status: 'CONFIRMED',
      createdAt: MAY_17
    }
  });

  await prisma.userCycle.create({
    data: {
      userId: u1Id,
      cycleNumber: 1,
      depositUsd: 200,
      planId: plan.id,
      maxEarning: 200 * 3, 
      startedAt: MAY_17,
    }
  });

  // 4. Create User 2 (500 USD) under User 1
  const u2Id = crypto.randomUUID();
  const u2Ref = crypto.randomUUID().substring(0, 8);
  const u2Wallet = '0x' + crypto.randomBytes(20).toString('hex');

  await prisma.user.create({
    data: {
      id: u2Id,
      walletAddress: u2Wallet,
      referralCode: u2Ref,
      referredBy: u1Id, // Under User 1
      status: 'WORKING',
      createdAt: MAY_17,
      teamSide: 'LEFT',
    }
  });

  await prisma.deposit.create({
    data: {
      userId: u2Id,
      amountUsd: 500,
      amountTrx: 4000, 
      trxPriceUsd: 0.125,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      planId: plan.id,
      status: 'CONFIRMED',
      createdAt: MAY_17
    }
  });

  await prisma.userCycle.create({
    data: {
      userId: u2Id,
      cycleNumber: 1,
      depositUsd: 500,
      planId: plan.id,
      maxEarning: 500 * 3,
      startedAt: MAY_17,
    }
  });

  // 5. Run Commissions for User 1's deposit on May 17
  console.log('Distributing commissions for User 1...');
  await distributeCommissionsWithDate(u1Id, 200, MAY_17);

  // 6. Run Commissions for User 2's deposit on May 17
  console.log('Distributing commissions for User 2...');
  await distributeCommissionsWithDate(u2Id, 500, MAY_17);

  console.log('Users and commissions created successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
