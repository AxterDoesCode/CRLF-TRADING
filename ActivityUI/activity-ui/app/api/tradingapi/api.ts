import { useEffect, useState } from 'react';
import useSWR from 'swr';

const BASE_URL = 'http://localhost:3003';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SymbolDetails {
    quantity: number;
    price_per_share: number;
    value: number;
}

export interface PortfolioSnapshot {
    timestamp: number;
    [symbol: string]: SymbolDetails | number;
}

export interface PortfolioRowData {
    ticker: string;
    instrument: string;
    quantity: number;
    purchasePrice: number;
    price: number;
    timeline: number[];
}

function toRowData(snapshots: PortfolioSnapshot[]): PortfolioRowData[] {
    if (!snapshots || snapshots.length === 0) return [];

    const latestSnapshot = snapshots[snapshots.length - 1];
    const stocks: PortfolioRowData[] = [];

    // Extract all stock symbols from the latest snapshot
    for (const key in latestSnapshot) {
        if (key !== 'timestamp') {
            const value = latestSnapshot[key];
            if (typeof value === 'number') continue;
            const stock: SymbolDetails = value;

            // Build timeline from all snapshots
            const timeline = snapshots.map(snapshot => {
                const stockData = snapshot[key];
                if (typeof stockData === 'number' || !stockData) return 0;
                return stockData.price_per_share;
            });

            // Calculate average purchase price (simplified - you might want to track this differently)
            const purchasePrice = timeline[0] || stock.price_per_share;

            stocks.push({
                ticker: key,
                instrument: key,
                quantity: stock.quantity,
                price: stock.price_per_share,
                purchasePrice: purchasePrice,
                timeline: timeline,
            });
        }
    }
    return stocks;
}

export function usePortfolio(playerId: string) {
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

    console.log("Fetching portfolio for", playerId, "at time", currentTime);

    const { data, error, isLoading, mutate } = useSWR(
        playerId ? `${BASE_URL}/portfolio/2LGQJVR2C?T=${currentTime}` : null,
        fetcher,
        {
            refreshInterval: 1000,
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
        }
    );

    const rowData: PortfolioRowData[] = data ? toRowData(data) : [];

    return {
        portfolio: data,
        rowData,
        isLoading,
        isError: error,
        mutate,
    };
}