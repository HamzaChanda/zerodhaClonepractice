import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="surface-card p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-[var(--kite-text-muted)]">{{ label }}</span>
        @if (badge) {
          <span class="badge" [ngClass]="badgeClass">{{ badge }}</span>
        }
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-semibold font-mono" [ngClass]="valueClass">
          {{ prefix }}{{ value | number:format }}
        </span>
        @if (change !== undefined) {
          <span 
            class="text-sm font-medium"
            [class.text-kite-green]="change >= 0"
            [class.text-kite-red]="change < 0"
          >
            {{ change >= 0 ? '+' : '' }}{{ change | number:'1.2-2' }}%
          </span>
        }
      </div>
      @if (subtitle) {
        <span class="text-xs text-[var(--kite-text-dim)]">{{ subtitle }}</span>
      }
    </div>
  `
})
export class StatCardComponent {
    @Input({ required: true }) label!: string;
    @Input({ required: true }) value!: number;
    @Input() change?: number;
    @Input() prefix: string = '₹';
    @Input() format: string = '1.2-2';
    @Input() subtitle?: string;
    @Input() badge?: string;
    @Input() badgeType: 'green' | 'red' | 'blue' | 'accent' = 'accent';

    get valueClass(): string {
        if (this.change !== undefined) {
            return this.change >= 0 ? 'text-kite-green' : 'text-kite-red';
        }
        return '';
    }

    get badgeClass(): string {
        return `badge-${this.badgeType}`;
    }
}
