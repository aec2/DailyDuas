import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { PrayerService } from './prayer.service';
import { ThemeService } from './theme.service';
import { PrayerCardComponent } from './prayer-card.component';
import { Prayer } from './data';
import { MatIconModule } from '@angular/material/icon';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [PrayerCardComponent, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-12 font-sans relative flex flex-col transition-colors duration-300">
      <!-- Header -->
      <header class="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
        <div class="max-w-2xl mx-auto px-4 py-3">
          <div class="flex items-center justify-between mb-3">
            <h1 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <mat-icon class="text-emerald-600 dark:text-emerald-400">menu_book</mat-icon>
              Günlük Dualar
            </h1>
            
            <div class="flex items-center gap-2">
              @if (showInstallButton()) {
                <button 
                  (click)="installPwa()"
                  class="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800 px-3 py-1.5 rounded-full transition-colors"
                >
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">download</mat-icon>
                  Yükle
                </button>
              } @else if (showInstallHelpButton()) {
                <button
                  (click)="showInstallHelp.set(true)"
                  class="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">help_outline</mat-icon>
                  Nasıl yüklenir?
                </button>
              }
              <button
                (click)="themeService.toggleTheme()"
                class="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                [attr.aria-label]="themeService.isDark() ? 'Açık moda geç' : 'Karanlık moda geç'"
              >
                <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
              </button>
              <button
                (click)="showDrawer.set(true)"
                class="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Dua listesi"
              >
                <mat-icon>list</mat-icon>
              </button>
              <button 
                (click)="showResetConfirm.set(true)"
                class="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="İlerlemeyi sıfırla"
              >
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div>
            <div class="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <span>İlerleme</span>
              <span>{{ prayerService.completedPrayers() }} / {{ prayerService.totalPrayers() }}</span>
            </div>
            <div
              class="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              [attr.aria-valuenow]="prayerService.completedPrayers()"
              [attr.aria-valuemin]="0"
              [attr.aria-valuemax]="prayerService.totalPrayers()"
              aria-label="Dua ilerlemesi"
            >
              <div
                class="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500 ease-out"
                [style.width.%]="progressPercent()"
              ></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main
        class="max-w-2xl mx-auto px-4 py-6 flex-1 flex flex-col w-full"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        @if (prayerService.isAllCompleted()) {
          <div class="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center animate-fade-in mb-6">
            <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-3xl w-8 h-8">task_alt</mat-icon>
            </div>
            <h2 class="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Tebrikler!</h2>
            <p class="text-emerald-600 dark:text-emerald-400">Bugünkü sabah ve akşam dualarınızı tamamladınız. Allah kabul etsin.</p>
          </div>
        }

        <div class="flex-1 flex flex-col justify-center">
          <!-- Navigation Header -->
          <div class="flex items-center justify-between mb-6">
            <button
              (click)="prayerService.prevPrayer()"
              [disabled]="prayerService.currentIndex() === 0"
              class="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Önceki dua"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>

            <button
              (click)="showDrawer.set(true)"
              class="text-center group"
              aria-label="Dua listesini aç"
            >
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Dua</span>
              <div class="text-xl font-bold text-slate-800 dark:text-white">
                {{ prayerService.currentIndex() + 1 }} <span class="text-slate-400 dark:text-slate-500 text-base font-medium">/ {{ prayerService.totalPrayers() }}</span>
              </div>
            </button>

            <button
              (click)="prayerService.nextPrayer()"
              [disabled]="prayerService.currentIndex() === prayerService.totalPrayers() - 1"
              class="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Sonraki dua"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>

          <!-- Current Prayer Card -->
          <div class="animate-fade-in">
            <app-prayer-card
              [prayer]="currentPrayer()"
              [currentCount]="prayerService.progress()[currentPrayer().id] || 0"
              (prayerTap)="onPrayerTapped(currentPrayer().id)"
              (prayerReset)="onPrayerReset(currentPrayer().id)"
            />
          </div>

          @if (!hasSwiped()) {
            <p class="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 animate-fade-in select-none">
              ← Kaydırarak gezin →
            </p>
          }
        </div>
      </main>

      <!-- Prayer List Drawer -->
      @if (showDrawer()) {
        <div
          class="fixed inset-0 z-40 flex items-end justify-center animate-fade-in-overlay"
          role="button"
          tabindex="-1"
          (click)="showDrawer.set(false)"
          (keydown.escape)="showDrawer.set(false)"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </div>
      }

      <div
        class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col transition-transform duration-300 ease-out"
        [class]="showDrawer() ? 'translate-y-0' : 'translate-y-full'"
        [attr.aria-hidden]="!showDrawer()"
        role="dialog"
        aria-label="Dua listesi"
      >
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        </div>
        <div class="px-4 pb-3 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Tüm Dualar</h2>
          <button
            (click)="showDrawer.set(false)"
            class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
            aria-label="Kapat"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="overflow-y-auto px-4 pb-4 flex-1 overscroll-contain">
          @for (prayer of prayerService.prayers(); track prayer.id) {
            <button
              (click)="navigateToPrayer(prayer.id)"
              class="w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-colors text-left mb-1"
              [class]="prayerService.currentIndex() === prayer.id - 1
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'"
            >
              <span
                class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold shrink-0"
                [class]="isPrayerCompleted(prayer)
                  ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
              >
                @if (isPrayerCompleted(prayer)) {
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">check</mat-icon>
                } @else {
                  {{ prayer.id }}
                }
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ prayer.transliteration }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{ prayer.virtue }}</p>
              </div>
              @if (!isPrayerCompleted(prayer) && (prayerService.progress()[prayer.id] || 0) > 0) {
                <span class="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full shrink-0">
                  {{ prayerService.progress()[prayer.id] }}/{{ prayer.targetCount }}
                </span>
              }
            </button>
          }
        </div>
      </div>

      <!-- Reset Confirmation Modal -->
      @if (showResetConfirm()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in-overlay"
          role="button"
          tabindex="-1"
          (click)="showResetConfirm.set(false)"
          (keydown.escape)="showResetConfirm.set(false)"
        >
          <div
            class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in"
            role="dialog"
          >
            <div class="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
              <mat-icon>warning</mat-icon>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">İlerlemeyi Sıfırla</h3>
            </div>
            <p class="text-slate-600 dark:text-slate-300 mb-6">
              Tüm duaların okunma sayıları sıfırlanacak. Bu işlemi onaylıyor musunuz?
            </p>
            <div class="flex justify-end gap-3">
              <button
                class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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

      @if (showInstallHelp()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in-overlay"
          role="button"
          tabindex="-1"
          (click)="showInstallHelp.set(false)"
          (keydown.escape)="showInstallHelp.set(false)"
        >
          <div
            class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in"
            role="dialog"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
              <mat-icon>download</mat-icon>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ installHelpTitle() }}</h3>
            </div>
            <p class="text-slate-600 dark:text-slate-300 mb-6">
              {{ installHelpText() }}
            </p>
            <div class="flex justify-end">
              <button
                class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                (click)="showInstallHelp.set(false)"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class App {
  prayerService = inject(PrayerService);
  themeService = inject(ThemeService);
  showResetConfirm = signal(false);
  showDrawer = signal(false);
  hasSwiped = signal(false);
  showInstallButton = signal(false);
  showInstallHelp = signal(false);
  showInstallHelpButton = signal(false);
  installHelpTitle = signal('Uygulamayi yukleme');
  installHelpText = signal('Tarayiciniz otomatik kurulum istemi gostermiyor.');

  private deferredPromptEvent: BeforeInstallPromptEvent | null = null;

  private touchStartX = 0;
  private touchStartY = 0;

  constructor() {
    this.initializeInstallHelp();
  }

  currentPrayer = computed(() => this.prayerService.prayers()[this.prayerService.currentIndex()]);

  progressPercent = computed(() => {
    const total = this.prayerService.totalPrayers();
    const completed = this.prayerService.completedPrayers();
    return total > 0 ? (completed / total) * 100 : 0;
  });

  isPrayerCompleted(prayer: Prayer): boolean {
    return (this.prayerService.progress()[prayer.id] || 0) >= prayer.targetCount;
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: Event) {
    e.preventDefault();
    this.deferredPromptEvent = e as BeforeInstallPromptEvent;
    this.showInstallButton.set(true);
    this.showInstallHelpButton.set(false);
  }

  @HostListener('window:appinstalled')
  onAppInstalled() {
    this.deferredPromptEvent = null;
    this.showInstallButton.set(false);
    this.showInstallHelpButton.set(false);
    this.showInstallHelp.set(false);
  }

  async installPwa() {
    if (!this.deferredPromptEvent) return;
    this.deferredPromptEvent.prompt();
    const { outcome } = await this.deferredPromptEvent.userChoice;
    this.showInstallButton.set(false);
    this.showInstallHelpButton.set(outcome !== 'accepted');
    this.deferredPromptEvent = null;
  }

  private initializeInstallHelp() {
    if (typeof window === 'undefined' || this.isRunningStandalone()) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform?.toLowerCase() ?? '';
    const maxTouchPoints = window.navigator.maxTouchPoints ?? 0;
    const isIos = /iphone|ipad|ipod/.test(userAgent) || (platform === 'macintel' && maxTouchPoints > 1);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktopChromium = /chrome|edg/.test(userAgent) && !isAndroid;

    if (isIos && isSafari) {
      this.installHelpTitle.set('iPhone veya iPad e yukleme');
      this.installHelpText.set('Safari paylas menusu icinden "Ana Ekrana Ekle" secenegini kullanin. iOS tarayicilari otomatik "Yukle" istemi gostermez.');
      this.showInstallHelpButton.set(true);
      return;
    }

    if (isAndroid) {
      this.installHelpTitle.set('Android cihaza yukleme');
      this.installHelpText.set('Tarayicinizin menusunde yer alan "Install app" veya "Add to Home screen" secenegini kullanin. Destekleyen tarayicilarda adres cubugunda kurulum simgesi de gorunebilir.');
      this.showInstallHelpButton.set(true);
      return;
    }

    if (isDesktopChromium) {
      this.installHelpTitle.set('Bilgisayara yukleme');
      this.installHelpText.set('Chrome veya Edge de adres cubugunun sagindaki kurulum simgesine tiklayin. Tarayici otomatik istem gostermeyebilir.');
      this.showInstallHelpButton.set(true);
    }
  }

  private isRunningStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const matchMedia = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;

    return (matchMedia?.('(display-mode: standalone)').matches ?? false)
      || (matchMedia?.('(display-mode: fullscreen)').matches ?? false)
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  confirmReset() {
    this.prayerService.resetProgress();
    this.showResetConfirm.set(false);
  }

  onPrayerReset(prayerId: number) {
    this.prayerService.resetPrayerProgress(prayerId);
  }

  onPrayerTapped(prayerId: number) {
    this.prayerService.incrementProgress(prayerId);

    const currentCount = this.prayerService.progress()[prayerId] || 0;
    const targetCount = this.currentPrayer().targetCount;

    if (currentCount >= targetCount) {
      setTimeout(() => {
        this.prayerService.nextIncompletePrayer();
      }, 1000);
    }
  }

  navigateToPrayer(prayerId: number) {
    const index = this.prayerService.prayers().findIndex(p => p.id === prayerId);
    if (index !== -1) {
      this.prayerService.currentIndex.set(index);
    }
    this.showDrawer.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (this.showInstallHelp()) {
      if (event.key === 'Escape') {
        this.showInstallHelp.set(false);
      }
      return;
    }

    if (this.showDrawer()) {
      if (event.key === 'Escape') {
        this.showDrawer.set(false);
      }
      return;
    }

    if (this.showResetConfirm()) {
      if (event.key === 'Escape') {
        this.showResetConfirm.set(false);
      }
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.prayerService.prevPrayer();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.prayerService.nextPrayer();
    }
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent) {
    if (this.showDrawer() || this.showResetConfirm() || this.showInstallHelp()) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const diffX = touchEndX - this.touchStartX;
    const diffY = touchEndY - this.touchStartY;

    if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      this.hasSwiped.set(true);
      if (diffX > 0) {
        this.prayerService.prevPrayer();
      } else {
        this.prayerService.nextPrayer();
      }
    }
  }
}
