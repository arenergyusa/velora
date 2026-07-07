import { getSession } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export async function verifyAdminSession() {
  const session = await getSession()
  if (!session || !session.user) {
    return { error: 'Unauthorized: No active session', status: 401 }
  }

  const userWalletAddress = session.user.walletAddress

  if (!userWalletAddress) {
    return { error: 'Unauthorized: Invalid session', status: 401 }
  }

  const config = await prisma.systemConfig.findUnique({
    where: { key: 'platform_wallet_address' }
  })
  const masterWalletAddress = config?.value

  if (!masterWalletAddress) {
    return { error: 'System error: Master wallet not configured', status: 500 }
  }

  if (userWalletAddress.toLowerCase() !== masterWalletAddress.toLowerCase()) {
    return { error: 'Forbidden: Admin access only', status: 403 }
  }

  return { success: true, walletAddress: userWalletAddress }
}
