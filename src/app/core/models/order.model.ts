// Order and trade models

export type OrderType = 'LIMIT' | 'MARKET' | 'SL' | 'SL-M';
export type OrderVariety = 'regular' | 'amo' | 'co' | 'iceberg' | 'auction';
export type ProductType = 'CNC' | 'MIS' | 'NRML';
export type TransactionType = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'REJECTED' | 'MODIFIED';
export type ValidityType = 'DAY' | 'IOC' | 'TTL';

export interface Order {
    orderId: string;
    exchangeOrderId?: string;
    symbol: string;
    exchange: string;
    transactionType: TransactionType;
    orderType: OrderType;
    productType: ProductType;
    variety: OrderVariety;
    validity: ValidityType;
    quantity: number;
    filledQuantity: number;
    pendingQuantity: number;
    price: number;
    triggerPrice?: number;
    averagePrice?: number;
    status: OrderStatus;
    statusMessage?: string;
    placedAt: Date;
    exchangeTimestamp?: Date;
    tag?: string;
}

export interface GTTOrder {
    id: string;
    symbol: string;
    exchange: string;
    transactionType: TransactionType;
    triggerType: 'single' | 'two-leg';
    lastPrice: number;
    triggerValues: number[];
    orders: {
        price: number;
        quantity: number;
        orderType: OrderType;
    }[];
    status: 'active' | 'triggered' | 'cancelled' | 'rejected' | 'deleted';
    createdAt: Date;
    expiresAt: Date;
}

export interface Trade {
    tradeId: string;
    orderId: string;
    symbol: string;
    exchange: string;
    transactionType: TransactionType;
    productType: ProductType;
    quantity: number;
    price: number;
    fillTimestamp: Date;
}
