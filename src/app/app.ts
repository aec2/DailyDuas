import {
  ChangeDetectionStrategy, Component, HostListener,
  computed, inject, signal, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, SlicePipe } from '@angular/common';
import { PrayerService } from './core/services/prayer.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { FolderService } from './core/services/folder.service';
import { CustomPrayerService, isCustomPrayer } from './core/services/custom-prayer.service';
import { Prayer } from './data/data';

import { FolderDetailComponent } from './features/folder-detail/folder-detail.component';
import { FolderModalComponent } from './shared/components/folder-modal.component';
import { Folder, FolderDraft } from './shared/types/folder.types';
import { HomeScreenComponent } from './features/home/home-screen.component';
import { LibraryScreenComponent } from './features/library/library-screen.component';
import { CounterScreenComponent } from './features/counter/counter-screen.component';
import { ProgressScreenComponent } from './features/progress/progress-screen.component';
import { SettingsScreenComponent } from './features/settings/settings-screen.component';
import { ReadingModalComponent } from './shared/components/reading-modal.component';
import { AuthPanelComponent } from './shared/components/auth-panel.component';
import { CalendarModalComponent } from './shared/components/calendar-modal.component';
import { CustomPrayerModalComponent, PositionOption } from './shared/components/custom-prayer-modal.component';
import { DailyHistoryService } from './core/services/daily-history.service';
import { CalendarDay } from './shared/types/app-ui.types';
import { CustomPrayer } from './core/services/custom-prayer.service';

