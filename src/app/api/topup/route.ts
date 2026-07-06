import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { distributeLevelCommissions } from '@/lib/business/commission'
import { getUserBalance } from '@/lib/business/balance'

export async function POST(request: Request) {
  try {
    const { userId, planId, amountUsd } = await request.json()

    if (!userId || !planId || !amountUsd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = Number(amountUsd)

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount provided' }, { status: 400 })
    }

    // 1. Validate Plan
    const plan = await prisma.planConfig.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 })
    }

    const maxDeposit = Number(plan.maxDepositUsd || 0);
    const isUnlimited = maxDeposit === 0 || maxDeposit === 100000;

    if (amount < Number(plan.minDepositUsd) || (!isUnlimited && amount > maxDeposit)) {
      return NextResponse.json({ error: `Amount must be between $${plan.minDepositUsd} and ${isUnlimited ? 'Unlimited' : `$${maxDeposit}`}` }, { status: 400 })
    }

    // 2. Check Available Internal Balance
    const { availableBalanceUsd } = await getUserBalance(userId)

    if (amount > availableBalanceUsd) {
      return NextResponse.json({ error: 'Insufficient internal balance to make this investment.' }, { status: 400 })
    }

    // 3. Prevent top-up if cycle is active
    const activeCycle = await prisma.userCycle.findFirst({
      where: { userId, status: 'ACTIVE' },
    })

    if (activeCycle) {
      return NextResponse.json({ error: 'You already have an active plan. Please wait until your reach (cap) is complete to top-up again.' }, { status: 400 })
    }

    // 4. Fetch or Create User Cycle
    const capConfig = await prisma.systemConfig.findUnique({ where: { key: 'non_working_cap_multiplier' } })
    const capMultiplier = Number(capConfig?.value || 3)
    const maxEarning = amount * capMultiplier

    const currentCycle = await prisma.userCycle.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'CAPPED'] } },
      orderBy: { cycleNumber: 'desc' }
    })

    const newCycleNumber = currentCycle ? currentCycle.cycleNumber + 1 : 1



    const newCycle = await prisma.userCycle.create({
      data: {
        userId,
        planId,
        depositUsd: amount,
        maxEarning,
        cycleNumber: newCycleNumber,
        status: 'ACTIVE'
      }
    })

    // 5. Update User Status if INACTIVE
    await prisma.user.updateMany({
      where: { id: userId, status: 'INACTIVE' },
      data: { status: 'ACTIVE' }
    })

    // 6. Distribute 10-level commissions upwards
    await distributeLevelCommissions(userId, amount, newCycleNumber)

    return NextResponse.json({ success: true, cycle: newCycle })

  } catch (error) {
    console.error('Invest API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
