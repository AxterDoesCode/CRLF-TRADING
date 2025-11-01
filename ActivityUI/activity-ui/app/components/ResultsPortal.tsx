'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';

interface Trade {
  id: number;
  action: string;
  price: number;
  companyName: string;
  amount: number;
  status: string;
  submittedAt: string;
  completedAt: string | null;
  executionTime: number;
  result: {
    success: boolean;
    executedPrice: number | null;
    executedAmount: number;
    message: string;
  } | null;
  clashRoyaleDeck: {
    deckName: string;
    strategy: string;
  };
}

interface Position {
  symbol: string;
  companyName: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface ProfitLoss {
  totalInvested: number;
  currentValue: number;
  realizedPL: number;
  unrealizedPL: number;
  totalPL: number;
  totalPLPercent: number;
}

interface StockDataPoint {
  time: string;
  value: number;
}

export default function ResultsPortal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const gridRef = useRef<AgGridReact>(null);

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef<Trade>[]>(() => [
    {
      field: 'id' as const,
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'action' as const,
      headerName: 'Action',
      width: 90,
      cellStyle: (params) => {
        if (params.value === 'Buy') {
          return { color: '#16a34a', fontWeight: '600' };
        }
        return { color: '#dc2626', fontWeight: '600' };
      },
    },
    {
      field: 'companyName' as const,
      headerName: 'Company',
      flex: 1,
      minWidth: 120,
    },
    {
      headerName: 'Shares',
      width: 90,
      valueGetter: (params) => params.data?.result?.executedAmount || 0,
    },
    {
      headerName: 'Price',
      width: 100,
      valueGetter: (params) => params.data?.result?.executedPrice || params.data?.price,
      valueFormatter: (params) => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      headerName: 'Total Value',
      width: 120,
      valueGetter: (params) => {
        const price = params.data?.result?.executedPrice || params.data?.price || 0;
        const amount = params.data?.result?.executedAmount || 0;
        return price * amount;
      },
      valueFormatter: (params) => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'completedAt' as const,
      headerName: 'Time',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      },
    },
    {
      field: 'status' as const,
      headerName: 'Status',
      width: 110,
      cellStyle: (params) => {
        if (params.value === 'completed') {
          return { backgroundColor: '#dcfce7', color: '#166534', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' };
        }
        if (params.value === 'processing') {
          return { backgroundColor: '#fef3c7', color: '#854d0e', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' };
        }
        return { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' };
      },
    },
  ], []);

  // AG Grid default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/trading');
      const data = await response.json();

      if (data.success) {
        setTrades(data.trades);

        // Calculate positions from trades
        const calculatedPositions = calculatePositions(data.trades);
        setPositions(calculatedPositions);

        // Calculate P&L
        const calculatedPL = calculateProfitLoss(data.trades, calculatedPositions);
        setProfitLoss(calculatedPL);

        // Generate portfolio value over time
        const portfolioData = generatePortfolioData(data.trades);
        setStockData(portfolioData);
      }
    } catch (error) {
      console.error('Failed to fetch trading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePositions = (trades: Trade[]): Position[] => {
    const positionMap = new Map<string, Position>();

    trades.forEach((trade) => {
      if (trade.status === 'completed' && trade.result?.success) {
        const symbol = trade.companyName.toUpperCase().substring(0, 4);
        const executedPrice = trade.result.executedPrice || trade.price;
        const executedAmount = trade.result.executedAmount;

        if (!positionMap.has(symbol)) {
          positionMap.set(symbol, {
            symbol,
            companyName: trade.companyName,
            shares: 0,
            avgCost: 0,
            currentPrice: executedPrice,
            totalValue: 0,
            profitLoss: 0,
            profitLossPercent: 0,
          });
        }

        const position = positionMap.get(symbol)!;

        if (trade.action === 'Buy') {
          const newTotalCost = (position.avgCost * position.shares) + (executedPrice * executedAmount);
          position.shares += executedAmount;
          position.avgCost = position.shares > 0 ? newTotalCost / position.shares : 0;
        } else if (trade.action === 'Sell') {
          position.shares -= executedAmount;
        }

        position.currentPrice = executedPrice;
        position.totalValue = position.shares * position.currentPrice;
        position.profitLoss = position.totalValue - (position.avgCost * position.shares);
        position.profitLossPercent = position.avgCost > 0
          ? ((position.currentPrice - position.avgCost) / position.avgCost) * 100
          : 0;
      }
    });

    return Array.from(positionMap.values()).filter(pos => pos.shares > 0);
  };

  const calculateProfitLoss = (trades: Trade[], positions: Position[]): ProfitLoss => {
    let totalInvested = 0;
    let realizedPL = 0;

    trades.forEach((trade) => {
      if (trade.status === 'completed' && trade.result?.success) {
        const value = (trade.result.executedPrice || trade.price) * trade.result.executedAmount;
        if (trade.action === 'Buy') {
          totalInvested += value;
        } else if (trade.action === 'Sell') {
          realizedPL += value;
        }
      }
    });

    const currentValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);
    const unrealizedPL = positions.reduce((sum, pos) => sum + pos.profitLoss, 0);
    const totalPL = realizedPL + unrealizedPL - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      realizedPL,
      unrealizedPL,
      totalPL,
      totalPLPercent,
    };
  };

