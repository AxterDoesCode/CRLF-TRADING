'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { usePortfolio } from '../api/tradingapi/api';

interface Position {
  symbol: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface ProfitLoss {
  startingValue: number;
  currentValue: number;
  totalPL: number;
  totalPLPercent: number;
  cashValue: number;
  stocksValue: number;
}

interface ChartDataPoint {
  time: number;
  totalValue: number;
  cash: number;
  [key: string]: number; // For individual stock values
}

const STARTING_PORTFOLIO_VALUE = 5000; // $100k starting value
const MAX_CHART_POINTS = 60; // Keep last 60 data points

// Define colors outside component to prevent recreation
const STOCK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ResultsPortal() {
  const { portfolio, isLoading } = usePortfolio('2LGQJVR2C');
  const [positions, setPositions] = useState<Position[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);
  const gridRef = useRef<AgGridReact>(null);
  const lastProcessedTimestamp = useRef<number>(-1);

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef<Position>[]>(() => [
    {
      field: 'symbol',
      headerName: 'Symbol',
      width: 100,
      cellStyle: { fontWeight: '600' }
    },
    {
      field: 'shares',
      headerName: 'Shares',
      width: 100,
      type: 'rightAligned',
    },
    {
      field: 'currentPrice',
      headerName: 'Current Price',
      width: 130,
      type: 'rightAligned',
      valueFormatter: (params) => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'totalValue',
      headerName: 'Total Value',
      width: 130,
      type: 'rightAligned',
      valueFormatter: (params) => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'profitLoss',
      headerName: 'P&L',
      width: 120,
      type: 'rightAligned',
      cellStyle: (params) => ({
        color: params.value >= 0 ? '#16a34a' : '#dc2626',
        fontWeight: '600'
      }),
      valueFormatter: (params) => {
        const val = params.value || 0;
        return `${val >= 0 ? '+' : ''}$${val.toFixed(2)}`;
      },
    },
    {
      field: 'profitLossPercent',
      headerName: 'P&L %',
      width: 100,
      type: 'rightAligned',
      cellStyle: (params) => ({
        color: params.value >= 0 ? '#16a34a' : '#dc2626',
        fontWeight: '600'
      }),
      valueFormatter: (params) => {
        const val = params.value || 0;
        return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
      },
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  useEffect(() => {
    if (!portfolio || portfolio.length === 0) return;

    // Get the latest snapshot
    const latestSnapshot = portfolio[portfolio.length - 1];

    // Check if we've already processed this timestamp
    if (latestSnapshot.timestamp === lastProcessedTimestamp.current) {
      return;
    }
    lastProcessedTimestamp.current = latestSnapshot.timestamp;

    // Extract stock symbols only once when they change
    const currentSymbols = Object.keys(latestSnapshot).filter(key => key !== 'timestamp' && key !== 'cash');
    setStockSymbols(prevSymbols => {
      // Only update if symbols actually changed
      if (JSON.stringify(prevSymbols.sort()) !== JSON.stringify(currentSymbols.sort())) {
        return currentSymbols;
      }
      return prevSymbols;
    });

    // Calculate positions from latest snapshot
    const calculatedPositions: Position[] = [];
    let cashValue = 0;
    let stocksValue = 0;

    for (const key in latestSnapshot) {
      if (key === 'timestamp') continue;

      const asset = latestSnapshot[key];

      if (key === 'cash') {
        cashValue = asset.value;
      } else {
        // It's a stock
        const stockValue = asset.value;
        stocksValue += stockValue;

        // Calculate P&L based on initial cost vs current value
        const purchasePrice = portfolio[0][key]?.price_per_share || asset.price_per_share;
        const profitLoss = asset.quantity * (asset.price_per_share - purchasePrice);
        const profitLossPercent = purchasePrice > 0
          ? ((asset.price_per_share - purchasePrice) / purchasePrice) * 100
          : 0;

        calculatedPositions.push({
          symbol: key,
          shares: asset.quantity,
          currentPrice: asset.price_per_share,
          totalValue: stockValue,
          profitLoss,
          profitLossPercent,
        });
      }
    }

    setPositions(calculatedPositions);

    // Calculate overall P&L
    const currentValue = cashValue + stocksValue;
    const totalPL = currentValue - STARTING_PORTFOLIO_VALUE;
    const totalPLPercent = ((currentValue - STARTING_PORTFOLIO_VALUE) / STARTING_PORTFOLIO_VALUE) * 100;

    setProfitLoss({
      startingValue: STARTING_PORTFOLIO_VALUE,
      currentValue,
      totalPL,
      totalPLPercent,
      cashValue,
      stocksValue,
    });

    // Create new chart point from latest snapshot
    const newPoint: ChartDataPoint = {
      time: latestSnapshot.timestamp,
      cash: latestSnapshot.cash.value,
      totalValue: 0,
    };

    let total = latestSnapshot.cash.value;

    // Add each stock's value
    for (const key in latestSnapshot) {
      if (key !== 'timestamp' && key !== 'cash') {
        const stockValue = latestSnapshot[key].value;
        newPoint[key] = stockValue;
        total += stockValue;
      }
    }

    newPoint.totalValue = total;

    // Append new point and remove old ones if exceeding max
    setChartData(prevData => {
      // Check if this point already exists
      if (prevData.length > 0 && prevData[prevData.length - 1].time === newPoint.time) {
        return prevData;
      }

      const newData = [...prevData, newPoint];

      // Keep only the last MAX_CHART_POINTS
      if (newData.length > MAX_CHART_POINTS) {
        return newData.slice(newData.length - MAX_CHART_POINTS);
      }

      return newData;
    });
  }, [portfolio]);

  // Memoize the chart component to prevent unnecessary re-renders
  const chart = useMemo(() => (
    <LineChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 156, 18, 0.2)" />
      <XAxis
        dataKey="time"
        stroke="#f39c12"
        style={{ fontSize: '10px', fontWeight: 'bold' }}
        label={{ value: 'Time (T)', position: 'insideBottom', offset: -5, fill: '#f39c12' }}
      />
      <YAxis
        stroke="#f39c12"
        style={{ fontSize: '10px', fontWeight: 'bold' }}
        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
      />
      <Tooltip
        formatter={(value: number) => `$${value.toFixed(2)}`}
        contentStyle={{
          backgroundColor: '#2c3e50',
          border: '2px solid #f39c12',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: 'bold'
        }}
      />
      <Legend />

      {/* Total Portfolio Value */}
      <Line
        type="monotone"
        dataKey="totalValue"
        stroke="#f39c12"
        strokeWidth={1}
        dot={false}
        name="Total Value"
        isAnimationActive={false}
      />

      {/* Cash Line */}
      {/* <Line
        type="monotone"
        dataKey="cash"
        stroke="#60a5fa"
        strokeWidth={1}
        dot={false}
        name="Cash"
        isAnimationActive={false}
      /> */}

      {/* Individual Stock Lines */}
      {/* {stockSymbols.map((symbol, index) => (
        <Line
          key={symbol}
          type="monotone"
          dataKey={symbol}
          stroke={STOCK_COLORS[index % STOCK_COLORS.length]}
          strokeWidth={1}
          dot={false}
          name={symbol}
          isAnimationActive={false}
        />
      ))} */}
    </LineChart>
  ), [chartData, stockSymbols]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white cr-subtitle chewy-regular">💼 MY BATTLE PORTFOLIO 💼</h2>
        <p className="text-yellow-300 text-sm mt-2 font-semibold chewy-regular">⚡ Real-time victory tracker ⚡</p>
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
              Started: ${profitLoss.startingValue.toFixed(2)}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="cr-card p-4 border-blue-400">
              <div className="text-xs text-yellow-300 font-bold uppercase tracking-wide">💵 Cash</div>
              <div className="text-xl font-black text-blue-300 mt-1">
                ${profitLoss.cashValue.toFixed(2)}
              </div>
            </div>

            <div className="cr-card p-4 border-green-400">
              <div className="text-xs text-yellow-300 font-bold uppercase tracking-wide">📈 Stocks</div>
              <div className="text-xl font-black text-green-300 mt-1">
                ${profitLoss.stocksValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Value Chart */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-5 mb-6 border-2 border-yellow-500">
        <h3 className="text-lg font-black text-white mb-4 cr-subtitle">📈 Battle Progress Chart</h3>
        <ResponsiveContainer width="100%" height={300}>
          {chart}
        </ResponsiveContainer>
      </div>

      {/* Current Positions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-5 mb-6 border-2 border-yellow-500">
        <h3 className="text-lg font-black text-white mb-4 cr-subtitle">🎯 Active Troops</h3>
        <div className="ag-theme-quartz-dark" style={{ height: 300, width: '100%' }}>
          {positions.length === 0 ? (
            <div className="text-center text-yellow-300 py-8 font-bold">
              💤 No active troops deployed
            </div>
          ) : (
            <AgGridReact
              ref={gridRef}
              rowData={positions}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              domLayout="normal"
              animateRows={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}