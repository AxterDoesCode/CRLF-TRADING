// store.js
const Alpaca = require('@alpacahq/alpaca-trade-api');

const alpaca = new Alpaca({
  keyId: process.env.APCA_API_KEY_ID,
  secretKey: process.env.APCA_API_SECRET_KEY,
  paper: true,
});

let players = new Map();
let trades = [];
let isInitialized = false;


async function initializeStateFromAlpaca() {
  console.log('Re-initializing state from Alpaca...');
  
  const allOrders = await alpaca.getOrders({
    status: 'closed',
    limit: 500,
    direction: 'asc',
    nested: true,
  });

  players.clear();
  trades = [];

  for (const order of allOrders) {
    if (!order.client_order_id || !order.client_order_id.startsWith('player-')) {
      continue; 
    }
    
    const playerId = order.client_order_id.split('-')[1];
    
    if (!players.has(playerId)) {
      players.set(playerId, {
        id: playerId,
        virtual_balance: 100000.00,
        holdings: new Map(), 
      });
    }

    const playerState = players.get(playerId);
    const qty = parseFloat(order.qty);
    const symbol = order.symbol;
    const filledPrice = parseFloat(order.filled_avg_price);
    const cost = qty * filledPrice;
    
    const currentQty = playerState.holdings.get(symbol) || 0;
    if (order.side === 'buy') {
      playerState.holdings.set(symbol, currentQty + qty);
      playerState.virtual_balance -= cost;
    } else { 
      playerState.holdings.set(symbol, currentQty - qty);
      playerState.virtual_balance += cost;
    }
    
    trades.push(order);
  }

  isInitialized = true;
  console.log(`State reloaded. ${trades.length} trades processed for ${players.size} players.`);
}

async function ensureInitialized() {
  if (!isInitialized) {
    await initializeStateFromAlpaca();
  }
}

module.exports = {
  players,
  trades,
  ensureInitialized,
  alpaca
};