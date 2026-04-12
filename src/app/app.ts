import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { PrayerService } from './prayer.service';
import { ThemeService } from './theme.service';
import { PrayerCardComponent } from './prayer-card.component';
import { Prayer } from './data';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './auth.service';
import { DailyHistoryEntry, DailyHistoryService } from './daily-history.service';
import { AuthPanelComponent } from './auth-panel.component';
import { CalendarModalComponent } from './calendar-modal.component';
import { CalendarDay } from './app-ui.types';
import { CustomPrayerModalComponent, PositionOption } from './custom-prayer-modal.component';
import { CustomPrayer, CustomPrayerService, isCustomPrayer } from './custom-prayer.service';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [PrayerCardComponent, MatIconModule, AuthPanelComponent, CalendarModalComponent, CustomPrayerModalComponent],
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
              }
              <button
                (click)="showAuthPanel.set(true)"
                class="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                aria-label="Google hesabi"
              >
                G
                <span
                  class="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-white dark:border-slate-800"
                  [class]="authService.user() ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-500'"
                ></span>
              </button>
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
              [sequenceNumber]="prayerService.currentIndex() + 1"
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
          <button
            (click)="openAddPrayer()"
            class="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon>
            </span>
            <div class="min-w-0">
              <p class="text-sm font-medium">Yeni zikir ekle</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ authService.user() ? 'Zikrinizi dilediginiz siraya ekleyin' : 'Kaydetmek icin once Google ile giris yapin' }}
              </p>
            </div>
          </button>
          <button
            (click)="openCalendar()"
            class="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">calendar_month</mat-icon>
            </span>
            <div class="min-w-0">
              <p class="text-sm font-medium">Zikir Takvimi</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Gunluk takibinizi takvimde goruntuleyin</p>
            </div>
          </button>
          @for (prayer of prayerService.prayers(); track prayer.id; let index = $index) {
            <div
              class="mb-1 h-2 rounded-full transition-colors"
              [class]="draggedPrayerId() !== null ? 'bg-emerald-100/80 dark:bg-emerald-900/30' : 'bg-transparent'"
              (dragover)="allowPrayerDrop($event)"
              (drop)="dropPrayerAt(index + 1, $event)"
              aria-hidden="true"
            ></div>

            <div
              class="w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-colors text-left"
              [class]="prayerService.currentIndex() === index
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'"
            >
              <button
                (click)="navigateToPrayer(index)"
                class="min-w-0 flex flex-1 items-center gap-3 text-left"
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
                    {{ index + 1 }}
                  }
                </span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium truncate">{{ prayer.transliteration }}</p>
                    @if (isCustomPrayerItem(prayer)) {
                      <span class="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">Kendi</span>
                    }
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{ prayer.virtue }}</p>
                </div>
                @if (!isPrayerCompleted(prayer) && (prayerService.progress()[prayer.id] || 0) > 0) {
                  <span class="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full shrink-0">
                    {{ prayerService.progress()[prayer.id] }}/{{ prayer.targetCount }}
                  </span>
                }
              </button>

              @if (isCustomPrayerItem(prayer)) {
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    draggable="true"
                    (dragstart)="onPrayerDragStart(prayer.id)"
                    (dragend)="onPrayerDragEnd()"
                    class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label="Zikri surukleyerek tasiyin"
                  >
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">drag_indicator</mat-icon>
                  </button>
                  <button
                    type="button"
                    (click)="editCustomPrayer(prayer); $event.stopPropagation()"
                    class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label="Zikri duzenle"
                  >
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">edit</mat-icon>
                  </button>
                  <button
                    type="button"
                    (click)="deleteCustomPrayer(prayer.id, $event)"
                    class="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    aria-label="Zikri sil"
                  >
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          }

          <div
            class="mt-2 h-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-500 flex items-center justify-center dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
            (dragover)="allowPrayerDrop($event)"
            (drop)="dropPrayerAt(prayerService.totalPrayers() + 1, $event)"
          >
            Buraya birak: en sona tasi
          </div>
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

      <app-auth-panel
        [open]="showAuthPanel()"
        [configured]="authService.isConfigured()"
        [signedIn]="!!authService.user()"
        [userLabel]="authService.user()?.displayName || authService.user()?.email || ''"
        [authError]="authService.error()"
        [syncError]="dailyHistoryService.syncError()"
        (close)="showAuthPanel.set(false)"
        (signIn)="signIn()"
        (signOut)="signOut()"
      />

      <app-calendar-modal
        [open]="showCalendar()"
        [monthLabel]="calendarMonthLabel()"
        [weekdayLabels]="weekdayLabels"
        [days]="calendarDays()"
        [signedIn]="!!authService.user()"
        (close)="showCalendar.set(false)"
        (previousMonth)="previousMonth()"
        (nextMonth)="nextMonth()"
      />

      <app-custom-prayer-modal
        [open]="showAddPrayerModal()"
        [signedIn]="!!authService.user()"
        [positionOptions]="positionOptions()"
        [error]="customPrayerService.syncError()"
        [editingPrayer]="editingPrayer()"
        (close)="showAddPrayerModal.set(false); editingPrayer.set(null)"
        (openAuth)="openAuthFromCustomPrayer()"
        (save)="saveCustomPrayer($event)"
      />

    </div>
  `
})
export class App {
  prayerService = inject(PrayerService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  dailyHistoryService = inject(DailyHistoryService);
  customPrayerService = inject(CustomPrayerService);
  showResetConfirm = signal(false);
  showDrawer = signal(false);
  showAuthPanel = signal(false);
  showCalendar = signal(false);
  showAddPrayerModal = signal(false);
  editingPrayer = signal<CustomPrayer | null>(null);
  draggedPrayerId = signal<number | null>(null);
  hasSwiped = signal(false);
  showInstallButton = signal(false);
  calendarMonth = signal(this.startOfMonth(new Date()));

  weekdayLabels = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

  private deferredPromptEvent: BeforeInstallPromptEvent | null = null;

  private touchStartX = 0;
  private touchStartY = 0;

  currentPrayer = computed(() => this.prayerService.prayers()[this.prayerService.currentIndex()]);
  calendarMonthLabel = computed(() => this.formatMonth(this.calendarMonth()));
  calendarDays = computed(() => this.buildCalendarDays(this.calendarMonth(), this.dailyHistoryService.entries()));
  positionOptions = computed<PositionOption[]>(() => {
    const prayers = this.prayerService.prayers();

    return Array.from({ length: prayers.length + 1 }, (_, index) => {
      if (index === 0) {
        return { value: 1, label: 'En basa ekle' };
      }

      if (index === prayers.length) {
        return { value: index + 1, label: 'En sona ekle' };
      }

      return { value: index + 1, label: `${index + 1}. siraya ekle` };
    });
  });

  progressPercent = computed(() => {
    const total = this.prayerService.totalPrayers();
    const completed = this.prayerService.completedPrayers();
    return total > 0 ? (completed / total) * 100 : 0;
  });

  isPrayerCompleted(prayer: Prayer): boolean {
    return (this.prayerService.progress()[prayer.id] || 0) >= prayer.targetCount;
  }

  isCustomPrayerItem(prayer: Prayer): prayer is CustomPrayer {
    return isCustomPrayer(prayer);
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: Event) {
    e.preventDefault();
    this.deferredPromptEvent = e as BeforeInstallPromptEvent;
    this.showInstallButton.set(true);
  }

  @HostListener('window:appinstalled')
  onAppInstalled() {
    this.deferredPromptEvent = null;
    this.showInstallButton.set(false);
  }

  async installPwa() {
    if (!this.deferredPromptEvent) return;
    this.deferredPromptEvent.prompt();
    await this.deferredPromptEvent.userChoice;
    this.showInstallButton.set(false);
    this.deferredPromptEvent = null;
  }

  async signIn() {
    await this.authService.signInWithGoogle();
  }

  async signOut() {
    await this.authService.signOut();
    this.showAuthPanel.set(false);
    this.showAddPrayerModal.set(false);
    this.editingPrayer.set(null);
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

  navigateToPrayer(index: number) {
    this.prayerService.currentIndex.set(index);
    this.showDrawer.set(false);
  }

  openAddPrayer() {
    this.showDrawer.set(false);
    this.editingPrayer.set(null);

    if (!this.authService.user()) {
      this.showAuthPanel.set(true);
      return;
    }

    this.showAddPrayerModal.set(true);
  }

  openAuthFromCustomPrayer() {
    this.showAddPrayerModal.set(false);
    this.showAuthPanel.set(true);
  }

  editCustomPrayer(prayer: CustomPrayer) {
    this.showDrawer.set(false);
    this.editingPrayer.set(prayer);
    this.showAddPrayerModal.set(true);
  }

  async deleteCustomPrayer(prayerId: number, event?: Event) {
    event?.stopPropagation();
    await this.customPrayerService.deletePrayer(prayerId);
  }

  async saveCustomPrayer(formValue: {
    arabic: string;
    transliteration: string;
    virtue: string;
    targetCount: number;
    position: number;
  }) {
    const draft = {
      arabic: formValue.arabic,
      transliteration: formValue.transliteration,
      virtue: formValue.virtue,
      targetCount: formValue.targetCount,
    };

    const editingPrayer = this.editingPrayer();
    const wasSaved = editingPrayer
      ? await this.customPrayerService.updatePrayer(editingPrayer.id, draft, formValue.position)
      : await this.customPrayerService.addPrayer(draft, formValue.position);

    if (wasSaved) {
      this.editingPrayer.set(null);
      this.showAddPrayerModal.set(false);
    }
  }

  onPrayerDragStart(prayerId: number) {
    this.draggedPrayerId.set(prayerId);
  }

  onPrayerDragEnd() {
    this.draggedPrayerId.set(null);
  }

  async dropPrayerAt(position: number, event: DragEvent) {
    event.preventDefault();
    const prayerId = this.draggedPrayerId();
    if (prayerId === null) {
      return;
    }

    await this.customPrayerService.movePrayer(prayerId, position);
    this.draggedPrayerId.set(null);
  }

  allowPrayerDrop(event: DragEvent) {
    event.preventDefault();
  }

  openCalendar() {
    this.showDrawer.set(false);
    this.showCalendar.set(true);
  }

  previousMonth() {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  private buildCalendarDays(month: Date, entries: Record<string, DailyHistoryEntry>): CalendarDay[] {
    const start = this.startOfMonth(month);
    const firstDayOffset = (start.getDay() + 6) % 7;
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - firstDayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);

      const dateKey = this.toDateKey(current);
      return {
        dateKey,
        dayNumber: current.getDate(),
        isCurrentMonth: current.getMonth() === month.getMonth(),
        entry: entries[dateKey] ?? null,
      };
    });
  }

  private formatMonth(date: Date) {
    return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(date);
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (this.showAuthPanel()) {
      if (event.key === 'Escape') {
        this.showAuthPanel.set(false);
      }
      return;
    }

    if (this.showCalendar()) {
      if (event.key === 'Escape') {
        this.showCalendar.set(false);
      }
      return;
    }

    if (this.showAddPrayerModal()) {
      if (event.key === 'Escape') {
        this.showAddPrayerModal.set(false);
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
    if (this.showDrawer() || this.showResetConfirm() || this.showAuthPanel() || this.showCalendar() || this.showAddPrayerModal()) return;

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
