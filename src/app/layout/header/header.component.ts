import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services';
import { MarketDataService } from '../../core/services';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <header class="h-14 border-b flex items-center justify-between px-4 bg-[var(--kite-surface)]">
      <!-- Left: Logo and Brand -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-kite-accent rounded flex items-center justify-center">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 19h20L12 2zm0 4l6.5 11h-13L12 6z"/>
            </svg>
          </div>
          <span class="font-semibold text-lg">Kite</span>
        </div>
        
        <!-- Market Summary -->
        <div class="hidden md:flex items-center gap-4 text-sm">
          <div class="flex items-center gap-1">
            <span class="text-[var(--kite-text-muted)]">NIFTY 50</span>
            <span class="font-medium">21,453.95</span>
            <span class="text-kite-green text-xs">+0.42%</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-[var(--kite-text-muted)]">SENSEX</span>
            <span class="font-medium">70,892.20</span>
            <span class="text-kite-green text-xs">+0.38%</span>
          </div>
        </div>
      </div>

      <!-- Center: Search -->
      <div class="flex-1 max-w-md mx-4">
        <button 
          (click)="openCommandPalette()"
          class="w-full flex items-center gap-2 px-3 py-1.5 rounded-md border text-left text-[var(--kite-text-muted)] hover:border-[var(--kite-border-light)] transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span class="text-sm">Search eg: infy, nifty fut, nifty 21000 ce...</span>
          <span class="ml-auto text-xs border rounded px-1.5 py-0.5">Ctrl+K</span>
        </button>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-3">
        <!-- Notifications -->
        <button class="p-2 rounded-md hover:bg-[var(--kite-surface-hover)] transition-colors relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="absolute top-1 right-1 w-2 h-2 bg-kite-accent rounded-full"></span>
        </button>

        <!-- Theme Toggle -->
        <button 
          (click)="themeService.toggleTheme()"
          class="p-2 rounded-md hover:bg-[var(--kite-surface-hover)] transition-colors"
          [title]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          @if (themeService.isDark()) {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          }
        </button>

        <!-- User Menu -->
        <div class="relative">
          <button 
            (click)="showUserMenu.set(!showUserMenu())"
            class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--kite-surface-hover)] transition-colors"
          >
            <div class="w-7 h-7 bg-kite-accent/20 text-kite-accent rounded-full flex items-center justify-center text-sm font-medium">
              HC
            </div>
            <span class="text-sm font-medium hidden sm:inline">ZQ1234</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          @if (showUserMenu()) {
            <div class="absolute right-0 top-full mt-1 w-48 py-1 glass-card shadow-lg z-50">
              <a href="#" class="block px-4 py-2 text-sm hover:bg-[var(--kite-surface-hover)]">Profile</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-[var(--kite-surface-hover)]">Settings</a>
              <a href="#" class="block px-4 py-2 text-sm hover:bg-[var(--kite-surface-hover)]">Console</a>
              <hr class="my-1 border-[var(--kite-border)]">
              <a href="#" class="block px-4 py-2 text-sm text-kite-red hover:bg-[var(--kite-surface-hover)]">Logout</a>
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Command Palette Modal -->
    @if (showCommandPalette()) {
      <div class="command-palette-overlay" (click)="closeCommandPalette()">
        <div class="command-palette" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 p-4 border-b border-[var(--kite-border)]">
            <svg class="w-5 h-5 text-[var(--kite-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input 
              #searchInput
              type="text" 
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Search eg: infy, nifty fut, nifty 21000 ce..."
              class="flex-1 bg-transparent outline-none text-lg"
              autofocus
            >
            <span class="text-xs text-[var(--kite-text-muted)] border rounded px-1.5 py-0.5">ESC</span>
          </div>
          
          <div class="max-h-96 overflow-y-auto">
            @if (searchResults().length > 0) {
              @for (stock of searchResults(); track stock.symbol) {
                <button 
                  class="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--kite-surface-hover)] transition-colors text-left"
                  (click)="selectStock(stock)"
                >
                  <div>
                    <div class="font-medium">{{ stock.symbol }}</div>
                    <div class="text-sm text-[var(--kite-text-muted)]">{{ stock.name }} · {{ stock.exchange }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono">{{ stock.ltp | number:'1.2-2' }}</div>
                    <div [class]="stock.change >= 0 ? 'text-kite-green' : 'text-kite-red'" class="text-sm">
                      {{ stock.change >= 0 ? '+' : '' }}{{ stock.changePercent | number:'1.2-2' }}%
                    </div>
                  </div>
                </button>
              }
            } @else if (searchQuery()) {
              <div class="px-4 py-8 text-center text-[var(--kite-text-muted)]">
                No results found for "{{ searchQuery() }}"
              </div>
            } @else {
              <div class="px-4 py-4 text-sm text-[var(--kite-text-muted)]">
                <div class="mb-2 font-medium">Quick Actions</div>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-xs border rounded px-1.5 py-0.5 text-center">B</span>
                    <span>Buy</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-xs border rounded px-1.5 py-0.5 text-center">S</span>
                    <span>Sell</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-xs border rounded px-1.5 py-0.5 text-center">W</span>
                    <span>Add to Watchlist</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class HeaderComponent {
    themeService = inject(ThemeService);
    private marketDataService = inject(MarketDataService);

    showUserMenu = signal(false);
    showCommandPalette = signal(false);
    searchQuery = signal('');
    searchResults = signal<any[]>([]);

    @HostListener('document:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent): void {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.openCommandPalette();
        }
        if (event.key === 'Escape') {
            this.closeCommandPalette();
            this.showUserMenu.set(false);
        }
    }

    openCommandPalette(): void {
        this.showCommandPalette.set(true);
        this.searchQuery.set('');
        this.searchResults.set([]);
    }

    closeCommandPalette(): void {
        this.showCommandPalette.set(false);
    }

    onSearch(): void {
        const query = this.searchQuery();
        if (query.length >= 1) {
            const results = this.marketDataService.searchStocks(query);
            this.searchResults.set(results.slice(0, 10));
        } else {
            this.searchResults.set([]);
        }
    }

    selectStock(stock: any): void {
        console.log('Selected stock:', stock);
        this.closeCommandPalette();
        // TODO: Navigate to stock or open order modal
    }
}
