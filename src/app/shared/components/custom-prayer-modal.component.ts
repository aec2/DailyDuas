import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
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
}

@Component({
  selector: 'app-custom-prayer-modal',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in-overlay"
        role="button"
        tabindex="-1"
        (click)="close.emit()"
        (keydown.escape)="close.emit()"
      >
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-5 sm:p-6 animate-fade-in max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Yeni zikir ekle"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kendi zikrin</p>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ editingPrayer() ? 'Zikri duzenle' : 'Yeni zikir ekle' }}</h3>
            </div>
            <button
              (click)="close.emit()"
              class="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Yeni zikir modalini kapat"
              autofocus
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          @if (!signedIn()) {
            <div class="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Zikrinizi hesabiniza kaydetmek icin once Google ile giris yapin.
              <div class="mt-4">
                <button
                  (click)="openAuth.emit()"
                  class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Google ile giris
                </button>
              </div>
            </div>
          } @else {
            <form class="space-y-4" (ngSubmit)="submitForm()">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200" for="custom-prayer-title">Baslik veya okunuş</label>
                <input
                  id="custom-prayer-title"
                  name="transliteration"
                  [ngModel]="transliteration()"
                  (ngModelChange)="transliteration.set($event)"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Ornek: Sabah salavati"
                  required
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200" for="custom-prayer-arabic">Arapca metin</label>
                <textarea
                  id="custom-prayer-arabic"
                  name="arabic"
                  [ngModel]="arabic()"
                  (ngModelChange)="arabic.set($event)"
                  class="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  dir="rtl"
                  required
                ></textarea>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200" for="custom-prayer-virtue">Aciklama</label>
                <textarea
                  id="custom-prayer-virtue"
                  name="virtue"
                  [ngModel]="virtue()"
                  (ngModelChange)="virtue.set($event)"
                  class="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Isterseniz anlami veya not ekleyin"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200" for="custom-prayer-count">Hedef sayi</label>
                  <input
                    id="custom-prayer-count"
                    name="targetCount"
                    type="number"
                    min="1"
                    [ngModel]="targetCount()"
                    (ngModelChange)="targetCount.set($event)"
                    class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200" for="custom-prayer-position">Konum</label>
                  <select
                    id="custom-prayer-position"
                    name="position"
                    [ngModel]="position()"
                    (ngModelChange)="position.set($event)"
                    class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    @for (option of positionOptions(); track option.value) {
                      <option [ngValue]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </div>
              </div>

              @if (error()) {
                <p class="text-sm text-red-600 dark:text-red-400">{{ error() }}</p>
              }

              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
                <button
                  type="button"
                  (click)="close.emit()"
                  class="w-full sm:w-auto rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  Vazgec
                </button>
                <button
                  type="submit"
                  class="w-full sm:w-auto rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  {{ editingPrayer() ? 'Degisiklikleri kaydet' : 'Zikri kaydet' }}
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
  editingPrayer = input<CustomPrayer | null>(null);

  close = output<void>();
  openAuth = output<void>();
  save = output<CustomPrayerFormValue>();

  arabic = signal('');
  transliteration = signal('');
  virtue = signal('');
  targetCount = signal(1);
  position = signal(1);

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
    });
  }

  submitForm() {
    this.save.emit({
      arabic: this.arabic(),
      transliteration: this.transliteration(),
      virtue: this.virtue(),
      targetCount: Number(this.targetCount()),
      position: Number(this.position()),
    });
  }
}
