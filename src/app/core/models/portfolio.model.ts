// Portfolio and holdings models

export interface Holding {
    tradingSymbol: string;
    exchange: string;
    isin: string;
    quantity: number;
    averagePrice: number;
    lastPrice: number;
    closePrice: number;
    pnl: number;
    pnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
    value: number;
    invested: number;
    t1Quantity: number;
    collateralQuantity: number;
    collateralType: string;
}

export interface Position {
    tradingSymbol: string;
    exchange: string;
    productType: 'MIS' | 'NRML' | 'CNC';
    quantity: number;
    overnightQuantity: number;
    multiplier: number;
    averagePrice: number;
    closePrice: number;
    lastPrice: number;
    value: number;
    pnl: number;
    m2m: number;
    unrealised: number;
    realised: number;
    buyQuantity: number;
    buyPrice: number;
    buyValue: number;
    sellQuantity: number;
    sellPrice: number;
    sellValue: number;
    dayBuyQuantity: number;
    dayBuyPrice: number;
    dayBuyValue: number;
    daySellQuantity: number;
    daySellPrice: number;
    daySellValue: number;
}

export interface PortfolioSummary {
    totalInvestment: number;
    currentValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    dayPnl: number;
    dayPnlPercent: number;
}

export interface Funds {
    availableCash: number;
    usedMargin: number;
    availableMargin: number;
    openingBalance: number;
    payin: number;
    payout: number;
    span: number;
    exposure: number;
    optionPremium: number;
    collateral: number;
    deliveryMargin: number;
}
