import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { DailyRoutineService } from '../../core/services/daily-routine.service';
import { DailyRoutine } from '../../shared/types/daily-routine.types';
import { AuthService } from '../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-routines-screen',
  standalone: true,
  template: `
    <div class="px-5 pb-32" style="padding-top: 36px;">

      <!-- Header -->
      <div class="mt-3 mb-5 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="font-mono text-[11px] dd-text-faint tracking-[1.4px] uppercase mb-0.5">
            {{ todayLabel() }}
          </div>
          <div class="font-serif text-[30px] leading-tight dd-text-ink" style="letter-spacing:-0.5px;">
            Günlük Rutin
          </div>
          <div class="font-mono text-[10px] mt-1" style="color:var(--dd-accent)">
            Bugünün alışkanlıkları
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button (click)="openCalendar.emit()"
                  class="border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale dd-bg-card"
                  aria-label="Takvimi aç">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </button>
          <button (click)="manage.emit()"
                  class="border-none rounded-full px-3.5 py-2 flex items-center gap-1.5 cursor-pointer font-sans text-[12px] font-medium press-scale dd-bg-card dd-text-ink"
                  aria-label="Rutinleri düzenle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Yönet
          </button>
        </div>
      </div>

      <!-- Signed-out state -->
      @if (!signedIn()) {
        <div class="dd-bg-card rounded-[24px] p-6 text-center">
          <div class="font-serif text-[18px] dd-text-ink mb-2">Giriş yapman gerekiyor</div>
          <div class="font-sans text-[13px] dd-text-muted mb-4">
            Günlük rutinlerini kaydedebilmek için hesabınla giriş yap.
          </div>
          <button (click)="openAuth.emit()"
                  class="border-none rounded-full px-5 py-2.5 cursor-pointer font-sans text-[13px] font-medium press-scale"
                  style="background:var(--dd-accent);color:#fff;">
            Giriş Yap
          </button>
        </div>
      } @else {
        <!-- Progress summary -->
        <div class="dd-bg-card rounded-[24px] p-[18px_20px] mb-4 flex items-center gap-4">
          <!-- Progress ring -->
          <div class="relative shrink-0" style="width:64px;height:64px;">
            <svg width="64" height="64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--dd-line)" stroke-width="4"/>
              <circle cx="32" cy="32" r="28" fill="none"
                      [attr.stroke]="pctToday() >= 1 ? 'var(--dd-accent2)' : 'var(--dd-accent)'"
                      stroke-width="4"
                      [attr.stroke-dasharray]="175.93"
                      [attr.stroke-dashoffset]="175.93 * (1 - pctToday())"
                      stroke-linecap="round"
                      transform="rotate(-90 32 32)"
                      style="transition: stroke-dashoffset 400ms cubic-bezier(.2,.8,.2,1)"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <span class="font-serif text-[16px] dd-text-ink">{{ Math.round(pctToday() * 100) }}%</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-serif text-[18px] dd-text-ink">
              {{ completedToday() }} / {{ totalActive() }} tamamlandı
            </div>
            <div class="font-mono text-[10px] dd-text-faint tracking-[0.6px] mt-0.5">
              {{ isFullyComplete() ? '✓ bugün tam' : totalActive() - completedToday() + ' rutin kaldı' }}
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-4 gap-2 mb-4">
          <div class="dd-bg-card rounded-[16px] p-3 text-center">
            <div class="font-serif text-[22px] dd-text-ink leading-none">{{ currentStreak() }}</div>
            <div class="font-mono text-[9px] dd-text-faint tracking-[0.6px] uppercase mt-1">Seri</div>
          </div>
          <div class="dd-bg-card rounded-[16px] p-3 text-center">
            <div class="font-serif text-[22px] dd-text-ink leading-none">{{ bestStreak() }}</div>
            <div class="font-mono text-[9px] dd-text-faint tracking-[0.6px] uppercase mt-1">En İyi</div>
          </div>
          <div class="dd-bg-card rounded-[16px] p-3 text-center">
            <div class="font-serif text-[22px] dd-text-ink leading-none">{{ weekPct() }}%</div>
            <div class="font-mono text-[9px] dd-text-faint tracking-[0.6px] uppercase mt-1">Hafta</div>
          </div>
          <div class="dd-bg-card rounded-[16px] p-3 text-center">
            <div class="font-serif text-[22px] dd-text-ink leading-none">{{ monthPct() }}%</div>
            <div class="font-mono text-[9px] dd-text-faint tracking-[0.6px] uppercase mt-1">Ay</div>
          </div>
        </div>

        <!-- Loading state -->
        @if (routineService.loading() && activeRoutines().length === 0) {
          <div class="dd-bg-card rounded-[24px] p-8 text-center dd-text-faint font-sans text-[13px]">
            Yükleniyor…
          </div>
        }

        <!-- Empty state -->
        @if (!routineService.loading() && activeRoutines().length === 0) {
          <div class="dd-bg-card rounded-[24px] p-6 text-center">
            <div class="font-serif text-[16px] dd-text-ink mb-1.5">Henüz rutin yok</div>
            <div class="font-sans text-[13px] dd-text-muted mb-4">
              Varsayılan rutinler otomatik oluşturulacak. Biraz bekle ya da kendi rutinini ekle.
            </div>
            <button (click)="manage.emit()"
                    class="border-none rounded-full px-5 py-2.5 cursor-pointer font-sans text-[13px] font-medium press-scale"
                    style="background:var(--dd-accent);color:#fff;">
              + Yeni Rutin
            </button>
          </div>
        }

        <!-- Checklist -->
        @if (activeRoutines().length > 0) {
          <div class="flex flex-col gap-2.5">
            @for (r of activeRoutines(); track r.id) {
              <button (click)="toggle(r)"
                      class="w-full border-none text-left cursor-pointer press-scale rounded-[20px] p-[16px_18px] flex items-center gap-3.5"
                      [style.background]="isDone(r.id) ? 'var(--dd-card)' : 'var(--dd-card)'"
                      [style.opacity]="isDone(r.id) ? 0.75 : 1">

                <!-- Check box -->
                <div class="shrink-0 rounded-full flex items-center justify-center transition-all duration-200"
                     style="width:32px;height:32px;"
                     [style.background]="isDone(r.id) ? 'var(--dd-accent2)' : 'transparent'"
                     [style.border]="isDone(r.id) ? 'none' : '1.5px solid var(--dd-line)'">
                  @if (isDone(r.id)) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  }
                </div>

                <!-- Text -->
                <div class="flex-1 min-w-0">
                  <div class="font-serif text-[16px] font-medium dd-text-ink"
                       [style.text-decoration]="isDone(r.id) ? 'line-through' : 'none'">
                    {{ r.title }}
                  </div>
                  @if (r.description) {
                    <div class="font-sans text-[12px] dd-text-muted mt-0.5 truncate">
                      {{ r.description }}
                    </div>
                  }
                </div>

                <!-- Target badge -->
                @if (r.targetValue && r.targetUnit) {
                  <div class="shrink-0 font-mono text-[10px] tracking-[0.6px] uppercase px-2.5 py-1 rounded-full"
                       style="background:var(--dd-line);color:var(--dd-ink-faint);">
                    {{ r.targetValue }} {{ unitLabel(r.targetUnit) }}
                  </div>
                }
              </button>
            }
          </div>
        }

        @if (routineService.syncError()) {
          <div class="mt-4 font-sans text-[12px] text-center" style="color:#ef4444;">
            {{ routineService.syncError() }}
          </div>
        }
      }
    </div>
  `,
})
export class RoutinesScreenComponent {
  readonly routineService = inject(DailyRoutineService);
  private readonly authService = inject(AuthService);

