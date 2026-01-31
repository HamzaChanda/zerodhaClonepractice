// Stock and market data models

export interface Stock {
    symbol: string;
    name: string;
    exchange: 'NSE' | 'BSE';
    segment: 'EQ' | 'FO' | 'CDS' | 'MCX';
    ltp: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousChange?: 'up' | 'down' | null;
}

export interface WatchlistItem extends Stock {
    watchlistId: string;
    position: number;
}

export interface MarketDepthLevel {
    price: number;
    quantity: number;
    orders: number;
}

export interface MarketDepth {
    symbol: string;
    bids: MarketDepthLevel[];
    offers: MarketDepthLevel[];
    totalBidQty: number;
    totalOfferQty: number;
}

export interface OHLC {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Instrument {
    tradingSymbol: string;
    name: string;
    exchange: string;
    segment: string;
    instrumentType: string;
    lotSize: number;
    tickSize: number;
    expiry?: string;
    strike?: number;
    optionType?: 'CE' | 'PE';
}
