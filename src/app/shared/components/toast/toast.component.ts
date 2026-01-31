import { Component, Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts = signal<Toast[]>([]);
    readonly activeToasts = this.toasts.asReadonly();

    show(message: string, type: Toast['type'] = 'info', duration: number = 4000): void {
        const id = `toast-${Date.now()}`;
        const toast: Toast = { id, message, type, duration };

        this.toasts.update(t => [...t, toast]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }
    }

    success(message: string, duration?: number): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number): void {
        this.show(message, 'error', duration);
    }

    warning(message: string, duration?: number): void {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration?: number): void {
        this.show(message, 'info', duration);
    }

    dismiss(id: string): void {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }
}

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div 
          class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-up min-w-[300px] max-w-md"
          [ngClass]="getToastClass(toast.type)"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              }
              @default {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </div>
          
          <!-- Message -->
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          
          <!-- Dismiss -->
          <button 
            (click)="toastService.dismiss(toast.id)"
            class="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
    constructor(public toastService: ToastService) { }

    getToastClass(type: Toast['type']): string {
        switch (type) {
            case 'success':
                return 'bg-kite-green text-white';
            case 'error':
                return 'bg-kite-red text-white';
            case 'warning':
                return 'bg-kite-yellow text-black';
            case 'info':
            default:
                return 'bg-kite-blue text-white';
        }
    }
}
