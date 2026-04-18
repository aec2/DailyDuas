# Folder-Based Prayer Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat category-based prayer list with a folder system where users can create named folders, add prayers/dhikrs to them (including across multiple folders), reorder/enable-disable folders, and complete them with daily-resetting progress — all working offline for guests and synced to Firebase for authenticated users.

**Architecture:** Introduce a `Folder` data type with an ordered list of prayer IDs. A `FolderService` manages CRUD, localStorage persistence for guests, and Firestore sync for authenticated users. The home screen becomes a folder card grid; a new `FolderDetailScreen` shows prayers within a folder using the existing reading modal flow. A default hardcoded "Gülistan" folder contains all base prayers and is always present.

**Tech Stack:** Angular 21 standalone components, signals, `@angular/service-worker`, Firebase Firestore, Tailwind CSS v4, existing `PrayerService` progress tracking (unchanged).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/shared/types/folder.types.ts` | `Folder` interface + `FolderDraft` type |
| Modify | `src/app/data/data.ts` | Export `DEFAULT_FOLDER` constant |
| Create | `src/app/core/services/folder.service.ts` | CRUD, localStorage + Firestore sync |
| Modify | `src/app/features/home/home-screen.component.ts` | Folder card grid UI |
| Create | `src/app/features/folder-detail/folder-detail.component.ts` | Prayers-within-folder screen |
| Create | `src/app/shared/components/folder-modal.component.ts` | Create/edit folder modal |
| Modify | `src/app/app.ts` | Wire folder navigation + new components |

---

## Task 1: Folder Types & Default Data

**Files:**
- Create: `src/app/shared/types/folder.types.ts`
- Modify: `src/app/data/data.ts`

- [ ] **Step 1: Create folder types**

Create `src/app/shared/types/folder.types.ts`:

```typescript
export interface Folder {
  id: string;
  name: string;
  emoji: string;
  order: number;
  enabled: boolean;
  prayerIds: number[];
  createdAt: string;
}

export interface FolderDraft {
  name: string;
  emoji: string;
  prayerIds: number[];
}
```

- [ ] **Step 2: Add default folder to data.ts**

At the bottom of `src/app/data/data.ts`, add:

```typescript
import { Folder } from '../shared/types/folder.types';

export const DEFAULT_FOLDER: Folder = {
  id: 'gulistan',
  name: 'Gülistan',
  emoji: '🌹',
  order: 0,
  enabled: true,
  prayerIds: PRAYERS.map(p => p.id),
  createdAt: '2024-01-01T00:00:00.000Z',
};
```

- [ ] **Step 3: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/types/folder.types.ts src/app/data/data.ts
git commit -m "feat: add Folder type and DEFAULT_FOLDER constant"
```

---

## Task 2: FolderService

**Files:**
- Create: `src/app/core/services/folder.service.ts`

The service manages the ordered folder list. For guests it uses localStorage key `dd_folders`. For authenticated users it syncs to Firestore path `users/{uid}/preferences/folders`. It always injects `DEFAULT_FOLDER` as the immutable first item (id `'gulistan'`); user folders are appended after it.

- [ ] **Step 1: Create the service**

Create `src/app/core/services/folder.service.ts`:

```typescript
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { getFirestoreInstance } from '../firebase/firebase.client';
import { Folder, FolderDraft } from '../../shared/types/folder.types';
import { DEFAULT_FOLDER } from '../../data/data';

const STORAGE_KEY = 'dd_folders';

@Injectable({ providedIn: 'root' })
export class FolderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly db = isPlatformBrowser(this.platformId) ? getFirestoreInstance() : null;

  /** User-created folders only (DEFAULT_FOLDER is always prepended in `folders`). */
  private readonly userFolders = signal<Folder[]>([]);
  readonly syncError = signal<string | null>(null);

  /** Full ordered list: default folder always first, then user folders sorted by order. */
  readonly folders = computed(() => [
    DEFAULT_FOLDER,
    ...this.userFolders().slice().sort((a, b) => a.order - b.order),
  ]);

  private unsubscribe: (() => void) | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromLocalStorage();
    }

    effect(() => {
      this.bindFirestore(this.authService.user()?.uid ?? null);
    }, { allowSignalWrites: true });
  }

  async addFolder(draft: FolderDraft): Promise<boolean> {
    const next: Folder = {
      id: `folder_${Date.now()}`,
      name: draft.name.trim(),
      emoji: draft.emoji || '📁',
      order: this.userFolders().length,
      enabled: true,
      prayerIds: draft.prayerIds,
      createdAt: new Date().toISOString(),
    };
    return this.save([...this.userFolders(), next]);
  }

  async updateFolder(id: string, draft: FolderDraft): Promise<boolean> {
    const updated = this.userFolders().map(f =>
      f.id === id ? { ...f, name: draft.name.trim(), emoji: draft.emoji, prayerIds: draft.prayerIds } : f
    );
    return this.save(updated);
  }

  async deleteFolder(id: string): Promise<boolean> {
    return this.save(this.userFolders().filter(f => f.id !== id));
  }

  async toggleFolder(id: string): Promise<boolean> {
    const updated = this.userFolders().map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    return this.save(updated);
  }

  async reorderFolders(orderedIds: string[]): Promise<boolean> {
    const reordered = orderedIds
      .map((id, index) => {
        const folder = this.userFolders().find(f => f.id === id);
        return folder ? { ...folder, order: index } : null;
      })
      .filter((f): f is Folder => f !== null);
    return this.save(reordered);
  }

  private async save(folders: Folder[]): Promise<boolean> {
    this.userFolders.set(folders);
    this.persistToLocalStorage(folders);

    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) return true;

    try {
      await setDoc(
        doc(this.db, 'users', uid, 'preferences', 'folders'),
        { items: folders, updatedAt: new Date().toISOString() }
      );
      this.syncError.set(null);
      return true;
    } catch {
      this.syncError.set('Klasörler kaydedilemedi. Firestore izinlerini kontrol edin.');
      return false;
    }
  }

  private bindFirestore(uid: string | null) {
    this.unsubscribe?.();
    this.unsubscribe = null;

    if (!this.db || !uid) return;

    this.unsubscribe = onSnapshot(
      doc(this.db, 'users', uid, 'preferences', 'folders'),
      snapshot => {
        const items = snapshot.data()?.['items'];
        if (Array.isArray(items)) {
          this.userFolders.set(items);
          this.persistToLocalStorage(items);
        }
      },
      () => this.syncError.set('Klasörler yüklenemedi.')
    );
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.userFolders.set(JSON.parse(raw));
    } catch {}
  }

  private persistToLocalStorage(folders: Folder[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    } catch {}
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/folder.service.ts
git commit -m "feat: add FolderService with localStorage + Firestore sync"
```

---

## Task 3: Folder Modal (Create / Edit)

**Files:**
- Create: `src/app/shared/components/folder-modal.component.ts`

A modal for creating a new folder or editing an existing one. Inputs: `open`, `allPrayers` (full merged prayer list), `editingFolder` (null when creating). Outputs: `close`, `save` (emits `FolderDraft`).

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/folder-modal.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Folder, FolderDraft } from '../../shared/types/folder.types';
import { Prayer } from '../../data/data';

const EMOJI_OPTIONS = ['🌹','📖','✨','🕌','🌙','⭐','🤲','💎','🌿','🕊️','🌸','🔮'];