type Tab = 'home' | 'library' | 'counter' | 'progress' | 'settings';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [
    SlicePipe,
    HomeScreenComponent,
    LibraryScreenComponent,
    CounterScreenComponent,
    ProgressScreenComponent,
    SettingsScreenComponent,
    ReadingModalComponent,
    AuthPanelComponent,
    CalendarModalComponent,
    CustomPrayerModalComponent,
    FolderDetailComponent,
    FolderModalComponent,
  ],
  template: `
    <!-- Root shell -->
    <div class="relative w-full h-dvh overflow-hidden dd-bg dd-text-ink"
         style="transition: background 300ms; box-shadow: 0 0 48px rgba(0,0,0,0.12);">

      <!-- ── SCREEN ROUTER ─────────────────────────────── -->
      @if (activeTab() === 'home') {
        <div class="absolute inset-0 overflow-y-auto animate-fade-in">
          <app-home-screen
            (openFolder)="activeFolderId.set($event)"
            (createFolder)="editingFolder.set(null); showFolderModal.set(true)"
            (openCalendar)="showCalendar.set(true)" />
        </div>
      }
      @if (activeTab() === 'library') {
        <div class="absolute inset-0 overflow-y-auto animate-fade-in">
          <app-library-screen (openDua)="openReading($event)" (addNew)="openAddDua()" (editDua)="openEditDua($event)" />
        </div>
      }
      @if (activeTab() === 'counter') {
        <div class="absolute inset-0">
          <app-counter-screen
            [prayer]="counterPrayer()"
            [variant]="counterVariant()"
            (close)="activeTab.set('home')"
            (pickDua)="showPicker.set(true)"
            (next)="nextCounter()"
            (prev)="prevCounter()"
          />
        </div>
      }
      @if (activeTab() === 'progress') {
        <div class="absolute inset-0 overflow-y-auto animate-fade-in">
          <app-progress-screen />
        </div>
      }
      @if (activeTab() === 'settings') {
        <div class="absolute inset-0 overflow-y-auto animate-fade-in">
          <app-settings-screen
            [counterVariant]="counterVariant()"
            [progressVariant]="progressVariant()"
            (counterVariantChange)="counterVariant.set($event)"
            (progressVariantChange)="progressVariant.set($event)"
            (openAuth)="showAuthPanel.set(true)"
            (openReset)="showResetConfirm.set(true)"
            (signOut)="signOut()"
          />
        </div>
      }

      <!-- Global Toast -->
      @if (toastMessage()) {
        <div class="absolute top-14 left-1/2 z-[100] animate-toast px-6 py-4 rounded-full shadow-lg border flex items-center justify-center font-serif text-[16px] dd-bg-surface dd-text-ink text-center" 
             style="border-color:var(--dd-line); white-space:nowrap;">
          {{ toastMessage() }}
        </div>
      }

      <!-- Folder detail overlay -->
      @if (activeFolderId()) {
        <div class="absolute inset-0 z-[45] overflow-y-auto dd-bg animate-slide-in-right">
          <app-folder-detail
            [folderId]="activeFolderId()!"
            (back)="activeFolderId.set(null)"
            (openDua)="openReading($event)"
            (editFolder)="openEditFolder($event)"
          />
        </div>
      }

      <!-- ── OVERLAYS ──────────────────────────────────── -->
      <app-reading-modal
        [prayer]="readingPrayer()"
        [hasPrev]="readingHasPrev()"
        [hasNext]="readingHasNext()"
        (close)="readingId.set(null)"
        (prev)="prevReading()"
        (next)="nextReading()"
      />

      @if (showAddDua()) {
        <div class="absolute inset-0 z-35 animate-slide-up">
          <app-custom-prayer-modal
            [open]="true"
            [signedIn]="!!authService.user()"
            [positionOptions]="positionOptions()"
            [error]="customPrayerService.syncError()"
            [editingPrayer]="editingPrayer()"
            (close)="showAddDua.set(false)"
            (openAuth)="showAddDua.set(false); showAuthPanel.set(true)"
            (save)="saveCustomPrayer($event)"
          />
        </div>
      }

      <!-- Dua picker for counter -->
      @if (showPicker()) {
        <div (click)="showPicker.set(false)" class="absolute inset-0 z-70 animate-fade-in-fast"
             style="background:rgba(0,0,0,0.4);display:flex;align-items:flex-end;">
          <div (click)="$event.stopPropagation()" class="w-full dd-bg-surface overflow-auto"
               style="border-radius:24px 24px 0 0;max-height:85%;padding:14px 0 28px;">
            <div style="width:40px;height:4px;border-radius:4px;background:var(--dd-line);margin:0 auto 12px;"></div>
            <div class="font-serif text-[18px] font-medium dd-text-ink px-5 pb-2">Zikir Seç</div>
            
            @for (group of folderGroups(); track group.folder.id) {
              @if (group.folder.enabled && group.prayers.length > 0) {
                <button
                  (click)="counterFolderId.set(group.folder.id); counterDuaId.set(group.prayers[0].id); showPicker.set(false)"
                  class="w-full border-none text-left px-5 py-2.5 mt-2 flex items-center justify-between gap-2 cursor-pointer press-scale"
                  style="background:var(--dd-line);"
                  [style.color]="counterFolderId() === group.folder.id ? 'var(--dd-accent)' : 'var(--dd-ink-faint)'">
                  <div class="flex items-center gap-2 font-mono text-[10px] tracking-[1.4px] uppercase">
                    <span>{{ group.folder.emoji }}</span>
                    <span>{{ group.folder.name }}</span>
                  </div>
                  <span class="font-sans text-[11px] normal-case" style="color:var(--dd-accent)">Listeyi Seç →</span>
                </button>
                @for (dua of group.prayers; track dua.id) {
                  <button (click)="counterFolderId.set(group.folder.id); counterDuaId.set(dua.id); showPicker.set(false)"
                          class="w-full bg-transparent border-none px-5 py-3.5 text-left cursor-pointer flex justify-between items-center press-scale"
                          style="border-bottom: 0.5px solid var(--dd-line);"
                          [style.color]="counterDuaId() === dua.id ? 'var(--dd-accent)' : 'var(--dd-ink)'">
                    <div>
                      <div class="font-serif text-[16px] font-medium">{{ dua.title || dua.transliteration | slice:0:30 }}</div>
                      <div class="font-mono text-[12px] dd-text-faint mt-0.5">hedef {{ dua.targetCount }}×</div>
                    </div>
                    @if (counterDuaId() === dua.id) {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-accent)" stroke-width="1.6" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    }
                  </button>
                }
              }
            }

            @if (unfolderedPrayers().length > 0) {
              <div class="font-mono text-[10px] tracking-[1.4px] uppercase dd-text-faint px-5 py-2.5 mt-2" style="background:var(--dd-line);">
                Diğer Zikirler
              </div>
              @for (dua of unfolderedPrayers(); track dua.id) {
                <button (click)="counterFolderId.set(null); counterDuaId.set(dua.id); showPicker.set(false)"
                        class="w-full bg-transparent border-none px-5 py-3.5 text-left cursor-pointer flex justify-between items-center press-scale"
                        style="border-bottom: 0.5px solid var(--dd-line);"
                        [style.color]="counterDuaId() === dua.id ? 'var(--dd-accent)' : 'var(--dd-ink)'">
                  <div>
                    <div class="font-serif text-[16px] font-medium">{{ dua.title || dua.transliteration | slice:0:30 }}</div>
                    <div class="font-mono text-[12px] dd-text-faint mt-0.5">hedef {{ dua.targetCount }}×</div>
                  </div>
                  @if (counterDuaId() === dua.id) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-accent)" stroke-width="1.6" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  }
                </button>
              }
            }
          </div>
        </div>
      }

      <!-- Auth panel -->
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

      <!-- Calendar modal -->
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

      <!-- Reset confirm -->
      @if (showResetConfirm()) {
        <div (click)="showResetConfirm.set(false)"
             class="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
             style="background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);">
          <div (click)="$event.stopPropagation()" class="dd-bg-surface rounded-[24px] max-w-sm w-full p-6 animate-fade-in">
            <div class="font-serif text-[20px] dd-text-ink mb-2">İlerlemeyi Sıfırla</div>
            <div class="font-sans text-[14px] dd-text-muted mb-6">Tüm duaların okunma sayıları sıfırlanacak. Onaylıyor musunuz?</div>
            <div class="flex justify-end gap-3">
              <button (click)="showResetConfirm.set(false)"
                      class="px-4 py-2 text-[14px] font-medium dd-text-muted border-none rounded-xl cursor-pointer press-scale" style="background:transparent;">
                İptal
              </button>
              <button (click)="confirmReset()"
                      class="px-4 py-2 text-[14px] font-medium text-white border-none rounded-xl cursor-pointer press-scale" style="background:#ef4444;">
                Sıfırla
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Folder create/edit modal -->
      @if (showFolderModal()) {
        <div class="absolute inset-0 z-50">
          <app-folder-modal
            [open]="true"
            [allPrayers]="customPrayerService.prayers()"
            [editingFolder]="editingFolder()"
            (close)="showFolderModal.set(false)"
            (save)="saveFolder($event)"
          />
        </div>
      }

      <!-- ── BOTTOM TAB BAR (hidden during counter) ────── -->
      @if (activeTab() !== 'counter') {
        <div class="absolute bottom-0 left-0 right-0 flex justify-around items-center pt-2"
             style="padding-bottom: max(env(safe-area-inset-bottom), 20px);
                    background: var(--dd-surface);
                    box-shadow: 0 -1px 8px rgba(0,0,0,0.06);
                    border-top: 0.5px solid var(--dd-line);
                    z-index: 40;">
          <!-- Home -->
          <button (click)="activeFolderId.set(null); activeTab.set('home')"
                  class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 border-none cursor-pointer bg-transparent font-sans text-[10px] font-medium press-scale"
                  [style.color]="activeTab() === 'home' ? 'var(--dd-accent)' : 'var(--dd-ink-faint)'"
                  aria-label="Anasayfa sekmesi">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 [attr.stroke-width]="activeTab() === 'home' ? 2 : 1.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2V10z"/>
            </svg>
            <span>Anasayfa</span>
          </button>
          <!-- Library -->
          <button (click)="activeFolderId.set(null); activeTab.set('library')"
                  class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 border-none cursor-pointer bg-transparent font-sans text-[10px] font-medium press-scale"
                  [style.color]="activeTab() === 'library' ? 'var(--dd-accent)' : 'var(--dd-ink-faint)'"
                  aria-label="Kütüphane sekmesi">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 [attr.stroke-width]="activeTab() === 'library' ? 2 : 1.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h11a4 4 0 014 4v12H8a4 4 0 01-4-4V4z"/>
              <path d="M4 4v12a4 4 0 014-4h11"/>
            </svg>
            <span>Kütüphane</span>
          </button>
          <!-- Counter -->
          <button (click)="activeFolderId.set(null); activeTab.set('counter')"
                  class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 border-none cursor-pointer bg-transparent font-sans text-[10px] font-medium press-scale"
                  [style.color]="activeTab() === 'counter' ? 'var(--dd-accent)' : 'var(--dd-ink-faint)'"
                  aria-label="Sayaç sekmesi">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 [attr.stroke-width]="activeTab() === 'counter' ? 2 : 1.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
            </svg>
            <span>Sayaç</span>
          </button>
          <!-- Progress -->
          <button (click)="activeFolderId.set(null); activeTab.set('progress')"
                  class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 border-none cursor-pointer bg-transparent font-sans text-[10px] font-medium press-scale"
                  [style.color]="activeTab() === 'progress' ? 'var(--dd-accent)' : 'var(--dd-ink-faint)'"
                  aria-label="İlerleme sekmesi">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 [attr.stroke-width]="activeTab() === 'progress' ? 2 : 1.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>
            </svg>
            <span>İlerleme</span>
          </button>
          <!-- Settings -->
          <button (click)="activeFolderId.set(null); activeTab.set('settings')"
                  class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 border-none cursor-pointer bg-transparent font-sans text-[10px] font-medium press-scale"
                  [style.color]="activeTab() === 'settings' ? 'var(--dd-accent)' : 'var(--dd-ink-faint)'"
                  aria-label="Ayarlar sekmesi">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 [attr.stroke-width]="activeTab() === 'settings' ? 2 : 1.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.6-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>
            </svg>
            <span>Ayarlar</span>
          </button>
        </div>
      }

      <!-- Install button (PWA) -->
      @if (showInstallButton()) {
        <div class="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
          <button (click)="installPwa()"
                  class="flex items-center gap-2 font-sans text-[14px] font-medium border-none rounded-full px-5 py-3 cursor-pointer press-scale shadow-lg"
                  style="background:var(--dd-accent);color:#fff; box-shadow: 0 8px 24px rgba(0,0,0,0.12)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Uygulamayı Yükle
          </button>
        </div>
      }
    </div>
  `,
})
export class App {
  readonly prayerService = inject(PrayerService);
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  readonly dailyHistoryService = inject(DailyHistoryService);
  readonly customPrayerService = inject(CustomPrayerService);
  private readonly folderService = inject(FolderService);
  private readonly platformId = inject(PLATFORM_ID);

