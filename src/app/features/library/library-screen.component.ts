import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { PrayerService } from '../../core/services/prayer.service';
import { Prayer } from '../../data/data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-library-screen',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  template: `
    <div class="px-5 pb-32" style="padding-top: 36px;">

      <!-- Header -->
      <div class="flex justify-between items-start mt-3 mb-4">
        <div>
          <div class="font-mono text-[11px] dd-text-faint tracking-[1.4px] uppercase mb-0.5">
            {{ prayers().length }} Zikir
          </div>
          <div class="font-serif text-[32px] dd-text-ink" style="letter-spacing:-0.5px;">Kütüphane</div>
          <!-- completion summary -->
          <div class="flex items-center gap-1.5 mt-1.5">
            <div class="h-1.5 rounded-full overflow-hidden flex-1 max-w-[100px]" style="background:var(--dd-line)">
              <div class="h-full rounded-full progress-fill"
                   [style.width.%]="completedPct()"
                   [style.background]="completedPct() >= 100 ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
              </div>
            </div>
            <div class="font-mono text-[10px] dd-text-faint">
              {{ completedCount() }}/{{ prayers().length }} tamamlandı
            </div>
          </div>
        </div>
        <button (click)="addNew.emit()" class="dd-bg-ink dd-text-on-ink border-none rounded-full px-3.5 py-2.5 flex items-center gap-1.5 cursor-pointer font-sans text-[13px] font-medium press-scale mt-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Yeni
        </button>
      </div>

      <!-- Search -->
      <div class="dd-bg-card rounded-2xl px-3.5 py-2.5 flex items-center gap-2 mb-3.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Zikir ara..."
               class="flex-1 border-none bg-transparent outline-none font-sans text-[15px] dd-text-ink placeholder:dd-text-faint" />
      </div>

      <!-- Category chips -->
      <div class="flex gap-1.5 overflow-x-auto mb-4 pb-1" style="scrollbar-width:none">
        @for (cat of categories(); track cat) {
          <button (click)="activeFilter.set(cat)"
                  class="border-none rounded-full px-3 py-1.5 cursor-pointer font-sans text-[12px] font-medium whitespace-nowrap shrink-0 press-scale"
                  [style.background]="activeFilter() === cat ? 'var(--dd-ink)' : 'transparent'"
                  [style.color]="activeFilter() === cat ? 'var(--dd-bg)' : 'var(--dd-ink-muted)'"
                  [style.border]="activeFilter() === cat ? 'none' : '1px solid var(--dd-line)'">
            {{ cat }}
          </button>
        }
      </div>

      <!-- Prayer list -->
      <div class="flex flex-col gap-2.5">
        @for (dua of filtered(); track dua.id) {
          <button (click)="openDua.emit(dua.id)"
                  class="dd-bg-surface border-none rounded-[20px] p-[14px_16px] text-left cursor-pointer flex flex-col gap-2.5 press-scale w-full"
                  style="box-shadow: 0 1px 0 var(--dd-line)">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-mono text-[9px] dd-text-faint tracking-[0.8px] uppercase mb-0.5">
                  {{ dua.category || 'Zikir' }} · {{ dua.time || 'Her Zaman' }}
                </div>
                <div class="font-serif text-[17px] font-medium dd-text-ink mb-0.5" style="letter-spacing:-0.2px;">
                  {{ dua.title || dua.transliteration }}
                </div>
                <div class="font-arabic text-[18px] dd-text-muted text-right leading-relaxed mt-1" dir="rtl">
                  {{ dua.arabic | slice:0:60 }}{{ dua.arabic.length > 60 ? '…' : '' }}
                </div>
              </div>
              <div class="flex flex-col items-end gap-0.5 shrink-0">
                <div class="flex items-baseline gap-0.5 font-serif">
                  <span class="text-[20px] font-medium"
                        [style.color]="getCount(dua) >= dua.targetCount ? 'var(--dd-accent2)' : 'var(--dd-ink)'">
                    {{ getCount(dua) }}
                  </span>
                  <span class="text-[12px] dd-text-faint">/{{ dua.targetCount }}</span>
                </div>
                @if (getCount(dua) >= dua.targetCount) {
                  <div class="font-mono text-[8px] tracking-[0.6px] uppercase" style="color:var(--dd-accent2)">✓ tamam</div>
                }
              </div>
            </div>
            <div class="w-full h-1 rounded-full overflow-hidden" style="background:var(--dd-line)">
              <div class="h-full rounded-full progress-fill"
                   [style.width.%]="progressPct(dua)"
                   [style.background]="progressPct(dua) >= 100 ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
              </div>
            </div>
          </button>
        }
      </div>
    </div>
  `,
})
export class LibraryScreenComponent {
  private readonly prayerService = inject(PrayerService);

  openDua = output<number>();
  addNew = output<void>();

  prayers = this.prayerService.prayers;
  progress = this.prayerService.progress;
  query = signal('');
  activeFilter = signal('Tümü');

  categories = computed(() => {
    const cats = Array.from(new Set(this.prayers().map(p => p.category).filter(Boolean))) as string[];
    return ['Tümü', ...cats];
  });

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    const f = this.activeFilter();
    return this.prayers().filter(d => {
      const matchQ = !q || (d.title || d.transliteration).toLowerCase().includes(q) || d.transliteration.toLowerCase().includes(q);
      const matchC = f === 'Tümü' || d.category === f;
      return matchQ && matchC;
    });
  });

  completedCount = computed(() => {
    const p = this.progress();
    return this.prayers().filter(d => (p[d.id] || 0) >= d.targetCount).length;
  });

  completedPct = computed(() => {
    const total = this.prayers().length;
    return total > 0 ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  getCount(prayer: Prayer): number { return this.progress()[prayer.id] || 0; }
  progressPct(prayer: Prayer): number {
    return Math.min(100, ((this.progress()[prayer.id] || 0) / prayer.targetCount) * 100);
  }
}
