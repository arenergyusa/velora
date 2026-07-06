import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JsonRpcProvider, FallbackProvider, Interface, id, parseUnits } from 'ethers'

export async function POST(request: Request) {
  try {
    const { userId, amountUsd, txHash, amountNative, nativePriceUsd } = await request.json()

    if (!userId || !amountUsd || !txHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Prevent duplicate txHash replay attacks
    const existingTx = await prisma.deposit.findFirst({ where: { txHash } })
    if (existingTx) {
      return NextResponse.json({ error: 'Transaction hash already used' }, { status: 400 })
    }

    // 2. Fetch User and Master Wallet Address
    const [user, config] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.systemConfig.findUnique({ where: { key: 'platform_wallet_address' } })
    ])
    
    if (!user || !user.walletAddress) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const masterWallet = config?.value
    if (!masterWallet) {
      return NextResponse.json({ error: 'System configuration error' }, { status: 500 })
    }

    // 3. Verify txHash on BSC network
    const rpcUrl = process.env.BSC_RPC_URL || 'https://bnb-mainnet.g.alchemy.com/v2/Be-ZMfSzCVwtZaaFUF9hm'
    const primaryProvider = new JsonRpcProvider(rpcUrl)
    const fallbackProvider = new JsonRpcProvider('https://bsc-dataseed.binance.org/')
    const provider = new FallbackProvider([primaryProvider, fallbackProvider])

    try {
      // Get transaction details
      const tx = await provider.getTransaction(txHash)
      
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found on BSC network' }, { status: 400 })
      }

      // Check transaction receipt for success
      const receipt = await provider.getTransactionReceipt(txHash)
      if (!receipt || receipt.status !== 1) {
        return NextResponse.json({ error: 'Transaction was not successful' }, { status: 400 })
      }

      // Verify that the transaction sender matches the user's wallet
      if (tx.from.toLowerCase() !== user.walletAddress.toLowerCase()) {
        return NextResponse.json({ error: 'Transaction sender does not match your wallet address' }, { status: 400 })
      }

      // The token contract for TRX on BSC
      const trxContractAddress = process.env.NEXT_PUBLIC_TRX_CONTRACT_ADDRESS || '0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3'

      if (tx.to?.toLowerCase() !== trxContractAddress.toLowerCase()) {
        return NextResponse.json({ error: 'Transaction was not sent to the TRX contract' }, { status: 400 })
      }

      // Find the Transfer event in the logs
      const transferEventSignature = id('Transfer(address,address,uint256)')
      
      const transferLog = receipt.logs.find(log => 
        log.address.toLowerCase() === trxContractAddress.toLowerCase() &&
        log.topics[0] === transferEventSignature &&
        // log.topics[2] is the 'to' address, padded to 32 bytes
        log.topics[2].toLowerCase().includes(masterWallet.toLowerCase().replace('0x', ''))
      )

      if (!transferLog) {
        return NextResponse.json({ error: 'No valid TRX transfer to the Master Wallet found in this transaction' }, { status: 400 })
      }

      // Verify the transferred amount is sufficient
      const actualWei = BigInt(transferLog.data)
      const expectedWei = parseUnits(Number(amountNative || 0).toFixed(6), 18) // BSC TRX uses 18 decimals

      // Allow a small 1% margin of error for precision differences
      const margin = expectedWei / BigInt(100)
      if (actualWei < (expectedWei - margin)) {
        return NextResponse.json({ error: 'Transferred amount is less than expected' }, { status: 400 })
      }

      // Enhanced Verification using BscScan API
      if (process.env.BSCSCAN_API_KEY) {
        try {
          const bscscanUrl = `https://api.bscscan.com/api?module=account&action=tokentx&address=${masterWallet}&page=1&offset=50&sort=desc&apikey=${process.env.BSCSCAN_API_KEY}`
          const bscRes = await fetch(bscscanUrl)
          const bscData = await bscRes.json()
          
          if (bscData.status === '1' && Array.isArray(bscData.result)) {
            const bscTx = bscData.result.find((t: any) => t.hash.toLowerCase() === txHash.toLowerCase())
            
            if (bscTx) {
              if (bscTx.to.toLowerCase() !== masterWallet.toLowerCase() || bscTx.from.toLowerCase() !== user.walletAddress.toLowerCase()) {
                 return NextResponse.json({ error: 'BscScan verification failed: address mismatch' }, { status: 400 })
              }
              const bscAmount = BigInt(bscTx.value)
              if (bscAmount < (expectedWei - margin)) {
                return NextResponse.json({ error: 'BscScan verification failed: amount mismatch' }, { status: 400 })
              }
            } else {
              console.warn(`TX ${txHash} not found in BscScan yet, relying on RPC verification.`)
            }
          }
        } catch (bscError) {
          console.error('BscScan verification warning:', bscError)
        }
      }

    } catch (verifyError) {
      console.error('BSC verification failed:', verifyError)
      return NextResponse.json({ error: 'Failed to verify transaction on blockchain' }, { status: 400 })
    }

    // 4. Create Deposit Record for INTERNAL FUNDING
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amountUsd: Number(amountUsd),
        amountTrx: Number(amountNative || 0),
        trxPriceUsd: Number(nativePriceUsd || 0),
        txHash,
        planId: 'INTERNAL_FUNDING', // Dummy plan ID indicating it's just adding to internal balance
        status: 'CONFIRMED'
      }
    })

    return NextResponse.json({ success: true, deposit })

  } catch (error) {
    console.error('Deposit API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
