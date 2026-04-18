import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, output, signal, viewChildren } from '@angular/core';
import { FolderService } from '../../core/services/folder.service';
import { PrayerService } from '../../core/services/prayer.service';
import { DailyHistoryService } from '../../core/services/daily-history.service';
import { AuthService } from '../../core/services/auth.service';
import { Folder } from '../../shared/types/folder.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-screen',
  standalone: true,
  imports: [],
  styles: [`
    .drag-ghost {
      opacity: 0.4;
      transform: scale(0.97);
    }
    .drag-over-top {
      border-top: 2px solid var(--dd-accent) !important;
      margin-top: -2px;
    }
    .drag-over-bottom {
      border-bottom: 2px solid var(--dd-accent) !important;
      margin-bottom: -2px;
    }
    .drag-handle {
      touch-action: none;
      cursor: grab;
    }
    .drag-handle:active { cursor: grabbing; }
  `],
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

      <!-- Folder grid header -->
      <div class="flex justify-between items-baseline mb-3">
        <div class="font-serif text-[20px] font-medium dd-text-ink" style="letter-spacing:-0.3px;">Klasörlerim</div>
        <button (click)="createFolder.emit()"
                class="dd-bg-ink dd-text-on-ink border-none rounded-full px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-sans text-[12px] font-medium press-scale">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Yeni
        </button>
      </div>

      <!-- Folder list -->
      <div class="flex flex-col gap-3">
        @for (folder of folders(); track folder.id; let i = $index) {
          @if (folder.enabled) {
            <div class="flex items-center gap-0"
                 [class.drag-ghost]="dragIndex() === i"
                 [class.drag-over-bottom]="dropTarget() === i && dragIndex() !== null && dragIndex()! < i"
                 [class.drag-over-top]="dropTarget() === i && dragIndex() !== null && dragIndex()! > i"
                 #folderRow>

              <!-- Drag handle (only for user folders, not default) -->
              @if (folder.id !== 'gulistan') {
                <div class="drag-handle shrink-0 flex items-center justify-center w-8 pr-1"
                     (touchstart)="onDragStart(i, $event)"
                     (touchmove)="onDragMove($event)"
                     (touchend)="onDragEnd()"
                     (mousedown)="onMouseDragStart(i, $event)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="2" stroke-linecap="round">
                    <circle cx="9" cy="6" r="1" fill="var(--dd-ink-faint)"/><circle cx="15" cy="6" r="1" fill="var(--dd-ink-faint)"/>
                    <circle cx="9" cy="12" r="1" fill="var(--dd-ink-faint)"/><circle cx="15" cy="12" r="1" fill="var(--dd-ink-faint)"/>
                    <circle cx="9" cy="18" r="1" fill="var(--dd-ink-faint)"/><circle cx="15" cy="18" r="1" fill="var(--dd-ink-faint)"/>
                  </svg>
                </div>
              } @else {
                <div class="w-8 pr-1 shrink-0"></div>
              }

              <!-- Folder card -->
              <button (click)="openFolder.emit(folder.id)"
                      class="flex-1 border-none text-left cursor-pointer press-scale rounded-[24px] dd-bg-card p-[18px_20px] flex items-center gap-4"
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

                <!-- Completion badge or arrow -->
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
            </div>
          } @else {
            <!-- Disabled folder -->
            <div class="flex items-center gap-0" #folderRow>
              <div class="w-8 pr-1 shrink-0"></div>
              <div class="flex-1 rounded-[24px] dd-bg-card p-[18px_20px] flex items-center gap-4 opacity-40">
                <div class="w-14 h-14 rounded-full flex items-center justify-center text-[22px]"
                     style="background:var(--dd-line)">{{ folder.emoji }}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-serif text-[18px] dd-text-ink mb-0.5">{{ folder.name }}</div>
                  <div class="font-mono text-[10px] dd-text-faint">Devre dışı</div>
                </div>
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

  folderRows = viewChildren<ElementRef>('folderRow');

  openFolder = output<string>();
  createFolder = output<void>();
  openCalendar = output<void>();

  folders = this.folderService.folders;
  gregorianDate = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  userName = computed(() => this.authService.user()?.displayName?.split(' ')[0] ?? null);

  // Drag state
  dragIndex = signal<number | null>(null);
  dropTarget = signal<number | null>(null);
  private startY = 0;

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

  // ── Drag & Drop (Touch) ──────────────────────
  onDragStart(index: number, e: TouchEvent) {
    // Don't drag the default folder (index 0 = gulistan)
    if (index === 0) return;
    e.preventDefault();
    this.dragIndex.set(index);
    this.startY = e.touches[0].clientY;
    // Haptic
    if ('vibrate' in navigator) navigator.vibrate(15);
  }

  onDragMove(e: TouchEvent) {
    if (this.dragIndex() === null) return;
    e.preventDefault();

    const y = e.touches[0].clientY;
    const rows = this.folderRows();
    let target: number | null = null;

    for (let i = 0; i < rows.length; i++) {
      const el = rows[i].nativeElement as HTMLElement;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (y >= rect.top && y <= rect.bottom) {
        target = i;
        break;
      }
      // If above the first row
      if (i === 0 && y < rect.top) { target = 0; break; }
      // If below the last row
      if (i === rows.length - 1 && y > rect.bottom) { target = i; break; }
    }

    // Don't allow dropping onto the default folder (index 0)
    if (target === 0) target = 1;
    this.dropTarget.set(target);
  }

  onDragEnd() {
    const from = this.dragIndex();
    const to = this.dropTarget();
    this.dragIndex.set(null);
    this.dropTarget.set(null);

    if (from === null || to === null || from === to) return;

    // Reorder: get current folder list, move item from → to
    const list = [...this.folders()];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    // Extract only user folder IDs (skip gulistan) in new order
    const userIds = list.filter(f => f.id !== 'gulistan').map(f => f.id);
    this.folderService.reorderFolders(userIds);
  }

  // ── Drag & Drop (Mouse - for desktop) ────────
  onMouseDragStart(index: number, e: MouseEvent) {
    if (index === 0) return;
    e.preventDefault();
    this.dragIndex.set(index);

    const onMove = (ev: MouseEvent) => {
      const rows = this.folderRows();
      let target: number | null = null;
      for (let i = 0; i < rows.length; i++) {
        const rect = (rows[i].nativeElement as HTMLElement).getBoundingClientRect();
        if (ev.clientY >= rect.top && ev.clientY <= rect.bottom) { target = i; break; }
        if (i === rows.length - 1 && ev.clientY > rect.bottom) { target = i; break; }
      }
      if (target === 0) target = 1;
      this.dropTarget.set(target);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.onDragEnd();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
}
