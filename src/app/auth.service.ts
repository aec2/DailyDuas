import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, User, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirebaseAuthInstance } from './firebase.client';
import { hasFirebaseConfig } from './firebase.config';

export function mapGoogleAuthError(error: unknown) {
  const code = error instanceof FirebaseError
    ? error.code
    : (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null);

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Bu domain Firebase Authentication icin yetkili degil. Firebase Console > Authentication > Settings > Authorized domains listesine mevcut domaini ekleyin.';
    case 'auth/popup-blocked':
      return 'Google giris penceresi tarayici tarafindan engellendi. Pop-up izni verin veya tekrar deneyin.';
    case 'auth/popup-closed-by-user':
      return 'Google giris penceresi kapatildi. Tekrar deneyin.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Bu ortam popup girisini desteklemiyor. Sayfa yonlendirmesi ile tekrar deneyin.';
    case 'auth/cancelled-popup-request':
      return 'Google giris istegi iptal edildi. Tekrar deneyin.';
    default:
      return 'Google girisi baslatilamadi. Firebase Console ayarlarinizi ve yetkili domainlerinizi kontrol edin.';
  }
}

export function shouldPreferRedirectFlow(userAgent: string, isStandalone: boolean) {
  const normalizedUserAgent = userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(normalizedUserAgent);

  return isIos || isStandalone;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly user = signal<User | null>(null);
  readonly isConfigured = signal(hasFirebaseConfig());
  readonly error = signal<string | null>(null);

  private readonly auth = isPlatformBrowser(this.platformId) ? getFirebaseAuthInstance() : null;

  constructor() {
    if (!isPlatformBrowser(this.platformId) || !this.auth) {
      return;
    }

    onAuthStateChanged(this.auth, user => {
      this.user.set(user);
    });

    void this.restoreRedirectResult();
  }

  async signInWithGoogle() {
    if (!this.auth) {
      this.error.set('Firebase ayarlari eksik. src/app/firebase.config.ts dosyasini doldurun.');
      return;
    }

    this.error.set(null);

    const provider = new GoogleAuthProvider();

    if (this.shouldUseRedirectFlow()) {
      await this.startRedirectSignIn(provider);
      return;
    }

    try {
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      if (this.shouldFallbackToRedirect(error)) {
        await this.startRedirectSignIn(provider);
        return;
      }

      this.error.set(mapGoogleAuthError(error));
    }
  }

  async signOut() {
    if (!this.auth) {
      return;
    }

    await signOut(this.auth);
  }

  private async restoreRedirectResult() {
    if (!this.auth) {
      return;
    }

    try {
      await getRedirectResult(this.auth);
    } catch (error) {
      this.error.set(mapGoogleAuthError(error));
    }
  }

  private async startRedirectSignIn(provider: GoogleAuthProvider) {
    if (!this.auth) {
      return;
    }

    try {
      await signInWithRedirect(this.auth, provider);
    } catch (error) {
      this.error.set(mapGoogleAuthError(error));
    }
  }

  private shouldFallbackToRedirect(error: unknown) {
    if (!(error instanceof FirebaseError)) {
      return false;
    }

    return error.code === 'auth/popup-blocked'
      || error.code === 'auth/operation-not-supported-in-this-environment'
      || error.code === 'auth/cancelled-popup-request';
  }

  private shouldUseRedirectFlow() {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const matchMedia = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;
    const isStandalone = (matchMedia?.('(display-mode: standalone)').matches ?? false)
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    return shouldPreferRedirectFlow(userAgent, isStandalone);
  }
}
