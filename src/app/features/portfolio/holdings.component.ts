import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../core/services';

@Component({
  selector: 'app-holdings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Summary -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">Holdings</h2>
          <p class="text-sm text-[var(--kite-text-muted)]">{{ holdings().length }} stocks</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm text-[var(--kite-text-muted)]">Current Value</div>
            <div class="text-lg font-mono font-semibold">₹{{ summary().currentValue | number:'1.2-2' }}</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-[var(--kite-text-muted)]">Total P&L</div>
            <div 
              class="text-lg font-mono font-semibold"
              [class.text-kite-green]="summary().totalPnl >= 0"
              [class.text-kite-red]="summary().totalPnl < 0"
            >
              {{ summary().totalPnl >= 0 ? '+' : '' }}₹{{ summary().totalPnl | number:'1.2-2' }}
              <span class="text-sm">({{ summary().totalPnlPercent | number:'1.2-2' }}%)</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-[var(--kite-text-muted)]">Day P&L</div>
            <div 
              class="text-lg font-mono font-semibold"
              [class.text-kite-green]="summary().dayPnl >= 0"
              [class.text-kite-red]="summary().dayPnl < 0"
            >
              {{ summary().dayPnl >= 0 ? '+' : '' }}₹{{ summary().dayPnl | number:'1.2-2' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Holdings Table -->
      <div class="surface-card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-[var(--kite-text-muted)]">
              <th class="px-4 py-3 font-medium">Instrument</th>
              <th class="px-4 py-3 font-medium text-right">Qty.</th>
              <th class="px-4 py-3 font-medium text-right">Avg. Cost</th>
              <th class="px-4 py-3 font-medium text-right">LTP</th>
              <th class="px-4 py-3 font-medium text-right">Cur. Val</th>
              <th class="px-4 py-3 font-medium text-right">P&L</th>
              <th class="px-4 py-3 font-medium text-right">Net Chg.</th>
              <th class="px-4 py-3 font-medium text-right">Day Chg.</th>
            </tr>
          </thead>
          <tbody>
            @for (holding of holdings(); track holding.tradingSymbol) {
              <tr 
                class="border-b border-[var(--kite-border)]/50 hover:bg-[var(--kite-surface-hover)] transition-colors cursor-pointer"
                (click)="selectHolding(holding)"
              >
                <td class="px-4 py-3">
                  <div class="font-medium">{{ holding.tradingSymbol }}</div>
                  <div class="text-xs text-[var(--kite-text-muted)]">{{ holding.exchange }}</div>
                </td>
                <td class="px-4 py-3 text-right font-mono">{{ holding.quantity }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ holding.averagePrice | number:'1.2-2' }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ holding.lastPrice | number:'1.2-2' }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ holding.value | number:'1.2-2' }}</td>
                <td 
                  class="px-4 py-3 text-right font-mono font-medium"
                  [class.text-kite-green]="holding.pnl >= 0"
                  [class.text-kite-red]="holding.pnl < 0"
                >
                  {{ holding.pnl >= 0 ? '+' : '' }}{{ holding.pnl | number:'1.2-2' }}
                </td>
                <td 
                  class="px-4 py-3 text-right font-mono"
                  [class.text-kite-green]="holding.pnlPercent >= 0"
                  [class.text-kite-red]="holding.pnlPercent < 0"
                >
                  {{ holding.pnlPercent >= 0 ? '+' : '' }}{{ holding.pnlPercent | number:'1.2-2' }}%
                </td>
                <td 
                  class="px-4 py-3 text-right font-mono"
                  [class.text-kite-green]="holding.dayChangePercent >= 0"
                  [class.text-kite-red]="holding.dayChangePercent < 0"
                >
                  {{ holding.dayChangePercent >= 0 ? '+' : '' }}{{ holding.dayChangePercent | number:'1.2-2' }}%
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="px-4 py-12 text-center text-[var(--kite-text-muted)]">
                  <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <p>No holdings yet</p>
                    <p class="text-sm mt-1">Start investing to build your portfolio</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class HoldingsComponent {
  private portfolioService = inject(PortfolioService);

  holdings = this.portfolioService.allHoldings;
  summary = this.portfolioService.portfolioSummary;

  selectHolding(holding: any): void {
    console.log('Selected holding:', holding);
    // TODO: Open stock details or chart
  }
}
