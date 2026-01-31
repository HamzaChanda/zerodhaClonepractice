import { Injectable, signal } from '@angular/core';
import { interval, Subject, BehaviorSubject } from 'rxjs';
import { Stock, WatchlistItem, MarketDepth, OHLC } from '../models';

// Mock stock data - 50+ stocks
const MOCK_STOCKS: Stock[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', segment: 'EQ', ltp: 2456.75, change: 23.45, changePercent: 0.96, open: 2440.00, high: 2465.00, low: 2435.50, close: 2433.30, volume: 5234567 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', segment: 'EQ', ltp: 3567.80, change: -15.20, changePercent: -0.42, open: 3580.00, high: 3590.00, low: 3550.00, close: 3583.00, volume: 1234567 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', segment: 'EQ', ltp: 1654.25, change: 12.75, changePercent: 0.78, open: 1645.00, high: 1660.00, low: 1640.00, close: 1641.50, volume: 3456789 },
    { symbol: 'INFY', name: 'Infosys', exchange: 'NSE', segment: 'EQ', ltp: 1456.90, change: -8.35, changePercent: -0.57, open: 1465.00, high: 1470.00, low: 1450.00, close: 1465.25, volume: 2345678 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', segment: 'EQ', ltp: 987.45, change: 5.65, changePercent: 0.58, open: 982.00, high: 990.00, low: 980.00, close: 981.80, volume: 4567890 },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', exchange: 'NSE', segment: 'EQ', ltp: 2345.60, change: -4.80, changePercent: -0.20, open: 2350.00, high: 2360.00, low: 2340.00, close: 2350.40, volume: 987654 },
    { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', segment: 'EQ', ltp: 567.85, change: 8.95, changePercent: 1.60, open: 560.00, high: 570.00, low: 555.00, close: 558.90, volume: 6789012 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', exchange: 'NSE', segment: 'EQ', ltp: 1234.70, change: 18.30, changePercent: 1.50, open: 1220.00, high: 1240.00, low: 1215.00, close: 1216.40, volume: 2345678 },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', exchange: 'NSE', segment: 'EQ', ltp: 1876.55, change: -12.45, changePercent: -0.66, open: 1890.00, high: 1895.00, low: 1870.00, close: 1889.00, volume: 1567890 },
    { symbol: 'ITC', name: 'ITC Limited', exchange: 'NSE', segment: 'EQ', ltp: 423.45, change: 3.25, changePercent: 0.77, open: 420.00, high: 425.00, low: 418.00, close: 420.20, volume: 8901234 },
    { symbol: 'LT', name: 'Larsen & Toubro', exchange: 'NSE', segment: 'EQ', ltp: 2890.30, change: 45.60, changePercent: 1.60, open: 2850.00, high: 2900.00, low: 2840.00, close: 2844.70, volume: 1234567 },
    { symbol: 'AXISBANK', name: 'Axis Bank', exchange: 'NSE', segment: 'EQ', ltp: 1045.80, change: -7.20, changePercent: -0.68, open: 1055.00, high: 1058.00, low: 1040.00, close: 1053.00, volume: 3456789 },
    { symbol: 'WIPRO', name: 'Wipro', exchange: 'NSE', segment: 'EQ', ltp: 456.75, change: 2.15, changePercent: 0.47, open: 455.00, high: 460.00, low: 452.00, close: 454.60, volume: 2345678 },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance', exchange: 'NSE', segment: 'EQ', ltp: 6789.45, change: 89.55, changePercent: 1.34, open: 6700.00, high: 6800.00, low: 6680.00, close: 6699.90, volume: 567890 },
    { symbol: 'MARUTI', name: 'Maruti Suzuki', exchange: 'NSE', segment: 'EQ', ltp: 10234.60, change: -156.40, changePercent: -1.51, open: 10400.00, high: 10420.00, low: 10200.00, close: 10391.00, volume: 234567 },
    { symbol: 'HCLTECH', name: 'HCL Technologies', exchange: 'NSE', segment: 'EQ', ltp: 1234.55, change: 11.45, changePercent: 0.94, open: 1225.00, high: 1240.00, low: 1220.00, close: 1223.10, volume: 1234567 },
    { symbol: 'ASIANPAINT', name: 'Asian Paints', exchange: 'NSE', segment: 'EQ', ltp: 2890.45, change: -23.55, changePercent: -0.81, open: 2910.00, high: 2920.00, low: 2880.00, close: 2914.00, volume: 456789 },
    { symbol: 'SUNPHARMA', name: 'Sun Pharma', exchange: 'NSE', segment: 'EQ', ltp: 1123.80, change: 15.20, changePercent: 1.37, open: 1110.00, high: 1130.00, low: 1105.00, close: 1108.60, volume: 1567890 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors', exchange: 'NSE', segment: 'EQ', ltp: 567.90, change: 12.35, changePercent: 2.22, open: 556.00, high: 570.00, low: 550.00, close: 555.55, volume: 5678901 },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', exchange: 'NSE', segment: 'EQ', ltp: 7890.25, change: -45.75, changePercent: -0.58, open: 7930.00, high: 7950.00, low: 7870.00, close: 7936.00, volume: 234567 },
    { symbol: 'TITAN', name: 'Titan Company', exchange: 'NSE', segment: 'EQ', ltp: 3234.65, change: 28.35, changePercent: 0.88, open: 3210.00, high: 3245.00, low: 3200.00, close: 3206.30, volume: 789012 },
    { symbol: 'NESTLEIND', name: 'Nestle India', exchange: 'NSE', segment: 'EQ', ltp: 22345.80, change: 156.20, changePercent: 0.70, open: 22200.00, high: 22400.00, low: 22150.00, close: 22189.60, volume: 56789 },
    { symbol: 'POWERGRID', name: 'Power Grid Corp', exchange: 'NSE', segment: 'EQ', ltp: 245.30, change: 3.70, changePercent: 1.53, open: 242.00, high: 247.00, low: 240.00, close: 241.60, volume: 4567890 },
    { symbol: 'NTPC', name: 'NTPC Limited', exchange: 'NSE', segment: 'EQ', ltp: 234.55, change: -2.45, changePercent: -1.03, open: 237.00, high: 238.00, low: 233.00, close: 237.00, volume: 5678901 },
    { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', exchange: 'NSE', segment: 'EQ', ltp: 178.90, change: 4.80, changePercent: 2.76, open: 175.00, high: 180.00, low: 174.00, close: 174.10, volume: 6789012 },
    { symbol: 'JSWSTEEL', name: 'JSW Steel', exchange: 'NSE', segment: 'EQ', ltp: 789.45, change: 12.55, changePercent: 1.62, open: 778.00, high: 792.00, low: 775.00, close: 776.90, volume: 2345678 },
    { symbol: 'TATASTEEL', name: 'Tata Steel', exchange: 'NSE', segment: 'EQ', ltp: 134.75, change: -1.25, changePercent: -0.92, open: 136.00, high: 137.00, low: 133.50, close: 136.00, volume: 8901234 },
    { symbol: 'ADANIENT', name: 'Adani Enterprises', exchange: 'NSE', segment: 'EQ', ltp: 2567.90, change: 67.10, changePercent: 2.68, open: 2510.00, high: 2580.00, low: 2500.00, close: 2500.80, volume: 1234567 },
    { symbol: 'ADANIPORTS', name: 'Adani Ports', exchange: 'NSE', segment: 'EQ', ltp: 987.65, change: -8.35, changePercent: -0.84, open: 995.00, high: 1000.00, low: 985.00, close: 996.00, volume: 1567890 },
    { symbol: 'TECHM', name: 'Tech Mahindra', exchange: 'NSE', segment: 'EQ', ltp: 1234.90, change: 18.60, changePercent: 1.53, open: 1220.00, high: 1240.00, low: 1215.00, close: 1216.30, volume: 1234567 },
    { symbol: 'DRREDDY', name: 'Dr. Reddys Labs', exchange: 'NSE', segment: 'EQ', ltp: 5678.45, change: 45.55, changePercent: 0.81, open: 5640.00, high: 5690.00, low: 5620.00, close: 5632.90, volume: 234567 },
    { symbol: 'CIPLA', name: 'Cipla', exchange: 'NSE', segment: 'EQ', ltp: 1123.60, change: -9.40, changePercent: -0.83, open: 1135.00, high: 1140.00, low: 1120.00, close: 1133.00, volume: 987654 },
    { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', exchange: 'NSE', segment: 'EQ', ltp: 1567.80, change: 23.20, changePercent: 1.50, open: 1550.00, high: 1575.00, low: 1545.00, close: 1544.60, volume: 678901 },
    { symbol: 'INDUSINDBK', name: 'IndusInd Bank', exchange: 'NSE', segment: 'EQ', ltp: 1234.55, change: -15.45, changePercent: -1.24, open: 1250.00, high: 1255.00, low: 1230.00, close: 1250.00, volume: 1234567 },
    { symbol: 'EICHERMOT', name: 'Eicher Motors', exchange: 'NSE', segment: 'EQ', ltp: 3890.70, change: 56.30, changePercent: 1.47, open: 3840.00, high: 3900.00, low: 3830.00, close: 3834.40, volume: 345678 },
    { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', exchange: 'NSE', segment: 'EQ', ltp: 4123.45, change: -34.55, changePercent: -0.83, open: 4160.00, high: 4170.00, low: 4110.00, close: 4158.00, volume: 234567 },
    { symbol: 'COALINDIA', name: 'Coal India', exchange: 'NSE', segment: 'EQ', ltp: 234.60, change: 5.40, changePercent: 2.36, open: 230.00, high: 236.00, low: 228.00, close: 229.20, volume: 4567890 },
    { symbol: 'BPCL', name: 'Bharat Petroleum', exchange: 'NSE', segment: 'EQ', ltp: 345.80, change: 6.20, changePercent: 1.83, open: 340.00, high: 348.00, low: 338.00, close: 339.60, volume: 3456789 },
    { symbol: 'GRASIM', name: 'Grasim Industries', exchange: 'NSE', segment: 'EQ', ltp: 2123.45, change: -18.55, changePercent: -0.87, open: 2140.00, high: 2150.00, low: 2115.00, close: 2142.00, volume: 456789 },
    { symbol: 'SHREECEM', name: 'Shree Cement', exchange: 'NSE', segment: 'EQ', ltp: 25678.90, change: 278.10, changePercent: 1.09, open: 25450.00, high: 25750.00, low: 25400.00, close: 25400.80, volume: 23456 },
    { symbol: 'DIVISLAB', name: 'Divis Laboratories', exchange: 'NSE', segment: 'EQ', ltp: 3456.75, change: 34.25, changePercent: 1.00, open: 3430.00, high: 3465.00, low: 3420.00, close: 3422.50, volume: 345678 },
    { symbol: 'BRITANNIA', name: 'Britannia Industries', exchange: 'NSE', segment: 'EQ', ltp: 4890.35, change: -45.65, changePercent: -0.92, open: 4935.00, high: 4950.00, low: 4880.00, close: 4936.00, volume: 234567 },
    { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', exchange: 'NSE', segment: 'EQ', ltp: 5678.90, change: 89.10, changePercent: 1.59, open: 5600.00, high: 5700.00, low: 5580.00, close: 5589.80, volume: 123456 },
    { symbol: 'M&M', name: 'Mahindra & Mahindra', exchange: 'NSE', segment: 'EQ', ltp: 1567.45, change: 23.55, changePercent: 1.53, open: 1550.00, high: 1575.00, low: 1545.00, close: 1543.90, volume: 1234567 },
    { symbol: 'HINDALCO', name: 'Hindalco Industries', exchange: 'NSE', segment: 'EQ', ltp: 456.80, change: -5.20, changePercent: -1.13, open: 462.00, high: 465.00, low: 455.00, close: 462.00, volume: 2345678 },
    { symbol: 'SBILIFE', name: 'SBI Life Insurance', exchange: 'NSE', segment: 'EQ', ltp: 1345.60, change: 12.40, changePercent: 0.93, open: 1335.00, high: 1350.00, low: 1330.00, close: 1333.20, volume: 567890 },
    { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', exchange: 'NSE', segment: 'EQ', ltp: 567.85, change: -4.15, changePercent: -0.73, open: 572.00, high: 575.00, low: 565.00, close: 572.00, volume: 1234567 },
    { symbol: 'TATACONSUM', name: 'Tata Consumer Products', exchange: 'NSE', segment: 'EQ', ltp: 890.45, change: 8.55, changePercent: 0.97, open: 883.00, high: 895.00, low: 880.00, close: 881.90, volume: 987654 },
    { symbol: 'PIDILITIND', name: 'Pidilite Industries', exchange: 'NSE', segment: 'EQ', ltp: 2678.90, change: 28.10, changePercent: 1.06, open: 2655.00, high: 2690.00, low: 2650.00, close: 2650.80, volume: 234567 },
    { symbol: 'VEDL', name: 'Vedanta Limited', exchange: 'NSE', segment: 'EQ', ltp: 345.70, change: 7.30, changePercent: 2.16, open: 340.00, high: 348.00, low: 338.00, close: 338.40, volume: 5678901 },
];

@Injectable({
    providedIn: 'root'
})
export class MarketDataService {
    private stocks = signal<Stock[]>([...MOCK_STOCKS]);
    private priceUpdateSubject = new Subject<{ symbol: string, price: number, change: 'up' | 'down' }>();
    private isStreaming = false;

    readonly allStocks = this.stocks.asReadonly();
    readonly priceUpdates$ = this.priceUpdateSubject.asObservable();

    constructor() {
        this.startPriceSimulation();
    }

    private startPriceSimulation(): void {
        if (this.isStreaming) return;
        this.isStreaming = true;

        // Simulate real-time price updates every 500ms
        interval(500).subscribe(() => {
            const numUpdates = Math.floor(Math.random() * 5) + 1; // 1-5 updates per tick

            for (let i = 0; i < numUpdates; i++) {
                const randomIndex = Math.floor(Math.random() * MOCK_STOCKS.length);
                this.updateStockPrice(randomIndex);
            }
        });
    }

    private updateStockPrice(index: number): void {
        this.stocks.update(stocks => {
            const newStocks = [...stocks];
            const stock = { ...newStocks[index] };

            // Random price change between -0.5% and +0.5%
            const changePercent = (Math.random() - 0.5) * 1;
            const priceChange = stock.ltp * (changePercent / 100);
            const previousLtp = stock.ltp;

            stock.ltp = Math.round((stock.ltp + priceChange) * 100) / 100;
            stock.change = Math.round((stock.ltp - stock.close) * 100) / 100;
            stock.changePercent = Math.round(((stock.ltp - stock.close) / stock.close) * 10000) / 100;

            // Update high/low
            if (stock.ltp > stock.high) stock.high = stock.ltp;
            if (stock.ltp < stock.low) stock.low = stock.ltp;

            // Track previous change for flash effect
            stock.previousChange = stock.ltp > previousLtp ? 'up' : 'down';

            newStocks[index] = stock;

            // Emit price update for flash effects
            this.priceUpdateSubject.next({
                symbol: stock.symbol,
                price: stock.ltp,
                change: stock.previousChange
            });

            return newStocks;
        });
    }

    getStock(symbol: string): Stock | undefined {
        return this.stocks().find(s => s.symbol === symbol);
    }

    searchStocks(query: string): Stock[] {
        const lowerQuery = query.toLowerCase();
        return this.stocks().filter(s =>
            s.symbol.toLowerCase().includes(lowerQuery) ||
            s.name.toLowerCase().includes(lowerQuery)
        );
    }

    generateMarketDepth(symbol: string): MarketDepth {
        const stock = this.getStock(symbol);
        if (!stock) {
            return { symbol, bids: [], offers: [], totalBidQty: 0, totalOfferQty: 0 };
        }

        const bids: { price: number; quantity: number; orders: number }[] = [];
        const offers: { price: number; quantity: number; orders: number }[] = [];
        const tickSize = 0.05;

        // Generate 5 levels of bids and offers
        for (let i = 0; i < 5; i++) {
            bids.push({
                price: Math.round((stock.ltp - (i + 1) * tickSize) * 100) / 100,
                quantity: Math.floor(Math.random() * 10000) + 100,
                orders: Math.floor(Math.random() * 50) + 1
            });
            offers.push({
                price: Math.round((stock.ltp + (i + 1) * tickSize) * 100) / 100,
                quantity: Math.floor(Math.random() * 10000) + 100,
                orders: Math.floor(Math.random() * 50) + 1
            });
        }

        return {
            symbol,
            bids,
            offers,
            totalBidQty: bids.reduce((sum, b) => sum + b.quantity, 0),
            totalOfferQty: offers.reduce((sum, o) => sum + o.quantity, 0)
        };
    }

    generateOHLCData(symbol: string, days: number = 100): OHLC[] {
        const stock = this.getStock(symbol);
        if (!stock) return [];

        const data: OHLC[] = [];
        let currentPrice = stock.ltp;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        for (let i = days; i >= 0; i--) {
            const volatility = (Math.random() - 0.5) * 0.04; // 4% max daily volatility
            const open = currentPrice;
            const changePercent = volatility;
            const close = open * (1 + changePercent);
            const high = Math.max(open, close) * (1 + Math.random() * 0.02);
            const low = Math.min(open, close) * (1 - Math.random() * 0.02);

            data.push({
                time: Math.floor((now - i * dayMs) / 1000),
                open: Math.round(open * 100) / 100,
                high: Math.round(high * 100) / 100,
                low: Math.round(low * 100) / 100,
                close: Math.round(close * 100) / 100,
                volume: Math.floor(Math.random() * 1000000) + 100000
            });

            currentPrice = close;
        }

        return data;
    }
}
