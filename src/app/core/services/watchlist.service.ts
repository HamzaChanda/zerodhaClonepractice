import { Injectable, signal, computed } from '@angular/core';
import { WatchlistItem, Stock } from '../models';
import { MarketDataService } from './market-data.service';

export interface Watchlist {
    id: string;
    name: string;
    items: WatchlistItem[];
}

@Injectable({
    providedIn: 'root'
})
export class WatchlistService {
    private watchlists = signal<Watchlist[]>([
        { id: 'default', name: 'Watchlist 1', items: [] },
        { id: 'watchlist2', name: 'Watchlist 2', items: [] },
        { id: 'watchlist3', name: 'Watchlist 3', items: [] },
        { id: 'watchlist4', name: 'Watchlist 4', items: [] },
        { id: 'watchlist5', name: 'Watchlist 5', items: [] },
    ]);

    private activeWatchlistId = signal<string>('default');

    readonly allWatchlists = this.watchlists.asReadonly();
    readonly currentWatchlistId = this.activeWatchlistId.asReadonly();

    readonly activeWatchlist = computed(() => {
        return this.watchlists().find(w => w.id === this.activeWatchlistId()) || this.watchlists()[0];
    });

    constructor(private marketDataService: MarketDataService) {
        this.initializeDefaultWatchlist();
    }

    private initializeDefaultWatchlist(): void {
        // Add some default stocks to the first watchlist
        const defaultSymbols = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
            'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'ITC',
            'LT', 'AXISBANK', 'WIPRO', 'BAJFINANCE', 'MARUTI'
        ];

        const stocks = this.marketDataService.allStocks();
        const watchlistItems: WatchlistItem[] = defaultSymbols
            .map((symbol, index) => {
                const stock = stocks.find(s => s.symbol === symbol);
                if (stock) {
                    return {
                        ...stock,
                        watchlistId: 'default',
                        position: index
                    };
                }
                return null;
            })
            .filter((item): item is WatchlistItem => item !== null);

        this.watchlists.update(lists => {
            return lists.map(list => {
                if (list.id === 'default') {
                    return { ...list, items: watchlistItems };
                }
                return list;
            });
        });
    }

    setActiveWatchlist(id: string): void {
        this.activeWatchlistId.set(id);
    }

    addToWatchlist(symbol: string, watchlistId?: string): boolean {
        const targetId = watchlistId || this.activeWatchlistId();
        const stock = this.marketDataService.getStock(symbol);

        if (!stock) return false;

        let added = false;

        this.watchlists.update(lists => {
            return lists.map(list => {
                if (list.id === targetId) {
                    // Check if already exists
                    if (list.items.some(item => item.symbol === symbol)) {
                        return list;
                    }

                    added = true;
                    const newItem: WatchlistItem = {
                        ...stock,
                        watchlistId: targetId,
                        position: list.items.length
                    };

                    return { ...list, items: [...list.items, newItem] };
                }
                return list;
            });
        });

        return added;
    }

    removeFromWatchlist(symbol: string, watchlistId?: string): boolean {
        const targetId = watchlistId || this.activeWatchlistId();
        let removed = false;

        this.watchlists.update(lists => {
            return lists.map(list => {
                if (list.id === targetId) {
                    const filteredItems = list.items.filter(item => item.symbol !== symbol);
                    if (filteredItems.length !== list.items.length) {
                        removed = true;
                        return { ...list, items: filteredItems };
                    }
                }
                return list;
            });
        });

        return removed;
    }

    updateWatchlistPrices(): void {
        const stocks = this.marketDataService.allStocks();

        this.watchlists.update(lists => {
            return lists.map(list => {
                const updatedItems = list.items.map(item => {
                    const currentStock = stocks.find(s => s.symbol === item.symbol);
                    if (currentStock) {
                        return {
                            ...item,
                            ltp: currentStock.ltp,
                            change: currentStock.change,
                            changePercent: currentStock.changePercent,
                            high: currentStock.high,
                            low: currentStock.low,
                            previousChange: currentStock.previousChange
                        };
                    }
                    return item;
                });

                return { ...list, items: updatedItems };
            });
        });
    }

    reorderWatchlistItem(symbol: string, newPosition: number, watchlistId?: string): void {
        const targetId = watchlistId || this.activeWatchlistId();

        this.watchlists.update(lists => {
            return lists.map(list => {
                if (list.id === targetId) {
                    const items = [...list.items];
                    const currentIndex = items.findIndex(item => item.symbol === symbol);

                    if (currentIndex !== -1 && newPosition >= 0 && newPosition < items.length) {
                        const [movedItem] = items.splice(currentIndex, 1);
                        items.splice(newPosition, 0, movedItem);

                        // Update positions
                        const reorderedItems = items.map((item, index) => ({
                            ...item,
                            position: index
                        }));

                        return { ...list, items: reorderedItems };
                    }
                }
                return list;
            });
        });
    }

    renameWatchlist(watchlistId: string, newName: string): void {
        this.watchlists.update(lists => {
            return lists.map(list => {
                if (list.id === watchlistId) {
                    return { ...list, name: newName };
                }
                return list;
            });
        });
    }
}
