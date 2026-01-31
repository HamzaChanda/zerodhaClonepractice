import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TabNavigationComponent, TabId } from './layout/tab-navigation/tab-navigation.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HoldingsComponent } from './features/portfolio/holdings.component';
import { PositionsComponent } from './features/portfolio/positions.component';
import { OrdersComponent } from './features/orders/orders.component';
import { FundsComponent } from './features/funds/funds.component';
import { ChartComponent } from './features/chart/chart.component';
import { MarketDepthComponent } from './features/market-depth/market-depth.component';
import { ToastContainerComponent } from './shared/components/toast/toast.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    TabNavigationComponent,
    DashboardComponent,
    HoldingsComponent,
    PositionsComponent,
    OrdersComponent,
    FundsComponent,
    ChartComponent,
    MarketDepthComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="h-screen flex flex-col bg-[var(--kite-bg)] text-[var(--kite-text)]">
      <!-- Header -->
      <app-header />
      
      <!-- Main Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar - Market Watchlist -->
        <app-sidebar />
        
        <!-- Right Content Area -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <!-- Tab Navigation -->
          <app-tab-navigation (tabChange)="onTabChange($event)" />
          
          <!-- Dynamic Content -->
          <div class="flex-1 overflow-auto p-4 bg-[var(--kite-bg-darker)]">
            @switch (currentTab()) {
              @case ('dashboard') {
                <app-dashboard />
              }
              @case ('orders') {
                <app-orders />
              }
              @case ('holdings') {
                <app-holdings />
              }
              @case ('positions') {
                <app-positions />
              }
              @case ('funds') {
                <app-funds />
              }
              @case ('apps') {
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <app-chart [symbolInput]="selectedSymbol()" />
                  <app-market-depth [symbolInput]="selectedSymbol()" />
                </div>
              }
              @default {
                <app-dashboard />
              }
            }
          </div>
        </main>
      </div>
    </div>

    <!-- Toast Notifications -->
    <app-toast-container />
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class App implements OnInit {
  private themeService = inject(ThemeService);

  currentTab = signal<TabId>('dashboard');
  selectedSymbol = signal('RELIANCE');

  ngOnInit(): void {
    // Load Pyngl loader script
    const script = document.createElement('script');
    script.src = '/loader.js';
    script.dataset['api'] = 'http://localhost:3000/api';
    script.dataset['debug'] = 'true';
    document.head.appendChild(script);
  }

  onTabChange(tabId: TabId): void {
    this.currentTab.set(tabId);
  }
}
