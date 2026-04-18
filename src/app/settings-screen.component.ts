import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ThemeService, PaletteKey } from './theme.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-screen',
  standalone: true,
  template: `
    <div class="px-5 pb-32" style="padding-top: 58px;">

      <div class="mt-3 mb-6">
        <div class="font-serif text-[32px] dd-text-ink" style="letter-spacing:-0.5px;">Ayarlar</div>
      </div>

      <!-- Appearance group -->
      <div class="mb-4">
        <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2 pl-1">Görünüm</div>
        <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">

          <!-- Dark mode -->
          <div class="px-4 py-3.5 flex justify-between items-center border-b" style="border-color:var(--dd-line)">
            <span class="font-sans text-[15px] dd-text-ink">Gece modu</span>
            <button (click)="themeService.toggleTheme()" class="border-none cursor-pointer p-0 relative"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="themeService.isDark() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="themeService.isDark() ? '20px' : '2px'"></div>
            </button>
          </div>

          <!-- Palette picker -->
          <div class="px-4 py-3.5" style="border-bottom: 0.5px solid var(--dd-line)">
            <div class="font-sans text-[15px] dd-text-ink mb-3">Renk paleti</div>
            <div class="flex gap-2">
              @for (key of themeService.paletteKeys; track key) {
                <button (click)="themeService.setPalette(key)" class="flex-1 h-10 rounded-[10px] cursor-pointer p-1 flex gap-0.5 items-center justify-center press-scale"
                        [style.background]="palettes()[key].bg"
                        [style.border]="themeService.palette() === key ? '2px solid var(--dd-ink)' : '1px solid var(--dd-line)'">
                  <div class="w-2.5 h-5 rounded-[2px]" [style.background]="palettes()[key].ink"></div>
                  <div class="w-2.5 h-5 rounded-[2px]" [style.background]="palettes()[key].accent"></div>
                  <div class="w-2.5 h-5 rounded-[2px]" [style.background]="palettes()[key].accent2"></div>
                </button>
              }
            </div>
          </div>

          <!-- Counter style -->
          <div class="px-4 py-3.5" style="border-bottom: 0.5px solid var(--dd-line)">
            <div class="font-sans text-[15px] dd-text-ink mb-3">Sayaç stili</div>
            <div class="flex gap-1">
              @for (v of counterVariants; track v.key) {
                <button (click)="setCounterVariant(v.key)" class="flex-1 py-1.5 px-1 rounded-lg cursor-pointer font-sans text-[11px] font-medium press-scale"
                        [style.background]="counterVariant() === v.key ? 'var(--dd-ink)' : 'transparent'"
                        [style.color]="counterVariant() === v.key ? 'var(--dd-bg)' : 'var(--dd-ink-muted)'"
                        [style.border]="counterVariant() === v.key ? 'none' : '1px solid var(--dd-line)'">
                  {{ v.label }}
                </button>
              }
            </div>
          </div>

          <!-- Progress viz -->
          <div class="px-4 py-3.5">
            <div class="font-sans text-[15px] dd-text-ink mb-3">İlerleme çubuğu</div>
            <div class="flex gap-1">
              @for (v of progressVariants; track v.key) {
                <button (click)="setProgressVariant(v.key)" class="flex-1 py-1.5 px-1 rounded-lg cursor-pointer font-sans text-[11px] font-medium press-scale"
                        [style.background]="progressVariant() === v.key ? 'var(--dd-ink)' : 'transparent'"
                        [style.color]="progressVariant() === v.key ? 'var(--dd-bg)' : 'var(--dd-ink-muted)'"
                        [style.border]="progressVariant() === v.key ? 'none' : '1px solid var(--dd-line)'">
                  {{ v.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Account group -->
      <div class="mb-4">
        <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2 pl-1">Hesap</div>
        <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">
          <button (click)="openAuth.emit()" class="w-full px-4 py-3.5 flex justify-between items-center border-none cursor-pointer press-scale" style="background:transparent">
            <span class="font-sans text-[15px] dd-text-ink">Google ile Giriş</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Reset group -->
      <div class="mb-4">
        <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2 pl-1">Veri</div>
        <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">
          <button (click)="openReset.emit()" class="w-full px-4 py-3.5 flex justify-between items-center border-none cursor-pointer press-scale" style="background:transparent">
            <span class="font-sans text-[15px]" style="color:#ef4444">Bugünkü ilerlemeyi sıfırla</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.6" stroke-linecap="round"><path d="M3 12a9 9 0 1015-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>
      </div>

      <div class="text-center mt-8 font-serif text-[14px] italic dd-text-faint">DailyDuas · v1.0</div>
    </div>
  `,
})
export class SettingsScreenComponent {
  readonly themeService = inject(ThemeService);

  openAuth = output<void>();
  openReset = output<void>();
  counterVariantChange = output<'hero' | 'beads' | 'focus'>();
  progressVariantChange = output<'bar' | 'segments' | 'dots'>();

  counterVariant = input<'hero' | 'beads' | 'focus'>('hero');
  progressVariant = input<'bar' | 'segments' | 'dots'>('bar');

  counterVariants = [
    { key: 'hero' as const, label: 'Daire' },
    { key: 'beads' as const, label: 'Boncuk' },
    { key: 'focus' as const, label: 'Odak' },
  ];

  progressVariants = [
    { key: 'bar' as const, label: 'Çubuk' },
    { key: 'segments' as const, label: 'Segmentli' },
    { key: 'dots' as const, label: 'Noktalı' },
  ];

  palettes() { return this.themeService.allPalettes; }

  setCounterVariant(v: 'hero' | 'beads' | 'focus') {
    this.counterVariantChange.emit(v);
  }

  setProgressVariant(v: 'bar' | 'segments' | 'dots') {
    this.progressVariantChange.emit(v);
  }
}
