import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Unsubscribe } from 'firebase/auth';
import {
  collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, writeBatch,
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { getFirestoreInstance } from '../firebase/firebase.client';
import {
  DailyRoutine, DailyRoutineDraft, DailyRoutineProgress, DailyRoutineProgressItem,
} from '../../shared/types/daily-routine.types';
export type { DailyRoutine, DailyRoutineProgress, DailyRoutineProgressItem, DailyRoutineDraft };

const DEFAULT_ROUTINES: Omit<DailyRoutine, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Kur\'an Okuma',
    description: '5 dakika Kur\'an oku',
    category: 'quran', targetType: 'duration', targetValue: 5, targetUnit: 'minute',
    sortOrder: 1, isActive: true, isDefault: true,
  },
  {
    title: 'Tefsir / Meal Okuma',
    description: 'Ayetlerin anlamını ve mesajını oku',
    category: 'tafsir', targetType: 'duration', targetValue: 5, targetUnit: 'minute',
    sortOrder: 2, isActive: true, isDefault: true,
  },
  {
    title: 'İlmihal Okuma',
    description: 'Günlük ibadet ve helal-haram sınırlarını öğren',
    category: 'ilmihal', targetType: 'duration', targetValue: 5, targetUnit: 'minute',
    sortOrder: 3, isActive: true, isDefault: true,
  },
  {
    title: 'Siyer Okuma',
    description: 'Peygamber Efendimiz\'in (ﷺ) hayatı ve ahlakı',
    category: 'siyer', targetType: 'duration', targetValue: 5, targetUnit: 'minute',
    sortOrder: 4, isActive: true, isDefault: true,
  },
  {
    title: 'Tasavvuf ve Ahlak',
    description: 'Kalbi arındırma ve karakter gelişimi okumaları',
    category: 'ahlak', targetType: 'duration', targetValue: 5, targetUnit: 'minute',
    sortOrder: 5, isActive: true, isDefault: true,
  },
  {
    title: 'Hadis Okuma',
    description: 'Peygamber Efendimiz\'in (ﷺ) sözlerini oku',
    category: 'hadith', targetType: 'duration', targetValue: 5, targetUnit: 'minute',
    sortOrder: 6, isActive: true, isDefault: true,
  },
];

