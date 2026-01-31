import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WatchlistService, MarketDataService } from '../../core/services';
import { WatchlistItem } from '../../core/models';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside class="w-80 border-r flex flex-col h-full bg-[var(--kite-bg)]">
      <!-- Watchlist Tabs -->
      <div class="flex items-center border-b">
        @for (watchlist of watchlistService.allWatchlists(); track watchlist.id; let i = $index) {
          <button 
            (click)="watchlistService.setActiveWatchlist(watchlist.id)"
            class="flex-1 px-2 py-2.5 text-xs font-medium transition-colors border-b-2"
            [class.border-kite-accent]="watchlist.id === watchlistService.currentWatchlistId()"
            [class.text-kite-accent]="watchlist.id === watchlistService.currentWatchlistId()"
            [class.border-transparent]="watchlist.id !== watchlistService.currentWatchlistId()"
            [class.text-[var(--kite-text-muted)]]="watchlist.id !== watchlistService.currentWatchlistId()"
          >
            {{ i + 1 }}
          </button>
        }
      </div>

      <!-- Search within watchlist -->
      <div class="p-2 border-b">
        <div class="flex items-center gap-2 px-2 py-1.5 rounded-md border bg-[var(--kite-bg-darker)]">
          <svg class="w-4 h-4 text-[var(--kite-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search eg: infy bse, nifty fut" 
            class="flex-1 bg-transparent text-sm outline-none"
            [(ngModel)]="filterQuery"
            (input)="filterWatchlist()"
          >
          <span class="text-xs text-[var(--kite-text-muted)]">{{ filteredItems().length }}</span>
        </div>
      </div>

      <!-- Watchlist Items -->
      <div class="flex-1 overflow-y-auto">
        @for (item of filteredItems(); track item.symbol) {
          <div 
            class="group flex items-center justify-between px-3 py-2.5 hover:bg-[var(--kite-surface-hover)] cursor-pointer transition-all border-b border-[var(--kite-border)]/50"
            [class.price-flash-green]="item.previousChange === 'up'"
            [class.price-flash-red]="item.previousChange === 'down'"
            (mouseenter)="hoveredItem.set(item.symbol)"
            (mouseleave)="hoveredItem.set(null)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm truncate">{{ item.symbol }}</span>
                <span class="text-[10px] text-[var(--kite-text-dim)]">{{ item.exchange }}</span>
              </div>
              @if (hoveredItem() === item.symbol) {
                <div class="flex items-center gap-1 mt-1">
                  <button class="btn-buy text-xs !px-2 !py-0.5" (click)="openBuy(item); $event.stopPropagation()">B</button>
                  <button class="btn-sell text-xs !px-2 !py-0.5" (click)="openSell(item); $event.stopPropagation()">S</button>
                  <button class="text-xs px-2 py-0.5 border rounded hover:bg-[var(--kite-surface-hover)]" (click)="openChart(item); $event.stopPropagation()">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                    </svg>
                  </button>
                  <button class="text-xs px-2 py-0.5 border rounded hover:bg-[var(--kite-surface-hover)]" (click)="openDepth(item); $event.stopPropagation()">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                  </button>
                  <button class="text-xs px-2 py-0.5 border rounded text-kite-red hover:bg-kite-red/10" (click)="removeFromWatchlist(item.symbol); $event.stopPropagation()">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
            <div class="text-right">
              <div class="font-mono text-sm">{{ item.ltp | number:'1.2-2' }}</div>
              <div 
                class="text-xs font-medium"
                [class.text-kite-green]="item.change >= 0"
                [class.text-kite-red]="item.change < 0"
              >
                {{ item.change >= 0 ? '+' : '' }}{{ item.change | number:'1.2-2' }} ({{ item.changePercent | number:'1.2-2' }}%)
              </div>
            </div>
          </div>
        } @empty {
          <div class="flex flex-col items-center justify-center py-12 text-[var(--kite-text-muted)]">
            <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <p class="text-sm">No stocks in watchlist</p>
            <p class="text-xs mt-1">Press Ctrl+K to search and add stocks</p>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="border-t p-2">
        <div class="flex items-center justify-between text-xs text-[var(--kite-text-muted)]">
          <span>Basket</span>
          <span>{{ watchlistService.activeWatchlist().items.length }} / 50</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  watchlistService = inject(WatchlistService);
  private marketDataService = inject(MarketDataService);

  hoveredItem = signal<string | null>(null);
  filterQuery = '';
  filteredItems = signal<WatchlistItem[]>([]);

  private updateSubscription?: Subscription;

  ngOnInit(): void {
    // Initial load
    this.updateFilteredItems();

    // Subscribe to price updates
    this.updateSubscription = interval(500).subscribe(() => {
      this.watchlistService.updateWatchlistPrices();
      this.updateFilteredItems();
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }

  private updateFilteredItems(): void {
    const items = this.watchlistService.activeWatchlist().items;
    if (this.filterQuery) {
      const query = this.filterQuery.toLowerCase();
      this.filteredItems.set(
        items.filter((item: WatchlistItem) =>
          item.symbol.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query)
        )
      );
    } else {
      this.filteredItems.set(items);
    }
  }

  filterWatchlist(): void {
    this.updateFilteredItems();
  }

  openBuy(item: WatchlistItem): void {
    console.log('Open buy modal for:', item.symbol);
    // TODO: Emit event to open order modal
  }

  openSell(item: WatchlistItem): void {
    console.log('Open sell modal for:', item.symbol);
    // TODO: Emit event to open order modal
  }

  openChart(item: WatchlistItem): void {
    console.log('Open chart for:', item.symbol);
    // TODO: Navigate to chart view
  }

  openDepth(item: WatchlistItem): void {
    console.log('Open market depth for:', item.symbol);
    // TODO: Open market depth modal
  }

  removeFromWatchlist(symbol: string): void {
    this.watchlistService.removeFromWatchlist(symbol);
    this.updateFilteredItems();
  }
}
