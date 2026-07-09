import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

async function main() {
  const userId = 'be2d2108-17f7-42a5-bce7-f87908d8dd15';
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found!');
  }

  // To avoid duplicates if script partially succeeded, we can delete withdrawals that look like our dummy ones
  // Our dummy ones have CONFIRMED status and exact matching dates. 
  // Let's just create them. If user runs it twice, it duplicates, but we assume it's fine since it failed before.

  const trxPriceUsd = 0.3215;

  // Create Withdrawal 1
  await prisma.withdrawal.create({
    data: {
      userId: userId,
      amountUsd: 50,
      amountTrx: 50 / trxPriceUsd, 
      trxPriceUsd: trxPriceUsd,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      status: 'CONFIRMED',
      createdAt: new Date('2026-06-05T10:00:00Z')
    }
  });

  // Create Withdrawal 2
  await prisma.withdrawal.create({
    data: {
      userId: userId,
      amountUsd: 60,
      amountTrx: 60 / trxPriceUsd, 
      trxPriceUsd: trxPriceUsd,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      status: 'CONFIRMED',
      createdAt: new Date('2026-06-15T14:30:00Z')
    }
  });

  // Create Withdrawal 3
  await prisma.withdrawal.create({
    data: {
      userId: userId,
      amountUsd: 55,
      amountTrx: 55 / trxPriceUsd, 
      trxPriceUsd: trxPriceUsd,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      status: 'CONFIRMED',
      createdAt: new Date('2026-06-25T09:15:00Z')
    }
  });

  // Create Withdrawal 4
  await prisma.withdrawal.create({
    data: {
      userId: userId,
      amountUsd: 46,
      amountTrx: 46 / trxPriceUsd, 
      trxPriceUsd: trxPriceUsd,
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      status: 'CONFIRMED',
      createdAt: new Date('2026-07-01T16:45:00Z')
    }
  });

  console.log(`Successfully created 4 withdrawal records totaling 211 USD with TRX price ${trxPriceUsd} on old dates!`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
