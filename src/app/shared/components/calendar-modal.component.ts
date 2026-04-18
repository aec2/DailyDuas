import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalendarDay } from '../types/app-ui.types';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
        style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);"
        role="button"
        tabindex="-1"
        (click)="close.emit()"
        (keydown.escape)="close.emit()"
      >
        <div
          class="dd-bg-surface rounded-[24px] max-w-2xl w-full p-5 animate-fade-in overflow-y-auto"
          style="box-shadow: 0 12px 40px rgba(0,0,0,0.15); max-height: 90vh;"
          role="dialog"
          aria-modal="true"
          aria-label="Zikir takvimi"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4 flex items-start justify-between">
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-1">Zikir Takvimi</div>
              <div class="font-serif text-[22px] dd-text-ink" style="letter-spacing:-0.3px;">{{ monthLabel() }}</div>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                (click)="previousMonth.emit()"
                class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                aria-label="Önceki ay"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button
                (click)="nextMonth.emit()"
                class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                aria-label="Sonraki ay"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <button
                (click)="close.emit()"
                class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                aria-label="Takvimi kapat"
                autofocus
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          @if (signedIn()) {
            <div class="grid grid-cols-7 gap-1 text-center font-mono text-[10px] dd-text-faint tracking-[0.6px] uppercase">
              @for (label of weekdayLabels(); track label) {
                <div>{{ label }}</div>
              }
            </div>

            <div class="mt-2 grid grid-cols-7 gap-1">
              @for (day of days(); track day.dateKey) {
                <div class="aspect-square rounded-[12px] p-1.5 flex flex-col items-center justify-start"
                     [style.background]="getDayBg(day)"
                     [style.border]="getDayBorder(day)"
                     [style.opacity]="day.isCurrentMonth ? 1 : 0.4">
                  <div class="font-mono text-[11px] font-medium" [style.color]="getDayColor(day)">{{ day.dayNumber }}</div>
                  @if (day.isCurrentMonth && day.entry) {
                    <div class="font-mono text-[8px] mt-0.5" [style.color]="day.entry.finished ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
                      {{ day.entry.completedPrayers }}/{{ day.entry.totalPrayers }}
                    </div>
                  }
                </div>
              }
            </div>

            <div class="mt-4 flex gap-4 font-mono text-[10px] dd-text-faint tracking-[0.5px]">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full" style="background:var(--dd-accent2)"></span> Tamamlandı
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full" style="background:var(--dd-accent)"></span> Kısmen yapıldı
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full" style="background:var(--dd-line)"></span> Kayıt yok
              </span>
            </div>
          } @else {
            <div class="rounded-[18px] p-6 text-center dd-bg-card mt-2">
              <svg class="mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.4" stroke-linecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <div class="font-sans text-[14px] dd-text-muted">Takvim görüntüsü için önce Google ile giriş yapın.</div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class CalendarModalComponent {
  open = input.required<boolean>();
  monthLabel = input.required<string>();
  weekdayLabels = input.required<string[]>();
  days = input.required<CalendarDay[]>();
  signedIn = input.required<boolean>();

  close = output<void>();
  previousMonth = output<void>();
  nextMonth = output<void>();

  getDayBg(day: CalendarDay): string {
    if (!day.isCurrentMonth) return 'transparent';
    if (!day.entry) return 'var(--dd-card)';
    return day.entry.finished
      ? 'linear-gradient(135deg, rgba(122,154,143,0.2), rgba(122,154,143,0.08))'
      : 'linear-gradient(135deg, rgba(212,165,116,0.2), rgba(212,165,116,0.08))';
  }

  getDayBorder(day: CalendarDay): string {
    if (!day.isCurrentMonth || !day.entry) return '1px solid var(--dd-line)';
    return day.entry.finished
      ? '1px solid var(--dd-accent2)'
      : '1px solid var(--dd-accent)';
  }

  getDayColor(day: CalendarDay): string {
    if (!day.isCurrentMonth) return 'var(--dd-ink-faint)';
    if (day.entry?.finished) return 'var(--dd-accent2)';
    return 'var(--dd-ink)';
  }
}
