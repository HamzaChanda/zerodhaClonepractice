import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { PortfolioService } from '../../core/services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Bento Grid Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Equity -->
        <div class="lg:col-span-2 surface-card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-sm text-[var(--kite-text-muted)] mb-1">Total Equity</div>
              <div class="text-3xl font-bold font-mono">
                ₹{{ summary().currentValue | number:'1.2-2' }}
              </div>
            </div>
            <div class="text-right">
              <div 
                class="text-xl font-semibold"
                [class.text-kite-green]="summary().totalPnl >= 0"
                [class.text-kite-red]="summary().totalPnl < 0"
              >
                {{ summary().totalPnl >= 0 ? '+' : '' }}₹{{ summary().totalPnl | number:'1.2-2' }}
              </div>
              <div 
                class="text-sm"
                [class.text-kite-green]="summary().totalPnlPercent >= 0"
                [class.text-kite-red]="summary().totalPnlPercent < 0"
              >
                {{ summary().totalPnlPercent >= 0 ? '+' : '' }}{{ summary().totalPnlPercent | number:'1.2-2' }}%
              </div>
            </div>
          </div>
          
          <!-- Mini chart placeholder -->
          <div class="h-16 bg-gradient-to-r from-kite-green/10 to-kite-green/5 rounded flex items-end px-2">
            @for (bar of chartBars; track $index) {
              <div 
                class="flex-1 bg-kite-green/50 mx-0.5 rounded-t transition-all hover:bg-kite-green"
                [style.height.%]="bar"
              ></div>
            }
          </div>
        </div>

        <!-- Day P&L -->
        <app-stat-card 
          label="Day P&L"
          [value]="summary().dayPnl"
          [change]="summary().dayPnlPercent"
          subtitle="Intraday profit/loss"
        />

        <!-- Available Margin -->
        <app-stat-card 
          label="Available Margin"
          [value]="funds().availableMargin"
          subtitle="Used: ₹{{ funds().usedMargin | number:'1.2-2' }}"
          badge="LIVE"
          badgeType="green"
        />
      </div>

      <!-- Second Row - Holdings Summary & Positions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Holdings Breakdown -->
        <div class="lg:col-span-2 surface-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold">Holdings Performance</h3>
            <span class="text-sm text-[var(--kite-text-muted)]">{{ holdings().length }} stocks</span>
          </div>
          
          <div class="space-y-3">
            @for (holding of topHoldings(); track holding.tradingSymbol) {
              <div class="flex items-center justify-between py-2 border-b border-[var(--kite-border)]/50 last:border-0">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium"
                    [class.bg-kite-green/20]="holding.pnl >= 0"
                    [class.text-kite-green]="holding.pnl >= 0"
                    [class.bg-kite-red/20]="holding.pnl < 0"
                    [class.text-kite-red]="holding.pnl < 0"
                  >
                    {{ holding.tradingSymbol.slice(0, 2) }}
                  </div>
                  <div>
                    <div class="font-medium">{{ holding.tradingSymbol }}</div>
                    <div class="text-xs text-[var(--kite-text-muted)]">{{ holding.quantity }} qty @ ₹{{ holding.averagePrice | number:'1.2-2' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-mono">₹{{ holding.value | number:'1.2-2' }}</div>
                  <div 
                    class="text-sm"
                    [class.text-kite-green]="holding.pnl >= 0"
                    [class.text-kite-red]="holding.pnl < 0"
                  >
                    {{ holding.pnl >= 0 ? '+' : '' }}{{ holding.pnlPercent | number:'1.2-2' }}%
                  </div>
                </div>
              </div>
            }
          </div>
          
          @if (holdings().length > 5) {
            <button class="w-full mt-4 py-2 text-sm text-kite-accent hover:bg-kite-accent/10 rounded transition-colors">
              View all {{ holdings().length }} holdings →
            </button>
          }
        </div>

        <!-- Quick Actions & Positions Summary -->
        <div class="space-y-4">
          <!-- Positions Card -->
          <div class="surface-card p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold">Open Positions</h3>
              <span class="badge badge-blue">{{ positionsSummary().openPositions }}</span>
            </div>
            <div class="text-2xl font-bold font-mono mb-1" 
              [class.text-kite-green]="positionsSummary().totalPnl >= 0"
              [class.text-kite-red]="positionsSummary().totalPnl < 0"
            >
              {{ positionsSummary().totalPnl >= 0 ? '+' : '' }}₹{{ positionsSummary().totalPnl | number:'1.2-2' }}
            </div>
            <div class="text-sm text-[var(--kite-text-muted)]">Today's M2M</div>
          </div>

          <!-- Market Pulse -->
          <div class="surface-card p-6">
            <h3 class="font-semibold mb-3">Market Pulse</h3>
            <div class="space-y-2">
              @for (index of marketIndices; track index.name) {
                <div class="flex items-center justify-between py-1">
                  <span class="text-sm">{{ index.name }}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm">{{ index.value | number:'1.2-2' }}</span>
                    <span 
                      class="text-xs font-medium"
                      [class.text-kite-green]="index.change >= 0"
                      [class.text-kite-red]="index.change < 0"
                    >
                      {{ index.change >= 0 ? '+' : '' }}{{ index.change | number:'1.2-2' }}%
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="surface-card p-6">
            <h3 class="font-semibold mb-3">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-2">
              <button class="flex items-center justify-center gap-2 py-2 px-3 text-sm border rounded hover:bg-[var(--kite-surface-hover)] transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Add Funds
              </button>
              <button class="flex items-center justify-center gap-2 py-2 px-3 text-sm border rounded hover:bg-[var(--kite-surface-hover)] transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Reports
              </button>
              <button class="flex items-center justify-center gap-2 py-2 px-3 text-sm border rounded hover:bg-[var(--kite-surface-hover)] transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                GTT
              </button>
              <button class="flex items-center justify-center gap-2 py-2 px-3 text-sm border rounded hover:bg-[var(--kite-surface-hover)] transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                SIP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  private portfolioService = inject(PortfolioService);

  summary = this.portfolioService.portfolioSummary;
  positionsSummary = this.portfolioService.positionsSummary;
  holdings = this.portfolioService.allHoldings;
  funds = this.portfolioService.currentFunds;

  // Mock chart bars
  chartBars = [45, 62, 38, 55, 72, 48, 65, 58, 70, 52, 68, 75, 60, 82, 55, 78, 65, 88, 72, 90];

  // Market indices
  marketIndices = [
    { name: 'NIFTY 50', value: 21453.95, change: 0.42 },
    { name: 'SENSEX', value: 70892.20, change: 0.38 },
    { name: 'NIFTY BANK', value: 45234.80, change: 0.65 },
    { name: 'INDIA VIX', value: 13.45, change: -2.15 }
  ];

  topHoldings() {
    return this.holdings().slice(0, 5);
  }
}
