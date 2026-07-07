import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'

export async function GET() {
  try {
    const adminCheck = await verifyAdminSession()
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const configs = await prisma.systemConfig.findMany()
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({ success: true, data: configMap })
  } catch (error) {
    console.error('Admin Config GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminCheck = await verifyAdminSession()
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { 
      min_withdrawal_usd, 
      withdrawal_fee_percent, 
      platform_wallet_address,
      salary_amount_usd,
      salary_min_downline_business,
      salary_monthly_increment_percent
    } = body

    if (min_withdrawal_usd !== undefined) {
      const val = Number(min_withdrawal_usd)
      if (!Number.isFinite(val) || val < 0) return NextResponse.json({ error: 'Invalid minimum withdrawal' }, { status: 400 })
    }

    if (salary_amount_usd !== undefined) {
      const val = Number(salary_amount_usd)
      if (!Number.isFinite(val) || val < 0) return NextResponse.json({ error: 'Invalid salary amount' }, { status: 400 })
    }

    if (salary_min_downline_business !== undefined) {
      const val = Number(salary_min_downline_business)
      if (!Number.isFinite(val) || val < 0) return NextResponse.json({ error: 'Invalid minimum downline business' }, { status: 400 })
    }

    if (withdrawal_fee_percent !== undefined) {
      const wfp = Number(withdrawal_fee_percent)
      if (!Number.isFinite(wfp) || wfp < 0 || wfp > 100) return NextResponse.json({ error: 'Invalid withdrawal fee' }, { status: 400 })
    }
    
    if (salary_monthly_increment_percent !== undefined) {
      const smip = Number(salary_monthly_increment_percent)
      if (!Number.isFinite(smip) || smip < 0 || smip > 100) return NextResponse.json({ error: 'Invalid salary increment' }, { status: 400 })
    }

    if (platform_wallet_address !== undefined) {
      const address = String(platform_wallet_address).trim()
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return NextResponse.json({ error: 'Invalid BEP20 wallet address' }, { status: 400 })
    }

    // Update configs in database
    const updates = []
    if (min_withdrawal_usd !== undefined) updates.push({ key: 'min_withdrawal_usd', value: String(min_withdrawal_usd) })
    if (withdrawal_fee_percent !== undefined) updates.push({ key: 'withdrawal_fee_percent', value: String(withdrawal_fee_percent) })
    if (platform_wallet_address !== undefined) updates.push({ key: 'platform_wallet_address', value: String(platform_wallet_address).trim() })
    if (salary_amount_usd !== undefined) updates.push({ key: 'salary_amount_usd', value: String(salary_amount_usd) })
    if (salary_min_downline_business !== undefined) updates.push({ key: 'salary_min_downline_business', value: String(salary_min_downline_business) })
    if (salary_monthly_increment_percent !== undefined) updates.push({ key: 'salary_monthly_increment_percent', value: String(salary_monthly_increment_percent) })

    const transaction = updates.map(update => 
      prisma.systemConfig.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value }
      })
    )

    await prisma.$transaction(transaction)

    return NextResponse.json({ success: true, message: 'Configuration updated' })
  } catch (error) {
    console.error('Admin Config POST Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
