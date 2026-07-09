import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

const MAY_27 = new Date('2026-05-27T00:00:00Z');
const MAY_04 = new Date('2026-05-04T00:00:00Z');

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
        // If sponsor joined AFTER this commission date, it might be weird chronologically, 
        // but we'll record it on the requested date anyway.
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
  const parentId = 'be2d2108-17f7-42a5-bce7-f87908d8dd15';
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

  // 1. Create User 3 (500 USD) on 27-05-2026
  const u3Id = crypto.randomUUID();
  const u3Ref = crypto.randomUUID().substring(0, 8);
  const u3Wallet = '0x' + crypto.randomBytes(20).toString('hex');
  
  await prisma.user.create({
    data: {
      id: u3Id,
      walletAddress: u3Wallet,
      referralCode: u3Ref,
      referredBy: parent.id, // Direct referral
      status: 'WORKING',
      createdAt: MAY_27,
      teamSide: 'RIGHT',
    }
  });

  await prisma.deposit.create({
    data: {
      userId: u3Id,
      amountUsd: 500,
      amountTrx: 4000, 
      trxPriceUsd: 0.125,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      planId: plan.id,
      status: 'CONFIRMED',
      createdAt: MAY_27
    }
  });

  await prisma.userCycle.create({
    data: {
      userId: u3Id,
      cycleNumber: 1,
      depositUsd: 500,
      planId: plan.id,
      maxEarning: 500 * 3, 
      startedAt: MAY_27,
    }
  });

  // 2. Create User 4 (450 USD) on 04-05-2026
  const u4Id = crypto.randomUUID();
  const u4Ref = crypto.randomUUID().substring(0, 8);
  const u4Wallet = '0x' + crypto.randomBytes(20).toString('hex');

  await prisma.user.create({
    data: {
      id: u4Id,
      walletAddress: u4Wallet,
      referralCode: u4Ref,
      referredBy: parent.id, // Direct referral to avoid chronology issues between U3 and U4
      status: 'WORKING',
      createdAt: MAY_04,
      teamSide: 'LEFT',
    }
  });

  await prisma.deposit.create({
    data: {
      userId: u4Id,
      amountUsd: 450,
      amountTrx: 3600, 
      trxPriceUsd: 0.125,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      planId: plan.id,
      status: 'CONFIRMED',
      createdAt: MAY_04
    }
  });

  await prisma.userCycle.create({
    data: {
      userId: u4Id,
      cycleNumber: 1,
      depositUsd: 450,
      planId: plan.id,
      maxEarning: 450 * 3,
      startedAt: MAY_04,
    }
  });

  console.log('Distributing commissions for User 3 (500 USD) on May 27...');
  await distributeCommissionsWithDate(u3Id, 500, MAY_27);

  console.log('Distributing commissions for User 4 (450 USD) on May 04...');
  await distributeCommissionsWithDate(u4Id, 450, MAY_04);

  console.log('2 new users added and commissions distributed successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
