import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for trades (in production, use a database)
let trades: any[] = [];
let tradeIdCounter = 1;

// POST - Execute a new trade
export async function POST(request: NextRequest) {
  try {
    const tradeData = await request.json();
    const { action, price, companyName, amount, clashRoyaleDeck } = tradeData;

    // Simulate trade execution with random success/failure
    const isSuccessful = Math.random() > 0.3; // 70% success rate
    const executionTime = Math.floor(Math.random() * 5000) + 2000; // 2-7 seconds

    const trade = {
      id: tradeIdCounter++,
      action,
      price,
      companyName,
      amount,
      clashRoyaleDeck,
      status: 'processing',
      submittedAt: new Date().toISOString(),
      completedAt: null,
      executionTime,
      result: null
    };

    trades.push(trade);

    // Simulate async processing
    setTimeout(() => {
      const tradeIndex = trades.findIndex(t => t.id === trade.id);
      if (tradeIndex !== -1) {
        trades[tradeIndex].status = isSuccessful ? 'completed' : 'incomplete';
        trades[tradeIndex].completedAt = new Date().toISOString();
        trades[tradeIndex].result = {
          success: isSuccessful,
          executedPrice: isSuccessful ? price * (0.98 + Math.random() * 0.04) : null, // Random Values
          executedAmount: isSuccessful ? amount : 0,
          message: isSuccessful
            ? `Trade executed successfully using ${clashRoyaleDeck.deckName}!`
            : 'Trade failed - insufficient liquidity or market conditions'
        };
      }
    }, executionTime);

    return NextResponse.json({
      success: true,
      tradeId: trade.id,
      message: 'Trade submitted successfully',
      estimatedTime: executionTime
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to execute trade' },
      { status: 400 }
    );
  }
}

// GET - Fetch all trades and statistics
export async function GET(request: NextRequest) {
  const completedTrades = trades.filter(t => t.status === 'completed');
  const incompleteTrades = trades.filter(t => t.status === 'incomplete');
  const processingTrades = trades.filter(t => t.status === 'processing');

  const totalVolume = completedTrades.reduce((sum, t) => sum + (t.amount * t.price), 0);
  const avgExecutionTime = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.executionTime, 0) / trades.length
    : 0;

  return NextResponse.json({
    success: true,
    statistics: {
      totalTrades: trades.length,
      completed: completedTrades.length,
      incomplete: incompleteTrades.length,
      processing: processingTrades.length,
      totalVolume: totalVolume.toFixed(2),
      successRate: trades.length > 0
        ? ((completedTrades.length / (completedTrades.length + incompleteTrades.length)) * 100).toFixed(1)
        : '0',
      avgExecutionTime: avgExecutionTime.toFixed(0)
    },
    trades: trades.sort((a, b) => b.id - a.id) // Most recent first
  });
}

// DELETE - Clear all trades (useful for testing)
export async function DELETE() {
  trades = [];
  tradeIdCounter = 1;
  return NextResponse.json({ success: true, message: 'All trades cleared' });
}
