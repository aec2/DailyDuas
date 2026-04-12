import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'theme_preference';
  private readonly platformId = inject(PLATFORM_ID);

  isDark = signal(false);

  constructor() {
    this.initializeTheme();

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.classList.toggle('dark', this.isDark());
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', this.isDark() ? '#0f172a' : '#10b981');
        }
      }
    });
  }

  private initializeTheme() {
    if (!isPlatformBrowser(this.platformId)) return;

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.isDark.set(stored === 'dark');
    } else {
      this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }

  toggleTheme() {
    const newDark = !this.isDark();
    this.isDark.set(newDark);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, newDark ? 'dark' : 'light');
    }
  }
}