  readonly Math = Math;

  manage = output<void>();
  openAuth = output<void>();
  openCalendar = output<void>();

  signedIn = computed(() => !!this.authService.user());
  activeRoutines = computed(() => this.routineService.activeRoutines());

  private progressToday = computed(() => this.routineService.todayProgress());

  completedToday = computed(() => {
    const p = this.progressToday();
    if (!p) return 0;
    const activeIds = new Set(this.activeRoutines().map(r => r.id));
    return Object.values(p.items).filter(it => it.completed && activeIds.has(it.routineId)).length;
  });

  totalActive = computed(() => this.activeRoutines().length);

  pctToday = computed(() => {
    const total = this.totalActive();
    if (total === 0) return 0;
    return Math.min(1, this.completedToday() / total);
  });

  isFullyComplete = computed(() => {
    const total = this.totalActive();
    return total > 0 && this.completedToday() >= total;
  });

  // ── Stats ─────────────────────────────────────────────
  currentStreak = computed(() => {
    const entries = this.routineService.progressEntries();
    let streak = 0;
    const d = new Date();
    // If today isn't fully complete, streak starts from yesterday
    const todayKey = this.dateKey(d);
    if (!entries[todayKey]?.isFullyCompleted) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const key = this.dateKey(d);
      if (entries[key]?.isFullyCompleted) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  });

  bestStreak = computed(() => {
    const entries = this.routineService.progressEntries();
    const fullDays = Object.values(entries)
      .filter(e => e.isFullyCompleted)
      .map(e => e.dateKey)
      .sort();
    let best = 0, cur = 0;
    let prev: Date | null = null;
    for (const key of fullDays) {
      const d = new Date(key);
      if (prev && (d.getTime() - prev.getTime()) === 86400000) cur++;
      else cur = 1;
      if (cur > best) best = cur;
      prev = d;
    }
    return best;
  });

  weekPct = computed(() => this.rollingPct(7));
  monthPct = computed(() => this.rollingPct(30));

  private rollingPct(days: number): number {
    const entries = this.routineService.progressEntries();
    let completed = 0, total = 0;
    const d = new Date();
    for (let i = 0; i < days; i++) {
      const key = this.dateKey(d);
      const e = entries[key];
      if (e && e.totalActiveCount > 0) {
        completed += e.completedCount;
        total += e.totalActiveCount;
      }
      d.setDate(d.getDate() - 1);
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  todayLabel = computed(() => {
    try {
      return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
        .format(new Date())
        .toUpperCase();
    } catch {
      return '';
    }
  });

  isDone(routineId: string): boolean {
    const p = this.progressToday();
    return !!p?.items?.[routineId]?.completed;
  }

  async toggle(routine: DailyRoutine): Promise<void> {
    const dateKey = this.routineService.todayKey();
    const currentlyDone = this.isDone(routine.id);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(currentlyDone ? 5 : 12);
    }
    await this.routineService.toggleRoutineForDate(dateKey, routine, !currentlyDone);
  }

  unitLabel(unit: string): string {
    switch (unit) {
      case 'minute': return 'dk';
      case 'page': return 'syf';
      case 'count': return 'adet';
      default: return unit;
    }
  }
}
