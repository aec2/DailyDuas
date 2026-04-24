import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DailyRoutineService } from '../../core/services/daily-routine.service';
import { DailyRoutine, DailyRoutineProgress } from '../../shared/types/daily-routine.types';

interface CalendarCell {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  entry: DailyRoutineProgress | null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-routine-calendar-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="absolute inset-0 z-[55] flex items-center justify-center p-4 animate-fade-in-fast"
           style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);"
           (click)="close.emit()">
        <div (click)="$event.stopPropagation()"
             class="dd-bg-surface rounded-[24px] max-w-2xl w-full p-5 animate-fade-in overflow-y-auto"
             style="box-shadow: 0 12px 40px rgba(0,0,0,0.15); max-height: 90vh;">

          <!-- Header -->
          <div class="mb-4 flex items-start justify-between">
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-1">Rutin Takvimi</div>
              <div class="font-serif text-[22px] dd-text-ink" style="letter-spacing:-0.3px;">{{ monthLabel() }}</div>
            </div>
            <div class="flex items-center gap-1.5">
              <button (click)="previousMonth()"
                      class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                      aria-label="Önceki ay">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button (click)="nextMonth()"
                      class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                      aria-label="Sonraki ay">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <button (click)="close.emit()"
                      class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                      aria-label="Kapat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- Weekday labels -->
          <div class="grid grid-cols-7 gap-1 text-center font-mono text-[10px] dd-text-faint tracking-[0.6px] uppercase">
            @for (label of weekdayLabels; track label) {
              <div>{{ label }}</div>
            }
          </div>

          <!-- Grid -->
          <div class="mt-2 grid grid-cols-7 gap-1">
            @for (cell of cells(); track cell.dateKey) {
              <button (click)="selectDay(cell)" [disabled]="cell.isFuture || !cell.isCurrentMonth"
                      class="aspect-square rounded-[12px] p-1.5 flex flex-col items-center justify-start cursor-pointer press-scale border-none"
                      [style.background]="bgFor(cell)"
                      [style.border]="borderFor(cell)"
                      [style.opacity]="cell.isCurrentMonth ? (cell.isFuture ? 0.4 : 1) : 0.25"
                      [style.cursor]="(cell.isFuture || !cell.isCurrentMonth) ? 'default' : 'pointer'">
                <div class="font-mono text-[11px] font-medium" [style.color]="colorFor(cell)">{{ cell.dayNumber }}</div>
                @if (cell.isCurrentMonth && cell.entry && cell.entry.totalActiveCount > 0) {
                  <div class="font-mono text-[8px] mt-0.5"
                       [style.color]="cell.entry.isFullyCompleted ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
                    {{ cell.entry.completedCount }}/{{ cell.entry.totalActiveCount }}
                  </div>
                }
              </button>
            }
          </div>

          <!-- Legend -->
          <div class="mt-4 flex gap-4 font-mono text-[10px] dd-text-faint tracking-[0.5px]">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" style="background:var(--dd-accent2)"></span> Tam
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" style="background:var(--dd-accent)"></span> Kısmen
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" style="background:var(--dd-line)"></span> Yok
            </span>
          </div>

          <!-- Selected day detail -->
          @if (selectedDay()) {
            <div class="mt-5 pt-4" style="border-top: 0.5px solid var(--dd-line);">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-0.5">
                    {{ selectedDayLabel() }}
                  </div>
                  <div class="font-serif text-[16px] dd-text-ink">
                    {{ dayCompletedCount() }} / {{ dayTotalCount() }} tamamlandı
                  </div>
                </div>
                <button (click)="selectedDay.set(null)"
                        class="border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale dd-bg-card"
                        aria-label="Kapat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="flex flex-col gap-1.5">
                @for (r of routineService.activeRoutines(); track r.id) {
                  <button (click)="toggleDay(r)"
                          class="w-full border-none text-left cursor-pointer press-scale rounded-[14px] p-2.5 flex items-center gap-3 dd-bg-card">
                    <div class="shrink-0 rounded-full flex items-center justify-center transition-all duration-200"
                         style="width:24px;height:24px;"
                         [style.background]="isDayDone(r.id) ? 'var(--dd-accent2)' : 'transparent'"
                         [style.border]="isDayDone(r.id) ? 'none' : '1.5px solid var(--dd-line)'">
                      @if (isDayDone(r.id)) {
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      }
                    </div>
                    <div class="flex-1 min-w-0 font-serif text-[14px] dd-text-ink truncate"
                         [style.text-decoration]="isDayDone(r.id) ? 'line-through' : 'none'">
                      {{ r.title }}
                    </div>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  imports: [],
})
export class RoutineCalendarModalComponent {
  readonly routineService = inject(DailyRoutineService);

