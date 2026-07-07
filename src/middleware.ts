import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis only if environment variables are available
const hasRedisConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

let globalRatelimit: Ratelimit | null = null
let authRatelimit: Ratelimit | null = null
let financialRatelimit: Ratelimit | null = null
let contactRatelimit: Ratelimit | null = null
let adminRatelimit: Ratelimit | null = null

if (hasRedisConfig) {
  const redis = Redis.fromEnv()
  
  // 50 requests per 10 seconds for general API routes
  globalRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '10 s'),
    analytics: true,
  })

  // 5 requests per 30 seconds for Auth API
  authRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '30 s'),
    analytics: true,
  })

  // 5 requests per 30 seconds for Financial actions (Deposit, Withdraw, Topup)
  financialRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '30 s'),
    analytics: true,
  })

  // 2 requests per 60 seconds for Contact API to prevent spam
  contactRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '60 s'),
    analytics: true,
  })

  // 10 requests per 30 seconds for Admin API
  adminRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '30 s'),
    analytics: true,
  })
}

export async function middleware(request: NextRequest) {
  // CORS & Allowed Origins Validation
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'https://bnb-mlm-dapp.vercel.app',
    'http://localhost:3000'
  ]

  // If origin is present and not in our allowed list, block the request
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: 'Forbidden: Invalid Origin' },
      { status: 403 }
    )
  }

  // Only apply rate limiting if Redis is configured
  if (!hasRedisConfig) {
    return NextResponse.next()
  }

  // Fallback to headers if ip property is not available on NextRequest
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             '127.0.0.1'
  const path = request.nextUrl.pathname

  try {
    let limitResult

    if (path.startsWith('/api/auth/')) {
      limitResult = await authRatelimit!.limit(ip)
    } else if (
      path.startsWith('/api/deposit') || 
      path.startsWith('/api/withdraw') || 
      path.startsWith('/api/topup')
    ) {
      limitResult = await financialRatelimit!.limit(ip)
    } else if (path.startsWith('/api/contact')) {
      limitResult = await contactRatelimit!.limit(ip)
    } else if (path.startsWith('/api/admin/')) {
      limitResult = await adminRatelimit!.limit(ip)
    } else if (path.startsWith('/api/')) {
      limitResult = await globalRatelimit!.limit(ip)
    }

    if (limitResult && !limitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.reset.toString()
          }
        }
      )
    }
  } catch (error) {
    // If rate limiting fails (e.g. Redis is down), allow the request to proceed
    console.error('Rate limiting error:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
