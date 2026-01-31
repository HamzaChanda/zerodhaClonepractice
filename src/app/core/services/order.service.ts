import { Injectable, signal, computed } from '@angular/core';
import { Order, GTTOrder, Trade, OrderStatus, TransactionType, OrderType, ProductType } from '../models';
import { PortfolioService } from './portfolio.service';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private orders = signal<Order[]>([]);
    private gttOrders = signal<GTTOrder[]>([]);
    private trades = signal<Trade[]>([]);
    private orderIdCounter = 1;

    readonly allOrders = this.orders.asReadonly();
    readonly allGttOrders = this.gttOrders.asReadonly();
    readonly allTrades = this.trades.asReadonly();

    readonly pendingOrders = computed(() =>
        this.orders().filter(o => o.status === 'PENDING' || o.status === 'OPEN')
    );

    readonly executedOrders = computed(() =>
        this.orders().filter(o => o.status === 'COMPLETE')
    );

    readonly cancelledOrders = computed(() =>
        this.orders().filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED')
    );

    constructor(private portfolioService: PortfolioService) {
        // Initialize with some mock orders
        this.initializeMockOrders();
    }

    private initializeMockOrders(): void {
        const mockOrders: Order[] = [
            {
                orderId: 'ORD001',
                symbol: 'RELIANCE',
                exchange: 'NSE',
                transactionType: 'BUY',
                orderType: 'LIMIT',
                productType: 'CNC',
                variety: 'regular',
                validity: 'DAY',
                quantity: 10,
                filledQuantity: 10,
                pendingQuantity: 0,
                price: 2435.50,
                averagePrice: 2435.50,
                status: 'COMPLETE',
                placedAt: new Date(Date.now() - 3600000),
                exchangeTimestamp: new Date(Date.now() - 3500000)
            },
            {
                orderId: 'ORD002',
                symbol: 'TCS',
                exchange: 'NSE',
                transactionType: 'BUY',
                orderType: 'LIMIT',
                productType: 'MIS',
                variety: 'regular',
                validity: 'DAY',
                quantity: 5,
                filledQuantity: 0,
                pendingQuantity: 5,
                price: 3540.00,
                status: 'PENDING',
                placedAt: new Date(Date.now() - 1800000)
            },
            {
                orderId: 'ORD003',
                symbol: 'HDFCBANK',
                exchange: 'NSE',
                transactionType: 'SELL',
                orderType: 'MARKET',
                productType: 'CNC',
                variety: 'regular',
                validity: 'DAY',
                quantity: 20,
                filledQuantity: 20,
                pendingQuantity: 0,
                price: 0,
                averagePrice: 1652.30,
                status: 'COMPLETE',
                placedAt: new Date(Date.now() - 7200000),
                exchangeTimestamp: new Date(Date.now() - 7100000)
            }
        ];

        const mockGttOrders: GTTOrder[] = [
            {
                id: 'GTT001',
                symbol: 'INFY',
                exchange: 'NSE',
                transactionType: 'BUY',
                triggerType: 'single',
                lastPrice: 1456.90,
                triggerValues: [1400.00],
                orders: [{ price: 1400.00, quantity: 50, orderType: 'LIMIT' }],
                status: 'active',
                createdAt: new Date(Date.now() - 86400000),
                expiresAt: new Date(Date.now() + 86400000 * 365)
            },
            {
                id: 'GTT002',
                symbol: 'SBIN',
                exchange: 'NSE',
                transactionType: 'SELL',
                triggerType: 'two-leg',
                lastPrice: 567.85,
                triggerValues: [600.00, 520.00],
                orders: [
                    { price: 600.00, quantity: 100, orderType: 'LIMIT' },
                    { price: 520.00, quantity: 100, orderType: 'LIMIT' }
                ],
                status: 'active',
                createdAt: new Date(Date.now() - 172800000),
                expiresAt: new Date(Date.now() + 86400000 * 365)
            }
        ];

        this.orders.set(mockOrders);
        this.gttOrders.set(mockGttOrders);
    }

    placeOrder(
        symbol: string,
        exchange: string,
        transactionType: TransactionType,
        orderType: OrderType,
        productType: ProductType,
        quantity: number,
        price: number,
        triggerPrice?: number
    ): { success: boolean; orderId?: string; message?: string } {
        // Calculate margin required
        const marginRequired = this.calculateMargin(transactionType, productType, quantity, price);

        // Check margin for buy orders
        if (transactionType === 'BUY') {
            const marginDeducted = this.portfolioService.deductMargin(marginRequired);
            if (!marginDeducted) {
                return { success: false, message: 'Insufficient margin' };
            }
        }

        const orderId = `ORD${String(this.orderIdCounter++).padStart(6, '0')}`;

        const newOrder: Order = {
            orderId,
            symbol,
            exchange,
            transactionType,
            orderType,
            productType,
            variety: 'regular',
            validity: 'DAY',
            quantity,
            filledQuantity: 0,
            pendingQuantity: quantity,
            price,
            triggerPrice,
            status: orderType === 'MARKET' ? 'COMPLETE' : 'PENDING',
            placedAt: new Date()
        };

        // Simulate immediate execution for market orders
        if (orderType === 'MARKET') {
            newOrder.filledQuantity = quantity;
            newOrder.pendingQuantity = 0;
            newOrder.averagePrice = price;
            newOrder.exchangeTimestamp = new Date();

            // Create trade
            this.createTrade(newOrder);
        }

        this.orders.update(orders => [newOrder, ...orders]);

        return { success: true, orderId };
    }

    private calculateMargin(
        transactionType: TransactionType,
        productType: ProductType,
        quantity: number,
        price: number
    ): number {
        const totalValue = quantity * price;

        if (productType === 'MIS') {
            // 5x leverage for intraday
            return totalValue / 5;
        } else if (productType === 'CNC') {
            // Full margin for delivery
            return totalValue;
        } else {
            // NRML - typically used for F&O
            return totalValue * 0.15; // 15% margin
        }
    }

    private createTrade(order: Order): void {
        const trade: Trade = {
            tradeId: `TRD${Date.now()}`,
            orderId: order.orderId,
            symbol: order.symbol,
            exchange: order.exchange,
            transactionType: order.transactionType,
            productType: order.productType,
            quantity: order.filledQuantity,
            price: order.averagePrice || order.price,
            fillTimestamp: new Date()
        };

        this.trades.update(trades => [trade, ...trades]);
    }

    cancelOrder(orderId: string): boolean {
        let cancelled = false;

        this.orders.update(orders => {
            return orders.map(order => {
                if (order.orderId === orderId && (order.status === 'PENDING' || order.status === 'OPEN')) {
                    cancelled = true;

                    // Release margin for buy orders
                    if (order.transactionType === 'BUY') {
                        const margin = this.calculateMargin(
                            order.transactionType,
                            order.productType,
                            order.pendingQuantity,
                            order.price
                        );
                        this.portfolioService.releaseMargin(margin);
                    }

                    return { ...order, status: 'CANCELLED' as OrderStatus };
                }
                return order;
            });
        });

        return cancelled;
    }

    modifyOrder(orderId: string, newPrice: number, newQuantity?: number): boolean {
        let modified = false;

        this.orders.update(orders => {
            return orders.map(order => {
                if (order.orderId === orderId && order.status === 'PENDING') {
                    modified = true;
                    return {
                        ...order,
                        price: newPrice,
                        quantity: newQuantity || order.quantity,
                        pendingQuantity: newQuantity || order.pendingQuantity,
                        status: 'MODIFIED' as OrderStatus
                    };
                }
                return order;
            });
        });

        return modified;
    }

    createGTT(
        symbol: string,
        exchange: string,
        transactionType: TransactionType,
        triggerType: 'single' | 'two-leg',
        lastPrice: number,
        triggerValues: number[],
        orders: { price: number; quantity: number; orderType: OrderType }[]
    ): string {
        const id = `GTT${String(Date.now()).slice(-6)}`;

        const gtt: GTTOrder = {
            id,
            symbol,
            exchange,
            transactionType,
            triggerType,
            lastPrice,
            triggerValues,
            orders,
            status: 'active',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 86400000 * 365) // 1 year
        };

        this.gttOrders.update(gtts => [gtt, ...gtts]);

        return id;
    }

    deleteGTT(id: string): boolean {
        let deleted = false;

        this.gttOrders.update(gtts => {
            return gtts.map(gtt => {
                if (gtt.id === id && gtt.status === 'active') {
                    deleted = true;
                    return { ...gtt, status: 'deleted' as const };
                }
                return gtt;
            });
        });

        return deleted;
    }
}
