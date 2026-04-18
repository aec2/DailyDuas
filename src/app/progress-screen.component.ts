import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { PrayerService } from './prayer.service';
import { DailyHistoryService, DailyHistoryEntry } from './daily-history.service';
import { Prayer } from './data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-progress-screen',
  standalone: true,
  imports: [SlicePipe],
  template: `
    <div class="px-5 pb-32" style="padding-top: 58px;">

      <!-- Header -->
      <div class="mt-3 mb-5">
        <div class="font-mono text-[11px] dd-text-faint tracking-[1.4px] uppercase mb-1">Yolculuğun</div>
        <div class="font-serif text-[32px] dd-text-ink" style="letter-spacing:-0.5px;">İlerleme</div>
      </div>

      <!-- Stat grid -->
      <div class="grid grid-cols-2 gap-2.5 mb-5">
        <!-- Streak card (accent background) -->
        <div class="dd-bg-ink rounded-[20px] p-[14px_16px] relative overflow-hidden">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2s4 4 4 8a4 4 0 01-8 0c0-2 1-3 1-3s-1-2 0-4 3-1 3-1z"/>
            <path d="M12 22a7 7 0 007-7c0-3-2-5-3-6 0 2-1 3-2 3s-2-1-2-3c-2 1-4 3-4 6a4 4 0 004 7z"/>
          </svg>
          <div class="font-serif text-[28px] leading-snug mt-2.5 dd-text-on-ink" style="letter-spacing:-0.5px;">
            {{ streak() }} <span class="text-[13px] opacity-50">gün</span>
          </div>
          <div class="font-sans text-[11px] mt-0.5" style="color:rgba(255,255,255,0.6)">Mevcut seri</div>
        </div>

        <!-- Completed today -->
        <div class="dd-bg-card rounded-[20px] p-[14px_16px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          <div class="font-serif text-[28px] leading-snug mt-2.5 dd-text-ink" style="letter-spacing:-0.5px;">
            {{ completedToday() }} <span class="text-[13px] dd-text-faint">/ {{ totalPrayers() }}</span>
          </div>
          <div class="font-sans text-[11px] dd-text-muted mt-0.5">Bugün tamamlanan</div>
        </div>

        <!-- Total counts today -->
        <div class="dd-bg-card rounded-[20px] p-[14px_16px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>
          <div class="font-serif text-[28px] leading-snug mt-2.5 dd-text-ink" style="letter-spacing:-0.5px;">
            {{ totalDone() }} <span class="text-[13px] dd-text-faint">/ {{ totalTarget() }}</span>
          </div>
          <div class="font-sans text-[11px] dd-text-muted mt-0.5">Bugün toplam</div>
        </div>

        <!-- Week total -->
        <div class="dd-bg-card rounded-[20px] p-[14px_16px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>
          <div class="font-serif text-[28px] leading-snug mt-2.5 dd-text-ink" style="letter-spacing:-0.5px;">
            {{ weekTotal() }} <span class="text-[11px] dd-text-faint">bu hafta</span>
          </div>
          <div class="font-sans text-[11px] dd-text-muted mt-0.5">Tamamlanan gün</div>
        </div>
      </div>

      <!-- 14-day history strip -->
      <div class="dd-bg-card rounded-[24px] p-[18px_18px_20px] mb-5">
        <div class="flex justify-between items-baseline mb-3.5">
          <div class="font-serif text-[17px] font-medium dd-text-ink">Son 14 Gün</div>
          <div class="font-mono text-[10px] dd-text-faint tracking-[1px] uppercase">
            {{ perfectDays() }} / 14 tam
          </div>
        </div>
        <div class="flex gap-1 items-end" style="height:70px;">
          @for (entry of last14Days(); track entry.dateKey) {
            <div class="flex-1 flex flex-col gap-1 items-center">
              <div class="w-full rounded-[4px] min-h-1"
                   [style.height.px]="entry.pct * 56"
                   [style.background]="entry.pct >= 1 ? 'var(--dd-accent2)' : entry.pct >= 0.5 ? 'var(--dd-accent)' : 'var(--dd-ink-faint)'"
                   [style.opacity]="entry.pct >= 0.5 ? 1 : 0.5">
              </div>
              <div class="font-mono text-[9px] dd-text-faint">{{ entry.dayLabel }}</div>
            </div>
          }
        </div>
      </div>

      <!-- Per-dua breakdown -->
      <div class="font-serif text-[17px] font-medium dd-text-ink mb-3">Zikir Bazında · Bugün</div>
      <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">
        @for (dua of prayers(); track dua.id; let i = $index; let last = $last) {
          <div class="px-4 py-3 flex flex-col gap-2"
               [style.border-bottom]="last ? 'none' : '0.5px solid var(--dd-line)'">
            <div class="flex justify-between items-center">
              <div class="font-serif text-[15px] dd-text-ink font-medium">
                {{ dua.title || dua.transliteration | slice:0:30 }}
              </div>
              <div class="font-mono text-[11px]"
                   [style.color]="getCount(dua) >= dua.targetCount ? 'var(--dd-accent2)' : 'var(--dd-ink-muted)'">
                {{ getCount(dua) }}/{{ dua.targetCount }}
              </div>
            </div>
            <div class="w-full h-1 rounded-full overflow-hidden" style="background:var(--dd-line)">
              <div class="h-full rounded-full progress-fill"
                   [style.width.%]="progressPct(dua)"
                   [style.background]="progressPct(dua) >= 100 ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ProgressScreenComponent {
  private readonly prayerService = inject(PrayerService);
  private readonly historyService = inject(DailyHistoryService);

  prayers = computed(() => this.prayerService.prayers().slice(0, 12));
  progress = this.prayerService.progress;

  totalDone = computed(() => {
    const p = this.progress();
    return this.prayerService.prayers().reduce((s, d) => s + Math.min(p[d.id] || 0, d.targetCount), 0);
  });
  totalTarget = computed(() => this.prayerService.prayers().reduce((s, d) => s + d.targetCount, 0));
  totalPrayers = this.prayerService.totalPrayers;
  completedToday = this.prayerService.completedPrayers;

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

  weekTotal = computed(() => {
    const entries = this.historyService.sortedEntries();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return entries.filter(e => {
      const d = new Date(e.dateKey + 'T00:00:00');
      return d >= cutoff && e.finished;
    }).length;
  });

  last14Days = computed(() => {
    const entries = this.historyService.entries();
    const days: Array<{ dateKey: string; dayLabel: string; pct: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry: DailyHistoryEntry | undefined = entries[key];
      const pct = entry ? (entry.completedPrayers / Math.max(entry.totalPrayers, 1)) : 0;
      days.push({ dateKey: key, dayLabel: ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'][d.getDay()], pct });
    }
    return days;
  });

  perfectDays = computed(() => this.last14Days().filter(d => d.pct >= 1).length);

  getCount(prayer: Prayer): number { return this.progress()[prayer.id] || 0; }
  progressPct(prayer: Prayer): number {
    return Math.min(100, ((this.progress()[prayer.id] || 0) / prayer.targetCount) * 100);
  }
}
