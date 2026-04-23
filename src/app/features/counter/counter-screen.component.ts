import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgTemplateOutlet, SlicePipe } from '@angular/common';
import { PrayerService } from '../../core/services/prayer.service';
import { ThemeService } from '../../core/services/theme.service';
import { Prayer } from '../../data/data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-counter-screen',
  standalone: true,
  imports: [NgTemplateOutlet, SlicePipe],
  template: `
    <div class="absolute inset-0 z-25 overflow-hidden flex flex-col"
         (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)"
         [style.background]="variant() === 'focus' ? (themeService.isDark() ? '#000' : 'var(--dd-ink)') : 'var(--dd-bg)'">

      <!-- Top bar -->
      <div class="flex justify-between items-center px-5 pb-3" style="padding-top: 36px; margin-top: 6px;">
        <button (click)="close.emit()" class="border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                [style.background]="variant() === 'focus' ? 'rgba(255,255,255,0.08)' : 'var(--dd-card)'"
                aria-label="Sayacı kapat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               [attr.stroke]="variant() === 'focus' ? '#fff' : 'var(--dd-ink)'"
               stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <button (click)="pickDua.emit()" class="border-none rounded-full px-3.5 py-2 flex items-center gap-1.5 cursor-pointer font-sans text-[12px] font-medium press-scale"
                [style.background]="variant() === 'focus' ? 'rgba(255,255,255,0.08)' : 'var(--dd-card)'"
                [style.color]="variant() === 'focus' ? '#fff' : 'var(--dd-ink)'">
          {{ prayer()?.title || prayer()?.transliteration | slice:0:22 }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               [attr.stroke]="variant() === 'focus' ? '#fff' : 'var(--dd-ink)'"
               stroke-width="1.6" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <button (click)="resetCount()" class="border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                [style.background]="variant() === 'focus' ? 'rgba(255,255,255,0.08)' : 'var(--dd-card)'"
                aria-label="Sayacı sıfırla">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               [attr.stroke]="variant() === 'focus' ? '#fff' : 'var(--dd-ink)'"
               stroke-width="1.6" stroke-linecap="round"><path d="M3 12a9 9 0 1015-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </div>

      <!-- Variant content -->
      @switch (variant()) {
        @case ('hero') { <ng-container *ngTemplateOutlet="heroVariant"></ng-container> }
        @case ('beads') { <ng-container *ngTemplateOutlet="beadsVariant"></ng-container> }
        @case ('focus') { <ng-container *ngTemplateOutlet="focusVariant"></ng-container> }
      }
    </div>

    <!-- HERO variant -->
    <ng-template #heroVariant>
      <div class="flex-1 flex flex-col items-center justify-center px-5 overflow-hidden">
        <div class="font-arabic dd-text-muted text-center leading-relaxed mb-1.5" dir="rtl"
             [style.font-size.px]="themeService.arabicSize()">
          {{ prayer()?.arabic | slice:0:80 }}
        </div>
        @if (themeService.showTransliteration()) {
          <div class="font-serif text-[14px] italic dd-text-faint text-center mb-7">
            {{ prayer()?.transliteration | slice:0:50 }}
          </div>
        }

        <!-- Big tap ring -->
        <button (click)="increment()" class="border-none bg-transparent cursor-pointer relative p-0 press-scale shrink-0"
                style="width:280px; height:280px; border-radius:50%;"
                aria-label="Saymak için dokun">
          <svg width="280" height="280" style="position:absolute;inset:0;">
            <circle cx="140" cy="140" r="130" [attr.fill]="'var(--dd-card)'"/>
            <circle cx="140" cy="140" r="130" fill="none" stroke="var(--dd-line)" stroke-width="2"/>
            <circle cx="140" cy="140" r="130" fill="none"
                    [attr.stroke]="isComplete() ? 'var(--dd-accent2)' : 'var(--dd-accent)'"
                    stroke-width="8"
                    [attr.stroke-dasharray]="circumference"
                    [attr.stroke-dashoffset]="circumference * (1 - pct())"
                    stroke-linecap="round"
                    transform="rotate(-90 140 140)"
                    style="transition: stroke-dashoffset 300ms cubic-bezier(.2,.8,.2,1)"/>
            <circle cx="140" cy="140" r="110" fill="none" stroke="var(--dd-ring)" stroke-width="1"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
            <div class="font-serif dd-text-ink leading-none"
                 style="font-size:88px; letter-spacing:-2px;">
              {{ count() }}
            </div>
            <div class="font-mono text-[12px] dd-text-faint tracking-[1.4px] uppercase mt-1">
              / {{ prayer()?.targetCount }}
            </div>
          </div>
        </button>

        <div class="font-sans text-[13px] dd-text-muted mt-6 text-center">
          {{ isComplete() ? '✓ Hedefe ulaşıldı — dilersen devam edebilirsin' : 'Saymak için daireye dokun' }}
        </div>

        <!-- Mini bars indicator -->
        <div class="flex gap-1 mt-4 flex-wrap justify-center" style="max-width:280px;">
          @for (i of indicatorBars(); track i) {
            <div class="rounded-[2px]" style="width:4px;height:14px;"
                 [style.background]="i < count() ? 'var(--dd-accent)' : 'var(--dd-line)'"></div>
          }
        </div>
      </div>
    </ng-template>

    <!-- BEADS variant -->
    <ng-template #beadsVariant>
      <div class="flex-1 flex flex-col items-center justify-center px-5 pb-8 overflow-hidden">
        <div class="text-center mb-4">
          <div class="font-arabic dd-text-ink text-center leading-relaxed mb-1" dir="rtl"
               [style.font-size.px]="themeService.arabicSize()">
            {{ prayer()?.arabic | slice:0:60 }}
          </div>
          @if (themeService.showTransliteration()) {
            <div class="font-serif text-[13px] italic dd-text-faint">{{ prayer()?.transliteration | slice:0:40 }}</div>
          }
        </div>

        <div class="flex justify-center items-baseline gap-1.5 mb-4">
          <div class="font-serif dd-text-ink leading-none" style="font-size:72px;letter-spacing:-2px;">{{ count() }}</div>
          <div class="font-serif text-[20px] dd-text-faint">/ {{ prayer()?.targetCount }}</div>
        </div>

        <!-- Bead column -->
        <div class="relative flex justify-center min-h-[120px] mb-4">
          <!-- string -->
          <div class="absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-1/2" style="background:var(--dd-line)"></div>
          <div class="flex flex-col gap-1 relative z-10 overflow-hidden" style="max-height:100%;">
            @for (bead of visibleBeads(); track $index) {
              <div class="rounded-full self-center transition-all duration-200"
                   [style.width.px]="bead.isActive ? 24 : bead.scale * 20"
                   [style.height.px]="bead.isActive ? 24 : bead.scale * 20"
                   [style.background]="bead.isActive ? 'var(--dd-accent)' : (bead.filled ? 'var(--dd-accent2)' : 'var(--dd-card)')"
                   [style.border]="bead.isActive ? '2px solid var(--dd-accent)' : '1px solid var(--dd-line)'"
                   [style.box-shadow]="bead.isActive ? '0 0 0 8px var(--dd-ring)' : 'none'">
              </div>
            }
          </div>
        </div>

        <button (click)="increment()"
                class="dd-bg-ink dd-text-on-ink border-none rounded-[24px] py-5 cursor-pointer font-serif text-[20px] press-scale"
                aria-label="Boncuğu ilerlet"
                style="box-shadow: 0 4px 20px var(--dd-ring)">
          Boncuğu İlerlet
        </button>
        <div class="flex justify-between font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mt-3">
          <span>Set {{ currentSet() }}</span>
          <span>{{ isComplete() ? '✓ tamamlandı' : (prayer()?.targetCount || 0) - count() + ' kaldı' }}</span>
        </div>
      </div>
    </ng-template>

    <!-- FOCUS variant -->
    <ng-template #focusVariant>
      <div (click)="increment()" class="flex-1 flex flex-col items-center justify-center cursor-pointer relative pb-10">
        <!-- ambient glow -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:360px;height:360px;border-radius:50%;pointer-events:none;"
             [style.background]="'radial-gradient(circle, ' + glowColor() + ' 0%, transparent 70%)'">
        </div>

        <div class="font-arabic text-center leading-[1.5] mb-12 relative"
             [style.font-size.px]="themeService.arabicSize()"
             style="color:rgba(255,255,255,0.7);" dir="rtl">
          {{ prayer()?.arabic | slice:0:80 }}
        </div>

        <div class="font-serif text-white leading-none relative" style="font-size:160px;letter-spacing:-6px;font-weight:300;">
          {{ count() }}
        </div>

        <div class="font-mono text-[12px] tracking-[2px] uppercase mt-3 relative"
             style="color:rgba(255,255,255,0.5);">
          {{ isComplete() ? '✓ hedefe ulaşıldı' : '/ ' + prayer()?.targetCount }}
        </div>

        <!-- progress strip -->
        <div style="position:absolute;bottom:60px;left:40px;right:40px;">
          <div style="height:2px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
            <div style="height:100%;border-radius:2px;transition:width 300ms;"
                 [style.width.%]="pct() * 100"
                 [style.background]="isComplete() ? 'var(--dd-accent2)' : 'var(--dd-accent)'">
            </div>
          </div>
          <div class="text-center mt-3.5 font-sans text-[12px]" style="color:rgba(255,255,255,0.35);">
            Saymak için ekrana dokun
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class CounterScreenComponent {
  readonly themeService = inject(ThemeService);
  private readonly prayerService = inject(PrayerService);

  prayer = input<Prayer | null>(null);
  variant = input<'hero' | 'beads' | 'focus'>('hero');

  close = output<void>();
  pickDua = output<void>();
  next = output<void>();
  prev = output<void>();

  readonly circumference = 2 * Math.PI * 130;
  touchStartX = 0;

  onTouchStart(e: TouchEvent) {
    if (e.changedTouches.length === 0) return;
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length === 0) return;
    const diffX = this.touchStartX - e.changedTouches[0].screenX;
    if (diffX > 60) {
      this.next.emit();
    } else if (diffX < -60) {
      this.prev.emit();
    }
  }

  count = computed(() => {
    const p = this.prayer();
    if (!p) return 0;
    return this.prayerService.progress()[p.id] || 0;
  });

  pct = computed(() => {
    const p = this.prayer();
    if (!p) return 0;
    return Math.min(1, (this.prayerService.progress()[p.id] || 0) / p.targetCount);
  });

  isComplete = computed(() => {
    const p = this.prayer();
    if (!p) return false;
    return (this.prayerService.progress()[p.id] || 0) >= p.targetCount;
  });

  indicatorBars = computed(() => {
    const p = this.prayer();
    const n = Math.min(p?.targetCount || 33, 33);
    return Array.from({ length: n }, (_, i) => i);
  });

  visibleBeads = computed(() => {
    const beadCount = 33;
    const c = this.count();
    const activeIdx = c % beadCount;
    return Array.from({ length: 11 }, (_, i) => {
      const beadIdx = (activeIdx - 5 + i + beadCount) % beadCount;
      const isActive = i === 5;
      const distance = Math.abs(i - 5);
      const scale = isActive ? 1.2 : Math.max(0.5, 1 - distance * 0.12);
      const filled = beadIdx < (c % beadCount) || (isActive && c > 0);
      return { isActive, scale, filled };
    });
  });

  currentSet = computed(() => Math.floor(this.count() / 33) + 1);

  glowColor = computed(() => {
    const pct = this.pct();
    const hex = Math.floor(pct * 80).toString(16).padStart(2, '0');
    return `var(--dd-accent)${hex}`;
  });

  increment() {
    const p = this.prayer();
    if (!p) return;

    const prevCount = this.prayerService.progress()[p.id] || 0;
    this.prayerService.incrementProgress(p.id);
    const newCount = this.prayerService.progress()[p.id] || 0;
    const justCompleted = prevCount < p.targetCount && newCount >= p.targetCount;

    if (this.themeService.soundEnabled()) {
      this.playSound(justCompleted);
    }

    if (this.themeService.hapticEnabled() && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(justCompleted ? [30, 50, 30] : 10);
    }

    if (this.themeService.autoAdvance() && justCompleted) {
      setTimeout(() => this.next.emit(), 600);
    }
  }

  private playSound(complete: boolean) {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx() as AudioContext;
      if (complete) {
        this.beep(ctx, 880, 0, 0.15, 0.07);
        this.beep(ctx, 1320, 0.18, 0.25, 0.05);
      } else {
        this.beep(ctx, 528, 0, 0.07, 0.04);
      }
    } catch {}
  }

  private beep(ctx: AudioContext, freq: number, start: number, dur: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.01);
  }

  resetCount() {
    const p = this.prayer();
    if (!p) return;
    this.prayerService.resetPrayerProgress(p.id);
  }
}
