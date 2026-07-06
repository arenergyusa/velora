import { NextResponse } from 'next/server'
import { processDailyROI } from '@/lib/business/roi'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processDailyROI()

    if (result.success) {
      return NextResponse.json({ 
        message: `ROI processed successfully`,
        date: result.date,
        processed: result.processedCount,
        skipped: result.skippedCount,
        catchUpDays: result.catchUpDays,
        errors: result.errorCount
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Cron ROI critical error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
