import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { DailyRoutineService } from './daily-routine.service';
import { getFirestoreInstance } from '../firebase/firebase.client';
import {
  DEFAULT_REMINDER_PREFERENCES,
  ReminderPreferences,
  ReminderSlot,
  ReminderTargetType,
  ReminderWeekday,
} from '../../shared/types/reminder.types';

const STORAGE_KEY = 'dd_reminder_preferences';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly routineService = inject(DailyRoutineService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly db = this.isBrowser ? getFirestoreInstance() : null;

  readonly preferences = signal<ReminderPreferences>(DEFAULT_REMINDER_PREFERENCES);
  readonly permission = signal<NotificationPermission | 'unsupported'>('default');
  readonly syncError = signal<string | null>(null);

  readonly slots = computed(() => this.preferences().slots);
  readonly enabled = computed(() => this.preferences().enabled);

  private unsubscribe: (() => void) | null = null;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    if (this.isBrowser) {
      this.loadFromLocalStorage();
      this.refreshPermission();
      this.registerServiceWorkerBridge();
    }

    effect(() => {
      this.bindFirestore(this.authService.user()?.uid ?? null);
    }, { allowSignalWrites: true });

    effect(() => {
      const prefs = this.preferences();
      const permission = this.permission();
      this.scheduleForOpenSession(prefs, permission);
    }, { allowSignalWrites: true });
  }

  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isBrowser || !('Notification' in window)) {
      this.permission.set('unsupported');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission.set(permission);
      return permission;
    } catch {
      this.permission.set('denied');
      return 'denied';
    }
  }

  async setEnabled(enabled: boolean): Promise<boolean> {
    const next = { ...this.preferences(), enabled };
    return this.savePreferences(next, enabled ? 'Hatırlatmalar etkinleştirilemedi.' : 'Hatırlatmalar kapatılamadı.');
  }

  async upsertSlot(partial: Omit<ReminderSlot, 'id'> & { id?: string }): Promise<boolean> {
    const id = partial.id ?? `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sanitized: ReminderSlot = {
      id,
      time: this.normalizeTime(partial.time),
      weekdays: this.sanitizeWeekdays(partial.weekdays),
      enabled: partial.enabled,
      targetType: partial.targetType,
      routineId: partial.targetType === 'routine' ? partial.routineId : undefined,
      label: partial.targetType === 'general' ? (partial.label?.trim() || 'Genel zikir') : undefined,
    };

    const existing = this.preferences().slots;
    const nextSlots = existing.some(slot => slot.id === id)
      ? existing.map(slot => (slot.id === id ? sanitized : slot))
      : [...existing, sanitized];

    return this.savePreferences({ ...this.preferences(), slots: nextSlots }, 'Hatırlatma kaydedilemedi.');
  }

  async deleteSlot(slotId: string): Promise<boolean> {
    const nextSlots = this.preferences().slots.filter(slot => slot.id !== slotId);
    return this.savePreferences({ ...this.preferences(), slots: nextSlots }, 'Hatırlatma silinemedi.');
  }

  async toggleSlot(slotId: string): Promise<boolean> {
    const nextSlots = this.preferences().slots.map(slot =>
      slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot
    );
    return this.savePreferences({ ...this.preferences(), slots: nextSlots }, 'Hatırlatma güncellenemedi.');
  }

  private async savePreferences(preferences: ReminderPreferences, errorMessage: string): Promise<boolean> {
    const payload: ReminderPreferences = {
      ...preferences,
      slots: preferences.slots.slice().sort((a, b) => a.time.localeCompare(b.time)),
      updatedAt: new Date().toISOString(),
    };

    this.preferences.set(payload);
    this.persistToLocalStorage(payload);

    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) {
      this.syncError.set(null);
      return true;
    }

    try {
      await setDoc(doc(this.db, 'users', uid, 'preferences', 'reminders'), payload, { merge: true });
      this.syncError.set(null);
      return true;
    } catch {
      this.syncError.set(errorMessage);
      return false;
    }
  }

  private bindFirestore(uid: string | null) {
    this.unsubscribe?.();
    this.unsubscribe = null;

    if (!this.db || !uid) {
      this.syncError.set(null);
      return;
    }

    this.unsubscribe = onSnapshot(
      doc(this.db, 'users', uid, 'preferences', 'reminders'),
      snapshot => {
        const data = snapshot.data() as ReminderPreferences | undefined;
        if (!data) return;

        const merged = this.normalizePreferences(data);
        this.preferences.set(merged);
        this.persistToLocalStorage(merged);
        this.syncError.set(null);
      },
      () => {
        this.syncError.set('Hatırlatma ayarları yüklenemedi. İzinleri kontrol edin.');
      }
    );
  }

  private normalizePreferences(input: Partial<ReminderPreferences>): ReminderPreferences {
    return {
      enabled: Boolean(input.enabled),
      updatedAt: input.updatedAt,
      slots: Array.isArray(input.slots)
        ? input.slots.map(slot => ({
          id: slot.id || `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          enabled: slot.enabled !== false,
          time: this.normalizeTime(slot.time || '09:00'),
          weekdays: this.sanitizeWeekdays(slot.weekdays),
          targetType: (slot.targetType === 'routine' ? 'routine' : 'general') as ReminderTargetType,
          routineId: slot.targetType === 'routine' ? slot.routineId : undefined,
          label: slot.targetType === 'general' ? (slot.label || 'Genel zikir') : undefined,
        }))
        : [],
    };
  }

  private loadFromLocalStorage() {
    if (!this.isBrowser) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReminderPreferences;
      this.preferences.set(this.normalizePreferences(parsed));
    } catch {
      // ignore corrupted local fallback
    }
  }

  private persistToLocalStorage(prefs: ReminderPreferences) {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore quota errors for graceful fallback
    }
  }

  private refreshPermission() {
    if (!this.isBrowser || !('Notification' in window)) {
      this.permission.set('unsupported');
      return;
    }

    this.permission.set(Notification.permission);
  }

  private scheduleForOpenSession(prefs: ReminderPreferences, permission: NotificationPermission | 'unsupported') {
    for (const timeoutId of this.timers.values()) {
      clearTimeout(timeoutId);
    }
    this.timers.clear();

    if (!this.isBrowser || !prefs.enabled || permission !== 'granted') {
      return;
    }

    for (const slot of prefs.slots) {
      if (!slot.enabled || slot.weekdays.length === 0) continue;
      this.scheduleSlot(slot);
    }
  }

  private scheduleSlot(slot: ReminderSlot) {
    const nextRun = this.getNextRunAt(slot);
    if (!nextRun) return;

    const delay = Math.max(nextRun.getTime() - Date.now(), 5_000);
    const timeoutId = setTimeout(() => {
      void this.fireReminder(slot);
      this.scheduleSlot(slot);
    }, delay);

    this.timers.set(slot.id, timeoutId);
  }

  private getNextRunAt(slot: ReminderSlot): Date | null {
    const [hours, minutes] = slot.time.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

    const now = new Date();

    for (let offset = 0; offset <= 7; offset += 1) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(hours, minutes, 0, 0);

      const weekday = candidate.getDay() as ReminderWeekday;
      if (!slot.weekdays.includes(weekday)) continue;
      if (candidate.getTime() <= now.getTime()) continue;

      return candidate;
    }

    return null;
  }

  private async fireReminder(slot: ReminderSlot) {
    if (!this.isBrowser) return;

    const title = slot.targetType === 'routine'
      ? (this.routineService.activeRoutines().find(r => r.id === slot.routineId)?.title ?? 'Rutin Hatırlatma')
      : (slot.label?.trim() || 'Zikir Hatırlatması');

    const body = slot.targetType === 'routine'
      ? 'Günlük rutinin için kısa bir vakit ayır.'
      : 'Allah’ı anmak için birkaç dakika ayırabilirsin.';

    const payload = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-128x128.png',
      tag: `dd-${slot.id}`,
      data: { type: 'reminder', slotId: slot.id },
    };

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, payload);
        return;
      }
    } catch {
      // fallback below
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, payload);
    }
  }

  private registerServiceWorkerBridge() {
    if (!this.isBrowser || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', event => {
      const data = event.data as { type?: string } | undefined;
      if (data?.type === 'dd-reminder-sync') {
        this.refreshPermission();
      }
    });
  }

  private sanitizeWeekdays(value: ReminderWeekday[] | number[] | undefined): ReminderWeekday[] {
    if (!Array.isArray(value)) {
      return [1, 2, 3, 4, 5, 6, 0];
    }

    const unique = Array.from(new Set(value.filter((n): n is ReminderWeekday => n >= 0 && n <= 6)));
    return unique.length > 0 ? unique as ReminderWeekday[] : [1, 2, 3, 4, 5, 6, 0];
  }

  private normalizeTime(raw: string) {
    if (!/^\d{1,2}:\d{2}$/.test(raw)) {
      return '09:00';
    }

    const [h, m] = raw.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return '09:00';

    const hh = String(Math.min(Math.max(h, 0), 23)).padStart(2, '0');
    const mm = String(Math.min(Math.max(m, 0), 59)).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
