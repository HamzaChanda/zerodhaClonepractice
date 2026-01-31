import { Injectable, signal, computed } from '@angular/core';
import { Holding, Position, PortfolioSummary, Funds } from '../models';

// Mock holdings data
const MOCK_HOLDINGS: Holding[] = [
    { tradingSymbol: 'RELIANCE', exchange: 'NSE', isin: 'INE002A01018', quantity: 50, averagePrice: 2300.50, lastPrice: 2456.75, closePrice: 2433.30, pnl: 7812.50, pnlPercent: 6.79, dayChange: 1167.25, dayChangePercent: 0.96, value: 122837.50, invested: 115025.00, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
    { tradingSymbol: 'TCS', exchange: 'NSE', isin: 'INE467B01029', quantity: 25, averagePrice: 3400.00, lastPrice: 3567.80, closePrice: 3583.00, pnl: 4195.00, pnlPercent: 4.94, dayChange: -380.00, dayChangePercent: -0.42, value: 89195.00, invested: 85000.00, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
    { tradingSymbol: 'HDFCBANK', exchange: 'NSE', isin: 'INE040A01034', quantity: 100, averagePrice: 1550.25, lastPrice: 1654.25, closePrice: 1641.50, pnl: 10400.00, pnlPercent: 6.71, dayChange: 1275.00, dayChangePercent: 0.78, value: 165425.00, invested: 155025.00, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
    { tradingSymbol: 'INFY', exchange: 'NSE', isin: 'INE009A01021', quantity: 75, averagePrice: 1380.00, lastPrice: 1456.90, closePrice: 1465.25, pnl: 5767.50, pnlPercent: 5.57, dayChange: -626.25, dayChangePercent: -0.57, value: 109267.50, invested: 103500.00, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
    { tradingSymbol: 'ICICIBANK', exchange: 'NSE', isin: 'INE090A01021', quantity: 150, averagePrice: 920.75, lastPrice: 987.45, closePrice: 981.80, pnl: 10005.00, pnlPercent: 7.24, dayChange: 847.50, dayChangePercent: 0.58, value: 148117.50, invested: 138112.50, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
    { tradingSymbol: 'SBIN', exchange: 'NSE', isin: 'INE062A01020', quantity: 200, averagePrice: 510.30, lastPrice: 567.85, closePrice: 558.90, pnl: 11510.00, pnlPercent: 11.29, dayChange: 1790.00, dayChangePercent: 1.60, value: 113570.00, invested: 102060.00, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
    { tradingSymbol: 'ITC', exchange: 'NSE', isin: 'INE154A01025', quantity: 300, averagePrice: 385.50, lastPrice: 423.45, closePrice: 420.20, pnl: 11385.00, pnlPercent: 9.84, dayChange: 975.00, dayChangePercent: 0.77, value: 127035.00, invested: 115650.00, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
    { tradingSymbol: 'WIPRO', exchange: 'NSE', isin: 'INE075A01022', quantity: 120, averagePrice: 420.00, lastPrice: 456.75, closePrice: 454.60, pnl: 4410.00, pnlPercent: 8.75, dayChange: 258.00, dayChangePercent: 0.47, value: 54810.00, invested: 50400.00, t1Quantity: 0, collateralQuantity: 0, collateralType: '' },
];

// Mock positions data
const MOCK_POSITIONS: Position[] = [
    { tradingSymbol: 'NIFTY25JAN2423000CE', exchange: 'NFO', productType: 'MIS', quantity: 50, overnightQuantity: 0, multiplier: 1, averagePrice: 125.50, closePrice: 120.00, lastPrice: 145.75, value: 7287.50, pnl: 1012.50, m2m: 1012.50, unrealised: 1012.50, realised: 0, buyQuantity: 50, buyPrice: 125.50, buyValue: 6275.00, sellQuantity: 0, sellPrice: 0, sellValue: 0, dayBuyQuantity: 50, dayBuyPrice: 125.50, dayBuyValue: 6275.00, daySellQuantity: 0, daySellPrice: 0, daySellValue: 0 },
    { tradingSymbol: 'BANKNIFTY25JAN51000PE', exchange: 'NFO', productType: 'MIS', quantity: -25, overnightQuantity: 0, multiplier: 1, averagePrice: 180.25, closePrice: 175.00, lastPrice: 165.50, value: -4137.50, pnl: 368.75, m2m: 368.75, unrealised: 368.75, realised: 0, buyQuantity: 0, buyPrice: 0, buyValue: 0, sellQuantity: 25, sellPrice: 180.25, sellValue: 4506.25, dayBuyQuantity: 0, dayBuyPrice: 0, dayBuyValue: 0, daySellQuantity: 25, daySellPrice: 180.25, daySellValue: 4506.25 },
    { tradingSymbol: 'RELIANCE', exchange: 'NSE', productType: 'MIS', quantity: 10, overnightQuantity: 0, multiplier: 1, averagePrice: 2445.00, closePrice: 2433.30, lastPrice: 2456.75, value: 24567.50, pnl: 117.50, m2m: 117.50, unrealised: 117.50, realised: 0, buyQuantity: 10, buyPrice: 2445.00, buyValue: 24450.00, sellQuantity: 0, sellPrice: 0, sellValue: 0, dayBuyQuantity: 10, dayBuyPrice: 2445.00, dayBuyValue: 24450.00, daySellQuantity: 0, daySellPrice: 0, daySellValue: 0 },
];

// Mock funds data
const MOCK_FUNDS: Funds = {
    availableCash: 523456.78,
    usedMargin: 125678.45,
    availableMargin: 397778.33,
    openingBalance: 500000.00,
    payin: 50000.00,
    payout: 0,
    span: 45678.90,
    exposure: 35000.00,
    optionPremium: 12500.55,
    collateral: 250000.00,
    deliveryMargin: 32500.00
};

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    private holdings = signal<Holding[]>([...MOCK_HOLDINGS]);
    private positions = signal<Position[]>([...MOCK_POSITIONS]);
    private funds = signal<Funds>({ ...MOCK_FUNDS });

    readonly allHoldings = this.holdings.asReadonly();
    readonly allPositions = this.positions.asReadonly();
    readonly currentFunds = this.funds.asReadonly();

    readonly portfolioSummary = computed<PortfolioSummary>(() => {
        const holdings = this.holdings();
        const totalInvestment = holdings.reduce((sum, h) => sum + h.invested, 0);
        const currentValue = holdings.reduce((sum, h) => sum + h.value, 0);
        const totalPnl = currentValue - totalInvestment;
        const totalPnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
        const dayPnl = holdings.reduce((sum, h) => sum + h.dayChange, 0);
        const dayPnlPercent = currentValue > 0 ? (dayPnl / (currentValue - dayPnl)) * 100 : 0;

        return {
            totalInvestment: Math.round(totalInvestment * 100) / 100,
            currentValue: Math.round(currentValue * 100) / 100,
            totalPnl: Math.round(totalPnl * 100) / 100,
            totalPnlPercent: Math.round(totalPnlPercent * 100) / 100,
            dayPnl: Math.round(dayPnl * 100) / 100,
            dayPnlPercent: Math.round(dayPnlPercent * 100) / 100
        };
    });

    readonly positionsSummary = computed(() => {
        const positions = this.positions();
        const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
        const totalM2M = positions.reduce((sum, p) => sum + p.m2m, 0);

        return {
            totalPnl: Math.round(totalPnl * 100) / 100,
            totalM2M: Math.round(totalM2M * 100) / 100,
            openPositions: positions.filter(p => p.quantity !== 0).length
        };
    });

    updateHoldingPrice(symbol: string, newPrice: number): void {
        this.holdings.update(holdings => {
            return holdings.map(h => {
                if (h.tradingSymbol === symbol) {
                    const value = h.quantity * newPrice;
                    const pnl = value - h.invested;
                    const pnlPercent = (pnl / h.invested) * 100;
                    const dayChange = (newPrice - h.closePrice) * h.quantity;
                    const dayChangePercent = ((newPrice - h.closePrice) / h.closePrice) * 100;

                    return {
                        ...h,
                        lastPrice: newPrice,
                        value,
                        pnl,
                        pnlPercent,
                        dayChange,
                        dayChangePercent
                    };
                }
                return h;
            });
        });
    }

    updatePositionPrice(symbol: string, newPrice: number): void {
        this.positions.update(positions => {
            return positions.map(p => {
                if (p.tradingSymbol === symbol) {
                    const value = p.quantity * newPrice;
                    const pnl = p.quantity > 0
                        ? (newPrice - p.averagePrice) * p.quantity
                        : (p.averagePrice - newPrice) * Math.abs(p.quantity);

                    return {
                        ...p,
                        lastPrice: newPrice,
                        value,
                        pnl,
                        m2m: pnl,
                        unrealised: pnl
                    };
                }
                return p;
            });
        });
    }

    deductMargin(amount: number): boolean {
        const currentFunds = this.funds();
        if (amount > currentFunds.availableMargin) {
            return false;
        }

        this.funds.update(f => ({
            ...f,
            usedMargin: f.usedMargin + amount,
            availableMargin: f.availableMargin - amount
        }));

        return true;
    }

    releaseMargin(amount: number): void {
        this.funds.update(f => ({
            ...f,
            usedMargin: Math.max(0, f.usedMargin - amount),
            availableMargin: f.availableMargin + amount
        }));
    }
}
