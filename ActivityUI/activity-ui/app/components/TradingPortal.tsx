'use client';

import { useState } from 'react';

interface TradingPortalProps {
  onTradeSubmitted: () => void;
}

export default function TradingPortal({ onTradeSubmitted }: TradingPortalProps) {
  const [action, setAction] = useState<'Buy' | 'Sell'>('Buy');
  const [price, setPrice] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clashRoyaleDeck, setClashRoyaleDeck] = useState<any>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setClashRoyaleDeck(null);

    try {
      // Step 1: Translate to Clash Royale deck
      const translatorResponse = await fetch('/api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buy: action == 'Buy',
          ticker: companyName,
          shares: parseInt(amount),
        })
      });

      const translatorData = await translatorResponse.json();

      if (!translatorData.success) {
        throw new Error('Failed to translate trade');
      }

      console.log(translatorData)

      setClashRoyaleDeck(translatorData.clashRoyaleDeck);

      // Step 2: Execute trade with Clash Royale deck
      const tradingResponse = await fetch('/api/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          price: parseFloat(price),
          companyName,
          amount: parseInt(amount),
          clashRoyaleDeck: translatorData.clashRoyaleDeck
        })
      });

      const tradingData = await tradingResponse.json();

      if (tradingData.success) {
        setMessage(`Trade #${tradingData.tradeId} submitted! Estimated execution time: ${(tradingData.estimatedTime / 1000).toFixed(1)}s`);

        // Reset form after successful submission
        setTimeout(() => {
          setPrice('');
          setCompanyName('');
          setAmount('');
          setClashRoyaleDeck(null);
          onTradeSubmitted();
        }, 2000);
      } else {
        throw new Error('Failed to execute trade');
      }
    } catch (error) {
      setMessage('Error: Failed to submit trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-white cr-subtitle text-center">
        ⚔️ BATTLE STATION ⚔️
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Action Selection */}
        <div>
          <label className="block text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wide">
            🎯 Battle Action
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setAction('Buy')}
              className={`flex-1 py-3 px-4 font-black transition-all text-white ${action === 'Buy'
                ? 'cr-button-buy'
                : 'bg-gray-600 hover:bg-gray-500 rounded-lg'
                }`}
            >
              💚 BUY
            </button>
            <button
              type="button"
              onClick={() => setAction('Sell')}
              className={`flex-1 py-3 px-4 font-black transition-all text-white ${action === 'Sell'
                ? 'cr-button-sell'
                : 'bg-gray-600 hover:bg-gray-500 rounded-lg'
                }`}
            >
              ❤️ SELL
            </button>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wide">
            🏢 Target Company
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="cr-input w-full"
            placeholder="e.g., AAPL, GOOGL, TSLA"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wide">
            💰 Price (Gold)
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="cr-input w-full"
            placeholder="0.00"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wide">
            🔢 Amount (Units)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="cr-input w-full"
            placeholder="0"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 px-4 font-black text-white text-lg ${isSubmitting
            ? 'bg-gray-500 cursor-not-allowed rounded-lg'
            : 'cr-button'
            }`}
        >
          {isSubmitting ? '⏳ DEPLOYING DECK...' : '⚡ DEPLOY & BATTLE ⚡'}
        </button>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`mt-5 p-4 rounded-xl font-bold text-center ${message.includes('Error')
          ? 'bg-red-900 text-red-100 border-2 border-red-600'
          : 'bg-green-900 text-green-100 border-2 border-green-500'
          }`}>
          {message}
        </div>
      )}

      {/* Clash Royale Deck Display */}
      {clashRoyaleDeck && (
        <div className="mt-6 cr-card p-5">
          <h3 className="text-xl font-black text-white mb-3 text-center cr-subtitle">
            🎴 {clashRoyaleDeck.deckName} 🎴
          </h3>
          <div className="text-center mb-4">
            <span className="text-sm text-yellow-300 font-bold">
              ⚡ Strategy: {clashRoyaleDeck.strategy}
            </span>
            <span className="cr-elixir ml-3">
              {clashRoyaleDeck.totalElixir} 💧
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {clashRoyaleDeck.cards.map((card: any, index: number) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-700 to-slate-800 p-3 rounded-lg border-2 border-yellow-500 shadow-lg"
              >
                <div className="font-black text-white text-sm">{card.card}</div>
                <div className="text-xs text-yellow-300 font-semibold mt-1">
                  ⭐ Lvl {card.level} • {card.elixir} 💧
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
