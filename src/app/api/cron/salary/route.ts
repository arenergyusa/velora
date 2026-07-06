import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processMonthlySalary } from '@/lib/business/salary'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Process salary for all active/working users
    const users = await prisma.user.findMany({
      where: {
        status: { in: ['ACTIVE', 'WORKING'] }
      },
      select: { id: true }
    })

    let eligibleCount = 0
    let processedCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        const isEligible = await processMonthlySalary(user.id)
        if (isEligible) {
          eligibleCount++
        }
        processedCount++
      } catch (userError) {
        console.error(`Salary error for user ${user.id}:`, userError)
        errorCount++
      }
    }

    const month = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`

    return NextResponse.json({ 
      message: `Salary processing complete`,
      month,
      totalUsers: users.length,
      processed: processedCount,
      eligible: eligibleCount,
      errors: errorCount
    })
  } catch (error) {
    console.error('Cron salary critical error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
