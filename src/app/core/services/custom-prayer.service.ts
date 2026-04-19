import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Prayer, PRAYERS } from '../../data/data';
import { AuthService } from './auth.service';
import { getFirestoreInstance } from '../firebase/firebase.client';

export interface CustomPrayer extends Prayer {
  order: number;
  createdAt: string;
}

export interface CustomPrayerDraft {
  arabic: string;
  transliteration: string;
  virtue: string;
  targetCount: number;
  title?: string;
  category?: string;
  time?: string;
}

export function isCustomPrayer(prayer: Prayer | CustomPrayer): prayer is CustomPrayer {
  return 'order' in prayer && 'createdAt' in prayer;
}

function extractCustomPrayers(mergedPrayers: Array<Prayer | CustomPrayer>) {
  return mergedPrayers.reduce<CustomPrayer[]>((result, prayer, index) => {
    if (isCustomPrayer(prayer)) {
      result.push({ ...prayer, order: index + 1 });
    }

    return result;
  }, []);
}

export function mergePrayers(basePrayers: Prayer[], customPrayers: CustomPrayer[]): Array<Prayer | CustomPrayer> {
  const merged: Array<Prayer | CustomPrayer> = [...basePrayers];

  [...customPrayers]
    .sort((a, b) => a.order - b.order)
    .forEach(prayer => {
      const insertionIndex = Math.min(Math.max(prayer.order - 1, 0), merged.length);
      merged.splice(insertionIndex, 0, prayer);
    });

  return merged;
}

export function insertCustomPrayer(
  basePrayers: Prayer[],
  existingCustomPrayers: CustomPrayer[],
  draft: CustomPrayerDraft,
  position: number,
) {
  const normalizedDraft: CustomPrayer = {
    id: Date.now(),
    arabic: draft.arabic.trim(),
    transliteration: draft.transliteration.trim(),
    virtue: draft.virtue.trim() || 'Kullanıcı tarafından eklenen zikir.',
    targetCount: draft.targetCount,
    title: draft.title?.trim() || undefined,
    category: draft.category?.trim() || undefined,
    time: draft.time?.trim() || undefined,
    order: position,
    createdAt: new Date().toISOString(),
  };

  const merged = mergePrayers(basePrayers, existingCustomPrayers);
  const insertionIndex = Math.min(Math.max(position - 1, 0), merged.length);
  merged.splice(insertionIndex, 0, normalizedDraft);

  return extractCustomPrayers(merged);
}

export function updateCustomPrayer(
  basePrayers: Prayer[],
  existingCustomPrayers: CustomPrayer[],
  prayerId: number,
  draft: CustomPrayerDraft,
  position: number,
) {
  const currentPrayer = existingCustomPrayers.find(prayer => prayer.id === prayerId);
  if (!currentPrayer) {
    return existingCustomPrayers;
  }

  const remainingCustomPrayers = existingCustomPrayers.filter(prayer => prayer.id !== prayerId);
  const merged = mergePrayers(basePrayers, remainingCustomPrayers);
  const insertionIndex = Math.min(Math.max(position - 1, 0), merged.length);

  merged.splice(insertionIndex, 0, {
    ...currentPrayer,
    arabic: draft.arabic.trim(),
    transliteration: draft.transliteration.trim(),
    virtue: draft.virtue.trim() || 'Kullanıcı tarafından eklenen zikir.',
    targetCount: draft.targetCount,
    title: draft.title?.trim() || undefined,
    category: draft.category?.trim() || undefined,
    time: draft.time?.trim() || undefined,
    order: position,
  });

  return extractCustomPrayers(merged);
}

export function deleteCustomPrayer(basePrayers: Prayer[], existingCustomPrayers: CustomPrayer[], prayerId: number) {
  const remainingCustomPrayers = existingCustomPrayers.filter(prayer => prayer.id !== prayerId);
  return extractCustomPrayers(mergePrayers(basePrayers, remainingCustomPrayers));
}

export function moveCustomPrayer(basePrayers: Prayer[], existingCustomPrayers: CustomPrayer[], prayerId: number, position: number) {
  const currentPrayer = existingCustomPrayers.find(prayer => prayer.id === prayerId);
  if (!currentPrayer) {
    return existingCustomPrayers;
  }

  const remainingCustomPrayers = existingCustomPrayers.filter(prayer => prayer.id !== prayerId);
  const merged = mergePrayers(basePrayers, remainingCustomPrayers);
  const insertionIndex = Math.min(Math.max(position - 1, 0), merged.length);
  merged.splice(insertionIndex, 0, currentPrayer);

  return extractCustomPrayers(merged);
}

