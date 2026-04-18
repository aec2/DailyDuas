import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { NgTemplateOutlet, SlicePipe, DecimalPipe } from '@angular/common';
import { PrayerService } from './prayer.service';
import { DailyHistoryService } from './daily-history.service';
import { AuthService } from './auth.service';
import { Prayer } from './data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-screen',
  standalone: true,
  imports: [NgTemplateOutlet, SlicePipe, DecimalPipe],
  template: `
    <div class="px-5 pb-32" style="padding-top: 36px;">

      <!-- Header row -->
      <div class="flex justify-between items-start mt-3 mb-7">
        <div>
          <div class="font-mono text-[11px] dd-text-faint tracking-[1.4px] uppercase mb-0.5">
            {{ gregorianDate }}
          </div>
          @if (hijriDate) {
            <div class="font-mono text-[10px] tracking-[0.8px] mb-1" style="color:var(--dd-accent)">
              {{ hijriDate }}
            </div>
          }
          <div class="font-serif text-[30px] leading-tight tracking-tight dd-text-ink" style="letter-spacing: -0.5px;">
            Esselamu<br>
            <em class="italic dd-text-accent">Aleyküm</em>
            @if (userName()) {
              <span class="not-italic dd-text-ink">, {{ userName() }}</span>
            }
          </div>
        </div>
        <div class="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl dd-bg-card">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2s4 4 4 8a4 4 0 01-8 0c0-2 1-3 1-3s-1-2 0-4 3-1 3-1z"/>
            <path d="M12 22a7 7 0 007-7c0-3-2-5-3-6 0 2-1 3-2 3s-2-1-2-3c-2 1-4 3-4 6a4 4 0 004 7z"/>
          </svg>
          <div class="font-serif text-[18px] font-medium leading-none dd-text-ink">{{ streak() }}</div>
          <div class="font-mono text-[9px] dd-text-faint tracking-[0.5px] uppercase">GÜN</div>
        </div>
      </div>

      <!-- Today's progress card -->
      <div class="rounded-[28px] dd-bg-card p-[22px_22px_24px] mb-6 relative overflow-hidden">
        <!-- decorative arc -->
        <svg width="180" height="180" style="position:absolute;right:-40px;top:-40px;opacity:0.15;pointer-events:none;">
          <circle cx="90" cy="90" r="70" stroke="var(--dd-accent)" stroke-width="1" fill="none"/>
          <circle cx="90" cy="90" r="50" stroke="var(--dd-accent)" stroke-width="1" fill="none"/>
        </svg>

        <div class="font-mono text-[10px] dd-text-faint tracking-[1.4px] uppercase mb-2">Bugünün Zikirleeri</div>
        <div class="flex items-end gap-1.5 mb-3.5">
          <div class="font-serif text-[48px] leading-none dd-text-ink" style="letter-spacing:-1px;">{{ totalDone() }}</div>
          <div class="font-serif text-[22px] dd-text-muted font-light leading-snug">/ {{ totalTarget() }}</div>
        </div>

        <!-- Progress bar -->
        <div class="w-full h-1 rounded-full mb-3.5 overflow-hidden" style="background:var(--dd-line)">
          <div class="h-full rounded-full progress-fill"
               [style.width.%]="progressPercent()"
               [style.background]="progressPercent() >= 100 ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
          </div>
        </div>

        <div class="flex justify-between font-sans text-[12px] dd-text-muted">
          <span>%{{ progressPercent() | number:'1.0-0' }} tamamlandı</span>
          <span class="dd-text-faint">Fecirde sıfırlanır</span>
        </div>
      </div>

      <!-- In progress section -->
      @if (inProgress().length > 0) {
        <div class="flex justify-between items-baseline mb-3">
          <div class="font-serif text-[20px] font-medium dd-text-ink" style="letter-spacing:-0.3px;">Devam Ediyor</div>
          <div class="font-mono text-[10px] dd-text-faint tracking-[0.6px] uppercase">{{ inProgress().length }} aktif</div>
        </div>
        <div class="flex flex-col gap-2.5 mb-7">
          @for (dua of inProgress(); track dua.id) {
            <button (click)="openCounter.emit(dua.id)" class="dd-bg-surface border-none rounded-[20px] p-[14px_16px] text-left cursor-pointer flex flex-col gap-2.5 press-scale w-full"
                    style="box-shadow: 0 1px 0 var(--dd-line)">
              <ng-container *ngTemplateOutlet="duaRowContent; context: { dua }"></ng-container>
            </button>
          }
        </div>
      }

      <!-- Suggested section -->
      @if (suggested().length > 0) {
        <div class="flex justify-between items-baseline mb-3">
          <div class="font-serif text-[20px] font-medium dd-text-ink" style="letter-spacing:-0.3px;">Sıradakiler</div>
          <div class="font-mono text-[10px] dd-text-faint tracking-[0.6px] uppercase">{{ suggested().length }} bekliyor</div>
        </div>
        <div class="flex flex-col gap-2.5">
          @for (dua of suggested(); track dua.id) {
            <button (click)="openDua.emit(dua.id)" class="dd-bg-surface border-none rounded-[20px] p-[14px_16px] text-left cursor-pointer flex flex-col gap-2.5 press-scale w-full"
                    style="box-shadow: 0 1px 0 var(--dd-line)">
              <ng-container *ngTemplateOutlet="duaRowContent; context: { dua }"></ng-container>
            </button>
          }
        </div>
      }

      <!-- All completed banner -->
      @if (isAllDone()) {
        <div class="rounded-[24px] p-6 text-center animate-fade-in mt-4" style="background:var(--dd-card)">
          <div class="font-serif text-[28px] dd-text-accent mb-2">✓</div>
          <div class="font-serif text-[20px] dd-text-ink mb-1">Tebrikler!</div>
          <div class="font-sans text-[13px] dd-text-muted">Bugünkü zikirlerinizi tamamladınız. Allah kabul etsin.</div>
        </div>
      }
    </div>

    <!-- Shared dua row template -->
    <ng-template #duaRowContent let-dua="dua">
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
      <!-- progress bar -->
      <div class="w-full h-1 rounded-full overflow-hidden" style="background:var(--dd-line)">
        <div class="h-full rounded-full progress-fill"
             [style.width.%]="progressPct(dua)"
             [style.background]="progressPct(dua) >= 100 ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
        </div>
      </div>
    </ng-template>
  `,
})
export class HomeScreenComponent {
  private readonly prayerService = inject(PrayerService);
  private readonly historyService = inject(DailyHistoryService);
  private readonly authService = inject(AuthService);

