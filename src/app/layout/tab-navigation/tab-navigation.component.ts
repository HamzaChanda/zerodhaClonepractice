import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TabId = 'dashboard' | 'orders' | 'holdings' | 'positions' | 'funds' | 'apps';

export interface Tab {
    id: TabId;
    label: string;
    icon?: string;
}

@Component({
    selector: 'app-tab-navigation',
    standalone: true,
    imports: [CommonModule],
    template: `
    <nav class="flex items-center gap-1 px-4 border-b bg-[var(--kite-surface)]">
      @for (tab of tabs; track tab.id) {
        <button 
          (click)="selectTab(tab.id)"
          class="tab-item"
          [class.active]="activeTab() === tab.id"
        >
          {{ tab.label }}
        </button>
      }
      
      <!-- Right side indicators -->
      <div class="ml-auto flex items-center gap-3 text-sm">
        <div class="flex items-center gap-1 text-[var(--kite-text-muted)]">
          <span class="w-2 h-2 bg-kite-green rounded-full animate-pulse"></span>
          <span>Market Open</span>
        </div>
      </div>
    </nav>
  `
})
export class TabNavigationComponent {
    tabChange = output<TabId>();

    activeTab = signal<TabId>('dashboard');

    tabs: Tab[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'orders', label: 'Orders' },
        { id: 'holdings', label: 'Holdings' },
        { id: 'positions', label: 'Positions' },
        { id: 'funds', label: 'Funds' },
        { id: 'apps', label: 'Apps' }
    ];

    selectTab(tabId: TabId): void {
        this.activeTab.set(tabId);
        this.tabChange.emit(tabId);
    }
}