  // ── Navigation state ────────────────────────────────────
  activeTab = signal<Tab>('home');
  readingId = signal<number | null>(null);
  counterDuaId = signal<number | null>(null);
  counterFolderId = signal<string | null>(null);
  showAddDua = signal(false);
  editingPrayer = signal<Prayer | null>(null);
  showPicker = signal(false);
  showAuthPanel = signal(false);
  showCalendar = signal(false);
  showResetConfirm = signal(false);
  showInstallButton = signal(false);
  toastMessage = signal<string | null>(null);
  activeFolderId = signal<string | null>(null);
  showFolderModal = signal(false);
  editingFolder = signal<Folder | null>(null);

  // ── Tweaks ──────────────────────────────────────────────
  counterVariant = signal<'hero' | 'beads' | 'focus'>('hero');
  progressVariant = signal<'bar' | 'segments' | 'dots'>('bar');

  private deferredPromptEvent: BeforeInstallPromptEvent | null = null;
  calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  weekdayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // ── Computed ────────────────────────────────────────────
  prayers = this.customPrayerService.prayers;

  readingIndex = computed<number>(() => {
    const id = this.readingId();
    if (!id) return -1;
    return this.prayers().findIndex(p => p.id === id);
  });

  readingPrayer = computed<Prayer | null>(() => {
    const idx = this.readingIndex();
    if (idx < 0) return null;
    return this.prayers()[idx] ?? null;
  });

