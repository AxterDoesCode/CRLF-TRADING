// simulator.js
import { SIMULATION_CONFIG, SIMULATION_START_TIME, PRICE_HISTORY_LOOKBACK } from './config.js';

/**
 * Calculates the price of a ticker at a specific time step T.
 * This is a pure function.
 * @param {string} ticker The stock ticker (e.g., "AAPL")
 * @param {number} T The time step (e.g., 50 for 50 minutes)
 * @returns {number} The calculated price.
 */
export function calculatePrice(ticker, T) {
  const config = SIMULATION_CONFIG[ticker];
  if (!config) return 0; // Stock not in config

  let price = config.basePrice;

  // 1. Add the long-term trend
  price += T * config.trend;

  // 2. Add all the sine waves for volatility
  for (const wave of config.waves) {
    price += wave.amplitude * Math.sin(wave.frequency * T);
  }
  
  // 3. Add a simple cosine wave to make it less uniform
  price += 0.1 * Math.cos(T * 0.5);

  // Return formatted to 2 decimal places, ensuring it's not negative
  return Math.max(0.01, parseFloat(price.toFixed(2)));
}

/**
 * Gets the price history for a ticker, ending at T.
 * @param {string} ticker The stock ticker
 * @param {number} T_end The current time step
 * @returns {Array<object>} An array of {ticker, price, timestamp}
 */
export function getPriceHistory(ticker, T_end) {
  // Get the last N values, but don't go below T=0
  const T_start = Math.max(0, T_end - PRICE_HISTORY_LOOKBACK + 1);
  const history = [];

  for (let T = T_start; T <= T_end; T++) {
    const price = calculatePrice(ticker, T);
    
    // Create a timestamp for this T (each T is one minute)
    const timestamp = new Date(SIMULATION_START_TIME + T * 60000).toISOString();
    
    history.push({
      ticker: ticker,
      price: price,
      timestamp: timestamp
    });
  }
  return history;
}