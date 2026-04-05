import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { PrayerService } from './prayer.service';
import { PrayerCardComponent } from './prayer-card.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [PrayerCardComponent, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans relative flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div class="max-w-2xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
              <mat-icon class="text-emerald-600">menu_book</mat-icon>
              Günlük Dualar
            </h1>
            
            <button 
              (click)="showResetConfirm.set(true)"
              class="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Sıfırla"
            >
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          <!-- Progress Bar -->
          <div>
            <div class="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span>İlerleme</span>
              <span>{{ prayerService.completedPrayers() }} / {{ prayerService.totalPrayers() }}</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-emerald-500 transition-all duration-500 ease-out"
                [style.width.%]="(prayerService.completedPrayers() / prayerService.totalPrayers()) * 100"
              ></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-2xl mx-auto px-4 py-6 flex-1 flex flex-col w-full">
        @if (prayerService.isAllCompleted()) {
          <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-fade-in mb-6">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-3xl w-8 h-8">task_alt</mat-icon>
            </div>
            <h2 class="text-xl font-bold text-emerald-800 mb-2">Tebrikler!</h2>
            <p class="text-emerald-600">Bugünkü sabah ve akşam dualarınızı tamamladınız. Allah kabul etsin.</p>
          </div>
        }

        <div class="flex-1 flex flex-col justify-center">
          <!-- Navigation Header -->
          <div class="flex items-center justify-between mb-6">
            <button 
              (click)="prayerService.prevPrayer()"
              [disabled]="prayerService.currentIndex() === 0"
              class="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            
            <div class="text-center">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dua</span>
              <div class="text-xl font-bold text-slate-800">
                {{ prayerService.currentIndex() + 1 }} <span class="text-slate-400 text-base font-medium">/ {{ prayerService.totalPrayers() }}</span>
              </div>
            </div>

            <button 
              (click)="prayerService.nextPrayer()"
              [disabled]="prayerService.currentIndex() === prayerService.totalPrayers() - 1"
              class="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>

          <!-- Current Prayer Card -->
          <div class="animate-fade-in">
            <app-prayer-card
              [prayer]="currentPrayer()"
              [currentCount]="prayerService.progress()[currentPrayer().id] || 0"
              (tapped)="onPrayerTapped(currentPrayer().id)"
              (reset)="onPrayerReset(currentPrayer().id)"
            />
          </div>
        </div>
      </main>

      <!-- Reset Confirmation Modal -->
      @if (showResetConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 overflow-hidden">
            <div class="flex items-center gap-3 mb-4 text-amber-600">
              <mat-icon>warning</mat-icon>
              <h3 class="text-lg font-bold text-slate-900">İlerlemeyi Sıfırla</h3>
            </div>
            <p class="text-slate-600 mb-6">
              Tüm duaların okunma sayıları sıfırlanacak. Bu işlemi onaylıyor musunuz?
            </p>
            <div class="flex justify-end gap-3">
              <button 
                class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                (click)="showResetConfirm.set(false)"
              >
                İptal
              </button>
              <button 
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                (click)="confirmReset()"
              >
                Sıfırla
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `]
})
export class App {
  prayerService = inject(PrayerService);
  showResetConfirm = signal(false);

  currentPrayer = computed(() => this.prayerService.prayers()[this.prayerService.currentIndex()]);

  confirmReset() {
    this.prayerService.resetProgress();
    this.showResetConfirm.set(false);
  }

  onPrayerReset(prayerId: number) {
    this.prayerService.resetPrayerProgress(prayerId);
  }

  onPrayerTapped(prayerId: number) {
    this.prayerService.incrementProgress(prayerId);
    
    // Check if this prayer just completed
    const currentCount = this.prayerService.progress()[prayerId] || 0;
    const targetCount = this.currentPrayer().targetCount;
    
    if (currentCount >= targetCount) {
      // Auto advance to next incomplete prayer
      setTimeout(() => {
        this.prayerService.nextIncompletePrayer();
      }, 400);
    }
  }
}

