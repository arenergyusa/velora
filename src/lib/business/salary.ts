import { prisma } from '@/lib/prisma'

/**
 * Get current month key (YYYY-MM) for duplicate salary prevention
 */
function getCurrentMonthKey(): { year: number; month: number; key: string } {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  return { year, month, key: `${year}-${String(month).padStart(2, '0')}` }
}

/**
 * Calculates total business (top-up/investments) for a user and their entire downline recursively.
 * Using a PostgreSQL Recursive CTE to prevent N+1 query performance bottlenecks.
 */
export async function calculateDownlineBusiness(userId: string): Promise<number> {
  try {
    const result: { total: unknown }[] = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        SELECT id FROM "User" WHERE id = ${userId}
        UNION
        SELECT u.id FROM "User" u
        INNER JOIN downline d ON u."referredBy" = d.id
      )
      SELECT COALESCE(SUM(c."depositUsd"), 0) as total
      FROM downline d
      INNER JOIN "UserCycle" c ON d.id = c."userId"
    `;
    
    return Number(result[0]?.total || 0);
  } catch (error) {
    console.error('CTE Downline Query Error:', error);
    return 0;
  }
}

export async function processMonthlySalary(userId: string) {
  try {
    const { year, month, key: monthKey } = getCurrentMonthKey()

    // DUPLICATE CHECK: Has this user already been processed for this month?
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    const existingSalary = await prisma.salaryTracking.findFirst({
      where: {
        userId,
        month: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    if (existingSalary) {
      console.log(`Salary already processed for user ${userId} for ${monthKey} — skipping duplicate`)
      return false // Already processed this month
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        salaries: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) return false

    // Fetch config values
    const configRecords = await prisma.systemConfig.findMany()
    const config = configRecords.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    const requiredMinBusiness = Number(config['salary_min_business_usd'] || 5000)
    const salaryAmount = Number(config['salary_amount_usd'] || 100)
    const incrementPct = Number(config['salary_monthly_increment_pct'] || 25)

    // Calculate left and right team business
    // We only look at direct children, and calculate their total downline business
    const leftDirects = await prisma.user.findMany({
      where: { referredBy: userId, teamSide: 'LEFT' },
      select: { id: true }
    })
    
    const rightDirects = await prisma.user.findMany({
      where: { referredBy: userId, teamSide: 'RIGHT' },
      select: { id: true }
    })

    let leftTeamBiz = 0
    let rightTeamBiz = 0

    for (const child of leftDirects) {
      leftTeamBiz += await calculateDownlineBusiness(child.id)
    }
    for (const child of rightDirects) {
      rightTeamBiz += await calculateDownlineBusiness(child.id)
    }

    const totalBiz = leftTeamBiz + rightTeamBiz

    // Check if total biz meets current requirement
    let currentRequired = requiredMinBusiness
    const lastSalary = user.salaries[0]

    if (lastSalary && lastSalary.status === 'PAID') {
      currentRequired = Number(lastSalary.requiredBiz) * (1 + (incrementPct / 100))
    }

    let isEligible = false

    if (totalBiz >= currentRequired) {
      // Check 40:60 ratio
      const leftPct = (leftTeamBiz / totalBiz) * 100
      const rightPct = (rightTeamBiz / totalBiz) * 100

      // Weaker team must be at least 40%, stronger max 60%
      // This is basically saying both left and right must be between 40% and 60%
      if (leftPct >= 40 && leftPct <= 60 && rightPct >= 40 && rightPct <= 60) {
        isEligible = true
      }
    }

    // Record the salary tracking for the month
    await prisma.salaryTracking.create({
      data: {
        userId: userId,
        month: new Date(),
        leftTeamBiz,
        rightTeamBiz,
        requiredBiz: currentRequired,
        isEligible,
        amountUsd: salaryAmount,
        status: isEligible ? 'PAID' : 'SKIPPED'
      }
    })

    // If eligible, insert into earnings table
    if (isEligible) {
      // Find active cycle just to log cycleNumber, though salary doesn't count towards cap
      const activeCycle = await prisma.userCycle.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { cycleNumber: 'desc' }
      })

      await prisma.earning.create({
        data: {
          userId,
          type: 'SALARY',
          amountUsd: salaryAmount,
          cycleNumber: activeCycle?.cycleNumber || 1,
          description: `Monthly Salary (${monthKey}) - Met ${currentRequired} requirement`
        }
      })
    }

    return isEligible

  } catch (error) {
    console.error('Error processing salary:', error)
    return false
  }
}
