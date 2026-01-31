import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../core/services';

@Component({
  selector: 'app-funds',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Fund Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="surface-card p-6">
          <div class="text-sm text-[var(--kite-text-muted)] mb-1">Available Cash</div>
          <div class="text-2xl font-bold font-mono">₹{{ funds().availableCash | number:'1.2-2' }}</div>
        </div>
        <div class="surface-card p-6">
          <div class="text-sm text-[var(--kite-text-muted)] mb-1">Used Margin</div>
          <div class="text-2xl font-bold font-mono">₹{{ funds().usedMargin | number:'1.2-2' }}</div>
        </div>
        <div class="surface-card p-6">
          <div class="text-sm text-[var(--kite-text-muted)] mb-1">Available Margin</div>
          <div class="text-2xl font-bold font-mono text-kite-green">₹{{ funds().availableMargin | number:'1.2-2' }}</div>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Equity -->
        <div class="surface-card p-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2">
            <span class="w-3 h-3 bg-kite-blue rounded-full"></span>
            Equity
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">Opening Balance</span>
              <span class="font-mono">₹{{ funds().openingBalance | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">Payin</span>
              <span class="font-mono text-kite-green">+₹{{ funds().payin | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">Payout</span>
              <span class="font-mono text-kite-red">-₹{{ funds().payout | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">Collateral</span>
              <span class="font-mono">₹{{ funds().collateral | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 font-medium">
              <span>Total Available</span>
              <span class="font-mono">₹{{ funds().availableCash + funds().collateral | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- Margins -->
        <div class="surface-card p-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2">
            <span class="w-3 h-3 bg-kite-accent rounded-full"></span>
            Margin Utilization
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">SPAN Margin</span>
              <span class="font-mono">₹{{ funds().span | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">Exposure Margin</span>
              <span class="font-mono">₹{{ funds().exposure | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">Option Premium</span>
              <span class="font-mono">₹{{ funds().optionPremium | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50">
              <span class="text-[var(--kite-text-muted)]">Delivery Margin</span>
              <span class="font-mono">₹{{ funds().deliveryMargin | number:'1.2-2' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 font-medium">
              <span>Total Used</span>
              <span class="font-mono text-kite-red">₹{{ funds().usedMargin | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-4">
        <button class="btn-buy flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Add Funds
        </button>
        <button class="btn-accent flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Withdraw
        </button>
      </div>
    </div>
  `
})
export class FundsComponent {
  private portfolioService = inject(PortfolioService);

  funds = this.portfolioService.currentFunds;
}
