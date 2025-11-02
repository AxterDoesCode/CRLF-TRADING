// config.js

// The 'T' value from the API will be the "minute" of the simulation.
// We start the simulation at a fixed date.
export const SIMULATION_START_TIME = Date.now();

// How many of the last price points to return in the API
export const PRICE_HISTORY_LOOKBACK = 60;

// The "personalities" of your stocks
export const SIMULATION_CONFIG = {
  'AAPL': {
    basePrice: 270.37, // Hardcoded real closing price
    trend: 0.0005, // A slight upward drift per minute
    waves: [
      { amplitude: 2, frequency: 0.05 }, // A long, slow wave
      { amplitude: 0.2, frequency: 0.3 },  // A medium wave
      { amplitude: 0.1, frequency: 0.9 }   // Fast "noise"
    ]
  },
  'MSFT': {
    basePrice: 517.81,
    trend: 0.0008, // A slightly stronger trend
    waves: [
      { amplitude: 2.0, frequency: 0.03 },
      { amplitude: 0.7, frequency: 0.25 },
      { amplitude: 0.2, frequency: 1.1 }
    ]
  },
  'GOOGL': {
    basePrice: 281.82,
    trend: 0.0006, // Moderate upward trend
    waves: [
      { amplitude: 1.2, frequency: 0.04 },
      { amplitude: 0.5, frequency: 0.35 },
      { amplitude: 0.15, frequency: 0.8 }
    ]
  },
  'NVDA': {
    basePrice: 202.49,
    trend: 0.0012, // Higher volatility/trend
    waves: [
      { amplitude: 2.5, frequency: 0.06 },
      { amplitude: 1.0, frequency: 0.4 },
      { amplitude: 0.3, frequency: 1.2 }
    ]
  }
};