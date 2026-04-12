import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirebaseAuthInstance } from './firebase.client';
import { hasFirebaseConfig } from './firebase.config';

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
  }

  async signInWithGoogle() {
    if (!this.auth) {
      this.error.set('Firebase ayarlari eksik. src/app/firebase.config.ts dosyasini doldurun.');
      return;
    }

    this.error.set(null);

    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(this.auth, provider);
    } catch {
      try {
        await signInWithRedirect(this.auth, provider);
      } catch {
        this.error.set('Google ile giris baslatilamadi. Firebase Console ayarlarinizi kontrol edin.');
      }
    }
  }

  async signOut() {
    if (!this.auth) {
      return;
    }

    await signOut(this.auth);
  }
}
