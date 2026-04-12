import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Unsubscribe } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { getFirestoreInstance } from './firebase.client';

export interface DailyHistoryEntry {
  dateKey: string;
  completedPrayers: number;
  totalPrayers: number;
  finished: boolean;
  progress: Record<number, number>;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DailyHistoryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  readonly entries = signal<Record<string, DailyHistoryEntry>>({});
  readonly sortedEntries = computed(() => Object.values(this.entries()).sort((a, b) => b.dateKey.localeCompare(a.dateKey)));
  readonly syncError = signal<string | null>(null);

  private readonly db = isPlatformBrowser(this.platformId) ? getFirestoreInstance() : null;
  private unsubscribeEntries: Unsubscribe | null = null;

  constructor() {
    effect(() => {
      this.bindEntries(this.authService.user()?.uid ?? null);
    }, { allowSignalWrites: true });
  }

  async saveTodaySnapshot(progress: Record<number, number>, completedPrayers: number, totalPrayers: number) {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) {
      return;
    }

    if (!Object.values(progress).some(value => value > 0)) {
      return;
    }

    const dateKey = this.getTodayKey();
    const entry: DailyHistoryEntry = {
      dateKey,
      completedPrayers,
      totalPrayers,
      finished: totalPrayers > 0 && completedPrayers >= totalPrayers,
      progress,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(this.db, 'users', uid, 'dailyProgress', dateKey), entry, { merge: true });
      this.syncError.set(null);
    } catch {
      this.syncError.set('Takvim senkronizasyonu basarisiz oldu. Firestore izinlerini kontrol edin.');
    }
  }

  private bindEntries(uid: string | null) {
    this.unsubscribeEntries?.();
    this.unsubscribeEntries = null;

    if (!this.db || !uid) {
      this.entries.set({});
      this.syncError.set(null);
      return;
    }

    const entriesQuery = query(collection(this.db, 'users', uid, 'dailyProgress'), orderBy('dateKey', 'desc'));

    this.unsubscribeEntries = onSnapshot(entriesQuery, snapshot => {
      const next: Record<string, DailyHistoryEntry> = {};

      snapshot.forEach(item => {
        const entry = item.data() as DailyHistoryEntry;
        next[entry.dateKey] = entry;
      });

      this.entries.set(next);
    });
  }

  private getTodayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