  open = input.required<boolean>();
  close = output<void>();

  readonly weekdayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  private readonly today = new Date();
  month = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  selectedDay = signal<CalendarCell | null>(null);

  monthLabel = computed(() =>
    new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(this.month())
  );

  cells = computed<CalendarCell[]>(() => {
    const month = this.month();
    const entries = this.routineService.progressEntries();
    const firstDayOffset = (month.getDay() + 6) % 7; // Mon=0 start
    const gridStart = new Date(month);
    gridStart.setDate(month.getDate() - firstDayOffset);

    const todayKey = this.dateKey(new Date());

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = this.dateKey(d);
      const isFuture = key > todayKey;
      return {
        dateKey: key,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month.getMonth(),
        isToday: key === todayKey,
        isFuture,
        entry: entries[key] ?? null,
      };
    });
  });

  selectedDayLabel = computed(() => {
    const sel = this.selectedDay();
    if (!sel) return '';
    const [y, m, d] = sel.dateKey.split('-').map(Number);
    return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date(y, m - 1, d))
      .toUpperCase();
  });

  dayCompletedCount = computed(() => {
    const sel = this.selectedDay();
    if (!sel) return 0;
    const entry = this.routineService.progressEntries()[sel.dateKey];
    if (!entry) return 0;
    const activeIds = new Set(this.routineService.activeRoutines().map(r => r.id));
    return Object.values(entry.items).filter(it => it.completed && activeIds.has(it.routineId)).length;
  });

  dayTotalCount = computed(() => this.routineService.activeRoutines().length);

  previousMonth() {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  nextMonth() {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  selectDay(cell: CalendarCell) {
    if (cell.isFuture || !cell.isCurrentMonth) return;
    this.selectedDay.set(cell);
  }

  isDayDone(routineId: string): boolean {
    const sel = this.selectedDay();
    if (!sel) return false;
    const entry = this.routineService.progressEntries()[sel.dateKey];
    return !!entry?.items?.[routineId]?.completed;
  }

  async toggleDay(r: DailyRoutine) {
    const sel = this.selectedDay();
    if (!sel) return;
    await this.routineService.toggleRoutineForDate(sel.dateKey, r, !this.isDayDone(r.id));
  }

  bgFor(cell: CalendarCell): string {
    if (!cell.isCurrentMonth) return 'transparent';
    if (cell.isToday && !cell.entry) return 'var(--dd-ring)';
    if (!cell.entry || cell.entry.totalActiveCount === 0) return 'var(--dd-card)';
    return cell.entry.isFullyCompleted
      ? 'linear-gradient(135deg, rgba(122,154,143,0.22), rgba(122,154,143,0.09))'
      : 'linear-gradient(135deg, rgba(212,165,116,0.22), rgba(212,165,116,0.09))';
  }

  borderFor(cell: CalendarCell): string {
    if (!cell.isCurrentMonth) return '1px solid transparent';
    if (cell.isToday) return '1.5px solid var(--dd-accent)';
    if (!cell.entry || cell.entry.totalActiveCount === 0) return '1px solid var(--dd-line)';
    return cell.entry.isFullyCompleted ? '1px solid var(--dd-accent2)' : '1px solid var(--dd-accent)';
  }

  colorFor(cell: CalendarCell): string {
    if (!cell.isCurrentMonth) return 'var(--dd-ink-faint)';
    if (cell.entry?.isFullyCompleted) return 'var(--dd-accent2)';
    return 'var(--dd-ink)';
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
