import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Wallet, JsonRpcProvider, FallbackProvider, parseUnits, Contract, isAddress } from 'ethers'

export async function POST(request: Request) {
  try {
    const { userId, amountUsd } = await request.json()

    if (!userId || !amountUsd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = Number(amountUsd)

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount provided' }, { status: 400 })
    }

    // Check minimum withdrawal
    const minWithdrawalConfig = await prisma.systemConfig.findUnique({ where: { key: 'min_withdrawal_usd' } })
    const minWithdrawal = Number(minWithdrawalConfig?.value || 10)

    if (amount < minWithdrawal) {
      return NextResponse.json({ error: `Minimum withdrawal is $${minWithdrawal}` }, { status: 400 })
    }

    // Check available balance using our business logic
    const { getUserBalance } = await import('@/lib/business/balance')
    const { availableBalanceUsd } = await getUserBalance(userId)

    if (amount > availableBalanceUsd) {
      return NextResponse.json({ error: 'Insufficient available balance' }, { status: 400 })
    }

    // Get user wallet address
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.walletAddress) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 400 })
    }

    // Get fee percentage
    const feeConfig = await prisma.systemConfig.findUnique({ where: { key: 'withdrawal_fee_pct' } })
    const feePct = Number(feeConfig?.value || 10)
    
    const feeAmount = (amount * feePct) / 100
    const finalAmountUsd = amount - feeAmount

    // Initialize ethers wallet (Admin Wallet) for BSC
    const privateKey = process.env.ADMIN_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json({ error: 'Server misconfiguration: No private key found' }, { status: 500 })
    }

    const rpcUrl = process.env.BSC_RPC_URL || 'https://bnb-mainnet.g.alchemy.com/v2/Be-ZMfSzCVwtZaaFUF9hm'
    const primaryProvider = new JsonRpcProvider(rpcUrl)
    const fallbackProvider = new JsonRpcProvider('https://bsc-dataseed.binance.org/')
    const provider = new FallbackProvider([primaryProvider, fallbackProvider])
    const adminWallet = new Wallet(privateKey, provider)

    // Fetch Live TRX Price to convert USD to TRX
    let trxPriceUsd = 0.15 // fallback
    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT')
      const priceData = await priceRes.json()
      if (priceData && priceData.price) trxPriceUsd = parseFloat(priceData.price)
    } catch (e) {
      console.error('Failed to fetch TRX price for withdrawal, using fallback.')
    }

    const finalAmountTrx = finalAmountUsd / trxPriceUsd
    const amountWei = parseUnits(finalAmountTrx.toFixed(6), 6) // BSC TRX uses 6 decimals

    // Execute Real Blockchain Transaction from Admin to User (TRX BEP20)
    let txHash = ''
    try {
      const trxContractAddress = process.env.NEXT_PUBLIC_TRX_CONTRACT_ADDRESS || '0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3'
      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)"
      ]
      const trxContract = new Contract(trxContractAddress, erc20Abi, adminWallet)

      if (!isAddress(user.walletAddress)) {
        console.error(`Invalid withdrawal address: ${user.walletAddress}`)
        return NextResponse.json({ error: 'Invalid user withdrawal address in database.' }, { status: 400 })
      }


      const tx = await trxContract.transfer(user.walletAddress, amountWei)
      
      const receipt = await tx.wait(1) // Wait for 1 block confirmation
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed on the network')
      }
      txHash = tx.hash
    } catch (txError: any) {
      console.error('Withdrawal Transaction Error:', txError)
      return NextResponse.json({ error: 'Blockchain transaction failed' }, { status: 500 })
    }

    // Save successful withdrawal in database
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amountUsd: amount,
        amountTrx: finalAmountTrx,
        trxPriceUsd: trxPriceUsd,
        txHash,
        status: 'CONFIRMED',
      }
    })

    return NextResponse.json({ success: true, txHash, withdrawal })

  } catch (error) {
    console.error('Withdrawal API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
