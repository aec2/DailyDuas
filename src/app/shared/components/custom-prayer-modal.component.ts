import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomPrayer } from '../../core/services/custom-prayer.service';

export interface PositionOption {
  value: number;
  label: string;
}

export interface CustomPrayerFormValue {
  arabic: string;
  transliteration: string;
  virtue: string;
  targetCount: number;
  position: number;
  title?: string;
  category?: string;
  time?: string;
}

@Component({
  selector: 'app-custom-prayer-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
        style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);"
        role="button"
        tabindex="-1"
      >
        <div
          class="dd-bg-surface rounded-[24px] max-w-lg w-full p-6 animate-fade-in overflow-y-auto"
          style="box-shadow: 0 12px 40px rgba(0,0,0,0.15); max-height: 90vh;"
          role="dialog"
          aria-modal="true"
          aria-label="Yeni zikir ekle"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-1">Kendi Zikrin</div>
              <div class="font-serif text-[22px] dd-text-ink" style="letter-spacing:-0.3px;">
                {{ editingPrayer() ? 'Zikri Düzenle' : 'Yeni Zikir Ekle' }}
              </div>
            </div>
            <button
              (click)="close.emit()"
              class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
              aria-label="Yeni zikir modalını kapat"
              autofocus
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          @if (!signedIn()) {
            <div class="rounded-[18px] dd-bg-card p-6 text-center">
              <svg class="mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.4" stroke-linecap="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <div class="font-sans text-[14px] dd-text-muted mb-4">
                Zikrinizi hesabınıza kaydetmek için önce Google ile giriş yapın.
              </div>
              <button
                (click)="openAuth.emit()"
                class="border-none rounded-full px-5 py-2.5 font-sans text-[14px] font-medium text-white cursor-pointer press-scale"
                style="background:var(--dd-accent)"
              >
                Google ile Giriş
              </button>
            </div>
          } @else {
            <form class="flex flex-col gap-4" (ngSubmit)="submitForm()">
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-title">Başlık (İsteğe Bağlı)</label>
                  <input
                    id="custom-prayer-title"
                    name="title"
                    type="text"
                    [ngModel]="title()"
                    (ngModelChange)="title.set($event)"
                    class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                    style="border: 1px solid var(--dd-line);"
                    placeholder="Kısa İsim"
                  />
                </div>
                <div>
                  <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-category">Kategori (İsteğe Bağlı)</label>
                  <input
                    id="custom-prayer-category"
                    name="category"
                    type="text"
                    [ngModel]="category()"
                    (ngModelChange)="category.set($event)"
                    class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                    style="border: 1px solid var(--dd-line);"
                    placeholder="Koruma, Şükür vb."
                  />
                </div>
              </div>

              <!-- Time -->
              <div class="mb-3">
                <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-time">Zaman (İsteğe Bağlı)</label>
                <input
                  id="custom-prayer-time"
                  name="time"
                  type="text"
                  [ngModel]="time()"
                  (ngModelChange)="time.set($event)"
                  class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                  style="border: 1px solid var(--dd-line);"
                  placeholder="Sabah & Akşam, Her Zaman vb."
                />
              </div>

              <!-- Transliteration / Title -->
              <div>
                <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-title-orig">Okunuş</label>
                <input
                  id="custom-prayer-title-orig"
                  name="transliteration"
                  [ngModel]="transliteration()"
                  (ngModelChange)="transliteration.set($event)"
                  class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                  style="border: 1px solid var(--dd-line); transition: border-color 200ms;"
                  placeholder="Örnek: Sabah salavatı okunuşu"
                  required
                />
              </div>

              <!-- Arabic -->
              <div>
                <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-arabic">Arapça Metin</label>
                <textarea
                  id="custom-prayer-arabic"
                  name="arabic"
                  [ngModel]="arabic()"
                  (ngModelChange)="arabic.set($event)"
                  class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-arabic text-[18px] outline-none"
                  style="border: 1px solid var(--dd-line); min-height: 100px; transition: border-color 200ms;"
                  dir="rtl"
                  required
                ></textarea>
              </div>

              <!-- Virtue / Description -->
              <div>
                <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-virtue">Açıklama</label>
                <textarea
                  id="custom-prayer-virtue"
                  name="virtue"
                  [ngModel]="virtue()"
                  (ngModelChange)="virtue.set($event)"
                  class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                  style="border: 1px solid var(--dd-line); min-height: 80px; transition: border-color 200ms;"
                  placeholder="İsterseniz anlamı veya not ekleyin"
                ></textarea>
              </div>

              <!-- Count + Position -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-count">Hedef Sayı</label>
                  <input
                    id="custom-prayer-count"
                    name="targetCount"
                    type="number"
                    min="1"
                    [ngModel]="targetCount()"
                    (ngModelChange)="targetCount.set($event)"
                    class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                    style="border: 1px solid var(--dd-line);"
                    required
                  />
                </div>

                <div>
                  <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="custom-prayer-position">Konum</label>
                  <select
                    id="custom-prayer-position"
                    name="position"
                    [ngModel]="position()"
                    (ngModelChange)="position.set($event)"
                    class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none cursor-pointer"
                    style="border: 1px solid var(--dd-line);"
                  >
                    @for (option of positionOptions(); track option.value) {
                      <option [ngValue]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </div>
              </div>

              @if (error()) {
                <div class="font-sans text-[13px]" style="color:#ef4444;">{{ error() }}</div>
              }

              <div class="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  (click)="close.emit()"
                  class="dd-bg-card border-none rounded-full px-4 py-2.5 font-sans text-[14px] font-medium dd-text-ink cursor-pointer press-scale"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  class="border-none rounded-full px-5 py-2.5 font-sans text-[14px] font-medium text-white cursor-pointer press-scale"
                  style="background:var(--dd-accent)"
                >
                  {{ editingPrayer() ? 'Değişiklikleri Kaydet' : 'Zikri Kaydet' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
})
export class CustomPrayerModalComponent {
  open = input.required<boolean>();
  signedIn = input.required<boolean>();
  positionOptions = input.required<PositionOption[]>();
  error = input<string | null>(null);
  editingPrayer = input<any | null>(null);

  close = output<void>();
  openAuth = output<void>();
  save = output<CustomPrayerFormValue>();

  arabic = signal('');
  transliteration = signal('');
  virtue = signal('');
  targetCount = signal(1);
  position = signal(1);
  title = signal('');
  category = signal('');
  time = signal('');

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      const editingPrayer = this.editingPrayer();

      this.arabic.set(editingPrayer?.arabic ?? '');
      this.transliteration.set(editingPrayer?.transliteration ?? '');
      this.virtue.set(editingPrayer?.virtue ?? '');
      this.targetCount.set(editingPrayer?.targetCount ?? 1);
      this.position.set(editingPrayer?.order ?? this.positionOptions()[0]?.value ?? 1);
      this.title.set(editingPrayer?.title ?? '');
      this.category.set(editingPrayer?.category ?? '');
      this.time.set(editingPrayer?.time ?? '');
    });
  }

  submitForm() {
    this.save.emit({
      arabic: this.arabic(),
      transliteration: this.transliteration(),
      virtue: this.virtue(),
      targetCount: Number(this.targetCount()),
      position: Number(this.position()),
      title: this.title() || undefined,
      category: this.category() || undefined,
      time: this.time() || undefined,
    });
  }
}