  userName = computed(() => {
    const u = this.authService.user();
    if (!u) return null;
    // Use first name only from displayName, or fall back to email prefix
    const display = u.displayName || u.email || '';
    return display.split(/[\s@]/)[0] || null;
  });

  openDua = output<number>();
  openCounter = output<number>();

  gregorianDate = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  hijriDate = (() => {
    try {
      return new Intl.DateTimeFormat('tr-TR-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    } catch { return ''; }
  })();

  prayers = this.prayerService.prayers;
  progress = this.prayerService.progress;

  totalDone = computed(() => {
    const p = this.progress();
    return this.prayers().reduce((s, d) => s + Math.min(p[d.id] || 0, d.targetCount), 0);
  });
  totalTarget = computed(() => this.prayers().reduce((s, d) => s + d.targetCount, 0));
  progressPercent = computed(() => {
    const t = this.totalTarget();
    return t > 0 ? Math.round((this.totalDone() / t) * 100) : 0;
  });
  isAllDone = this.prayerService.isAllCompleted;

  streak = computed(() => {
    const entries = this.historyService.sortedEntries();
    if (!entries.length) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < entries.length; i++) {
      const d = new Date(entries[i].dateKey + 'T00:00:00');
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff === i && entries[i].finished) count++;
      else break;
    }
    return count;
  });

  inProgress = computed(() => {
    const p = this.progress();
    return this.prayers().filter(d => (p[d.id] || 0) > 0 && (p[d.id] || 0) < d.targetCount).slice(0, 4);
  });

  suggested = computed(() => {
    const p = this.progress();
    return this.prayers().filter(d => (p[d.id] || 0) === 0).slice(0, 3);
  });

  getCount(prayer: Prayer): number {
    return this.progress()[prayer.id] || 0;
  }

  progressPct(prayer: Prayer): number {
    return Math.min(100, ((this.progress()[prayer.id] || 0) / prayer.targetCount) * 100);
  }
}
