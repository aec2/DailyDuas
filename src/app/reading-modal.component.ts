import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { PrayerService } from './prayer.service';
import { Prayer } from './data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reading-modal',
  standalone: true,
  template: `
    @if (prayer()) {
      <div class="absolute inset-0 z-30 dd-bg overflow-auto animate-slide-in-right" style="padding-bottom:40px;">
        <div style="padding: 58px 20px 40px;">

          <!-- Top bar -->
          <div class="flex justify-between items-center mt-3 mb-5">
            <button (click)="close.emit()" class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase">{{ prayer()!.category }}</div>
            <button class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M5 3h14v18l-7-5-7 5V3z"/></svg>
            </button>
          </div>

          <!-- Title -->
          <div class="font-serif text-[28px] dd-text-ink mb-1.5" style="letter-spacing:-0.4px;">
            {{ prayer()!.title || prayer()!.transliteration }}
          </div>
          <div class="font-sans text-[13px] dd-text-muted mb-7">
            {{ prayer()!.targetCount }}× okunacak · {{ prayer()!.time || 'Her Zaman' }}
          </div>

          <!-- Arabic panel -->
          <div class="dd-bg-card rounded-[24px] p-[32px_24px] mb-4">
            <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-4 text-right">العربية</div>
            <div class="font-arabic text-[34px] dd-text-ink text-center leading-[1.8]" dir="rtl">
              {{ prayer()!.arabic }}
            </div>
          </div>

          <!-- Transliteration -->
          <div class="mb-4 px-1">
            <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2">Okunuş</div>
            <div class="font-serif text-[17px] dd-text-ink italic leading-relaxed" style="letter-spacing:-0.1px;">
              {{ prayer()!.transliteration }}
            </div>
          </div>

          <!-- Virtue -->
          <div class="mb-7 px-1">
            <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2">Fazileti</div>
            <div class="font-serif text-[17px] dd-text-muted leading-relaxed font-light">
              "{{ prayer()!.virtue }}"
            </div>
          </div>

          <!-- Today's progress -->
          <div class="dd-bg-surface rounded-[20px] p-[16px_18px] mb-4" style="box-shadow: 0 1px 0 var(--dd-line)">
            <div class="flex justify-between items-baseline mb-2.5">
              <div class="font-sans text-[12px] dd-text-muted tracking-[0.3px]">Bugünün ilerlemesi</div>
              <div class="font-serif">
                <span class="text-[20px] dd-text-ink">{{ count() }}</span>
                <span class="text-[12px] dd-text-faint"> / {{ prayer()!.targetCount }}</span>
              </div>
            </div>
            <div class="w-full h-1 rounded-full overflow-hidden" style="background:var(--dd-line)">
              <div class="h-full rounded-full progress-fill"
                   [style.width.%]="pct()"
                   [style.background]="pct() >= 100 ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
              </div>
            </div>
          </div>

          <!-- Start counter -->
          <button (click)="startCounter.emit()"
                  class="w-full dd-bg-ink dd-text-on-ink border-none rounded-full py-3.5 font-sans text-[15px] font-semibold cursor-pointer press-scale">
            Saymaya Başla
          </button>
        </div>
      </div>
    }
  `,
})
export class ReadingModalComponent {
  private readonly prayerService = inject(PrayerService);

  prayer = input<Prayer | null>(null);
  close = output<void>();
  startCounter = output<void>();

  count = computed(() => {
    const p = this.prayer();
    if (!p) return 0;
    return this.prayerService.progress()[p.id] || 0;
  });

  pct = computed(() => {
    const p = this.prayer();
    if (!p) return 0;
    return Math.min(100, ((this.prayerService.progress()[p.id] || 0) / p.targetCount) * 100);
  });
}
