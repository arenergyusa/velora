import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import { verifyMessage } from 'ethers'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-for-development'
const key = new TextEncoder().encode(SECRET_KEY)

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

/**
 * POST /api/auth/connect
 * Verifies a signed message (EIP-191) and creates a session.
 * Body: { address, signature, message, nonceToken, referralCode? }
 */
export async function POST(req: Request) {
  try {
    const { address, signature, message, nonceToken, referralCode } = await req.json()

    if (!address || !signature || !message || !nonceToken) {
      return NextResponse.json(
        { error: 'Missing required fields: address, signature, message, nonceToken' },
        { status: 400 }
      )
    }

    // ─── Step 1: Verify the EVM signature (EIP-191 personal_sign) ───
    let recoveredAddress: string
    try {
      recoveredAddress = verifyMessage(message, signature)
    } catch (err) {
      console.error('Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Validate that recovered address matches the claimed address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Signature does not match the wallet address' },
        { status: 401 }
      )
    }

    // ─── Step 1.5: Decode nonceToken and verify expected nonce ───
    let expectedNonce: string
    try {
      const { payload } = await jwtVerify(nonceToken, key, { algorithms: ['HS256'] })
      if (payload.address !== address.toLowerCase()) {
         return NextResponse.json({ error: 'Nonce token address mismatch' }, { status: 401 })
      }
      expectedNonce = payload.nonce as string
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired nonce token' }, { status: 401 })
    }

    if (!message.includes(`Nonce: ${expectedNonce}`)) {
       return NextResponse.json({ error: 'Message does not contain the correct nonce' }, { status: 401 })
    }

    // ─── Step 2: Check if user exists (Login) or create new (Register) ───
    let user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() }
    })

    let isNewUser = false

    if (user) {
      // ── Existing user: verify the nonce matches ──
      if (user.nonce !== expectedNonce) {
        return NextResponse.json(
          { error: 'Invalid or expired nonce. Please try again.' },
          { status: 401 }
        )
      }

      // Rotate the nonce after successful login (replay protection)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { nonce: crypto.randomUUID() }
      })
    } else {
      // ── New user: Register ──
      isNewUser = true

      let referredBy = null
      let teamSide: 'LEFT' | 'RIGHT' | null = null

      if (referralCode) {
        const sponsor = await prisma.user.findUnique({
          where: { referralCode }
        })

        if (sponsor) {
          if (sponsor.status === 'INACTIVE') {
            return NextResponse.json(
              { error: 'Invalid referral code. The sponsor account is not active yet.' },
              { status: 400 }
            )
          }

          referredBy = sponsor.id

          // Auto alternating team assignment logic (Left/Right)
          const directsCount = await prisma.user.count({
            where: { referredBy: sponsor.id }
          })

          // Even number (0, 2, 4) -> Left, Odd number (1, 3, 5) -> Right
          teamSide = directsCount % 2 === 0 ? 'LEFT' : 'RIGHT'
        } else {
          return NextResponse.json(
            { error: 'Invalid referral code provided.' },
            { status: 400 }
          )
        }
      }

      user = await prisma.user.create({
        data: {
          walletAddress: address.toLowerCase(),
          referralCode: generateReferralCode(),
          referredBy,
          teamSide,
          nonce: crypto.randomUUID(), // Fresh nonce for next login
          status: 'INACTIVE'
        }
      })
    }

    // ─── Step 3: Create JWT session ───
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const session = await encrypt({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        referralCode: user.referralCode,
        status: user.status
      }
    })

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        referralCode: user.referralCode,
        status: user.status
      }
    })
  } catch (error: any) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
