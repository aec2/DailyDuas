import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FolderService } from '../../core/services/folder.service';
import { PrayerService } from '../../core/services/prayer.service';
import { CustomPrayerService } from '../../core/services/custom-prayer.service';
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
            <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-0.5">Sahîfe</div>
            <div class="font-serif text-[22px] dd-text-ink leading-tight" style="letter-spacing:-0.3px;">
              {{ folder()!.emoji }} {{ folder()!.name }}
            </div>
          </div>
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
          @for (prayer of prayers(); track prayer.id) {
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
            <div class="font-serif text-[18px] dd-text-ink mb-2">Sahîfe boş</div>
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
  private readonly customPrayerService = inject(CustomPrayerService);

  folder = computed(() => this.folderService.folders().find(f => f.id === this.folderId()) ?? null);

  prayers = computed(() => {
    const f = this.folder();
    if (!f) return [];
    const allPrayers = this.customPrayerService.prayers();
    return f.prayerIds
      .map(id => allPrayers.find(p => p.id === id))
      .filter((p): p is Prayer => p !== undefined);
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
