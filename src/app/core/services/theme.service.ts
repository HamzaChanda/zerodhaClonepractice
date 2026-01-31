import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'kite-theme';

    readonly theme = signal<Theme>(this.getInitialTheme());
    readonly isDark = signal<boolean>(this.theme() === 'dark');

    constructor() {
        // Apply theme on init and whenever it changes
        effect(() => {
            this.applyTheme(this.theme());
            this.isDark.set(this.theme() === 'dark');
        });
    }

    private getInitialTheme(): Theme {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
            if (savedTheme) return savedTheme;

            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'dark'; // Default to dark theme for Kite
    }

    private applyTheme(theme: Theme): void {
        if (typeof document !== 'undefined') {
            const root = document.documentElement;
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            localStorage.setItem(this.THEME_KEY, theme);
        }
    }

    toggleTheme(): void {
        this.theme.update(current => current === 'light' ? 'dark' : 'light');
    }

    setTheme(theme: Theme): void {
        this.theme.set(theme);
    }
}
