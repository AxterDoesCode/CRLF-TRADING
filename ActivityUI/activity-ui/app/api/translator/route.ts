import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const tradeData = await request.json()
    const { action, ticker, shares } = tradeData
    console.log("tradedata", tradeData,)
    // Convert trade info into the Python backend format
    const backendPayload = {
      buy: action === 'Buy',
      shares: Number(shares),
      ticker: ticker
    }
    console.log("bepayload", backendPayload)
    // Forward the request to your local backend
    const backendResponse = await fetch('http://127.0.0.1:8000/encoding/encode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload)
    })
    console.log('backendrespond', backendResponse)
    if (!backendResponse.ok) {
      throw new Error(`Backend returned ${backendResponse.status}`)
    }
    console.log(backendResponse)
    const backendData = await backendResponse.json()

    // Return whatever your backend sent (the deck, combinations, etc.)
    return NextResponse.json({
      success: true,
      originalTrade: tradeData,
      clashRoyaleDeck: backendData
    })
  } catch (error) {
    console.error('Error in translator API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Clash Royale deck' },
      { status: 500 }
    )
  }
}
