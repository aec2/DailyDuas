import { Component, input, output, computed } from '@angular/core';
import { Prayer } from './data';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-prayer-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div 
      class="relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col h-full"
      [class]="isCompleted() ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 shadow-md'"
    >
      <!-- Progress Background Fill -->
      <div 
        class="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-300 ease-out"
        [style.width.%]="progressPercentage()"
      ></div>

      <div class="p-5 sm:p-6 flex-1 flex flex-col">
        <!-- Header: ID and Counter -->
        <div class="flex justify-between items-center mb-4">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold text-sm">
            {{ prayer().id }}
          </span>
          
          <div class="flex items-center gap-2">
            @if (currentCount() > 0) {
              <button 
                (click)="onReset($event)"
                class="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/70 transition-colors flex items-center justify-center"
                title="Bu duayı sıfırla"
              >
                <mat-icon class="text-[18px] w-[18px] h-[18px]">replay</mat-icon>
              </button>
            }
            
            @if (isCompleted()) {
              <span class="flex items-center text-emerald-600 font-medium text-sm bg-emerald-100 px-2.5 py-1 rounded-full">
                <mat-icon class="text-[18px] w-[18px] h-[18px] mr-1">check_circle</mat-icon>
                Tamamlandı
              </span>
            } @else {
              <span class="text-slate-500 font-medium text-sm bg-slate-100 px-3 py-1 rounded-full">
                {{ currentCount() }} / {{ prayer().targetCount }}
              </span>
            }
          </div>
        </div>

        <!-- Arabic Text -->
        <div class="mb-6 text-right">
          <p class="font-arabic text-2xl sm:text-3xl leading-loose text-slate-800" dir="rtl">
            {{ prayer().arabic }}
          </p>
        </div>

        <!-- Transliteration -->
        <div class="mb-4">
          <p class="text-slate-600 text-sm sm:text-base leading-relaxed italic">
            {{ prayer().transliteration }}
          </p>
        </div>

        <!-- Virtue / Meaning -->
        <div class="mt-4 pt-4 border-t border-slate-100 mb-6 flex-1">
          <div class="flex items-start gap-2 text-emerald-700">
            <mat-icon class="text-[20px] w-[20px] h-[20px] mt-0.5 shrink-0">auto_awesome</mat-icon>
            <p class="text-sm font-medium leading-relaxed">
              {{ prayer().virtue }}
            </p>
          </div>
        </div>

        <!-- Action Button -->
        <div class="mt-auto pt-2">
          <button 
            (click)="onTap()"
            [disabled]="isCompleted()"
            class="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold transition-all duration-300 active:scale-[0.98] shadow-sm"
            [class]="isCompleted() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'"
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
    .font-arabic {
      font-family: 'Amiri', 'Scheherazade New', serif;
    }
  `]
})
export class PrayerCardComponent {
  prayer = input.required<Prayer>();
  currentCount = input.required<number>();
  
  tapped = output<void>();
  reset = output<void>();

  isCompleted = computed(() => this.currentCount() >= this.prayer().targetCount);
  
  progressPercentage = computed(() => {
    return Math.min(100, (this.currentCount() / this.prayer().targetCount) * 100);
  });

  onTap() {
    if (!this.isCompleted()) {
      this.tapped.emit();
    }
  }

  onReset(event: Event) {
    event.stopPropagation();
    this.reset.emit();
  }
}
