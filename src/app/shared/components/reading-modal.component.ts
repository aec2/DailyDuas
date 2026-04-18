import {
  ChangeDetectionStrategy, Component, computed, effect,
  ElementRef, inject, input, output, signal, viewChild
} from '@angular/core';
import { PrayerService } from '../../core/services/prayer.service';
import { ThemeService } from '../../core/services/theme.service';
import { Prayer } from '../../data/data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reading-modal',
  standalone: true,
  styles: [`
    .tap-zone {
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .tap-zone:active { transform: scale(0.98); }

    @keyframes completePulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    .complete-pulse { animation: completePulse 0.4s ease-out; }

    @keyframes countBump {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
    .count-bump { animation: countBump 0.15s ease-out; }

    .swipe-container {
      touch-action: pan-y;
    }
  `],
  template: `
    @if (prayer()) {
      <div class="absolute inset-0 z-50 flex flex-col animate-slide-in-right"
           style="background: var(--dd-bg)"
           #swipeContainer
           (touchstart)="onTouchStart($event)"
           (touchend)="onTouchEnd($event)">

        <!-- ── TOP: Scrollable reading area ─────────────── -->
        <div class="flex-1 overflow-y-auto swipe-container" style="padding: 0 0 8px;">
          <div style="padding: 58px 20px 0;">

            <!-- Nav bar -->
            <div class="flex justify-between items-center mt-3 mb-5">
              <button (click)="close.emit()"
                      class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                      aria-label="Geri dön">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)"
                     stroke-width="1.6" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>

              <!-- Prev / Next dua navigation -->
              <div class="flex items-center gap-3">
                @if (hasPrev()) {
                  <button (click)="prev.emit()"
                          class="dd-bg-card border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale"
                          aria-label="Önceki dua">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-muted)"
                         stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                }
                <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase">
                  {{ prayer()!.category }}
                </div>
                @if (hasNext()) {
                  <button (click)="next.emit()"
                          class="dd-bg-card border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale"
                          aria-label="Sonraki dua">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-muted)"
                         stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                }
              </div>

              <!-- Swipe hint indicator (replaces non-functional bookmark) -->
              <div class="flex items-center gap-1 font-mono text-[9px] dd-text-faint tracking-[0.5px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.4" stroke-linecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                kaydır
              </div>
            </div>

            <!-- Title + meta -->
            <div class="font-serif text-[26px] dd-text-ink mb-1" style="letter-spacing:-0.4px;">
              {{ prayer()!.title || prayer()!.transliteration }}
            </div>
            <div class="font-sans text-[12px] dd-text-faint mb-6">
              {{ prayer()!.targetCount }}× · {{ prayer()!.time || 'Her Zaman' }}
            </div>

            <!-- Font size controls — separate row above Arabic card -->
            <div class="flex items-center justify-end gap-2 mb-2 px-1">
              <span class="font-mono text-[10px] dd-text-faint tracking-[0.8px] uppercase">Yazı boyutu</span>
              <button (click)="themeService.adjustArabicSize(-4)"
                      [disabled]="themeService.arabicSize() <= 20"
                      class="border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale dd-bg-card"
                      style="color:var(--dd-ink-muted); font-size:16px; line-height:1; font-weight:500;"
                      aria-label="Yazı boyutunu küçült">−</button>
              <span class="font-mono text-[11px] dd-text-faint" style="min-width:28px; text-align:center;">{{ themeService.arabicSize() }}</span>
              <button (click)="themeService.adjustArabicSize(4)"
                      [disabled]="themeService.arabicSize() >= 56"
                      class="border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale dd-bg-card"
                      style="color:var(--dd-ink-muted); font-size:16px; line-height:1; font-weight:500;"
                      aria-label="Yazı boyutunu büyüt">+</button>
            </div>

            <!-- Arabic text — main focal point -->
            <div class="dd-bg-card rounded-[24px] mb-5">
              <div class="p-[28px_24px]">
                <div class="font-arabic dd-text-ink text-center"
                     dir="rtl"
                     [style.font-size.px]="themeService.arabicSize()"
                     [style.line-height]="themeService.arabicSize() >= 44 ? '1.7' : '1.9'">
                  {{ prayer()!.arabic }}
                </div>
              </div>
            </div>

            <!-- Transliteration -->
            <div class="mb-4 px-1">
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2">Okunuş</div>
              <div class="font-serif text-[17px] dd-text-ink italic leading-relaxed">
                {{ prayer()!.transliteration }}
              </div>
            </div>

            <!-- Virtue -->
            <div class="mb-3 px-1">
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2">Fazileti</div>
              <div class="font-serif text-[16px] dd-text-muted leading-relaxed font-light">
                "{{ prayer()!.virtue }}"
              </div>
            </div>

          </div>
        </div>

        <!-- ── BOTTOM: Sticky in-place counter ─────────── -->
        <div class="shrink-0 dd-bg-surface"
             style="border-top: 1px solid var(--dd-line);
                    padding: 16px 20px max(env(safe-area-inset-bottom), 20px);">

          <!-- Progress bar -->
          <div class="w-full h-1 rounded-full overflow-hidden mb-3" style="background:var(--dd-line)">
            <div class="h-full rounded-full progress-fill"
                 [style.width.%]="pct()"
                 [style.background]="isComplete() ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
            </div>
          </div>

          <!-- Count display + tap button row -->
          <div class="flex items-center gap-3">

            <!-- Big tap button -->
            <button (click)="tap()"
                    class="tap-zone flex-1 border-none rounded-[20px] py-5 flex flex-col items-center gap-1 cursor-pointer transition-all"
                    [style.background]="isComplete() ? 'var(--dd-accent2)' : 'var(--dd-accent)'"
                    [class.complete-pulse]="justCompleted()"
                    aria-label="Saymak için dokun">
              <div class="font-serif leading-none text-white"
                   style="font-size: 52px; letter-spacing: -2px;"
                   [class.count-bump]="bumpKey()">
                {{ count() }}
              </div>
              <div class="font-mono text-[10px] tracking-[1.2px] uppercase"
                   style="color: rgba(255,255,255,0.7)">
                {{ isComplete() ? '✓ tamamlandı' : '/ ' + prayer()!.targetCount }}
              </div>
            </button>

            <!-- Right column: reset + next -->
            <div class="flex flex-col gap-2">
              <!-- Reset -->
              <button (click)="reset()"
                      class="dd-bg-card border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer press-scale"
                      aria-label="Sayacı sıfırla">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-muted)"
                     stroke-width="1.8" stroke-linecap="round">
                  <path d="M3 12a9 9 0 1015-6.7L21 8"/><path d="M21 3v5h-5"/>
                </svg>
              </button>
              <!-- Next dua (visible when complete & next exists) -->
              @if (isComplete() && hasNext()) {
                <button (click)="next.emit()"
                        class="border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer press-scale animate-fade-in"
                        style="background: var(--dd-ink)"
                        aria-label="Sonraki duaya geç">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-bg)"
                       stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              }
            </div>

          </div>

          <!-- Hint text -->
          @if (!isComplete()) {
            <div class="text-center font-sans text-[11px] dd-text-faint mt-2.5">
              Saymak için aşağıdaki butona dokun
            </div>
          } @else if (hasNext()) {
            <div class="text-center font-sans text-[11px] mt-2.5" style="color:var(--dd-accent2)">
              Sıradaki zikre geç →
            </div>
          }
        </div>

      </div>
    }
  `,
})
export class ReadingModalComponent {
  private readonly prayerService = inject(PrayerService);
  readonly themeService = inject(ThemeService);

