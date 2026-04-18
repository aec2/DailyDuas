import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { getFirestoreInstance } from '../firebase/firebase.client';
import { Folder, FolderDraft } from '../../shared/types/folder.types';
import { DEFAULT_FOLDER } from '../../data/data';

const STORAGE_KEY = 'dd_folders';

@Injectable({ providedIn: 'root' })
export class FolderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly db = isPlatformBrowser(this.platformId) ? getFirestoreInstance() : null;

  /** User-created folders only (DEFAULT_FOLDER is always prepended in `folders`). */
  private readonly userFolders = signal<Folder[]>([]);
  readonly syncError = signal<string | null>(null);

  /** Full ordered list: default folder always first, then user folders sorted by order. */
  readonly folders = computed(() => [
    DEFAULT_FOLDER,
    ...this.userFolders().slice().sort((a, b) => a.order - b.order),
  ]);

  private unsubscribe: (() => void) | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromLocalStorage();
    }

    effect(() => {
      this.bindFirestore(this.authService.user()?.uid ?? null);
    }, { allowSignalWrites: true });
  }

  async addFolder(draft: FolderDraft): Promise<boolean> {
    const next: Folder = {
      id: `folder_${Date.now()}`,
      name: draft.name.trim(),
      emoji: draft.emoji || '📁',
      order: this.userFolders().length,
      enabled: true,
      prayerIds: draft.prayerIds,
      createdAt: new Date().toISOString(),
    };
    return this.save([...this.userFolders(), next]);
  }

  async updateFolder(id: string, draft: FolderDraft): Promise<boolean> {
    const updated = this.userFolders().map(f =>
      f.id === id ? { ...f, name: draft.name.trim(), emoji: draft.emoji, prayerIds: draft.prayerIds } : f
    );
    return this.save(updated);
  }

  async deleteFolder(id: string): Promise<boolean> {
    return this.save(this.userFolders().filter(f => f.id !== id));
  }

  async toggleFolder(id: string): Promise<boolean> {
    const updated = this.userFolders().map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    return this.save(updated);
  }

  async reorderFolders(orderedIds: string[]): Promise<boolean> {
    const reordered = orderedIds
      .map((id, index) => {
        const folder = this.userFolders().find(f => f.id === id);
        return folder ? { ...folder, order: index } : null;
      })
      .filter((f): f is Folder => f !== null);
    return this.save(reordered);
  }

  private async save(folders: Folder[]): Promise<boolean> {
    this.userFolders.set(folders);
    this.persistToLocalStorage(folders);

    const uid = this.authService.user()?.uid;
    if (!this.db || !uid) return true;

    try {
      await setDoc(
        doc(this.db, 'users', uid, 'preferences', 'folders'),
        { items: folders, updatedAt: new Date().toISOString() }
      );
      this.syncError.set(null);
      return true;
    } catch {
      this.syncError.set('Klasörler kaydedilemedi. Firestore izinlerini kontrol edin.');
      return false;
    }
  }

  private bindFirestore(uid: string | null) {
    this.unsubscribe?.();
    this.unsubscribe = null;

    if (!this.db || !uid) return;

    this.unsubscribe = onSnapshot(
      doc(this.db, 'users', uid, 'preferences', 'folders'),
      snapshot => {
        const items = snapshot.data()?.['items'];
        if (Array.isArray(items) && items.length > 0) {
          this.userFolders.set(items);
          this.persistToLocalStorage(items);
        } else if (this.userFolders().length > 0) {
          this.save(this.userFolders());
        }
      },
      () => this.syncError.set('Klasörler yüklenemedi.')
    );
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.userFolders.set(JSON.parse(raw));
    } catch {}
  }

  private persistToLocalStorage(folders: Folder[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    } catch {}
  }
}
