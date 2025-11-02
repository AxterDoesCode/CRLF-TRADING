import express from 'express';
import { SIMULATION_CONFIG } from './config.js';
import { calculatePrice, getPriceHistory } from './simulator.js';
import { parse } from 'dotenv';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

const players = new Map();

app.get("/price-history", (req, res) => {
    const T = parseInt(req.query.T);
    const allHistory = [];

    for (const ticker in SIMULATION_CONFIG) {
        const history = getPriceHistory(ticker, T);
        allHistory.push(...history);
    }
    res.json(allHistory);
});

app.post("/player", (req, res) => {
    const { playerId } = req.body;
    if (players.has(playerId)) {
        return res.status(400).json({ error: "Player already exists" });
    }

    players.set(playerId, {
        id: playerId,
        virtual_balance: 100000.00,
        orders: [],
    });

    res.json({ message: "Player created", playerId: playerId });
});

app.post("/trade", (req, res) => {
    const { playerId, symbol, side, quantity, T } = req.body;
    const player = players.get(playerId);

    if (!player) {
        return res.status(404).json({ error: "Player not found" });
    }

    player.orders.push({ symbol, side, quantity, T });
    res.json({ message: "Trade recorded" });
});

app.get("/portfolio/:playerId", (req, res) => {
    const playerId = req.params.playerId;
    const player = players.get(playerId);
    const T_NOW = parseInt(req.query.T);

    if (!player) {
        return res.status(404).json({ error: "Player not found" });
    }

    const portfolioSnapshots = [];
    const start = Math.max(0, T_NOW - 60);

    // Sort all orders by time
    const sortedOrders = player.orders
        .filter(order => order.T <= T_NOW)
        .sort((a, b) => a.T - b.T);

    // Initial portfolio state
    let currentPortfolio = {
        cash: {
            amount: player.virtual_balance,
            price_per_share: 1.00,
            value: player.virtual_balance * 1.00,
        }
    };

    let orderIndex = 0;

    // Process each timestamp from 0 to T_NOW
    for (let t = 0; t <= T_NOW; t++) {
        // Process all orders at this timestamp
        while (orderIndex < sortedOrders.length && sortedOrders[orderIndex].T === t) {
            const order = sortedOrders[orderIndex];
            const price = calculatePrice(order.symbol, t);

            if (order.side === 'buy') {
                if (!currentPortfolio[order.symbol]) {
                    currentPortfolio[order.symbol] = {
                        quantity: 0,
                        price_per_share: price,
                        value: 0
                    };
                }
                currentPortfolio[order.symbol].quantity += order.quantity;
                currentPortfolio.cash.amount -= order.quantity * price;
            }
            else if (order.side === 'sell') {
                if (!currentPortfolio[order.symbol]) {
                    currentPortfolio[order.symbol] = {
                        quantity: 0,
                        price_per_share: price,
                        value: 0
                    };
                }
                currentPortfolio[order.symbol].quantity -= order.quantity;
                currentPortfolio.cash.amount += order.quantity * price;
            }

            orderIndex++;
        }

        // Only create snapshots for the range [start, T_NOW]
        if (t >= start) {
            const snapshot = JSON.parse(JSON.stringify(currentPortfolio)); // deep copy

            // Update prices and values for current timestamp
            for (const sym in snapshot) {
                if (sym !== 'cash') {
                    snapshot[sym].price_per_share = calculatePrice(sym, t);
                    snapshot[sym].value = snapshot[sym].quantity * snapshot[sym].price_per_share;
                }
            }

            snapshot.cash.value = snapshot.cash.amount * 1.00;
            snapshot.timestamp = t;

            portfolioSnapshots.push(snapshot);
        }
    }

    return res.json(portfolioSnapshots);
});

// app.get("/portfolio/:playerId", (req, res) => {
//     const playerId = req.params.playerId;
//     const player = players.get(playerId);
//     const T_NOW = parseInt(req.query.T);

//     if (!player) {
//         return res.status(404).json({ error: "Player not found" });
//     }
//     const portfolioSnapshots = [];

