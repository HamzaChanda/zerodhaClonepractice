import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../core/services';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Summary -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">Positions</h2>
          <p class="text-sm text-[var(--kite-text-muted)]">{{ openPositions().length }} open positions</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm text-[var(--kite-text-muted)]">Total P&L</div>
            <div 
              class="text-lg font-mono font-semibold"
              [class.text-kite-green]="positionsSummary().totalPnl >= 0"
              [class.text-kite-red]="positionsSummary().totalPnl < 0"
            >
              {{ positionsSummary().totalPnl >= 0 ? '+' : '' }}₹{{ positionsSummary().totalPnl | number:'1.2-2' }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-[var(--kite-text-muted)]">M2M</div>
            <div 
              class="text-lg font-mono font-semibold"
              [class.text-kite-green]="positionsSummary().totalM2M >= 0"
              [class.text-kite-red]="positionsSummary().totalM2M < 0"
            >
              {{ positionsSummary().totalM2M >= 0 ? '+' : '' }}₹{{ positionsSummary().totalM2M | number:'1.2-2' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Positions Table -->
      <div class="surface-card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-[var(--kite-text-muted)]">
              <th class="px-4 py-3 font-medium">Product</th>
              <th class="px-4 py-3 font-medium">Instrument</th>
              <th class="px-4 py-3 font-medium text-right">Qty.</th>
              <th class="px-4 py-3 font-medium text-right">Avg.</th>
              <th class="px-4 py-3 font-medium text-right">LTP</th>
              <th class="px-4 py-3 font-medium text-right">P&L</th>
              <th class="px-4 py-3 font-medium text-right">Chg.</th>
            </tr>
          </thead>
          <tbody>
            @for (position of positions(); track position.tradingSymbol) {
              <tr 
                class="border-b border-[var(--kite-border)]/50 hover:bg-[var(--kite-surface-hover)] transition-colors"
                [class.opacity-50]="position.quantity === 0"
              >
                <td class="px-4 py-3">
                  <span 
                    class="badge"
                    [ngClass]="{
                      'badge-blue': position.productType === 'MIS',
                      'badge-accent': position.productType === 'NRML',
                      'badge-green': position.productType === 'CNC'
                    }"
                  >
                    {{ position.productType }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium">{{ position.tradingSymbol }}</div>
                  <div class="text-xs text-[var(--kite-text-muted)]">{{ position.exchange }}</div>
                </td>
                <td class="px-4 py-3 text-right font-mono" 
                  [class.text-kite-green]="position.quantity > 0"
                  [class.text-kite-red]="position.quantity < 0"
                >
                  {{ position.quantity > 0 ? '+' : '' }}{{ position.quantity }}
                </td>
                <td class="px-4 py-3 text-right font-mono">{{ position.averagePrice | number:'1.2-2' }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ position.lastPrice | number:'1.2-2' }}</td>
                <td 
                  class="px-4 py-3 text-right font-mono font-medium"
                  [class.text-kite-green]="position.pnl >= 0"
                  [class.text-kite-red]="position.pnl < 0"
                >
                  {{ position.pnl >= 0 ? '+' : '' }}{{ position.pnl | number:'1.2-2' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    @if (position.quantity !== 0) {
                      <button 
                        class="text-xs px-2 py-1 border rounded hover:bg-[var(--kite-surface-hover)] transition-colors"
                        (click)="addPosition(position)"
                      >
                        Add
                      </button>
                      <button 
                        class="text-xs px-2 py-1 border rounded text-kite-red hover:bg-kite-red/10 transition-colors"
                        (click)="exitPosition(position)"
                      >
                        Exit
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-4 py-12 text-center text-[var(--kite-text-muted)]">
                  <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p>No open positions</p>
                    <p class="text-sm mt-1">Trade intraday to see positions here</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Exit All Button -->
      @if (openPositions().length > 0) {
        <div class="flex justify-end">
          <button class="btn-sell" (click)="exitAllPositions()">
            Exit All Positions
          </button>
        </div>
      }
    </div>
  `
})
export class PositionsComponent {
  private portfolioService = inject(PortfolioService);

  positions = this.portfolioService.allPositions;
  positionsSummary = this.portfolioService.positionsSummary;

  openPositions() {
    return this.positions().filter(p => p.quantity !== 0);
  }

  addPosition(position: any): void {
    console.log('Add to position:', position);
    // TODO: Open order modal
  }

  exitPosition(position: any): void {
    console.log('Exit position:', position);
    // TODO: Open order modal with exit
  }

  exitAllPositions(): void {
    console.log('Exit all positions');
    // TODO: Implement bulk exit
  }
}
