'use client';

import { useState } from 'react';
import TradingPortal from './components/TradingPortal';
import ResultsPortal from './components/ResultsPortal';
import { FinanceExample } from './src/FinanceExample';

type Tab =  'stats' | 'market';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isTradingOpen, setIsTradingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  const handleTradeSubmitted = () => {
    // Trigger a refresh of the results portal
    setRefreshKey(prev => prev + 1);
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

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-3 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 font-black text-lg transition-all rounded-t-2xl relative ${activeTab === tab.id
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
          className={`cr-stats-panel p-6 relative ${activeTab === 'market' ? 'h-[calc(100vh)]' : ''}`}
          style={{
            backgroundImage: activeTab === 'market'
              ? 'url(/res/PurpleEyesBG.png)'
              : 'url(/res/73_SwordInTheMouth_BG.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
          }}
        >
          {/* Overlay for better text readability */}
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
                  <FinanceExample />
                </div>
              </>
            )}

            {activeTab === 'stats' && (
              <div className="overflow-y-auto">
                <ResultsPortal key={refreshKey} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Trading Portal */}
        <div
          className={`fixed top-[0%] right-6 z-50 transition-transform duration-500 ease-in-out 
        ${isTradingOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
          style={{ width: '30%', height: '10%' }}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsTradingOpen(!isTradingOpen)}
            className="cr-button absolute left-0 top-0 -translate-x-full text-white px-1 py-1 rounded-l-2xl shadow-2xl flex flex-col items-center gap-3"
            aria-label={isTradingOpen ? 'Close Trading Panel' : 'Open Trading Panel'}
          >
          <div class='flex flex-row'>
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${isTradingOpen ? 'rotate-0' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              {!isTradingOpen ? 
              'Open Trading':
              'Close Trading'
              }
            </div>

          </div>
          </button>

          {/* Trading Portal Panel */}
          <div
            className="cr-stats-panel shadow-2xl rounded-2xl overflow-hidden max-h-[calc(100vh)] overflow-y-auto relative"
            style={{
              backgroundImage: 'url(/res/Spending_the_Loot.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'overlay',
            }}
          >
            <div className="absolute inset-0 bg-slate-900/85 rounded-2xl" />
            <div className="relative z-10">
              <TradingPortal onTradeSubmitted={handleTradeSubmitted} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}