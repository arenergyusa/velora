import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT', {
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch TRX price from Binance');
    }

    const data = await response.json();
    const price = parseFloat(data.price);

    if (isNaN(price)) {
      throw new Error('Invalid price data received');
    }

    return NextResponse.json({
      success: true,
      price: price,
      symbol: 'TRX/USDT'
    });
  } catch (error: any) {
    console.error('Error fetching BNB price:', error.message);

    // Fallback price in case API fails
    return NextResponse.json({
      success: false,
      price: 0.3215, // Reasonable fallback for TRX
      symbol: 'TRX/USDT',
      error: 'Using fallback price due to API error'
    }, { status: 200 });
  }
}