  prayer  = input<Prayer | null>(null);
  hasPrev = input(false);
  hasNext = input(false);

  close = output<void>();
  prev  = output<void>();
  next  = output<void>();

  // bump key cycles to re-trigger the animation on each tap
  bumpKey = signal(false);
  justCompleted = signal(false);

  // Swipe tracking
  private touchStartX = 0;
  private touchStartY = 0;

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

  isComplete = computed(() => {
    const p = this.prayer();
    if (!p) return false;
    return (this.prayerService.progress()[p.id] || 0) >= p.targetCount;
  });

  tap() {
    const p = this.prayer();
    if (!p) return;

    // Allow tapping even after completion (continue counting)
    this.prayerService.incrementProgress(p.id);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // trigger count animation
    this.bumpKey.set(!this.bumpKey());

    // detect completion
    if ((this.prayerService.progress()[p.id] || 0) >= p.targetCount && !this.isComplete()) {
      this.justCompleted.set(true);
      // Longer vibration for completion
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
      setTimeout(() => this.justCompleted.set(false), 500);
    }
  }

  reset() {
    const p = this.prayer();
    if (!p) return;
    this.prayerService.resetPrayerProgress(p.id);
  }

  // Swipe gesture handling
  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].clientX;
    this.touchStartY = e.changedTouches[0].clientY;
  }

  onTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    const deltaY = e.changedTouches[0].clientY - this.touchStartY;

    // Only trigger swipe if horizontal movement is dominant and >= 60px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= 60) {
      if (deltaX > 0 && this.hasPrev()) {
        // Swipe right → previous
        this.prev.emit();
      } else if (deltaX < 0 && this.hasNext()) {
        // Swipe left → next
        this.next.emit();
      }
    }
  }
}
