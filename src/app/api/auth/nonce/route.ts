import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { SignJWT } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-for-development'
const key = new TextEncoder().encode(SECRET_KEY)

/**
 * GET /api/auth/nonce?address=0x...
 * Returns a unique challenge message for the user to sign.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Check if user already exists (normalize to lowercase for EVM)
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      select: { nonce: true }
    })

    let nonce: string
    if (user) {
      // Existing user → use their stored nonce
      nonce = user.nonce
    } else {
      // New user → generate a temporary nonce (not stored until registration)
      nonce = crypto.randomUUID()
    }

    // Construct the human-readable message users will see in their wallet
    const message = buildSignMessage(address, nonce)

    // Sign the nonce and address into a short-lived token
    const nonceToken = await new SignJWT({ address: address.toLowerCase(), nonce })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .sign(key)

    return NextResponse.json({ 
      message,
      nonce,
      nonceToken,
      isNewUser: !user 
    })
  } catch (error: any) {
    console.error('Nonce generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Builds a human-readable sign message.
 * IMPORTANT: This exact format must match the backend verification.
 */
export function buildSignMessage(address: string, nonce: string): string {
  return `Welcome to Velora!\n\nSign this message to verify your wallet ownership.\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString().split('T')[0]}`
}