//     let last_portfolio_snapshot = {
//         timestamp: 0,
//         cash: {
//             amount: player.virtual_balance,
//             price_per_share: 1.00,
//             value: player.virtual_balance * 1.00,
//         }
//     }
//     const start = Math.max(0, T_NOW - 10);
//     let last_t = start;

//     for (const order of player.orders) {
//         if (order.T <= T_NOW && order.T >= start)
//         {
//             // we need to compute snapshots at all times between start and T_NOW
//             // but, order.T <= T_NOW, so we process UP to T_NOW, from the larger of start and last_t
//             let process_start = Math.max(start, last_t);
//             for (let t = process_start; t <= T_NOW; t++) {
//                 const snapshot = JSON.parse(JSON.stringify(last_portfolio_snapshot)); // deep copy
//                 for (const sym in snapshot) {
//                     if (sym !== 'cash' && sym !== 'timestamp') {
//                         snapshot[sym].price_per_share = calculatePrice(sym, t);
//                         snapshot[sym].value = snapshot[sym].quantity * snapshot[sym].price_per_share;
//                     }
//                 }
//                 if (t === order.T) {
//                     if(order.side === 'buy') {
//                         if (!snapshot[order.symbol]) {
//                             snapshot[order.symbol] = {
//                                 quantity: order.quantity,
//                                 price_per_share: calculatePrice(order.symbol, order.T),
//                                 value: order.quantity * calculatePrice(order.symbol, order.T)
//                             };
//                             snapshot.cash.amount -= order.quantity * calculatePrice(order.symbol, order.T);
//                             snapshot.cash.value = snapshot.cash.amount * 1.00;
//                         } else {
//                             snapshot[order.symbol].quantity += order.quantity;
//                             snapshot[order.symbol].price_per_share = calculatePrice(order.symbol, order.T);
//                             snapshot[order.symbol].value = snapshot[order.symbol].quantity * snapshot[order.symbol].price_per_share;

//                             snapshot.cash.amount -= order.quantity * calculatePrice(order.symbol, order.T);
//                             snapshot.cash.value = snapshot.cash.amount * 1.00;
//                         }
//                     }
//                     else if(order.side === 'sell') {
//                         if (!snapshot[order.symbol]) {
//                             snapshot[order.symbol] = {
//                                 quantity: -order.quantity,
//                                 price_per_share: calculatePrice(order.symbol, order.T),
//                                 value: -order.quantity * calculatePrice(order.symbol, order.T)
//                             };
//                             snapshot.cash.amount += order.quantity * calculatePrice(order.symbol, order.T);
//                             snapshot.cash.value = snapshot.cash.amount * 1.00;
//                         } else {
//                             snapshot[order.symbol].quantity -= order.quantity;
//                             snapshot[order.symbol].price_per_share = calculatePrice(order.symbol, order.T);
//                             snapshot[order.symbol].value = snapshot[order.symbol].quantity * snapshot[order.symbol].price_per_share;

//                             snapshot.cash.amount += order.quantity * calculatePrice(order.symbol, order.T);
//                             snapshot.cash.value = snapshot.cash.amount * 1.00;
//                         }
//                     }
//                 }
//                 snapshot.timestamp = t;
//                 last_portfolio_snapshot = snapshot;
//                 last_t = t;
//                 portfolioSnapshots.push(snapshot);
//             }
//         }
//     }

//     // Finally, ensure we have a snapshot at T_NOW
//     if (last_t < T_NOW || portfolioSnapshots.length == 0) {
//         last_t = portfolioSnapshots.length == 0 ? start - 1 : last_t;
//         for (let t = last_t + 1; t <= T_NOW; t++) {
//             const snapshot = JSON.parse(JSON.stringify(last_portfolio_snapshot)); // deep copy
//             for (const sym in snapshot) {
//                 if (sym !== 'cash' && sym !== 'timestamp') {
//                     snapshot[sym].price_per_share = calculatePrice(sym, t);
//                     snapshot[sym].value = snapshot[sym].quantity * snapshot[sym].price_per_share;
//                 }
//             }
//             snapshot.timestamp = t;
//             last_portfolio_snapshot = snapshot;
//             last_t = t;
//             portfolioSnapshots.push(snapshot);
//         }
//     }

//     return res.json(portfolioSnapshots);
// });

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Trading API server running on port ${PORT}`);
});