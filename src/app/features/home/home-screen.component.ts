import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, output, signal, viewChildren } from '@angular/core';
import { FolderService } from '../../core/services/folder.service';
import { PrayerService } from '../../core/services/prayer.service';
import { CustomPrayerService } from '../../core/services/custom-prayer.service';
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
    .date-toggle {
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      display: inline-block;
      -webkit-tap-highlight-color: transparent;
    }
    @keyframes dateFlip {
      0%   { opacity: 0; transform: translateY(-8px) scale(0.85) rotateX(-60deg); filter: blur(3px); }
      55%  { opacity: 1; transform: translateY(0) scale(1.06) rotateX(0); filter: blur(0); }
      100% { transform: scale(1); }
    }
    .date-flip { animation: dateFlip 380ms cubic-bezier(.2,.8,.2,1); }
  `],
  template: `
    <div class="px-5 pb-32" style="padding-top: 36px;">

      <!-- Header -->
      <div class="flex justify-between items-start mt-3 mb-7">
        <div>
          <button (click)="toggleDate()" class="date-toggle font-mono text-[11px] dd-text-faint tracking-[1.4px] uppercase mb-0.5"
                  [attr.aria-label]="showHijri() ? 'Miladi takvime geç' : 'Hicri takvime geç'">
            <span [class.date-flip]="flipping()"
                  style="display:inline-block; transform-origin: center;"
                  [style.color]="showHijri() ? 'var(--dd-accent)' : 'inherit'">
              {{ showHijri() ? hijriDate : gregorianDate }}
            </span>
          </button>
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
        <div class="font-serif text-[20px] font-medium dd-text-ink" style="letter-spacing:-0.3px;">Listelerim</div>
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
            <div [class.drag-ghost]="dragIndex() === i"
                 [class.drag-over-bottom]="dropTarget() === i && dragIndex() !== null && dragIndex()! < i"
                 [class.drag-over-top]="dropTarget() === i && dragIndex() !== null && dragIndex()! > i"
                 #folderRow>

              <!-- Folder card (long-press to drag for user folders) -->
              <button (click)="onCardClick(folder.id)"
                      (touchstart)="onTouchStart(i, $event)"
                      (touchmove)="onTouchMove($event)"
                      (touchend)="onTouchEnd()"
                      (mousedown)="onMouseDragStart(i, $event)"
                      class="w-full border-none text-left cursor-pointer press-scale rounded-[24px] dd-bg-card p-[18px_20px] flex items-center gap-4"
                      style="box-shadow: 0 1px 0 var(--dd-line); touch-action: pan-x;">
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
            <div #folderRow>
              <div class="rounded-[24px] dd-bg-card p-[18px_20px] flex items-center gap-4 opacity-40">
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
  private readonly customPrayerService = inject(CustomPrayerService);
  private readonly historyService = inject(DailyHistoryService);
  private readonly authService = inject(AuthService);

  folderRows = viewChildren<ElementRef>('folderRow');

  openFolder = output<string>();
  createFolder = output<void>();
  openCalendar = output<void>();

  folders = this.folderService.folders;
  gregorianDate = this.formatGregorian();
  hijriDate = this.formatHijri();
  showHijri = signal(false);
  flipping = signal(false);
  userName = computed(() => this.authService.user()?.displayName?.split(' ')[0] ?? null);

  private formatGregorian(): string {
    const d = new Date();
    const day = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' }).format(d);
    const month = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(d);
    const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(d);
    return `${day} ${month} ${weekday}`;
  }

  private static readonly HIJRI_MONTHS_TR = [
    'Muharrem', 'Safer', 'Rebîülevvel', 'Rebîülâhir',
    'Cemâziyelevvel', 'Cemâziyelâhir', 'Receb', 'Şaban',
    'Ramazan', 'Şevval', 'Zilkâde', 'Zilhicce',
  ];

  private formatHijri(): string {
    const d = new Date();
    let day: number | null = null;
    let month: number | null = null;
    let year: number | null = null;

    // Try Intl with islamic-umalqura, then plain islamic — but ONLY use the
    // numeric parts. Some Android builds ignore the calendar for month names
    // and the era, so we never trust their string output.
    for (const cal of ['islamic-umalqura', 'islamic']) {
      try {
        const parts = new Intl.DateTimeFormat(`en-US-u-ca-${cal}-nu-latn`, {
          day: 'numeric', month: 'numeric', year: 'numeric',
        }).formatToParts(d);
        const dn = parseInt(parts.find(p => p.type === 'day')?.value ?? '', 10);
        const mn = parseInt(parts.find(p => p.type === 'month')?.value ?? '', 10);
        const yn = parseInt(parts.find(p => p.type === 'year')?.value ?? '', 10);
        // Sanity check: a Hijri year right now is ~1440–1460. Reject if Intl
        // ignored the calendar (year would still be ~2020+).
        if (
          Number.isFinite(dn) && dn >= 1 && dn <= 30 &&
          Number.isFinite(mn) && mn >= 1 && mn <= 12 &&
          Number.isFinite(yn) && yn >= 1300 && yn <= 1600
        ) {
          day = dn; month = mn; year = yn;
          break;
        }
      } catch { /* try next */ }
    }

    // Fallback: tabular Islamic calendar (Kuwaiti algorithm). Up to ~1 day off
    // from the moon-based Hijri but consistent everywhere.
    if (day === null || month === null || year === null) {
      const t = HomeScreenComponent.gregorianToHijriTabular(d);
      day = t.d; month = t.m; year = t.y;
    }

    return `${day} ${HomeScreenComponent.HIJRI_MONTHS_TR[month - 1]} ${year}`;
  }

  private static gregorianToHijriTabular(date: Date): { d: number; m: number; y: number } {
    const day = date.getDate();
    const m0 = date.getMonth() + 1;
    const y0 = date.getFullYear();

    let jd: number;
    if (y0 < 1582 || (y0 === 1582 && (m0 < 10 || (m0 === 10 && day < 15)))) {
      jd = 367 * y0 - Math.floor(7 * (y0 + 5001 + Math.floor((m0 - 9) / 7)) / 4) +
        Math.floor(275 * m0 / 9) + day + 1729777;
    } else {
      jd = Math.floor((1461 * (y0 + 4800 + Math.floor((m0 - 14) / 12))) / 4) +
        Math.floor((367 * (m0 - 2 - 12 * Math.floor((m0 - 14) / 12))) / 12) -
        Math.floor((3 * Math.floor((y0 + 4900 + Math.floor((m0 - 14) / 12)) / 100)) / 4) +
        day - 32075;
    }

    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
      Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const islamicMonth = Math.floor((24 * l3) / 709);
    const islamicDay = l3 - Math.floor((709 * islamicMonth) / 24);
    const islamicYear = 30 * n + j - 30;

    return { d: islamicDay, m: islamicMonth, y: islamicYear };
  }

  toggleDate() {
    this.showHijri.update(v => !v);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);

    // Force the CSS animation to restart by removing and re-adding the class
    // across two animation frames (ensures a reflow happens between toggles).
    this.flipping.set(false);
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.flipping.set(true));
      });
    } else {
      this.flipping.set(true);
    }
    setTimeout(() => this.flipping.set(false), 420);
  }

  // Drag state
  dragIndex = signal<number | null>(null);
  dropTarget = signal<number | null>(null);
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private isDragging = false;
  private tapCancelled = false;

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
    const allPrayers = this.customPrayerService.prayers();
    return folder.prayerIds.filter(id => {
      const prayer = allPrayers.find(pr => pr.id === id);
      return prayer && (p[id] || 0) >= prayer.targetCount;
    }).length;
  }

  folderPct(folder: Folder): number {
    const total = folder.prayerIds.length;
    if (!total) return 0;
    return Math.min(1, this.folderCompleted(folder) / total);
  }

  // ── Card click (only fires if not dragging) ────
  onCardClick(folderId: string) {
    if (!this.tapCancelled) {
      this.openFolder.emit(folderId);
    }
  }

  // ── Touch: Long Press → Drag ──────────────────
  onTouchStart(index: number, e: TouchEvent) {
    if (this.folders()[index]?.id === 'gulistan') return;

    this.tapCancelled = false;
    this.isDragging = false;

    this.longPressTimer = setTimeout(() => {
      this.isDragging = true;
      this.tapCancelled = true;
      this.dragIndex.set(index);
      if ('vibrate' in navigator) navigator.vibrate(20);
    }, 400);
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging) {
      if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      return;
    }

    e.preventDefault();
    const y = e.touches[0].clientY;
    const rows = this.folderRows();
    let target: number | null = null;

    for (let i = 0; i < rows.length; i++) {
      const el = rows[i].nativeElement as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) { target = i; break; }
      if (i === 0 && y < rect.top) { target = 0; break; }
      if (i === rows.length - 1 && y > rect.bottom) { target = i; break; }
    }

    if (target === 0) target = 1;
    this.dropTarget.set(target);
  }

  onTouchEnd() {
    if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }

    if (this.isDragging) {
      this.finalizeDrag();
      this.isDragging = false;
    }
  }

  private finalizeDrag() {
    const from = this.dragIndex();
    const to = this.dropTarget();
    this.dragIndex.set(null);
    this.dropTarget.set(null);

    if (from === null || to === null || from === to) return;

    const list = [...this.folders()];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    const userIds = list.filter(f => f.id !== 'gulistan').map(f => f.id);
    this.folderService.reorderFolders(userIds);
  }

  // ── Mouse: Long press for desktop ─────────────
  onMouseDragStart(index: number, e: MouseEvent) {
    if (this.folders()[index]?.id === 'gulistan') return;
    this.tapCancelled = false;

    this.longPressTimer = setTimeout(() => {
      this.tapCancelled = true;
      this.isDragging = true;
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
        this.finalizeDrag();
        this.isDragging = false;
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }, 400);

    const cancelDrag = () => {
      if (this.longPressTimer && !this.isDragging) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      document.removeEventListener('mousemove', cancelDrag);
      document.removeEventListener('mouseup', cancelUp);
    };
    const cancelUp = () => {
      if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      document.removeEventListener('mousemove', cancelDrag);
      document.removeEventListener('mouseup', cancelUp);
    };
    document.addEventListener('mousemove', cancelDrag);
    document.addEventListener('mouseup', cancelUp);
  }
}
