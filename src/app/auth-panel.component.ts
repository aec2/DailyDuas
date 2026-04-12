import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [MatIconModule],
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
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Google hesap baglantisi"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Google Sync</p>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Hesap baglantisi</h3>
            </div>
              <button
                (click)="close.emit()"
                class="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label="Google panelini kapat"
                autofocus
              >
                <mat-icon>close</mat-icon>
              </button>
          </div>

          @if (configured()) {
            @if (signedIn()) {
              <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <p class="font-medium text-emerald-900 dark:text-emerald-100">{{ userLabel() || 'Google kullanicisi' }}</p>
                <p class="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Gunluk zikir gecmisiniz takvime senkronize ediliyor.</p>
              </div>
            } @else {
              <p class="text-sm text-slate-600 dark:text-slate-300">Takvim gecmisinizi cihazlar arasinda esitlemek icin Google ile giris yapin.</p>
            }
          } @else {
            <p class="text-sm text-amber-700 dark:text-amber-300">Firebase ayarlari eksik. firebase.config.ts dosyasini doldurduktan sonra Google girisi acilacak.</p>
          }

          @if (authError()) {
            <p class="mt-4 text-sm text-red-600 dark:text-red-400">{{ authError() }}</p>
          }

          @if (syncError()) {
            <p class="mt-3 text-sm text-red-600 dark:text-red-400">{{ syncError() }}</p>
          }

            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              @if (signedIn()) {
                <button
                  (click)="signOut.emit()"
                  class="w-full sm:w-auto rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  Cikis yap
                </button>
              } @else {
                <button
                  (click)="signIn.emit()"
                  [disabled]="!configured()"
                  class="w-full sm:w-auto rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                >
                  Google ile giris
                </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class AuthPanelComponent {
  open = input.required<boolean>();
  configured = input.required<boolean>();
  signedIn = input.required<boolean>();
  userLabel = input<string>('');
  authError = input<string | null>(null);
  syncError = input<string | null>(null);

  close = output<void>();
  signIn = output<void>();
  signOut = output<void>();
}
