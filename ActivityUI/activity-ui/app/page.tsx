'use client';

import { useState, useEffect } from 'react';
import TradingPortal from './components/TradingPortal';
import ResultsPortal from './components/ResultsPortal';
import { FinanceExample } from './src/FinanceExample';

type Tab = 'stats' | 'market';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isTradingOpen, setIsTradingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [inputValue, setInputValue] = useState(''); // What user is typing
  const [searchQuery, setSearchQuery] = useState(''); // Actual search value
  const [currentTime, setCurrentTime] = useState(() => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return Math.floor((now - startOfDay.getTime()) / 1000);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      setCurrentTime(Math.floor((now - startOfDay.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTradeSubmitted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
  };

  const tabs = [
    { id: 'stats' as Tab, label: 'My Trading Stats', icon: '⚔️' },
    { id: 'market' as Tab, label: 'Market Dashboard', icon: '👑' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-full mx-auto">
        {/* Header with Badge */}
        <header className="mb-6 text-center relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <img
              src="/res/Clash_Royale_Logo.png"
              alt="Clan Wars Badge"
              className="w-120 h-60 opacity-90"
            />
          </div>
          <div className="pt-50">
            <h1 className="text-5xl font-bold text-white mb-2 cr-title">
              ⚔️ C.R.L.F. TRADING ARENA ⚔️
            </h1>
            <p className="text-xl text-white cr-subtitle">
              🏆 Execute trades using legendary battle deck strategies 🏆
            </p>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-6 max-w-2xl mx-auto">
          <div className="relative flex gap-2">
            <input
              type="text"
              placeholder="Search a player"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-yellow-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 font-bold text-lg transition-all"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
            <button
              onClick={handleSearch}
              className="px-6 py-4 cr-button rounded-xl font-bold text-lg transition-all hover:scale-105"
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-3 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 font-black text-lg transition-all rounded-t-2xl relative ${
                  activeTab === tab.id
                    ? 'cr-button text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div
          className={`cr-stats-panel p-6 relative ${
            activeTab === 'market' ? 'h-[calc(100vh)]' : ''
          }`}
          style={{
            backgroundImage:
              activeTab === 'market'
                ? 'url(/res/PurpleEyesBG.png)'
                : 'url(/res/73_SwordInTheMouth_BG.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl" />

          <div className="relative z-10 h-full flex flex-col">
            {activeTab === 'market' && (
              <>
                <div className="mb-4 flex-shrink-0">
                  <h2 className="text-3xl font-bold text-white cr-subtitle">
                    👑 ROYAL MARKET DASHBOARD 👑
                  </h2>
                  <p className="text-yellow-300 text-sm mt-2 font-semibold">
                    ⚡ Real-time trading arena • All active securities ⚡
                  </p>
                </div>
                <div className="flex-1 min-h-0">
                  <FinanceExample playerId="player_002" currentTime={currentTime} />
                </div>
              </>
            )}

            {activeTab === 'stats' && (
              <div className="overflow-y-auto">
                <ResultsPortal key={refreshKey} player={searchQuery} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Trade Button */}
        <button
          onClick={() => setIsTradingOpen(true)}
          className="fixed bottom-8 right-8 cr-button px-8 py-4 rounded-full shadow-2xl hover:scale-110 transition-transform font-black text-xl z-50"
        >
          ⚔️ EXECUTE TRADE
        </button>

        {/* Trading Portal Modal */}
        {isTradingOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-2xl w-full">
              <button
                onClick={() => setIsTradingOpen(false)}
                className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-2xl z-10 transition-colors"
              >
                ✕
              </button>
              <TradingPortal
                onClose={() => setIsTradingOpen(false)}
                onTradeSubmitted={handleTradeSubmitted}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}