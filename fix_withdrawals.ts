import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';

async function main() {
  const userId = 'be2d2108-17f7-42a5-bce7-f87908d8dd15';
  
  // Find all withdrawals for this user with TRX price 0.3215
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      userId: userId,
      trxPriceUsd: 0.3215
    }
  });

  console.log(`Found ${withdrawals.length} withdrawals to update...`);

  const trxPriceUsd = 0.3215;
  const feePct = 0.10; // 10% fee

  for (const w of withdrawals) {
    const amountUsd = Number(w.amountUsd);
    const feeUsd = amountUsd * feePct;
    const finalAmountUsd = amountUsd - feeUsd;
    const amountTrx = finalAmountUsd / trxPriceUsd;

    await prisma.withdrawal.update({
      where: { id: w.id },
      data: {
        feeUsd: feeUsd,
        amountTrx: amountTrx
      }
    });
    
    console.log(`Updated withdrawal ${w.id}: Amount=${amountUsd}, Fee=${feeUsd}, FinalUsd=${finalAmountUsd}, TRX=${amountTrx}`);
  }

  console.log('All withdrawals fixed with 10% fee and amountTrx updated!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
