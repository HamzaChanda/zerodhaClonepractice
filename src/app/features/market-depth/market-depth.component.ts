import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketDataService } from '../../core/services';
import { MarketDepth } from '../../core/models';

@Component({
  selector: 'app-market-depth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="surface-card p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">Market Depth</h3>
        <span class="text-sm text-[var(--kite-text-muted)]">{{ symbol() }}</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <!-- Bids (Buy) -->
        <div>
          <div class="text-xs text-[var(--kite-text-muted)] mb-2 flex justify-between px-2">
            <span>Bid</span>
            <span>Orders</span>
            <span>Qty</span>
          </div>
          @for (bid of depth().bids; track $index) {
            <div class="relative">
              <!-- Background bar -->
              <div 
                class="absolute inset-y-0 left-0 bg-kite-blue/20 rounded"
                [style.width.%]="(bid.quantity / maxBidQty()) * 100"
              ></div>
              <!-- Content -->
              <div class="relative flex justify-between items-center px-2 py-1.5 text-sm">
                <span class="font-mono text-kite-blue">{{ bid.price | number:'1.2-2' }}</span>
                <span class="text-[var(--kite-text-muted)]">{{ bid.orders }}</span>
                <span class="font-mono">{{ bid.quantity }}</span>
              </div>
            </div>
          }
          <div class="flex justify-between items-center px-2 py-2 border-t mt-1 text-sm font-medium">
            <span>Total</span>
            <span class="font-mono text-kite-blue">{{ depth().totalBidQty | number }}</span>
          </div>
        </div>

        <!-- Offers (Sell) -->
        <div>
          <div class="text-xs text-[var(--kite-text-muted)] mb-2 flex justify-between px-2">
            <span>Qty</span>
            <span>Orders</span>
            <span>Offer</span>
          </div>
          @for (offer of depth().offers; track $index) {
            <div class="relative">
              <!-- Background bar -->
              <div 
                class="absolute inset-y-0 right-0 bg-kite-red/20 rounded"
                [style.width.%]="(offer.quantity / maxOfferQty()) * 100"
              ></div>
              <!-- Content -->
              <div class="relative flex justify-between items-center px-2 py-1.5 text-sm">
                <span class="font-mono">{{ offer.quantity }}</span>
                <span class="text-[var(--kite-text-muted)]">{{ offer.orders }}</span>
                <span class="font-mono text-kite-red">{{ offer.price | number:'1.2-2' }}</span>
              </div>
            </div>
          }
          <div class="flex justify-between items-center px-2 py-2 border-t mt-1 text-sm font-medium">
            <span class="font-mono text-kite-red">{{ depth().totalOfferQty | number }}</span>
            <span>Total</span>
          </div>
        </div>
      </div>

      <!-- Depth Visualization -->
      <div class="mt-4 h-2 flex rounded overflow-hidden">
        <div 
          class="bg-kite-blue transition-all"
          [style.width.%]="bidPercent()"
        ></div>
        <div 
          class="bg-kite-red transition-all"
          [style.width.%]="offerPercent()"
        ></div>
      </div>
      <div class="flex justify-between text-xs mt-1 text-[var(--kite-text-muted)]">
        <span>{{ bidPercent() | number:'1.0-0' }}% Buy</span>
        <span>{{ offerPercent() | number:'1.0-0' }}% Sell</span>
      </div>
    </div>
  `
})
export class MarketDepthComponent implements OnInit {
  @Input() set symbolInput(value: string) {
    this.symbol.set(value);
    this.loadDepth();
  }

  private marketDataService = inject(MarketDataService);

  symbol = signal('RELIANCE');
  depth = signal<MarketDepth>({ symbol: '', bids: [], offers: [], totalBidQty: 0, totalOfferQty: 0 });

  ngOnInit(): void {
    this.loadDepth();
  }

  private loadDepth(): void {
    const depthData = this.marketDataService.generateMarketDepth(this.symbol());
    this.depth.set(depthData);
  }

  maxBidQty(): number {
    return Math.max(...this.depth().bids.map(b => b.quantity), 1);
  }

  maxOfferQty(): number {
    return Math.max(...this.depth().offers.map(o => o.quantity), 1);
  }

  bidPercent(): number {
    const total = this.depth().totalBidQty + this.depth().totalOfferQty;
    return total > 0 ? (this.depth().totalBidQty / total) * 100 : 50;
  }

  offerPercent(): number {
    return 100 - this.bidPercent();
  }
}
