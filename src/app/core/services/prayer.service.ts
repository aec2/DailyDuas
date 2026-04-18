import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Prayer, PRAYERS } from '../../data/data';

@Injectable({
  providedIn: 'root'
})
export class PrayerService {
  private readonly STORAGE_KEY = 'prayer_progress';
  private readonly DATE_KEY = 'prayer_date';
  private readonly INDEX_KEY = 'prayer_index';
  private readonly platformId = inject(PLATFORM_ID);

  prayers = signal<Prayer[]>(PRAYERS);
  
  // Store progress as a map of prayer ID to current count
  progress = signal<Record<number, number>>({});
  
  currentIndex = signal<number>(0);

  totalPrayers = computed(() => this.prayers().length);
  
  completedPrayers = computed(() => {
    const currentProgress = this.progress();
    return this.prayers().filter(p => (currentProgress[p.id] || 0) >= p.targetCount).length;
  });

  isAllCompleted = computed(() => this.completedPrayers() === this.totalPrayers());

  constructor() {
    this.loadProgress();
    
    // Auto-save effect
    effect(() => {
      const currentProgress = this.progress();
      const index = this.currentIndex();
      
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentProgress));
        localStorage.setItem(this.INDEX_KEY, index.toString());
        localStorage.setItem(this.DATE_KEY, new Date().toDateString());
      }
    });
  }

  private loadProgress() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedDate = localStorage.getItem(this.DATE_KEY);
    const today = new Date().toDateString();

    if (savedDate === today) {
      const savedProgress = localStorage.getItem(this.STORAGE_KEY);
      const savedIndex = localStorage.getItem(this.INDEX_KEY);
      
      if (savedProgress) {
        try {
          this.progress.set(JSON.parse(savedProgress));
        } catch (e) {
          this.progress.set({});
        }
      }
      
      if (savedIndex) {
        const idx = parseInt(savedIndex, 10);
        if (!isNaN(idx) && idx >= 0 && idx < this.totalPrayers()) {
          this.currentIndex.set(idx);
        }
      }
    } else {
      // New day, reset progress
      this.progress.set({});
      this.currentIndex.set(0);
    }
  }

  incrementProgress(prayerId: number) {
    this.progress.update(prev => {
      const current = prev[prayerId] || 0;
      const target = this.prayers().find(p => p.id === prayerId)?.targetCount || 1;
      
      if (current < target) {
        return { ...prev, [prayerId]: current + 1 };
      }
      return prev;
    });
  }

  resetProgress() {
    this.progress.set({});
    this.currentIndex.set(0);
  }

  resetPrayerProgress(prayerId: number) {
    this.progress.update(prev => {
      const next = { ...prev };
      delete next[prayerId];
      return next;
    });
  }

  nextPrayer() {
    if (this.currentIndex() < this.totalPrayers() - 1) {
      this.currentIndex.update(i => i + 1);
    }
  }

  prevPrayer() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
    }
  }

  nextIncompletePrayer() {
    const currentProgress = this.progress();
    const prayers = this.prayers();
    const start = this.currentIndex() + 1;
    
    // Search from current to end
    for (let i = start; i < prayers.length; i++) {
      if ((currentProgress[prayers[i].id] || 0) < prayers[i].targetCount) {
        this.currentIndex.set(i);
        return;
      }
    }
    
    // Search from beginning to current
    for (let i = 0; i < start; i++) {
      if ((currentProgress[prayers[i].id] || 0) < prayers[i].targetCount) {
        this.currentIndex.set(i);
        return;
      }
    }
  }
}


