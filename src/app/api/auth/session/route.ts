import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/jwt'

/**
 * GET /api/auth/session
 * Returns current session data, or null if not authenticated.
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user
    })
  } catch (error: any) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false, user: null })
  }
}
