import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services';

type OrderTab = 'pending' | 'executed' | 'gtt';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Tabs -->
      <div class="flex items-center gap-1 border-b">
        <button 
          (click)="activeTab.set('pending')"
          class="tab-item"
          [class.active]="activeTab() === 'pending'"
        >
          Pending ({{ pendingOrders().length }})
        </button>
        <button 
          (click)="activeTab.set('executed')"
          class="tab-item"
          [class.active]="activeTab() === 'executed'"
        >
          Executed ({{ executedOrders().length }})
        </button>
        <button 
          (click)="activeTab.set('gtt')"
          class="tab-item"
          [class.active]="activeTab() === 'gtt'"
        >
          GTT ({{ gttOrders().length }})
        </button>
      </div>

      <!-- Pending Orders -->
      @if (activeTab() === 'pending') {
        <div class="surface-card overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b text-left text-sm text-[var(--kite-text-muted)]">
                <th class="px-4 py-3 font-medium">Time</th>
                <th class="px-4 py-3 font-medium">Type</th>
                <th class="px-4 py-3 font-medium">Instrument</th>
                <th class="px-4 py-3 font-medium">Product</th>
                <th class="px-4 py-3 font-medium text-right">Qty.</th>
                <th class="px-4 py-3 font-medium text-right">Price</th>
                <th class="px-4 py-3 font-medium text-right">Status</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (order of pendingOrders(); track order.orderId) {
                <tr class="border-b border-[var(--kite-border)]/50 hover:bg-[var(--kite-surface-hover)]">
                  <td class="px-4 py-3 text-sm">{{ order.placedAt | date:'HH:mm:ss' }}</td>
                  <td class="px-4 py-3">
                    <span 
                      class="badge"
                      [class.badge-blue]="order.transactionType === 'BUY'"
                      [class.badge-red]="order.transactionType === 'SELL'"
                    >
                      {{ order.transactionType }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ order.symbol }}</div>
                    <div class="text-xs text-[var(--kite-text-muted)]">{{ order.exchange }} · {{ order.orderType }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge badge-accent">{{ order.productType }}</span>
                  </td>
                  <td class="px-4 py-3 text-right font-mono">{{ order.pendingQuantity }} / {{ order.quantity }}</td>
                  <td class="px-4 py-3 text-right font-mono">{{ order.price | number:'1.2-2' }}</td>
                  <td class="px-4 py-3 text-right">
                    <span class="badge badge-blue">{{ order.status }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        class="text-xs px-2 py-1 border rounded hover:bg-[var(--kite-surface-hover)]"
                        (click)="modifyOrder(order)"
                      >
                        Modify
                      </button>
                      <button 
                        class="text-xs px-2 py-1 border rounded text-kite-red hover:bg-kite-red/10"
                        (click)="cancelOrder(order.orderId)"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-12 text-center text-[var(--kite-text-muted)]">
                    No pending orders
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Executed Orders -->
      @if (activeTab() === 'executed') {
        <div class="surface-card overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b text-left text-sm text-[var(--kite-text-muted)]">
                <th class="px-4 py-3 font-medium">Time</th>
                <th class="px-4 py-3 font-medium">Type</th>
                <th class="px-4 py-3 font-medium">Instrument</th>
                <th class="px-4 py-3 font-medium">Product</th>
                <th class="px-4 py-3 font-medium text-right">Qty.</th>
                <th class="px-4 py-3 font-medium text-right">Avg. Price</th>
                <th class="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (order of executedOrders(); track order.orderId) {
                <tr class="border-b border-[var(--kite-border)]/50 hover:bg-[var(--kite-surface-hover)]">
                  <td class="px-4 py-3 text-sm">{{ order.placedAt | date:'HH:mm:ss' }}</td>
                  <td class="px-4 py-3">
                    <span 
                      class="badge"
                      [class.badge-blue]="order.transactionType === 'BUY'"
                      [class.badge-red]="order.transactionType === 'SELL'"
                    >
                      {{ order.transactionType }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ order.symbol }}</div>
                    <div class="text-xs text-[var(--kite-text-muted)]">{{ order.exchange }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge badge-accent">{{ order.productType }}</span>
                  </td>
                  <td class="px-4 py-3 text-right font-mono">{{ order.filledQuantity }}</td>
                  <td class="px-4 py-3 text-right font-mono">{{ order.averagePrice | number:'1.2-2' }}</td>
                  <td class="px-4 py-3 text-right">
                    <span class="badge badge-green">{{ order.status }}</span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-12 text-center text-[var(--kite-text-muted)]">
                    No executed orders today
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- GTT Orders -->
      @if (activeTab() === 'gtt') {
        <div class="surface-card overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b text-left text-sm text-[var(--kite-text-muted)]">
                <th class="px-4 py-3 font-medium">Created</th>
                <th class="px-4 py-3 font-medium">Type</th>
                <th class="px-4 py-3 font-medium">Instrument</th>
                <th class="px-4 py-3 font-medium text-right">LTP</th>
                <th class="px-4 py-3 font-medium text-right">Trigger</th>
                <th class="px-4 py-3 font-medium text-right">Qty.</th>
                <th class="px-4 py-3 font-medium text-right">Status</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (gtt of activeGttOrders(); track gtt.id) {
                <tr class="border-b border-[var(--kite-border)]/50 hover:bg-[var(--kite-surface-hover)]">
                  <td class="px-4 py-3 text-sm">{{ gtt.createdAt | date:'dd MMM' }}</td>
                  <td class="px-4 py-3">
                    <span 
                      class="badge"
                      [class.badge-blue]="gtt.transactionType === 'BUY'"
                      [class.badge-red]="gtt.transactionType === 'SELL'"
                    >
                      {{ gtt.transactionType }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ gtt.symbol }}</div>
                    <div class="text-xs text-[var(--kite-text-muted)]">{{ gtt.exchange }} · {{ gtt.triggerType }}</div>
                  </td>
                  <td class="px-4 py-3 text-right font-mono">{{ gtt.lastPrice | number:'1.2-2' }}</td>
                  <td class="px-4 py-3 text-right font-mono">
                    @for (trigger of gtt.triggerValues; track $index) {
                      <div>{{ trigger | number:'1.2-2' }}</div>
                    }
                  </td>
                  <td class="px-4 py-3 text-right font-mono">
                    @for (order of gtt.orders; track $index) {
                      <div>{{ order.quantity }}</div>
                    }
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span 
                      class="badge"
                      [ngClass]="{
                        'badge-green': gtt.status === 'active',
                        'badge-red': gtt.status === 'cancelled' || gtt.status === 'deleted',
                        'badge-blue': gtt.status === 'triggered'
                      }"
                    >
                      {{ gtt.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    @if (gtt.status === 'active') {
                      <button 
                        class="text-xs px-2 py-1 border rounded text-kite-red hover:bg-kite-red/10"
                        (click)="deleteGtt(gtt.id)"
                      >
                        Delete
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-12 text-center text-[var(--kite-text-muted)]">
                    <div class="flex flex-col items-center">
                      <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p>No GTT orders</p>
                      <p class="text-sm mt-1">Create a GTT to execute orders at target prices</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class OrdersComponent {
  private orderService = inject(OrderService);

  activeTab = signal<OrderTab>('pending');

  pendingOrders = this.orderService.pendingOrders;
  executedOrders = this.orderService.executedOrders;
  gttOrders = this.orderService.allGttOrders;

  activeGttOrders() {
    return this.gttOrders().filter(g => g.status === 'active');
  }

  modifyOrder(order: any): void {
    console.log('Modify order:', order);
    // TODO: Open modify modal
  }

  cancelOrder(orderId: string): void {
    this.orderService.cancelOrder(orderId);
  }

  deleteGtt(id: string): void {
    this.orderService.deleteGTT(id);
  }
}