  readingHasPrev = computed(() => this.readingIndex() > 0);
  readingHasNext = computed(() => {
    const idx = this.readingIndex();
    return idx >= 0 && idx < this.prayers().length - 1;
  });

  counterPrayers = computed<Prayer[]>(() => {
    const folderId = this.counterFolderId();
    const all = this.prayers();
    if (!folderId) return all;
    const folder = this.folderService.folders().find(f => f.id === folderId);
    if (!folder) return all;
    return folder.prayerIds.map(id => all.find(p => p.id === id)).filter((p): p is Prayer => !!p);
  });

  counterPrayer = computed<Prayer | null>(() => {
    const id = this.counterDuaId();
    const prayers = this.counterPrayers();
    if (!prayers.length) return null;
    return (id ? prayers.find(p => p.id === id) : null) ?? prayers[0];
  });

  positionOptions = computed<PositionOption[]>(() => {
    const prayers = this.prayers();
    return Array.from({ length: prayers.length + 1 }, (_, i) => {
      if (i === 0) return { value: 1, label: 'En başa ekle' };
      if (i === prayers.length) return { value: i + 1, label: 'En sona ekle' };
      return { value: i + 1, label: `${i + 1}. sıraya ekle` };
    });
  });

  // ── Picker Groups ───────────────────────────────────────
  folderGroups = computed(() => {
    const all = this.prayers();
    return this.folderService.folders().map(f => ({
      folder: f,
      prayers: f.prayerIds.map(id => all.find(p => p.id === id)).filter((p): p is Prayer => !!p)
    }));
  });

  unfolderedPrayers = computed(() => {
    const assignedIds = new Set(this.folderService.folders().flatMap(f => f.prayerIds));
    return this.prayers().filter(p => !assignedIds.has(p.id));
  });

