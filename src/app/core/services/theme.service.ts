import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type PaletteKey = 'dusk' | 'clay' | 'sage';

export interface ThemePalette {
  name: string;
  bg: string;
  surface: string;
  card: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  accent: string;
  accent2: string;
  ring: string;
  line: string;
}

export const PALETTES: Record<PaletteKey, ThemePalette> = {
  dusk: {
    name: 'Alacakaranlık',
    bg: '#fafaf7',
    surface: '#ffffff',
    card: '#f3efe6',
    ink: '#1a2e3b',
    inkMuted: '#5b6b75',
    inkFaint: '#94a0a8',
    accent: '#d4a574',
    accent2: '#7a9a8f',
    ring: 'rgba(212,165,116,0.18)',
    line: 'rgba(26,46,59,0.08)',
  },
  clay: {
    name: 'Kil',
    bg: '#f0ebe0',
    surface: '#faf6ec',
    card: '#e8e0d0',
    ink: '#3d2817',
    inkMuted: '#7a5f48',
    inkFaint: '#a89379',
    accent: '#a0522d',
    accent2: '#6b8e23',
    ring: 'rgba(160,82,45,0.18)',
    line: 'rgba(61,40,23,0.1)',
  },
  sage: {
    name: 'Adaçayı',
    bg: '#f5f1e8',
    surface: '#ffffff',
    card: '#ebe5d6',
    ink: '#2d5f4e',
    inkMuted: '#5d7a6f',
    inkFaint: '#9aa89f',
    accent: '#c9a961',
    accent2: '#8b3a2e',
    ring: 'rgba(201,169,97,0.2)',
    line: 'rgba(45,95,78,0.1)',
  },
};

export const DARK_PALETTE: ThemePalette = {
  name: 'Gece',
  bg: '#0f1419',
  surface: '#171e26',
  card: '#1d252e',
  ink: '#f0e6d2',
  inkMuted: '#9aa4ad',
  inkFaint: '#5d6770',
  accent: '#d4a574',
  accent2: '#7a9a8f',
  ring: 'rgba(212,165,116,0.18)',
  line: 'rgba(240,230,210,0.08)',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly PALETTE_KEY = 'dd_palette';
  private readonly DARK_KEY = 'theme_preference';
  private readonly ARABIC_SIZE_KEY = 'dd_arabic_size';
  private readonly platformId = inject(PLATFORM_ID);

  palette = signal<PaletteKey>('dusk');
  isDark = signal(false);
  arabicSize = signal(32); // px, range 20–56 step 4

  currentPalette = computed<ThemePalette>(() =>
    this.isDark() ? DARK_PALETTE : PALETTES[this.palette()]
  );

  constructor() {
    this.initializeTheme();

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const t = this.currentPalette();
      const root = document.documentElement;
      root.style.setProperty('--dd-bg', t.bg);
      root.style.setProperty('--dd-surface', t.surface);
      root.style.setProperty('--dd-card', t.card);
      root.style.setProperty('--dd-ink', t.ink);
      root.style.setProperty('--dd-ink-muted', t.inkMuted);
      root.style.setProperty('--dd-ink-faint', t.inkFaint);
      root.style.setProperty('--dd-accent', t.accent);
      root.style.setProperty('--dd-accent2', t.accent2);
      root.style.setProperty('--dd-ring', t.ring);
      root.style.setProperty('--dd-line', t.line);

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', this.isDark() ? '#0f1419' : t.accent);
    });
  }

  private initializeTheme() {
    if (!isPlatformBrowser(this.platformId)) return;

    const storedPalette = localStorage.getItem(this.PALETTE_KEY) as PaletteKey | null;
    if (storedPalette && PALETTES[storedPalette]) {
      this.palette.set(storedPalette);
    }

    const storedDark = localStorage.getItem(this.DARK_KEY);
    if (storedDark) {
      this.isDark.set(storedDark === 'dark');
    } else {
      this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    const storedSize = localStorage.getItem(this.ARABIC_SIZE_KEY);
    if (storedSize) {
      const n = parseInt(storedSize, 10);
      if (n >= 20 && n <= 56) this.arabicSize.set(n);
    }
  }

  setPalette(key: PaletteKey) {
    this.palette.set(key);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.PALETTE_KEY, key);
    }
  }

  toggleTheme() {
    const newDark = !this.isDark();
    this.isDark.set(newDark);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.DARK_KEY, newDark ? 'dark' : 'light');
    }
  }

  adjustArabicSize(delta: number) {
    const next = Math.min(56, Math.max(20, this.arabicSize() + delta));
    this.arabicSize.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.ARABIC_SIZE_KEY, String(next));
    }
  }

  get paletteKeys(): PaletteKey[] { return ['dusk', 'clay', 'sage']; }
  get allPalettes() { return PALETTES; }
}
