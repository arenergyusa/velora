import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'

export async function GET() {
  try {
    const adminCheck = await verifyAdminSession()
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const queries = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Fetch the latest 200 messages
    })

    const formattedData = queries.map(q => ({
      id: q.id,
      name: q.name,
      email: q.email,
      message: q.message,
      date: q.createdAt.toISOString().replace('T', ' ').substring(0, 16)
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('Admin Queries GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
