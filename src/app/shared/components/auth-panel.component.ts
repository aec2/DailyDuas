import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="absolute inset-0 z-50 flex items-center justify-center p-5 animate-fade-in-fast"
        style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);"
        role="button"
        tabindex="-1"
        (click)="close.emit()"
        (keydown.escape)="close.emit()"
      >
        <div
          class="dd-bg-surface rounded-[24px] max-w-sm w-full p-6 animate-fade-in"
          style="box-shadow: 0 12px 40px rgba(0,0,0,0.15);"
          role="dialog"
          aria-modal="true"
          aria-label="Google hesap bağlantısı"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-1">Google Sync</div>
              <div class="font-serif text-[22px] dd-text-ink" style="letter-spacing:-0.3px;">Hesap Bağlantısı</div>
            </div>
            <button
              (click)="close.emit()"
              class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
              aria-label="Google panelini kapat"
              autofocus
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          @if (configured()) {
            @if (signedIn()) {
              <div class="rounded-[18px] p-4 mb-1" style="background:var(--dd-accent2);background:linear-gradient(135deg, rgba(122,154,143,0.15), rgba(122,154,143,0.08));">
                <div class="font-serif text-[16px] dd-text-ink font-medium">{{ userLabel() || 'Google kullanıcısı' }}</div>
                <div class="font-sans text-[13px] dd-text-muted mt-1">Günlük zikir geçmişiniz takvime senkronize ediliyor.</div>
              </div>
            } @else {
              <div class="font-sans text-[14px] dd-text-muted leading-relaxed">
                Takvim geçmişinizi cihazlar arasında eşitlemek için Google ile giriş yapın.
              </div>
            }
          } @else {
            <div class="font-sans text-[14px] dd-text-accent leading-relaxed">
              Firebase ayarları eksik. <span class="font-mono text-[12px]">firebase.config.ts</span> dosyasını doldurduktan sonra Google girişi açılacak.
            </div>
          }

          @if (authError()) {
            <div class="font-sans text-[13px] mt-3" style="color:#ef4444;">{{ authError() }}</div>
          }

          @if (syncError()) {
            <div class="font-sans text-[13px] mt-2" style="color:#ef4444;">{{ syncError() }}</div>
          }

          <div class="flex justify-end gap-3 mt-6">
            @if (signedIn()) {
              <button
                (click)="signOut.emit()"
                class="dd-bg-card border-none rounded-full px-4 py-2.5 font-sans text-[14px] font-medium dd-text-ink cursor-pointer press-scale"
              >
                Çıkış Yap
              </button>
            } @else {
              <button
                (click)="signIn.emit()"
                [disabled]="!configured()"
                class="border-none rounded-full px-5 py-2.5 font-sans text-[14px] font-medium text-white cursor-pointer press-scale"
                [style.background]="configured() ? 'var(--dd-accent)' : 'var(--dd-line)'"
                [style.color]="configured() ? '#fff' : 'var(--dd-ink-faint)'"
                [style.cursor]="configured() ? 'pointer' : 'not-allowed'"
              >
                Google ile Giriş
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
