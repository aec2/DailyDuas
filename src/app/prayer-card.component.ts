import { Component, input, output, computed, signal } from '@angular/core';
import { Prayer } from './data';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-prayer-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div
      class="relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col h-full"
      [class]="isCompleted()
        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-sm'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md'"
      [class.animate-success-pop]="isAnimating()"
    >
      @if (isAnimating()) {
        <div class="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden rounded-2xl">
          <div class="absolute inset-0 bg-emerald-400/20 dark:bg-emerald-500/30 animate-flash"></div>
          <mat-icon
            class="text-emerald-500 dark:text-emerald-400 opacity-0 animate-scale-up-fade drop-shadow-lg"
            style="width: 120px; height: 120px; font-size: 120px;"
          >
            check_circle
          </mat-icon>
        </div>
      }
      <!-- Progress Bar -->
      <div
        class="absolute top-0 left-0 h-1.5 bg-emerald-500 dark:bg-emerald-400 transition-all duration-300 ease-out"
        [style.width.%]="progressPercentage()"
      ></div>

      <div class="p-5 sm:p-6 flex-1 flex flex-col min-h-0">
        <!-- Header: ID and Counter -->
        <div class="flex justify-between items-center mb-4">
          <span
            class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0"
            [class]="isCompleted()
              ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
          >
            {{ sequenceNumber() }}
          </span>

          <div class="flex items-center gap-2">
            @if (currentCount() > 0) {
              <button
                (click)="onReset($event)"
                class="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                title="Bu duayı sıfırla"
                aria-label="Bu duayı sıfırla"
              >
                <mat-icon class="text-[18px] w-[18px] h-[18px]">replay</mat-icon>
              </button>
            }

            @if (isCompleted()) {
              <span class="flex items-center text-emerald-600 dark:text-emerald-400 font-medium text-sm bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full">
                <mat-icon class="text-[18px] w-[18px] h-[18px] mr-1">check_circle</mat-icon>
                Tamamlandı
              </span>
            } @else {
              <span class="text-slate-500 dark:text-slate-400 font-medium text-sm bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                {{ currentCount() }} / {{ prayer().targetCount }}
              </span>
            }
          </div>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 min-h-0 overflow-y-auto">
          <!-- Arabic Text -->
          <div class="mb-6 text-right">
            <p class="font-arabic text-2xl sm:text-3xl leading-loose text-slate-800 dark:text-slate-100" dir="rtl">
              {{ prayer().arabic }}
            </p>
          </div>

          <!-- Transliteration -->
          <div class="mb-4">
            <p class="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed italic">
              {{ prayer().transliteration }}
            </p>
          </div>

          <!-- Virtue / Meaning -->
          <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 mb-6">
            <div class="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
              <mat-icon class="text-[20px] w-[20px] h-[20px] mt-0.5 shrink-0">auto_awesome</mat-icon>
              <p class="text-sm font-medium leading-relaxed">
                {{ prayer().virtue }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-2">
          <button
            (click)="onTap()"
            [disabled]="isCompleted()"
            class="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-lg font-bold transition-all duration-300 active:scale-[0.98] shadow-sm"
            [class]="isCompleted()
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white hover:shadow-md'"
            [attr.aria-label]="isCompleted() ? 'Tamamlandı' : 'Okudum - ' + currentCount() + ' / ' + prayer().targetCount"
          >
            @if (isCompleted()) {
              <mat-icon>check_circle</mat-icon>
              Tamamlandı
            } @else {
              <mat-icon>add_circle_outline</mat-icon>
              Okudum ({{ currentCount() }}/{{ prayer().targetCount }})
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes successPop {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); }
      100% { transform: scale(1); }
    }
    .animate-success-pop {
      animation: successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes scaleUpFade {
      0% { transform: scale(0.5); opacity: 0; }
      30% { opacity: 0.9; }
      70% { transform: scale(1.2); opacity: 0.9; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    .animate-scale-up-fade {
      animation: scaleUpFade 0.8s ease-out forwards;
    }
    @keyframes flash {
      0% { opacity: 0; }
      30% { opacity: 1; }
      100% { opacity: 0; }
    }
    .animate-flash {
      animation: flash 0.8s ease-out forwards;
    }
  `]
})
export class PrayerCardComponent {
  prayer = input.required<Prayer>();
  currentCount = input.required<number>();
  sequenceNumber = input.required<number>();

  prayerTap = output<void>();
  prayerReset = output<void>();

  isAnimating = signal(false);

  isCompleted = computed(() => this.currentCount() >= this.prayer().targetCount);

  progressPercentage = computed(() => {
    return Math.min(100, (this.currentCount() / this.prayer().targetCount) * 100);
  });

  onTap() {
    if (!this.isCompleted()) {
      const willComplete = this.currentCount() + 1 >= this.prayer().targetCount;
      if (willComplete) {
        this.isAnimating.set(true);
        setTimeout(() => this.isAnimating.set(false), 1000);
      }
      this.prayerTap.emit();
    }
  }

  onReset(event: Event) {
    event.stopPropagation();
    this.prayerReset.emit();
  }
}
