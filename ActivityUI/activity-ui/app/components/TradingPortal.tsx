'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from "react-qr-code";
import { clear } from 'console';
interface TradingPortalProps {
  onTradeSubmitted: () => void;
}

const cardImages: Record<string, string> = {
  "28000001": "/res/arrows.png",
  "26000005": "/res/minions.png",
  "26000001": "/res/archer.png",
  "26000000": "/res/knight.png",
  "28000000": "/res/fireball.png",
  "26000018": "/res/mini-pekka.png",
  "26000014": "/res/musketeer.png",
  "26000003": "/res/giant.png",
  "26000019": "/res/spear-goblins.png",
  "26000002": "/res/goblin.png",
  "27000012": "/res/goblin-cage.png",
  "27000001": "/res/goblin-hut.png",
  "26000013": "/res/bomber.png",
  "26000010": "/res/skeletons.png",
  "27000009": "/res/tombstone.png",
  "26000011": "/res/valkyrie.png",
};

function getDeckUrl(deck: string[]) {
  return `clashroyale://copyDeck?deck=${deck.join(';')}&l=Royals&slots=0;0;0;0;0;0;0;0&tt=159000000`;
}

export default function TradingPortal({ onTradeSubmitted }: TradingPortalProps) {
  const [action, setAction] = useState<'Buy' | 'Sell'>('Buy');
  const [companyName, setCompanyName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clashRoyaleDeck, setClashRoyaleDeck] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [qrVisible, setQrVisible] = useState(false);
  const [deckVisible, setDeckVisible] = useState(false);
  const [url, setUrl] = useState("")

  const clearCard = () => {
    setClashRoyaleDeck([]);
  };

  const importDeck = () => {
    setQrVisible(true);
    setDeckVisible(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setClashRoyaleDeck([]);
    setQrVisible(false);
    setDeckVisible(true);
    setUrl("");

    try {
      // Step 1: Translate to Clash Royale deck
      const translatorResponse = await fetch('api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          ticker: companyName,
          shares: parseInt(amount),
        })
      });
      const translatorData = await translatorResponse.json();

      if (!translatorData.success) {
        throw new Error('Failed to translate trade');
      }

      console.log(translatorData)

      setClashRoyaleDeck(translatorData.clashRoyaleDeck.deck_encoding);
      setUrl(getDeckUrl(translatorData.clashRoyaleDeck.deck_encoding))

    } catch (error) {
      setMessage('Error: Failed to submit trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 h-[100vh] center">
      <h2 className="text-3xl font-bold mb-6 text-white cr-subtitle text-center chewy-regular">
        ⚔️ BATTLE STATION ⚔️
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Action Selection */}
        <div>
          <label className="block text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wide chewy-regular">
            🎯 Battle Action
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setAction('Buy')}
              className={`flex-1 py-3 px-4 font-black transition-all text-white chewy-regular ${action === 'Buy'
                ? 'cr-button-buy'
                : 'bg-gray-600 hover:bg-gray-500 rounded-lg'
                }`}
            >
              💚 BUY
            </button>
            <button
              type="button"
              onClick={() => setAction('Sell')}
              className={`flex-1 py-3 px-4 font-black transition-all text-white chewy-regular ${action === 'Sell'
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
          <label className="block text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wide chewy-regular">
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
        {/* <div>
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
        </div> */}

        {/* Amount */}
        <div>
          <label className="block text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wide chewy-regular">
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
          className={`w-full py-4 px-4 font-black text-white text-lg chewy-regular ${isSubmitting
            ? 'bg-gray-500 cursor-not-allowed rounded-lg'
            : 'cr-button'
            }`}
        >
          {isSubmitting ? '⏳ DEPLOYING DECK...' : '⚡ DEPLOY & BATTLE ⚡'}
        </button>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`mt-5 p-4 rounded-xl font-bold text-center chewy-regular ${message.includes('Error')
          ? 'bg-red-900 text-red-100 border-2 border-red-600'
          : 'bg-green-900 text-green-100 border-2 border-green-500'
          }`}>
          {message}
        </div>
      )}

      {clashRoyaleDeck.length > 0 && (
        <div className='mt-6'>
          <button
            type="button"
            onClick={importDeck}
            className="w-full py-4 px-4 font-black text-white text-lg chewy-regular cr-button-import"
          >
            Import Deck
          </button>
          <button
            type="button"
            onClick={clearCard}
            className="w-full mt-6 py-4 px-4 font-black text-white text-lg chewy-regular cr-button-reset"
          >
            Clear Deck
          </button>
          {deckVisible &&
            (<div className="grid grid-cols-4 gap-4 mt-8">
              {clashRoyaleDeck.map((cardId, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateY: 180 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-yellow-600 to-orange-800 rounded-xl p-2 shadow-lg hover:scale-105 transform transition-all"
                >
                  <img
                    src={cardImages[cardId]}
                    alt={`Card ${cardId}`}
                    className="rounded-lg w-full object-cover"
                  />
                </motion.div>
              ))
              }
            </div>)
          }
          {url && qrVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                ease: "easeOut"
              }}
              className="flex w-full h-full justify-center items-center bg-gradient-to-br from-yellow-600 to-orange-800 rounded-xl p-2 shadow-lg hover:scale-105 transform transition-all qr-wrapper"
            >
              <QRCode
                value={url}
                size={256}
              />
            </motion.div>
          )}
        </div>
      )
      }
    </div >);
}
