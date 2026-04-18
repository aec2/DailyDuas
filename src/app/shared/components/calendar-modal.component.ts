import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CalendarDay } from '../types/app-ui.types';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in-overlay"
        role="button"
        tabindex="-1"
        (click)="close.emit()"
        (keydown.escape)="close.emit()"
      >
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-4 sm:p-6 animate-fade-in max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Zikir takvimi"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Zikir Takvimi</p>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ monthLabel() }}</h3>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button
                (click)="previousMonth.emit()"
                class="rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Onceki ay"
              >
                <mat-icon>chevron_left</mat-icon>
              </button>
              <button
                (click)="nextMonth.emit()"
                class="rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Sonraki ay"
              >
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button
                (click)="close.emit()"
                class="rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Takvimi kapat"
                autofocus
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          @if (signedIn()) {
            <div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              @for (label of weekdayLabels(); track label) {
                <div>{{ label }}</div>
              }
            </div>

            <div class="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
              @for (day of days(); track day.dateKey) {
                <div class="aspect-square min-h-14 sm:min-h-20 rounded-xl border p-1.5 sm:p-2 transition-colors" [class]="getDayClasses(day)">
                  <div class="text-xs sm:text-sm font-semibold">{{ day.dayNumber }}</div>
                  @if (day.isCurrentMonth && day.entry) {
                    <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] leading-tight">
                      <div>{{ day.entry.completedPrayers }}/{{ day.entry.totalPrayers }}</div>
                      <div class="hidden sm:block">{{ day.entry.finished ? 'Tamamlandi' : 'Devam etti' }}</div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-emerald-500"></span> Tamamlandi</span>
              <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-amber-400"></span> Kismen yapildi</span>
              <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600"></span> Kayit yok</span>
            </div>
          } @else {
            <div class="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Takvim goruntusu icin once Google ile giris yapin.
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

  getDayClasses(day: CalendarDay) {
    if (!day.isCurrentMonth) {
      return 'border-transparent bg-slate-50 text-slate-300 dark:bg-slate-900/40 dark:text-slate-600';
    }

    if (!day.entry) {
      return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300';
    }

    return day.entry.finished
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
  }
}