@Injectable({ providedIn: 'root' })
export class DailyRoutineService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly db = isPlatformBrowser(this.platformId) ? getFirestoreInstance() : null;

  readonly routines = signal<DailyRoutine[]>([]);
  readonly activeRoutines = computed(() =>
    this.routines().filter(r => r.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  );
  readonly progressEntries = signal<Record<string, DailyRoutineProgress>>({});
  readonly syncError = signal<string | null>(null);
  readonly loading = signal(true);

  private unsubscribeRoutines: Unsubscribe | null = null;
  private unsubscribeProgress: Unsubscribe | null = null;
  private seededForUid: string | null = null;

  readonly todayKey = computed(() => this.getTodayKey());
  readonly todayProgress = computed<DailyRoutineProgress | null>(
    () => this.progressEntries()[this.todayKey()] ?? null
  );

  constructor() {
    effect(() => {
      const uid = this.authService.user()?.uid ?? null;
      this.bindRoutines(uid);
      this.bindProgress(uid);
    }, { allowSignalWrites: true });
  }

  // ── Queries ──────────────────────────────────────────────
  getProgressForDate(dateKey: string): DailyRoutineProgress | null {
    return this.progressEntries()[dateKey] ?? null;
  }

  getProgressForDateRange(startKey: string, endKey: string): DailyRoutineProgress[] {
    return Object.values(this.progressEntries())
      .filter(p => p.dateKey >= startKey && p.dateKey <= endKey)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }

  // ── Routine CRUD ─────────────────────────────────────────
  async createRoutine(draft: DailyRoutineDraft): Promise<void> {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) return;

    const id = `routine_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const routine: DailyRoutine = {
      id,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      targetType: draft.targetType,
      targetValue: draft.targetValue,
      targetUnit: draft.targetUnit,
      icon: draft.icon,
      color: draft.color,
      sortOrder: draft.sortOrder,
      isActive: draft.isActive,
      isDefault: draft.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(this.db, 'users', uid, 'dailyRoutines', id), routine);
      this.syncError.set(null);
    } catch {
      this.syncError.set('Rutin kaydedilemedi.');
    }
  }

  async updateRoutine(routineId: string, partial: Partial<DailyRoutine>): Promise<void> {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) return;

    try {
      await setDoc(
        doc(this.db, 'users', uid, 'dailyRoutines', routineId),
        { ...partial, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      this.syncError.set(null);
    } catch {
      this.syncError.set('Rutin güncellenemedi.');
    }
  }

  async deleteRoutine(routineId: string, softDelete = true): Promise<void> {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) return;

    try {
      if (softDelete) {
        await this.updateRoutine(routineId, { isActive: false });
      } else {
        await deleteDoc(doc(this.db, 'users', uid, 'dailyRoutines', routineId));
      }
    } catch {
      this.syncError.set('Rutin silinemedi.');
    }
  }

  async ensureDefaultRoutinesCreated(): Promise<void> {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) return;
    if (this.seededForUid === uid) return;

    // Read once to avoid race with onSnapshot
    try {
      const snap = await getDocs(collection(this.db, 'users', uid, 'dailyRoutines'));
      if (!snap.empty) {
        this.seededForUid = uid;
        return;
      }

      const batch = writeBatch(this.db);
      const now = new Date().toISOString();
      for (const def of DEFAULT_ROUTINES) {
        const id = `default_${def.category ?? def.sortOrder}`;
        const routine: DailyRoutine = { id, ...def, createdAt: now, updatedAt: now };
        batch.set(doc(this.db, 'users', uid, 'dailyRoutines', id), routine);
      }
      await batch.commit();
      this.seededForUid = uid;
      this.syncError.set(null);
    } catch {
      this.syncError.set('Varsayılan rutinler oluşturulamadı.');
    }
  }

  // ── Progress writes ──────────────────────────────────────
  async toggleRoutineForDate(
    dateKey: string,
    routine: DailyRoutine,
    completed: boolean,
  ): Promise<void> {
    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) return;

    const existing = this.progressEntries()[dateKey];
    const items: Record<string, DailyRoutineProgressItem> = { ...(existing?.items ?? {}) };

    items[routine.id] = {
      routineId: routine.id,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
      note: items[routine.id]?.note,
    };

    const activeIds = new Set(this.activeRoutines().map(r => r.id));
    const totalActiveCount = activeIds.size;
    const completedCount = Object.values(items).filter(
      it => it.completed && activeIds.has(it.routineId)
    ).length;

    const progress: DailyRoutineProgress = {
      dateKey,
      timezone: this.getTimezone(),
      completedCount,
      totalActiveCount,
      isFullyCompleted: totalActiveCount > 0 && completedCount >= totalActiveCount,
      items,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(
        doc(this.db, 'users', uid, 'dailyRoutineProgress', dateKey),
        progress,
        { merge: true }
      );
      this.syncError.set(null);
    } catch {
      this.syncError.set('İlerleme kaydedilemedi.');
    }
  }

  // ── Firestore bindings ───────────────────────────────────
  private bindRoutines(uid: string | null) {
    this.unsubscribeRoutines?.();
    this.unsubscribeRoutines = null;

    if (!this.db || !uid) {
      this.routines.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const q = query(collection(this.db, 'users', uid, 'dailyRoutines'), orderBy('sortOrder', 'asc'));

    this.unsubscribeRoutines = onSnapshot(q, snap => {
      const list: DailyRoutine[] = [];
      snap.forEach(d => list.push(d.data() as DailyRoutine));
      this.routines.set(list);
      this.loading.set(false);

      if (list.length === 0) {
        void this.ensureDefaultRoutinesCreated();
      }
    }, () => {
      this.loading.set(false);
      this.syncError.set('Rutinler yüklenemedi. İzinleri kontrol edin.');
    });
  }

  private bindProgress(uid: string | null) {
    this.unsubscribeProgress?.();
    this.unsubscribeProgress = null;

    if (!this.db || !uid) {
      this.progressEntries.set({});
      return;
    }

    const q = query(collection(this.db, 'users', uid, 'dailyRoutineProgress'), orderBy('dateKey', 'desc'));

    this.unsubscribeProgress = onSnapshot(q, snap => {
      const next: Record<string, DailyRoutineProgress> = {};
      snap.forEach(d => {
        const entry = d.data() as DailyRoutineProgress;
        next[entry.dateKey] = entry;
      });
      this.progressEntries.set(next);
    }, () => {
      this.syncError.set('Rutin geçmişi yüklenemedi.');
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  private getTodayKey(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'Europe/Istanbul';
    }
  }
}
