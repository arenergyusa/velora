import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';

async function main() {
  const userId = '1579e15b-fa0d-4c3c-97a4-74cf3ace1566';
  
  const cycles = await prisma.userCycle.findMany({
    where: { userId: userId },
    orderBy: { cycleNumber: 'desc' }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  console.log(`User: ${user?.walletAddress} | Status: ${user?.status}`);
  console.log('Cycles:', JSON.stringify(cycles, null, 2));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