  calendarMonthLabel = computed(() =>
    new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(this.calendarMonth())
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const month = this.calendarMonth();
    const entries = this.dailyHistoryService.entries();
    const firstDayOffset = (month.getDay() + 6) % 7;
    const gridStart = new Date(month);
    gridStart.setDate(month.getDate() - firstDayOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { dateKey: key, dayNumber: d.getDate(), isCurrentMonth: d.getMonth() === month.getMonth(), entry: entries[key] ?? null };
    });
  });

  // ── Methods ─────────────────────────────────────────────
  openReading(id: number) { this.readingId.set(id); }

  prevReading() {
    const idx = this.readingIndex();
    if (idx > 0) this.readingId.set(this.prayers()[idx - 1].id);
  }

  nextReading() {
    const idx = this.readingIndex();
    if (idx >= 0 && idx < this.prayers().length - 1) this.readingId.set(this.prayers()[idx + 1].id);
  }

  prevCounter() {
    const prayers = this.counterPrayers();
    if (!prayers.length) return;
    const currentId = this.counterPrayer()?.id;
    let idx = prayers.findIndex(p => p.id === currentId);
    if (idx < 0) idx = 0;
    if (idx > 0) this.counterDuaId.set(prayers[idx - 1].id);
  }

  nextCounter() {
    const prayers = this.counterPrayers();
    if (!prayers.length) return;
    const currentId = this.counterPrayer()?.id;
    let idx = prayers.findIndex(p => p.id === currentId);
    if (idx < 0) idx = 0;
    if (idx < prayers.length - 1) this.counterDuaId.set(prayers[idx + 1].id);
  }

  openCounter(id: number) {
    this.counterDuaId.set(id);
    this.activeTab.set('counter');
  }

  openAddDua() {
    if (!this.authService.user()) {
      this.showAuthPanel.set(true);
      return;
    }
    this.editingPrayer.set(null);
    this.showAddDua.set(true);
  }

  openEditDua(prayer: Prayer) {
    this.editingPrayer.set(prayer);
    this.showAddDua.set(true);
  }

  async saveCustomPrayer(form: { arabic: string; transliteration: string; virtue: string; targetCount: number; position: number; title?: string; category?: string; time?: string }) {
    const draft = {
      arabic: form.arabic,
      transliteration: form.transliteration,
      virtue: form.virtue,
      targetCount: form.targetCount,
      title: form.title,
      category: form.category,
      time: form.time
    };
    const editing = this.editingPrayer();
    if (editing) {
      await this.customPrayerService.updatePrayer(editing.id, draft, form.position);
      this.showAddDua.set(false);
      return;
    }
    const saved = await this.customPrayerService.addPrayer(draft, form.position);
    if (saved) this.showAddDua.set(false);
  }

  confirmReset() {
    this.prayerService.resetProgress();
    this.showResetConfirm.set(false);
  }

  openEditFolder(folderId: string) {
    const folder = this.folderService.folders().find(f => f.id === folderId) ?? null;
    if (!folder || folder.id === 'gulistan') return;
    this.editingFolder.set(folder);
    this.showFolderModal.set(true);
  }

  async saveFolder(draft: FolderDraft) {
    const editing = this.editingFolder();
    if (editing) {
      await this.folderService.updateFolder(editing.id, draft);
    } else {
      await this.folderService.addFolder(draft);
    }
    this.showFolderModal.set(false);
  }

  async signIn() {
    try {
      await this.authService.signInWithGoogle();
      this.showToast('Hoş geldin! Cihazların senkronize ediliyor... ✨');
      setTimeout(() => {
        this.showAuthPanel.set(false);
      }, 2800);
    } catch {
      // Errors are handled inside auth service usually
    }
  }
  async signOut() {
    await this.authService.signOut();
    this.showAuthPanel.set(false);
    this.showToast('Zikret, fikret, şükret... Yine gel bekleriz... :)');
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3500);
  }

  previousMonth() {
    const m = this.calendarMonth();
    this.calendarMonth.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  nextMonth() {
    const m = this.calendarMonth();
    this.calendarMonth.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
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

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.readingId()) { this.readingId.set(null); return; }
      if (this.showAddDua()) { this.showAddDua.set(false); return; }
      if (this.showPicker()) { this.showPicker.set(false); return; }
      if (this.showAuthPanel()) { this.showAuthPanel.set(false); return; }
      if (this.showCalendar()) { this.showCalendar.set(false); return; }
      if (this.showResetConfirm()) { this.showResetConfirm.set(false); return; }
    }
  }
}