@Injectable({ providedIn: 'root' })
export class CustomPrayerService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  readonly customPrayers = signal<CustomPrayer[]>([]);
  readonly prayerOverrides = signal<Record<number, Partial<CustomPrayerDraft>>>({});
  readonly syncError = signal<string | null>(null);
  readonly prayers = computed(() => {
    const overrides = this.prayerOverrides();
    const baseWithOverrides = PRAYERS.map(p => ({ ...p, ...overrides[p.id] } as Prayer));
    return mergePrayers(baseWithOverrides, this.customPrayers());
  });

  private readonly db = isPlatformBrowser(this.platformId) ? getFirestoreInstance() : null;
  private unsubscribeCustomPrayers: (() => void) | null = null;

  constructor() {
    effect(() => {
      this.bindCustomPrayers(this.authService.user()?.uid ?? null);
    }, { allowSignalWrites: true });
  }

  async addPrayer(draft: CustomPrayerDraft, position: number) {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) {
      this.syncError.set('Kendi zikrinizi kaydetmek icin once Google ile giris yapin.');
      return false;
    }

    const nextCustomPrayers = insertCustomPrayer(PRAYERS, this.customPrayers(), draft, position);

    try {
      await setDoc(doc(this.db, 'users', uid, 'preferences', 'customPrayers'), {
        items: nextCustomPrayers,
        updatedAt: new Date().toISOString(),
      });
      this.syncError.set(null);
      return true;
    } catch {
      this.syncError.set('Yeni zikr kaydedilemedi. Firestore izinlerini kontrol edin.');
      return false;
    }
  }

  async updatePrayer(prayerId: number, draft: CustomPrayerDraft, position: number) {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) {
      this.syncError.set('Zikri düzenlemek için önce Google ile giriş yapın.');
      return false;
    }

    // Default prayer: update overrides
    if (prayerId <= 100) {
      const newOverrides = { ...this.prayerOverrides(), [prayerId]: draft };
      try {
        await setDoc(doc(this.db, 'users', uid, 'preferences', 'prayerOverrides'), {
          items: newOverrides,
          updatedAt: new Date().toISOString(),
        });
        this.syncError.set(null);
        return true;
      } catch {
        this.syncError.set('Zikir güncellenemedi. Firestore izinlerini kontrol edin.');
        return false;
      }
    }

    // Custom prayer: update list
    const nextCustomPrayers = updateCustomPrayer(PRAYERS, this.customPrayers(), prayerId, draft, position);
    return this.saveCustomPrayerList(uid, nextCustomPrayers, 'Zikir güncellenemedi. Firestore izinlerini kontrol edin.');
  }

  async deletePrayer(prayerId: number) {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) {
      this.syncError.set('Kendi zikrinizi silmek icin once Google ile giris yapin.');
      return false;
    }

    const nextCustomPrayers = deleteCustomPrayer(PRAYERS, this.customPrayers(), prayerId);
    return this.saveCustomPrayerList(uid, nextCustomPrayers, 'Zikir silinemedi. Firestore izinlerini kontrol edin.');
  }

  async movePrayer(prayerId: number, position: number) {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) {
      this.syncError.set('Zikri tasimak icin once Google ile giris yapin.');
      return false;
    }

    const nextCustomPrayers = moveCustomPrayer(PRAYERS, this.customPrayers(), prayerId, position);
    return this.saveCustomPrayerList(uid, nextCustomPrayers, 'Zikir sirasi guncellenemedi. Firestore izinlerini kontrol edin.');
  }

  private async saveCustomPrayerList(uid: string, prayers: CustomPrayer[], errorMessage: string) {
    try {
      await setDoc(doc(this.db!, 'users', uid, 'preferences', 'customPrayers'), {
        items: prayers,
        updatedAt: new Date().toISOString(),
      });
      this.syncError.set(null);
      return true;
    } catch {
      this.syncError.set(errorMessage);
      return false;
    }
  }

  private bindCustomPrayers(uid: string | null) {
    this.unsubscribeCustomPrayers?.();
    this.unsubscribeCustomPrayers = null;

    if (!this.db || !uid) {
      this.customPrayers.set([]);
      this.syncError.set(null);
      return;
    }

    this.unsubscribeCustomPrayers = onSnapshot(
      doc(this.db, 'users', uid, 'preferences', 'customPrayers'),
      snapshot => {
        const items = snapshot.data()?.['items'];
        this.customPrayers.set(Array.isArray(items) ? items : []);
      },
      () => {
        this.syncError.set('Kullanici zikrleri yuklenemedi. Firestore izinlerini kontrol edin.');
      },
    );

    onSnapshot(
      doc(this.db, 'users', uid, 'preferences', 'prayerOverrides'),
      snapshot => {
        const items = snapshot.data()?.['items'];
        this.prayerOverrides.set(items || {});
      }
    );
  }
}
