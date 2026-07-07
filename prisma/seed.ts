import "dotenv/config";
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Seeding database with default configurations...')

  // 1. Seed Plan Configurations
  const plans = [
    { name: 'Start', minDepositUsd: 50, maxDepositUsd: 499, monthlyRoiPct: 8, sortOrder: 1 },
    { name: 'Elite', minDepositUsd: 500, maxDepositUsd: 4999, monthlyRoiPct: 10, sortOrder: 2 },
    { name: 'Prime', minDepositUsd: 5000, maxDepositUsd: null, monthlyRoiPct: 12, sortOrder: 3 },
  ]

  for (const plan of plans) {
    await prisma.planConfig.create({
      data: plan
    })
  }

  // 2. Seed Level Commission Configurations
  const levelPcts = [12, 9, 6, 3, 3, 3, 3, 2, 2, 5]

  for (let i = 0; i < levelPcts.length; i++) {
    await prisma.levelConfig.upsert({
      where: { level: i + 1 },
      update: { commissionPct: levelPcts[i] },
      create: {
        level: i + 1,
        commissionPct: levelPcts[i],
      }
    })
  }

  // 3. Seed System Configurations
  const systemConfigs = [
    { key: 'non_working_cap_multiplier', value: '2', description: 'Max earning cap (multiplier) for non-working IDs' },
    { key: 'working_cap_multiplier', value: '3', description: 'Max earning cap (multiplier) for working IDs' },
    { key: 'salary_amount_usd', value: '100', description: 'Monthly salary amount in USD' },
    { key: 'salary_min_business_usd', value: '5000', description: 'Minimum downline business for salary' },
    { key: 'salary_team_ratio_min', value: '40', description: 'Minimum percentage for weaker team' },
    { key: 'salary_team_ratio_max', value: '60', description: 'Maximum percentage for stronger team' },
    { key: 'salary_monthly_increment_pct', value: '25', description: 'Monthly business growth needed for salary continuation' },
    { key: 'platform_wallet_address', value: '0x1F0f0980feE31EC75F188f16F1d5C7001395D3C1', description: 'Platform Master BSC receiving address' },
    { key: 'min_withdrawal_usd', value: '10', description: 'Minimum withdrawal amount in USD' },
    { key: 'withdrawal_fee_pct', value: '10', description: 'Withdrawal fee percentage' },
  ]

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    })
  }

  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