  const generatePortfolioData = (trades: Trade[]): StockDataPoint[] => {
    const data: StockDataPoint[] = [];
    let portfolioValue = 10000; // Starting value

    // Sort trades by completion time
    const completedTrades = trades
      .filter(t => t.status === 'completed' && t.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    // Add starting point
    data.push({
      time: 'Start',
      value: portfolioValue,
    });

    // Track value changes
    completedTrades.forEach((trade) => {
      if (trade.result?.success) {
        const value = (trade.result.executedPrice || trade.price) * trade.result.executedAmount;
        if (trade.action === 'Buy') {
          portfolioValue -= value;
        } else if (trade.action === 'Sell') {
          portfolioValue += value;
        }

        data.push({
          time: new Date(trade.completedAt!).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          value: Math.max(0, portfolioValue),
        });
      }
    });

    return data;
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-lg p-6 h-full flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading portfolio data...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white cr-subtitle">💼 MY BATTLE PORTFOLIO 💼</h2>
        <p className="text-yellow-300 text-sm mt-2 font-semibold">⚡ Real-time victory tracker ⚡</p>
      </div>

      {/* Profit & Loss Summary - Top Section */}
      {profitLoss && (
        <div className="mb-6 space-y-3">
          <div className="cr-card p-4">
            <div className="text-xs text-yellow-300 font-bold uppercase tracking-wide">💰 Total Gold</div>
            <div className="text-2xl font-black text-white mt-1 cr-gold-text">
              ${profitLoss.currentValue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Invested: ${profitLoss.totalInvested.toFixed(2)}
            </div>
          </div>

          <div className={`cr-card p-4 ${profitLoss.totalPL >= 0 ? 'border-green-400' : 'border-red-400'}`}>
            <div className="text-xs text-yellow-300 font-bold uppercase tracking-wide">
              {profitLoss.totalPL >= 0 ? '🏆 Victory Spoils' : '💀 Battle Loss'}
            </div>
            <div className={`text-2xl font-black mt-1 ${profitLoss.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitLoss.totalPL >= 0 ? '+' : ''}${profitLoss.totalPL.toFixed(2)}
            </div>
            <div className={`text-xs font-bold mt-1 ${profitLoss.totalPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {profitLoss.totalPLPercent >= 0 ? '+' : ''}{profitLoss.totalPLPercent.toFixed(2)}%
            </div>
          </div>

          <div className="cr-card p-4 border-purple-400">
            <div className="text-xs text-yellow-300 font-bold uppercase tracking-wide">⚔️ Pending Battles</div>
            <div className={`text-2xl font-black mt-1 ${profitLoss.unrealizedPL >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
              {profitLoss.unrealizedPL >= 0 ? '+' : ''}${profitLoss.unrealizedPL.toFixed(2)}
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Won: ${profitLoss.realizedPL.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Value Chart */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-5 mb-6 border-2 border-yellow-500">
        <h3 className="text-lg font-black text-white mb-4 cr-subtitle">📈 Battle Progress Chart</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={stockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 156, 18, 0.2)" />
            <XAxis
              dataKey="time"
              stroke="#f39c12"
              style={{ fontSize: '10px', fontWeight: 'bold' }}
            />
            <YAxis
              stroke="#f39c12"
              style={{ fontSize: '10px', fontWeight: 'bold' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gold']}
              contentStyle={{ backgroundColor: '#2c3e50', border: '2px solid #f39c12', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f39c12"
              strokeWidth={4}
              dot={{ fill: '#f39c12', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
              name="Gold Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Positions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-5 mb-6 border-2 border-yellow-500">
        <h3 className="text-lg font-black text-white mb-4 cr-subtitle">🎯 Active Troops</h3>
        <div className="overflow-x-auto">
          {positions.length === 0 ? (
            <div className="text-center text-yellow-300 py-8 font-bold">
              💤 No active troops deployed
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-yellow-500">
                  <th className="text-left py-2 px-2 font-black text-yellow-300">Troop</th>
                  <th className="text-right py-2 px-2 font-black text-yellow-300">Units</th>
                  <th className="text-right py-2 px-2 font-black text-yellow-300">Cost</th>
                  <th className="text-right py-2 px-2 font-black text-yellow-300">Value</th>
                  <th className="text-right py-2 px-2 font-black text-yellow-300">P&L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-slate-700">
                    <td className="py-3 px-2">
                      <div className="font-bold text-white">{position.symbol}</div>
                      <div className="text-xs text-gray-400">{position.companyName}</div>
                    </td>
                    <td className="text-right py-3 px-2 text-white font-bold">{position.shares}</td>
                    <td className="text-right py-3 px-2 text-white font-bold">${position.avgCost.toFixed(2)}</td>
                    <td className="text-right py-3 px-2 text-white font-bold">${position.currentPrice.toFixed(2)}</td>
                    <td className="text-right py-3 px-2">
                      <div className={`font-black ${position.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {position.profitLoss >= 0 ? '+' : ''}${position.profitLoss.toFixed(2)}
                      </div>
                      <div className={`text-xs font-bold ${position.profitLoss >= 0 ? 'text-green-300' : 'text-red-300'
                        }`}>
                        {position.profitLossPercent >= 0 ? '+' : ''}{position.profitLossPercent.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-5 border-2 border-yellow-500">
        <h3 className="text-lg font-black text-white mb-4 cr-subtitle">📜 Battle History</h3>
        <div className="ag-theme-quartz" style={{ height: 350, width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={trades}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="normal"
            rowSelection="multiple"
            animateRows={true}
          />
        </div>
      </div>
    </div>
  );
}