@Component({
  selector: 'app-folder-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
           style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);"
           role="button" tabindex="-1"
           (click)="close.emit()" (keydown.escape)="close.emit()">
        <div class="dd-bg-surface rounded-[24px] max-w-lg w-full p-6 animate-fade-in overflow-y-auto"
             style="box-shadow:0 12px 40px rgba(0,0,0,0.15);max-height:90vh;"
             role="dialog" aria-modal="true"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-1">Klasör</div>
              <div class="font-serif text-[22px] dd-text-ink" style="letter-spacing:-0.3px;">
                {{ editingFolder() ? 'Klasörü Düzenle' : 'Yeni Klasör' }}
              </div>
            </div>
            <button (click)="close.emit()"
                    class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                    aria-label="Kapat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <form class="flex flex-col gap-4" (ngSubmit)="submit()">
            <!-- Emoji picker -->
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5">Simge</div>
              <div class="flex flex-wrap gap-2">
                @for (e of emojiOptions; track e) {
                  <button type="button"
                          (click)="emoji.set(e)"
                          class="border-none rounded-[12px] w-10 h-10 text-[20px] cursor-pointer press-scale"
                          [style.background]="emoji() === e ? 'var(--dd-accent)' : 'var(--dd-card)'">
                    {{ e }}
                  </button>
                }
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="folder-name">Klasör Adı</label>
              <input id="folder-name" name="name"
                     [ngModel]="name()" (ngModelChange)="name.set($event)"
                     class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                     style="border:1px solid var(--dd-line);"
                     placeholder="Örnek: Sabah Zikirlerim" required />
            </div>

            <!-- Prayer picker -->
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5">
                Zikirler ({{ selectedIds().length }} seçili)
              </div>
              <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto rounded-[14px] dd-bg-card p-2">
                @for (prayer of allPrayers(); track prayer.id) {
                  <label class="flex items-center gap-3 px-2 py-2 rounded-[10px] cursor-pointer"
                         [style.background]="isSelected(prayer.id) ? 'rgba(212,165,116,0.12)' : 'transparent'">
                    <input type="checkbox"
                           [checked]="isSelected(prayer.id)"
                           (change)="togglePrayer(prayer.id)"
                           class="accent-[var(--dd-accent)] w-4 h-4" />
                    <span class="font-serif text-[14px] dd-text-ink">{{ prayer.title || prayer.transliteration }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-1">
              <button type="button" (click)="close.emit()"
                      class="dd-bg-card border-none rounded-full px-4 py-2.5 font-sans text-[14px] font-medium dd-text-ink cursor-pointer press-scale">
                Vazgeç
              </button>
              <button type="submit" [disabled]="!name().trim()"
                      class="border-none rounded-full px-5 py-2.5 font-sans text-[14px] font-medium text-white cursor-pointer press-scale"
                      style="background:var(--dd-accent)">
                {{ editingFolder() ? 'Kaydet' : 'Oluştur' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class FolderModalComponent {
  open = input.required<boolean>();
  allPrayers = input.required<Prayer[]>();
  editingFolder = input<Folder | null>(null);

  close = output<void>();
  save = output<FolderDraft>();

  readonly emojiOptions = EMOJI_OPTIONS;

  name = signal('');
  emoji = signal('🌹');
  selectedIds = signal<number[]>([]);

  constructor() {
    effect(() => {
      const f = this.editingFolder();
      if (f) {
        this.name.set(f.name);
        this.emoji.set(f.emoji);
        this.selectedIds.set([...f.prayerIds]);
      } else if (this.open()) {
        this.name.set('');
        this.emoji.set('🌹');
        this.selectedIds.set([]);
      }
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  togglePrayer(id: number) {
    this.selectedIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  submit() {
    if (!this.name().trim()) return;
    this.save.emit({ name: this.name(), emoji: this.emoji(), prayerIds: this.selectedIds() });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/folder-modal.component.ts
git commit -m "feat: add FolderModalComponent for create/edit folder"
```

---

## Task 4: Home Screen → Folder Card Grid

**Files:**
- Modify: `src/app/features/home/home-screen.component.ts`

Replace the flat prayer list with a grid of folder cards. Each card shows: emoji, name, progress ring (completed/total prayers), enabled/disabled state. Outputs: `openFolder` (emits folder id), `createFolder`, `openCalendar` (kept).

- [ ] **Step 1: Rewrite home-screen.component.ts**

Replace the entire content of `src/app/features/home/home-screen.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FolderService } from '../../core/services/folder.service';
import { PrayerService } from '../../core/services/prayer.service';
import { DailyHistoryService } from '../../core/services/daily-history.service';
import { AuthService } from '../../core/services/auth.service';
import { Folder } from '../../shared/types/folder.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-screen',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="px-5 pb-32" style="padding-top: 36px;">

      <!-- Header -->
      <div class="flex justify-between items-start mt-3 mb-7">
        <div>
          <div class="font-mono text-[11px] dd-text-faint tracking-[1.4px] uppercase mb-0.5">{{ gregorianDate }}</div>
          <div class="font-serif text-[30px] leading-tight dd-text-ink" style="letter-spacing:-0.5px;">
            Esselamu<br>
            <em class="italic dd-text-accent">Aleyküm</em>
            @if (userName()) {
              <span class="not-italic dd-text-ink">, {{ userName() }}</span>
            }
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openCalendar.emit()"
                  class="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl dd-bg-card cursor-pointer border-none press-scale"
                  aria-label="Takvimi aç">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-accent)" stroke-width="1.6" stroke-linecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </button>
          <div class="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl dd-bg-card">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2s4 4 4 8a4 4 0 01-8 0c0-2 1-3 1-3s-1-2 0-4 3-1 3-1z"/>
              <path d="M12 22a7 7 0 007-7c0-3-2-5-3-6 0 2-1 3-2 3s-2-1-2-3c-2 1-4 3-4 6a4 4 0 004 7z"/>
            </svg>
            <div class="font-serif text-[18px] font-medium leading-none dd-text-ink">{{ streak() }}</div>
            <div class="font-mono text-[9px] dd-text-faint tracking-[0.5px] uppercase">GÜN</div>
          </div>
        </div>
      </div>

      <!-- Folder grid -->
      <div class="flex justify-between items-baseline mb-3">
        <div class="font-serif text-[20px] font-medium dd-text-ink" style="letter-spacing:-0.3px;">Klasörlerim</div>
        <button (click)="createFolder.emit()"
                class="dd-bg-ink dd-text-on-ink border-none rounded-full px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-sans text-[12px] font-medium press-scale">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Yeni
        </button>
      </div>

      <div class="flex flex-col gap-3">
        @for (folder of folders(); track folder.id) {
          @if (folder.enabled) {
            <button (click)="openFolder.emit(folder.id)"
                    class="w-full border-none text-left cursor-pointer press-scale rounded-[24px] dd-bg-card p-[18px_20px] flex items-center gap-4"
                    style="box-shadow: 0 1px 0 var(--dd-line);">
              <!-- Emoji + progress ring -->
              <div class="relative shrink-0" style="width:56px;height:56px;">
                <svg width="56" height="56" style="position:absolute;inset:0;">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="var(--dd-line)" stroke-width="3"/>
                  <circle cx="28" cy="28" r="24" fill="none"
                          [attr.stroke]="folderPct(folder) >= 1 ? 'var(--dd-accent2)' : 'var(--dd-accent)'"
                          stroke-width="3"
                          [attr.stroke-dasharray]="150.8"
                          [attr.stroke-dashoffset]="150.8 * (1 - folderPct(folder))"
                          stroke-linecap="round"
                          transform="rotate(-90 28 28)"
                          style="transition: stroke-dashoffset 400ms cubic-bezier(.2,.8,.2,1)"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;">
                  {{ folder.emoji }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="font-serif text-[18px] font-medium dd-text-ink mb-0.5" style="letter-spacing:-0.2px;">
                  {{ folder.name }}
                </div>
                <div class="font-mono text-[10px] dd-text-faint tracking-[0.6px]">
                  {{ folderCompleted(folder) }}/{{ folder.prayerIds.length }} tamamlandı
                </div>
              </div>

              <!-- Completion badge -->
              @if (folderPct(folder) >= 1) {
                <div class="shrink-0 font-mono text-[10px] tracking-[0.6px] uppercase px-2.5 py-1 rounded-full"
                     style="background:rgba(122,154,143,0.15);color:var(--dd-accent2)">
                  ✓ Tamam
                </div>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round" class="shrink-0">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              }
            </button>
          } @else {
            <!-- Disabled folder: dimmed, no tap -->
            <div class="rounded-[24px] dd-bg-card p-[18px_20px] flex items-center gap-4 opacity-40">
              <div class="w-14 h-14 rounded-full flex items-center justify-center text-[22px]"
                   style="background:var(--dd-line)">{{ folder.emoji }}</div>
              <div class="flex-1 min-w-0">
                <div class="font-serif text-[18px] dd-text-ink mb-0.5">{{ folder.name }}</div>
                <div class="font-mono text-[10px] dd-text-faint">Devre dışı</div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class HomeScreenComponent {
  private readonly folderService = inject(FolderService);
  private readonly prayerService = inject(PrayerService);
  private readonly historyService = inject(DailyHistoryService);
  private readonly authService = inject(AuthService);

  openFolder = output<string>();
  createFolder = output<void>();
  openCalendar = output<void>();

  folders = this.folderService.folders;
  gregorianDate = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  userName = computed(() => this.authService.user()?.displayName?.split(' ')[0] ?? null);

  streak = computed(() => {
    const entries = this.historyService.sortedEntries();
    if (!entries.length) return 0;
    const today = new Date();
    let count = 0;
    for (let i = 0; i < entries.length; i++) {
      const d = new Date(entries[i].dateKey + 'T00:00:00');
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff === i && entries[i].finished) count++;
      else break;
    }
    return count;
  });

  folderCompleted(folder: Folder): number {
    const p = this.prayerService.progress();
    return folder.prayerIds.filter(id => {
      const prayer = this.prayerService.prayers().find(pr => pr.id === id);
      return prayer && (p[id] || 0) >= prayer.targetCount;
    }).length;
  }

  folderPct(folder: Folder): number {
    const total = folder.prayerIds.length;
    if (!total) return 0;
    return Math.min(1, this.folderCompleted(folder) / total);
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add src/app/features/home/home-screen.component.ts
git commit -m "feat: rewrite home screen as folder card grid"
```

---

## Task 5: Folder Detail Screen

**Files:**
- Create: `src/app/features/folder-detail/folder-detail.component.ts`

Shows the ordered list of prayers within a folder. Each prayer shows progress (current count / target). Tapping a prayer emits `openDua` (existing reading modal handles it). Also emits `openCounter` for the full-screen counter.

- [ ] **Step 1: Create the component**

Create `src/app/features/folder-detail/folder-detail.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FolderService } from '../../core/services/folder.service';
import { PrayerService } from '../../core/services/prayer.service';
import { Folder } from '../../shared/types/folder.types';
import { Prayer } from '../../data/data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-folder-detail',
  standalone: true,
  imports: [],
  template: `
    @if (folder()) {
      <div class="px-5 pb-32" style="padding-top: 36px;">

        <!-- Nav bar -->
        <div class="flex items-center gap-3 mt-3 mb-6">
          <button (click)="back.emit()"
                  class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale shrink-0"
                  aria-label="Geri">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="flex-1 min-w-0">
            <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-0.5">Klasör</div>
            <div class="font-serif text-[22px] dd-text-ink leading-tight" style="letter-spacing:-0.3px;">
              {{ folder()!.emoji }} {{ folder()!.name }}
            </div>
          </div>
          <!-- Edit button -->
          <button (click)="editFolder.emit(folder()!.id)"
                  class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale shrink-0"
                  aria-label="Düzenle">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-muted)" stroke-width="1.6" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>

        <!-- Overall progress bar -->
        <div class="dd-bg-card rounded-[20px] p-[16px_18px] mb-5">
          <div class="flex justify-between items-center mb-2">
            <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase">Bugünkü İlerleme</div>
            <div class="font-mono text-[11px]" [style.color]="totalPct() >= 1 ? 'var(--dd-accent2)' : 'var(--dd-ink-muted)'">
              {{ completedCount() }}/{{ prayers().length }}
            </div>
          </div>
          <div class="w-full h-1.5 rounded-full overflow-hidden" style="background:var(--dd-line)">
            <div class="h-full rounded-full progress-fill"
                 [style.width.%]="totalPct() * 100"
                 [style.background]="totalPct() >= 1 ? 'var(--dd-accent2)' : 'var(--dd-accent)'"
                 style="transition: width 400ms cubic-bezier(.2,.8,.2,1);">
            </div>
          </div>
        </div>

        <!-- Prayer list -->
        <div class="flex flex-col gap-2.5">
          @for (prayer of prayers(); track prayer.id; let i = $index) {
            <button (click)="openDua.emit(prayer.id)"
                    class="w-full border-none text-left cursor-pointer press-scale dd-bg-surface rounded-[20px] p-[14px_16px] flex flex-col gap-2"
                    style="box-shadow: 0 1px 0 var(--dd-line);">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1 min-w-0">
                  <div class="font-mono text-[9px] dd-text-faint tracking-[0.8px] uppercase mb-0.5">
                    {{ prayer.time || 'Her Zaman' }}
                  </div>
                  <div class="font-serif text-[17px] font-medium dd-text-ink" style="letter-spacing:-0.2px;">
                    {{ prayer.title || prayer.transliteration }}
                  </div>
                  <div class="font-arabic text-[16px] dd-text-muted text-right leading-relaxed mt-1" dir="rtl">
                    {{ prayer.arabic.slice(0, 60) }}{{ prayer.arabic.length > 60 ? '…' : '' }}
                  </div>
                </div>
                <div class="flex flex-col items-end gap-0.5 shrink-0">
                  <div class="font-serif flex items-baseline gap-0.5">
                    <span class="text-[20px] font-medium"
                          [style.color]="getCount(prayer) >= prayer.targetCount ? 'var(--dd-accent2)' : 'var(--dd-ink)'">
                      {{ getCount(prayer) }}
                    </span>
                    <span class="text-[12px] dd-text-faint">/{{ prayer.targetCount }}</span>
                  </div>
                  @if (getCount(prayer) >= prayer.targetCount) {
                    <div class="font-mono text-[8px] tracking-[0.6px] uppercase" style="color:var(--dd-accent2)">✓ tamam</div>
                  }
                </div>
              </div>
              <!-- Progress bar -->
              <div class="w-full h-1 rounded-full overflow-hidden" style="background:var(--dd-line)">
                <div class="h-full rounded-full progress-fill"
                     [style.width.%]="progressPct(prayer)"
                     [style.background]="progressPct(prayer) >= 100 ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
                </div>
              </div>
            </button>
          }
        </div>

        @if (prayers().length === 0) {
          <div class="rounded-[24px] p-8 text-center mt-4 dd-bg-card">
            <div class="font-serif text-[28px] mb-3" style="color:var(--dd-accent)">✦</div>
            <div class="font-serif text-[18px] dd-text-ink mb-2">Klasör boş</div>
            <div class="font-sans text-[13px] dd-text-muted">Düzenle butonuna basarak zikir ekleyebilirsiniz.</div>
          </div>
        }
      </div>
    }
  `,
})
export class FolderDetailComponent {
  folderId = input.required<string>();

  back = output<void>();
  openDua = output<number>();
  editFolder = output<string>();

  private readonly folderService = inject(FolderService);
  private readonly prayerService = inject(PrayerService);

  folder = computed(() => this.folderService.folders().find(f => f.id === this.folderId()) ?? null);

  prayers = computed(() => {
    const f = this.folder();
    if (!f) return [];
    const allPrayers = this.prayerService.prayers();
    return f.prayerIds
      .map(id => allPrayers.find(p => p.id === id))
      .filter((p): p is Prayer => p !== null);
  });

  completedCount = computed(() => {
    const p = this.prayerService.progress();
    return this.prayers().filter(pr => (p[pr.id] || 0) >= pr.targetCount).length;
  });

  totalPct = computed(() => {
    const total = this.prayers().length;
    return total ? this.completedCount() / total : 0;
  });

  getCount(prayer: Prayer): number {
    return this.prayerService.progress()[prayer.id] || 0;
  }

  progressPct(prayer: Prayer): number {
    return Math.min(100, (this.getCount(prayer) / prayer.targetCount) * 100);
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add src/app/features/folder-detail/folder-detail.component.ts
git commit -m "feat: add FolderDetailComponent showing prayers in a folder"
```

---

## Task 6: Wire Everything in app.ts

**Files:**
- Modify: `src/app/app.ts`

Add `activeFolderId` signal for folder navigation. Replace home screen's old `openDua`/`openCounter` outputs with `openFolder`/`createFolder`. Show `FolderDetailComponent` as a full-screen overlay when a folder is active. Hook up the folder modal for create/edit.

- [ ] **Step 1: Update app.ts imports and signals**

At the top of `src/app/app.ts`, add these imports (keep all existing ones):

```typescript
import { FolderService } from './core/services/folder.service';
import { FolderDetailComponent } from './features/folder-detail/folder-detail.component';
import { FolderModalComponent } from './shared/components/folder-modal.component';
import { Folder, FolderDraft } from './shared/types/folder.types';
```

Add to the `imports: [...]` array of the `@Component` decorator:
```typescript
FolderDetailComponent,
FolderModalComponent,
```

Add these signals inside the component class (near the other signals):
```typescript
private readonly folderService = inject(FolderService);

activeFolderId = signal<string | null>(null);
showFolderModal = signal(false);
editingFolder = signal<Folder | null>(null);
```

- [ ] **Step 2: Update home screen bindings in app.ts template**

Find the home screen block in the template:
```html
@if (activeTab() === 'home') {
  <div class="absolute inset-0 overflow-y-auto animate-fade-in">
    <app-home-screen (openDua)="openReading($event)" (openCounter)="openCounter($event)" (openCalendar)="showCalendar.set(true)" />
  </div>
}
```

Replace with:
```html
@if (activeTab() === 'home') {
  <div class="absolute inset-0 overflow-y-auto animate-fade-in">
    <app-home-screen
      (openFolder)="activeFolderId.set($event)"
      (createFolder)="editingFolder.set(null); showFolderModal.set(true)"
      (openCalendar)="showCalendar.set(true)" />
  </div>
}
```

- [ ] **Step 3: Add folder detail overlay in app.ts template**

After the `@if (activeTab() === 'counter')` block and before the `<!-- ── OVERLAYS ──` comment, add:

```html
<!-- Folder detail overlay -->
@if (activeFolderId()) {
  <div class="absolute inset-0 z-20 overflow-y-auto dd-bg animate-slide-in-right">
    <app-folder-detail
      [folderId]="activeFolderId()!"
      (back)="activeFolderId.set(null)"
      (openDua)="openReading($event)"
      (editFolder)="openEditFolder($event)"
    />
  </div>
}
```

- [ ] **Step 4: Add folder modal in app.ts template**

After the `<!-- Reset confirm -->` block, add:

```html
<!-- Folder create/edit modal -->
@if (showFolderModal()) {
  <div class="absolute inset-0 z-50">
    <app-folder-modal
      [open]="true"
      [allPrayers]="prayerService.prayers()"
      [editingFolder]="editingFolder()"
      (close)="showFolderModal.set(false)"
      (save)="saveFolder($event)"
    />
  </div>
}
```

- [ ] **Step 5: Add helper methods to app.ts class**

Add these methods to the `App` component class:

```typescript
openEditFolder(folderId: string) {
  const folder = this.folderService.folders().find(f => f.id === folderId) ?? null;
  if (!folder || folder.id === 'gulistan') return; // default folder is not editable
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
```

- [ ] **Step 6: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 7: Commit**

```bash
git add src/app/app.ts
git commit -m "feat: wire folder navigation, detail screen, and folder modal into app shell"
```

---

## Task 7: Settings Screen — Folder Management

**Files:**
- Modify: `src/app/features/settings/settings-screen.component.ts`

Add a "Klasörler" section in settings where users can toggle (enable/disable) and delete their user-created folders. The default "Gülistan" folder cannot be deleted or disabled.

- [ ] **Step 1: Inject FolderService and add folder management UI**

In `src/app/features/settings/settings-screen.component.ts`, add this import:

```typescript
import { FolderService } from '../../core/services/folder.service';
import { Folder } from '../../shared/types/folder.types';
```

Inject the service in the class:

```typescript
private readonly folderService = inject(FolderService);
folders = this.folderService.folders;
```

Add a folder management section to the template (after the existing reset/auth sections):

```html
<!-- Folder management -->
<div class="mb-6">
  <div class="font-serif text-[18px] font-medium dd-text-ink mb-3">Klasörler</div>
  <div class="flex flex-col gap-2">
    @for (folder of folders(); track folder.id) {
      <div class="dd-bg-card rounded-[18px] p-[12px_16px] flex items-center gap-3">
        <span class="text-[20px]">{{ folder.emoji }}</span>
        <div class="flex-1 font-serif text-[16px] dd-text-ink">{{ folder.name }}</div>
        @if (folder.id !== 'gulistan') {
          <button (click)="toggleFolder(folder)"
                  class="border-none rounded-full px-3 py-1 font-mono text-[10px] cursor-pointer press-scale"
                  [style.background]="folder.enabled ? 'var(--dd-accent)' : 'var(--dd-line)'"
                  [style.color]="folder.enabled ? '#fff' : 'var(--dd-ink-muted)'">
            {{ folder.enabled ? 'Açık' : 'Kapalı' }}
          </button>
          <button (click)="deleteFolder(folder.id)"
                  class="border-none bg-transparent rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale"
                  aria-label="Klasörü sil">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        } @else {
          <span class="font-mono text-[10px] dd-text-faint tracking-[0.6px]">Varsayılan</span>
        }
      </div>
    }
  </div>
</div>
```

Add methods to the class:

```typescript
async toggleFolder(folder: Folder) {
  await this.folderService.toggleFolder(folder.id);
}

async deleteFolder(id: string) {
  await this.folderService.deleteFolder(id);
}
```

- [ ] **Step 2: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add src/app/features/settings/settings-screen.component.ts
git commit -m "feat: add folder management (toggle/delete) in settings screen"
```

---

## Task 8: Clean Up Library Screen

**Files:**
- Modify: `src/app/features/library/library-screen.component.ts`

The library screen now shows all prayers across all folders (flat view for browsing/searching), removing the old "Yeni" button (folder creation is done from home). The `addNew` output is removed since custom prayer creation now happens within the folder modal prayer picker. Keep search + filter.

- [ ] **Step 1: Remove addNew output from library-screen**

In `src/app/features/library/library-screen.component.ts`, remove the line:
```typescript
addNew = output<void>();
```

And remove the "Yeni" button from the template (the `<button (click)="addNew.emit()">` element).

- [ ] **Step 2: Update app.ts to remove addNew binding**

In `src/app/app.ts`, find:
```html
<app-library-screen (openDua)="openReading($event)" (addNew)="openAddDua()" />
```
Replace with:
```html
<app-library-screen (openDua)="openReading($event)" />
```

- [ ] **Step 3: Verify build**

```bash
npx ng build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 4: Commit**

```bash
git add src/app/features/library/library-screen.component.ts src/app/app.ts
git commit -m "refactor: remove addNew from library screen, folder modal handles prayer creation"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Default "Gülistan" folder with all 20 prayers | Task 1 (DEFAULT_FOLDER) |
| User can create new folders | Task 3 (FolderModalComponent) + Task 6 (wired in app.ts) |
| Folder contains prayers with repeat counts | Task 3 (prayerIds picker uses existing Prayer.targetCount) |
| Prayer can appear in multiple folders | Supported — FolderService stores prayerIds arrays independently |
| Daily progress reset | Unchanged — PrayerService already does this |
| Unauthenticated users get default folder | DEFAULT_FOLDER is hardcoded, no auth required |
| Authenticated users' progress synced | DailyHistoryService unchanged; FolderService syncs folder structure to Firestore |
| Enable/disable folders | Task 7 (settings) + FolderService.toggleFolder |
| Reorder folders | FolderService.reorderFolders ready; UI drag-reorder not included (scope: post-MVP) |
| Enter folder → sequential prayer flow | Task 5 (FolderDetailComponent) → openDua → existing ReadingModalComponent |
| Edit folder (rename, change prayers) | Task 6 (openEditFolder → FolderModalComponent in edit mode) |
| Delete user folders | Task 7 |

**Placeholder scan:** No TBDs or vague steps found.

**Type consistency check:** `Folder`, `FolderDraft` defined in Task 1 and used consistently in Tasks 2–7. `prayerIds: number[]` matches `Prayer.id: number`. `FolderService.folders()` returns `Folder[]` and is consumed correctly in Tasks 4, 5, 6, 7.
