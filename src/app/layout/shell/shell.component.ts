import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TabNavigationComponent, TabId } from '../tab-navigation/tab-navigation.component';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [CommonModule, HeaderComponent, SidebarComponent, TabNavigationComponent],
    template: `
    <div class="h-screen flex flex-col bg-[var(--kite-bg)]">
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
          <div class="flex-1 overflow-auto p-4">
            <ng-content></ng-content>
          </div>
        </main>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class ShellComponent {
    currentTab = signal<TabId>('dashboard');

    onTabChange(tabId: TabId): void {
        this.currentTab.set(tabId);
    }
}
