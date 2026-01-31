import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Stock } from '../../../core/models';
import { OrderService, MarketDataService, PortfolioService } from '../../../core/services';

@Component({
    selector: 'app-order-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="close()">
        <div class="modal-content max-w-md" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-lg">{{ stock?.symbol }}</span>
                <span class="text-sm text-[var(--kite-text-muted)]">{{ stock?.exchange }}</span>
              </div>
              <div class="text-sm text-[var(--kite-text-muted)]">{{ stock?.name }}</div>
            </div>
            <button (click)="close()" class="p-1 hover:bg-[var(--kite-surface-hover)] rounded">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Buy/Sell Toggle -->
          <div class="flex mb-4">
            <button 
              (click)="transactionType.set('BUY')"
              class="flex-1 py-2 font-medium transition-colors rounded-l-md"
              [class.bg-kite-blue]="transactionType() === 'BUY'"
              [class.text-white]="transactionType() === 'BUY'"
              [class.bg-[var(--kite-bg-darker)]]="transactionType() !== 'BUY'"
            >
              BUY
            </button>
            <button 
              (click)="transactionType.set('SELL')"
              class="flex-1 py-2 font-medium transition-colors rounded-r-md"
              [class.bg-kite-red]="transactionType() === 'SELL'"
              [class.text-white]="transactionType() === 'SELL'"
              [class.bg-[var(--kite-bg-darker)]]="transactionType() !== 'SELL'"
            >
              SELL
            </button>
          </div>

          <!-- Product Type Toggle -->
          <div class="toggle-group w-full mb-4">
            <button 
              (click)="productType.set('MIS')"
              class="flex-1 toggle-item"
              [class.active]="productType() === 'MIS'"
            >
              MIS (Intraday)
            </button>
            <button 
              (click)="productType.set('CNC')"
              class="flex-1 toggle-item"
              [class.active]="productType() === 'CNC'"
            >
              CNC (Delivery)
            </button>
          </div>

          <!-- Order Type Toggle -->
          <div class="toggle-group w-full mb-4">
            @for (type of orderTypes; track type.value) {
              <button 
                (click)="orderType.set(type.value)"
                class="flex-1 toggle-item"
                [class.active]="orderType() === type.value"
              >
                {{ type.label }}
              </button>
            }
          </div>

          <!-- Quantity & Price -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm text-[var(--kite-text-muted)] mb-1">Quantity</label>
              <input 
                type="number" 
                [(ngModel)]="quantity"
                class="input-field"
                min="1"
              >
            </div>
            <div>
              <label class="block text-sm text-[var(--kite-text-muted)] mb-1">Price</label>
              <input 
                type="number" 
                [(ngModel)]="price"
                class="input-field"
                [disabled]="orderType() === 'MARKET'"
                [class.opacity-50]="orderType() === 'MARKET'"
              >
            </div>
          </div>

          <!-- Trigger Price for SL orders -->
          @if (orderType() === 'SL' || orderType() === 'SL-M') {
            <div class="mb-4">
              <label class="block text-sm text-[var(--kite-text-muted)] mb-1">Trigger Price</label>
              <input 
                type="number" 
                [(ngModel)]="triggerPrice"
                class="input-field"
              >
            </div>
          }

          <!-- Order Summary -->
          <div class="surface-card p-3 mb-4 text-sm">
            <div class="flex justify-between mb-1">
              <span class="text-[var(--kite-text-muted)]">Margin Required</span>
              <span class="font-mono">₹{{ marginRequired() | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--kite-text-muted)]">Available Margin</span>
              <span class="font-mono">₹{{ availableMargin() | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="bg-kite-red/10 text-kite-red text-sm px-3 py-2 rounded mb-4">
              {{ errorMessage() }}
            </div>
          }

          <!-- Submit Button -->
          <button 
            (click)="placeOrder()"
            class="w-full py-3 font-medium rounded-md transition-colors"
            [class.bg-kite-blue]="transactionType() === 'BUY'"
            [class.bg-kite-red]="transactionType() === 'SELL'"
            [class.text-white]="true"
            [class.hover:opacity-90]="true"
            [disabled]="isSubmitting()"
          >
            @if (isSubmitting()) {
              <span>Placing Order...</span>
            } @else {
              <span>{{ transactionType() }} {{ quantity }} x {{ stock?.symbol }} @ {{ orderType() === 'MARKET' ? 'Market' : price }}</span>
            }
          </button>
        </div>
      </div>
    }
  `
})
export class OrderModalComponent implements OnInit {
    @Input() stock?: Stock;
    @Input() initialType: 'BUY' | 'SELL' = 'BUY';
    @Output() orderPlaced = new EventEmitter<void>();
    @Output() closed = new EventEmitter<void>();

    private orderService = inject(OrderService);
    private portfolioService = inject(PortfolioService);

    isOpen = signal(false);
    transactionType = signal<'BUY' | 'SELL'>('BUY');
    productType = signal<'MIS' | 'CNC'>('MIS');
    orderType = signal<'LIMIT' | 'MARKET' | 'SL' | 'SL-M'>('LIMIT');

    quantity = 1;
    price = 0;
    triggerPrice = 0;

    isSubmitting = signal(false);
    errorMessage = signal('');

    orderTypes = [
        { value: 'LIMIT' as const, label: 'Limit' },
        { value: 'MARKET' as const, label: 'Market' },
        { value: 'SL' as const, label: 'SL' },
        { value: 'SL-M' as const, label: 'SL-M' }
    ];

    ngOnInit(): void {
        if (this.stock) {
            this.price = this.stock.ltp;
            this.triggerPrice = this.stock.ltp;
        }
        this.transactionType.set(this.initialType);
    }

    open(stock: Stock, type: 'BUY' | 'SELL' = 'BUY'): void {
        this.stock = stock;
        this.price = stock.ltp;
        this.triggerPrice = stock.ltp;
        this.transactionType.set(type);
        this.errorMessage.set('');
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
        this.closed.emit();
    }

    marginRequired = () => {
        if (!this.stock) return 0;
        const totalValue = this.quantity * (this.orderType() === 'MARKET' ? this.stock.ltp : this.price);
        if (this.productType() === 'MIS') {
            return totalValue / 5; // 5x leverage
        }
        return totalValue;
    };

    availableMargin = () => {
        return this.portfolioService.currentFunds().availableMargin;
    };

    placeOrder(): void {
        if (!this.stock) return;

        this.isSubmitting.set(true);
        this.errorMessage.set('');

        const result = this.orderService.placeOrder(
            this.stock.symbol,
            this.stock.exchange,
            this.transactionType(),
            this.orderType(),
            this.productType(),
            this.quantity,
            this.orderType() === 'MARKET' ? this.stock.ltp : this.price,
            (this.orderType() === 'SL' || this.orderType() === 'SL-M') ? this.triggerPrice : undefined
        );

        setTimeout(() => {
            this.isSubmitting.set(false);

            if (result.success) {
                this.orderPlaced.emit();
                this.close();
            } else {
                this.errorMessage.set(result.message || 'Order placement failed');
            }
        }, 500);
    }
}
