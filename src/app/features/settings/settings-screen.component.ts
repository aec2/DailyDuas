import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { FolderService } from '../../core/services/folder.service';
import { DailyHistoryService } from '../../core/services/daily-history.service';
import { PrayerService } from '../../core/services/prayer.service';
import { CustomPrayerService } from '../../core/services/custom-prayer.service';
import { ReminderService } from '../../core/services/reminder.service';
import { DailyRoutineService } from '../../core/services/daily-routine.service';
import { Folder } from '../../shared/types/folder.types';
import { ReminderSlot, ReminderTargetType, ReminderWeekday } from '../../shared/types/reminder.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-screen',
  standalone: true,
  template: `
    <div class="px-5 pb-32" style="padding-top: 36px;">

      <!-- Header -->
      <div class="mt-3 mb-6">
        <div class="font-mono text-[11px] dd-text-faint tracking-[1.4px] uppercase mb-0.5">Tercihler</div>
        <div class="font-serif text-[32px] dd-text-ink" style="letter-spacing:-0.5px;">Ayarlar</div>

        <!-- Profile card -->
        @if (user()) {
          <div class="flex items-center gap-3 mt-4 dd-bg-card rounded-[18px] px-4 py-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-serif text-[18px] font-medium"
                 style="background:var(--dd-accent);color:#fff;">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-serif text-[16px] dd-text-ink font-medium truncate">{{ user()!.displayName || 'Kullanıcı' }}</div>
              <div class="font-mono text-[11px] dd-text-faint truncate">{{ user()!.email }}</div>
            </div>
            <button (click)="onSignOut()" class="border-none bg-transparent cursor-pointer p-2 press-scale" aria-label="Çıkış yap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dd-accent2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        } @else {
          <button (click)="openAuth.emit()"
                  class="flex items-center gap-2.5 mt-4 dd-bg-card rounded-[18px] px-4 py-3 w-full border-none cursor-pointer text-left press-scale">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style="background:var(--dd-line)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
            <div>
              <div class="font-serif text-[15px] dd-text-ink">Giriş yap</div>
              <div class="font-mono text-[10px] dd-text-faint">İlerlemenizi senkronize edin</div>
            </div>
            <svg class="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        }
      </div>

      <!-- Appearance group -->
      <div class="mb-4">
        <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2 pl-1">Görünüm</div>
        <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">

          <!-- Dark mode -->
          <div class="px-4 py-3.5 flex justify-between items-center border-b" style="border-color:var(--dd-line)">
            <span class="font-sans text-[15px] dd-text-ink">Gece modu</span>
            <button (click)="themeService.toggleTheme()" class="border-none cursor-pointer p-0 relative"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="themeService.isDark() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="themeService.isDark() ? '20px' : '2px'"></div>
            </button>
          </div>

          <!-- Okunush / Transliteration -->
          <div class="px-4 py-3.5 flex justify-between items-center border-b" style="border-color:var(--dd-line)">
            <span class="font-sans text-[15px] dd-text-ink">Arapça Okunuşu Göster</span>
            <button (click)="themeService.toggleTransliteration()" class="border-none cursor-pointer p-0 relative"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="themeService.showTransliteration() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="themeService.showTransliteration() ? '20px' : '2px'"></div>
            </button>
          </div>

          <!-- Palette picker -->
          <div class="px-4 py-3.5" style="border-bottom: 0.5px solid var(--dd-line)">
            <div class="font-sans text-[15px] dd-text-ink mb-3">Renk paleti</div>
            <div class="flex gap-2">
              @for (key of themeService.paletteKeys; track key) {
                <button (click)="themeService.setPalette(key)" class="flex-1 h-10 rounded-[10px] cursor-pointer p-1 flex gap-0.5 items-center justify-center press-scale"
                        [style.background]="palettes()[key].bg"
                        [style.border]="themeService.palette() === key ? '2px solid var(--dd-ink)' : '1px solid var(--dd-line)'">
                  <div class="w-2.5 h-5 rounded-[2px]" [style.background]="palettes()[key].ink"></div>
                  <div class="w-2.5 h-5 rounded-[2px]" [style.background]="palettes()[key].accent"></div>
                  <div class="w-2.5 h-5 rounded-[2px]" [style.background]="palettes()[key].accent2"></div>
                </button>
              }
            </div>
          </div>

          <!-- Counter style -->
          <div class="px-4 py-3.5" style="border-bottom: 0.5px solid var(--dd-line)">
            <div class="font-sans text-[15px] dd-text-ink mb-3">Sayaç stili</div>
            <div class="flex gap-1">
              @for (v of counterVariants; track v.key) {
                <button (click)="setCounterVariant(v.key)" class="flex-1 py-1.5 px-1 rounded-lg cursor-pointer font-sans text-[11px] font-medium press-scale"
                        [style.background]="counterVariant() === v.key ? 'var(--dd-ink)' : 'transparent'"
                        [style.color]="counterVariant() === v.key ? 'var(--dd-bg)' : 'var(--dd-ink-muted)'"
                        [style.border]="counterVariant() === v.key ? 'none' : '1px solid var(--dd-line)'">
                  {{ v.label }}
                </button>
              }
            </div>
          </div>

          <!-- Progress viz -->
          <div class="px-4 py-3.5" style="border-bottom: 0.5px solid var(--dd-line)">
            <div class="font-sans text-[15px] dd-text-ink mb-3">İlerleme çubuğu</div>
            <div class="flex gap-1">
              @for (v of progressVariants; track v.key) {
                <button (click)="setProgressVariant(v.key)" class="flex-1 py-1.5 px-1 rounded-lg cursor-pointer font-sans text-[11px] font-medium press-scale"
                        [style.background]="progressVariant() === v.key ? 'var(--dd-ink)' : 'transparent'"
                        [style.color]="progressVariant() === v.key ? 'var(--dd-bg)' : 'var(--dd-ink-muted)'"
                        [style.border]="progressVariant() === v.key ? 'none' : '1px solid var(--dd-line)'">
                  {{ v.label }}
                </button>
              }
            </div>
          </div>

          <!-- Arabic font size -->
          <div class="px-4 py-3.5">
            <div class="font-sans text-[15px] dd-text-ink mb-3">Arapça Yazı Boyutu</div>
            <div class="flex gap-1">
              @for (opt of arabicSizeOpts; track opt.value) {
                <button (click)="themeService.setArabicSize(opt.value)"
                        class="flex-1 py-1.5 px-1 rounded-lg cursor-pointer font-sans text-[11px] font-medium press-scale"
                        [style.background]="themeService.arabicSize() === opt.value ? 'var(--dd-ink)' : 'transparent'"
                        [style.color]="themeService.arabicSize() === opt.value ? 'var(--dd-bg)' : 'var(--dd-ink-muted)'"
                        [style.border]="themeService.arabicSize() === opt.value ? 'none' : '1px solid var(--dd-line)'">
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>



      <!-- Counter & Reading group -->
      <div class="mb-4">
        <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2 pl-1">Sayaç & Okuma</div>
        <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">

          <!-- Haptic feedback -->
          <div class="px-4 py-3.5 flex justify-between items-center border-b" style="border-color:var(--dd-line)">
            <div>
              <div class="font-sans text-[15px] dd-text-ink">Titreşim</div>
              <div class="font-mono text-[10px] dd-text-faint mt-0.5">Sayarken dokunsal geri bildirim</div>
            </div>
            <button (click)="themeService.toggleHaptic()" class="border-none cursor-pointer p-0 relative shrink-0"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="themeService.hapticEnabled() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="themeService.hapticEnabled() ? '20px' : '2px'"></div>
            </button>
          </div>

          <!-- Sound -->
          <div class="px-4 py-3.5 flex justify-between items-center border-b" style="border-color:var(--dd-line)">
            <div>
              <div class="font-sans text-[15px] dd-text-ink">Ses</div>
              <div class="font-mono text-[10px] dd-text-faint mt-0.5">Her sayımda hafif ses tonu</div>
            </div>
            <button (click)="themeService.toggleSound()" class="border-none cursor-pointer p-0 relative shrink-0"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="themeService.soundEnabled() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="themeService.soundEnabled() ? '20px' : '2px'"></div>
            </button>
          </div>

          <!-- Auto-advance -->
          <div class="px-4 py-3.5 flex justify-between items-center border-b" style="border-color:var(--dd-line)">
            <div>
              <div class="font-sans text-[15px] dd-text-ink">Otomatik Geç</div>
              <div class="font-mono text-[10px] dd-text-faint mt-0.5">Hedefe ulaşınca sıradaki zikre geç</div>
            </div>
            <button (click)="themeService.toggleAutoAdvance()" class="border-none cursor-pointer p-0 relative shrink-0"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="themeService.autoAdvance() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="themeService.autoAdvance() ? '20px' : '2px'"></div>
            </button>
          </div>

          <!-- Sparks / animation -->
          <div class="px-4 py-3.5 flex justify-between items-center">
            <div>
              <div class="font-sans text-[15px] dd-text-ink">Kıvılcım Efekti</div>
              <div class="font-mono text-[10px] dd-text-faint mt-0.5">Arka plan ve sayaç parıltıları</div>
            </div>
            <button (click)="themeService.toggleSparks()" class="border-none cursor-pointer p-0 relative shrink-0"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="themeService.sparksEnabled() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="themeService.sparksEnabled() ? '20px' : '2px'"></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Reminder group -->
      <div class="mb-4">
        <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2 pl-1">Hatırlatmalar</div>
        <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">
          <div class="px-4 py-3.5 flex justify-between items-center border-b" style="border-color:var(--dd-line)">
            <div>
              <div class="font-sans text-[15px] dd-text-ink">Hatırlatmaları Aç</div>
              <div class="font-mono text-[10px] dd-text-faint mt-0.5">Açık sekmede zamanlanmış bildirimler</div>
            </div>
            <button (click)="toggleRemindersMaster()" class="border-none cursor-pointer p-0 relative shrink-0"
                    style="width:44px;height:26px;border-radius:999px;transition:background 180ms;"
                    [style.background]="reminderService.enabled() ? 'var(--dd-accent)' : 'var(--dd-line)'">
              <div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left 180ms;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                   [style.left]="reminderService.enabled() ? '20px' : '2px'"></div>
            </button>
          </div>

          <div class="px-4 py-3.5 border-b" style="border-color:var(--dd-line)">
            <div class="flex justify-between items-center gap-2">
              <div>
                <div class="font-sans text-[14px] dd-text-ink">Bildirim İzni</div>
                <div class="font-mono text-[10px] dd-text-faint mt-0.5">
                  {{ permissionText() }}
                </div>
              </div>
              @if (isPermissionActionVisible()) {
                <button (click)="requestNotificationPermission()"
                        class="border-none rounded-full px-3 py-1 font-mono text-[10px] cursor-pointer press-scale"
                        style="background:var(--dd-line);color:var(--dd-ink-muted);">
                  İzin Ver
                </button>
              }
            </div>
            @if (reminderService.permission() === 'denied') {
              <div class="font-sans text-[11px] mt-2" style="color:#ef4444;">
                Tarayıcı bildirim izni reddedildi. Ayarlardan bildirimi tekrar açabilirsiniz.
              </div>
            }
            @if (reminderService.permission() === 'unsupported') {
              <div class="font-sans text-[11px] mt-2" style="color:#ef4444;">
                Bu cihaz bildirim API desteği sunmuyor.
              </div>
            }
            @if (reminderService.syncError()) {
              <div class="font-sans text-[11px] mt-2" style="color:#ef4444;">
                {{ reminderService.syncError() }}
              </div>
            }
          </div>

          <div class="px-4 py-3.5 border-b" style="border-color:var(--dd-line)">
            <button (click)="startCreateReminder()"
                    class="border-none rounded-xl px-3 py-2 text-[12px] font-mono cursor-pointer press-scale"
                    style="background:var(--dd-line);color:var(--dd-ink-muted);">
              + Hatırlatma Ekle
            </button>
          </div>

          @for (slot of reminderService.slots(); track slot.id) {
            <div class="px-4 py-3.5 border-b" style="border-color:var(--dd-line)">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="font-serif text-[16px] dd-text-ink">{{ slot.time }}</div>
                  <div class="font-mono text-[10px] dd-text-faint mt-0.5">{{ formatSlotSummary(slot) }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="toggleReminderSlot(slot)"
                          class="border-none rounded-full px-3 py-1 font-mono text-[10px] cursor-pointer press-scale"
                          [style.background]="slot.enabled ? 'var(--dd-accent)' : 'var(--dd-line)'"
                          [style.color]="slot.enabled ? '#fff' : 'var(--dd-ink-muted)'">
                    {{ slot.enabled ? 'Açık' : 'Kapalı' }}
                  </button>
                  <button (click)="startEditReminder(slot)"
                          class="border-none bg-transparent rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale"
                          aria-label="Hatırlatmayı düzenle">
                    ✎
                  </button>
                  <button (click)="deleteReminderSlot(slot)"
                          class="border-none bg-transparent rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale"
                          aria-label="Hatırlatmayı sil">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          }

          @if (showReminderEditor()) {
            <div class="px-4 py-4">
              <div class="font-sans text-[14px] dd-text-ink mb-2">{{ editingReminderId() ? 'Hatırlatmayı Düzenle' : 'Yeni Hatırlatma' }}</div>
              <div class="flex flex-col gap-3">
                <input
                  type="time"
                  [value]="editorTime()"
                  (input)="editorTime.set(($any($event.target).value || '09:00'))"
                  class="dd-bg-card dd-text-ink border-none rounded-xl px-3 py-2"
                />
                <div class="flex gap-1 flex-wrap">
                  @for (day of weekdayOptions; track day.value) {
                    <button (click)="toggleEditorWeekday(day.value)"
                            class="px-2 py-1 border-none rounded-lg cursor-pointer text-[11px]"
                            [style.background]="editorWeekdays().includes(day.value) ? 'var(--dd-accent)' : 'var(--dd-line)'"
                            [style.color]="editorWeekdays().includes(day.value) ? '#fff' : 'var(--dd-ink-muted)'">
                      {{ day.label }}
                    </button>
                  }
                </div>
                <div class="flex gap-1">
                  @for (type of reminderTargets; track type.value) {
                    <button (click)="editorTargetType.set(type.value)"
                            class="px-3 py-1.5 border-none rounded-lg cursor-pointer text-[11px]"
                            [style.background]="editorTargetType() === type.value ? 'var(--dd-ink)' : 'var(--dd-line)'"
                            [style.color]="editorTargetType() === type.value ? 'var(--dd-bg)' : 'var(--dd-ink-muted)'">
                      {{ type.label }}
                    </button>
                  }
                </div>
                @if (editorTargetType() === 'routine') {
                  <select
                    [value]="editorRoutineId()"
                    (change)="editorRoutineId.set(($any($event.target).value || ''))"
                    class="dd-bg-card dd-text-ink border-none rounded-xl px-3 py-2">
                    <option value="">Rutin seçin</option>
                    @for (routine of activeRoutines(); track routine.id) {
                      <option [value]="routine.id">{{ routine.title }}</option>
                    }
                  </select>
                } @else {
                  <input
                    type="text"
                    [value]="editorLabel()"
                    (input)="editorLabel.set(($any($event.target).value || ''))"
                    placeholder="Örn: Akşam zikri"
                    class="dd-bg-card dd-text-ink border-none rounded-xl px-3 py-2"
                  />
                }
                <div class="flex justify-end gap-2">
                  <button (click)="cancelReminderEdit()" class="border-none rounded-xl px-3 py-2 text-[12px] cursor-pointer" style="background:var(--dd-line);color:var(--dd-ink-muted);">
                    İptal
                  </button>
                  <button (click)="saveReminderSlot()" class="border-none rounded-xl px-3 py-2 text-[12px] cursor-pointer" style="background:var(--dd-accent);color:#fff;">
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Folder management -->
      <div class="mb-6">
        <div class="font-serif text-[18px] font-medium dd-text-ink mb-3">Listelerim</div>
        <div class="flex flex-col gap-2">
          @for (folder of folders(); track folder.id) {
            <div class="dd-bg-card rounded-[18px] p-[12px_16px] flex items-center gap-3">
              <span class="text-[20px]">{{ folder.emoji }}</span>
              <div class="flex-1 font-serif text-[16px] dd-text-ink">{{ folder.name }}</div>
              @if (folder.id !== 'gulistan') {
                <button (click)="toggleFolder(folder)"
                        class="border-none rounded-full px-3 py-1 font-mono text-[10px] cursor-pointer press-scale"
                        [style.background]="folder.enabled ? 'var(--dd-accent)' : 'var(--dd-line)'"
                        [style.color]="folder.enabled ? '#fff' : 'var(--dd-ink-muted)'">
                  {{ folder.enabled ? 'Açık' : 'Kapalı' }}
                </button>
                <button (click)="deleteFolder(folder.id)"
                        class="border-none bg-transparent rounded-full w-8 h-8 flex items-center justify-center cursor-pointer press-scale"
                        aria-label="Listeyi sil">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
              } @else {
                <span class="font-mono text-[10px] dd-text-faint tracking-[0.6px]">Varsayılan</span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Reset group -->
      <div class="mb-4">
        <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-2 pl-1">Veri</div>
        <div class="dd-bg-surface rounded-[20px] overflow-hidden" style="box-shadow: 0 1px 0 var(--dd-line)">
          <button (click)="exportProgress()" class="w-full px-4 py-3.5 flex justify-between items-center border-none cursor-pointer press-scale border-b" style="background:transparent;border-color:var(--dd-line)">
            <span class="font-sans text-[15px] dd-text-ink">İlerlemeyi Dışa Aktar</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.6" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
          <button (click)="openReset.emit()" class="w-full px-4 py-3.5 flex justify-between items-center border-none cursor-pointer press-scale border-b" style="background:transparent;border-color:var(--dd-line)">
            <span class="font-sans text-[15px]" style="color:#ef4444">Bugünkü ilerlemeyi sıfırla</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.6" stroke-linecap="round"><path d="M3 12a9 9 0 1015-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
          <button (click)="showResetAllConfirm.set(true)" class="w-full px-4 py-3.5 flex justify-between items-center border-none cursor-pointer press-scale" style="background:transparent">
            <span class="font-sans text-[15px]" style="color:#ef4444">Tüm geçmişi sil</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.6" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>

      <!-- Reset all history confirm dialog -->
      @if (showResetAllConfirm()) {
        <div (click)="showResetAllConfirm.set(false)"
             class="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
             style="background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);">
          <div (click)="$event.stopPropagation()" class="dd-bg-surface rounded-[24px] max-w-sm w-full p-6 animate-fade-in">
            <div class="font-serif text-[20px] dd-text-ink mb-2">Tüm Geçmişi Sil</div>
            <div class="font-sans text-[14px] dd-text-muted mb-6">Takvim geçmişindeki tüm günlük kayıtlar silinecek. Bu işlem geri alınamaz.</div>
            <div class="flex justify-end gap-3">
              <button (click)="showResetAllConfirm.set(false)"
                      class="px-4 py-2 text-[14px] font-medium dd-text-muted border-none rounded-xl cursor-pointer press-scale" style="background:transparent;">
                İptal
              </button>
              <button (click)="confirmResetAll()"
                      class="px-4 py-2 text-[14px] font-medium text-white border-none rounded-xl cursor-pointer press-scale" style="background:#ef4444;">
                Sil
              </button>
            </div>
          </div>
        </div>
      }

      <div class="text-center mt-8 font-serif text-[14px] italic dd-text-faint">DailyDuas · v1.0</div>
    </div>
  `,
})
export class SettingsScreenComponent {
  readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly folderService = inject(FolderService);
  private readonly historyService = inject(DailyHistoryService);
  private readonly prayerService = inject(PrayerService);
  private readonly customPrayerService = inject(CustomPrayerService);
  readonly reminderService = inject(ReminderService);
  private readonly routineService = inject(DailyRoutineService);
  private readonly platformId = inject(PLATFORM_ID);

  showResetAllConfirm = signal(false);

  user = this.authService.user;
  userInitial = computed(() => {
    const u = this.authService.user();
    if (!u) return '';
    const name = u.displayName || u.email || '?';
    return name.charAt(0).toUpperCase();
  });

  folders = this.folderService.folders;

  openAuth = output<void>();
  openReset = output<void>();
  signOut = output<void>();
  toast = output<string>();
  counterVariantChange = output<'hero' | 'beads' | 'focus'>();
  progressVariantChange = output<'bar' | 'segments' | 'dots'>();

  counterVariant = input<'hero' | 'beads' | 'focus'>('hero');
  progressVariant = input<'bar' | 'segments' | 'dots'>('bar');

  counterVariants = [
    { key: 'hero' as const, label: 'Daire' },
    { key: 'beads' as const, label: 'Boncuk' },
    { key: 'focus' as const, label: 'Odak' },
  ];

  progressVariants = [
    { key: 'bar' as const, label: 'Çubuk' },
    { key: 'segments' as const, label: 'Segmentli' },
    { key: 'dots' as const, label: 'Noktalı' },
  ];

  arabicSizeOpts = [
    { value: 22, label: 'Küçük' },
    { value: 32, label: 'Orta' },
    { value: 44, label: 'Büyük' },
  ];
  readonly activeRoutines = this.routineService.activeRoutines;
  readonly weekdayOptions: { value: ReminderWeekday; label: string }[] = [
    { value: 1, label: 'Pzt' },
    { value: 2, label: 'Sal' },
    { value: 3, label: 'Çar' },
    { value: 4, label: 'Per' },
    { value: 5, label: 'Cum' },
    { value: 6, label: 'Cmt' },
    { value: 0, label: 'Paz' },
  ];
  readonly reminderTargets: { value: ReminderTargetType; label: string }[] = [
    { value: 'general', label: 'Genel Zikir' },
    { value: 'routine', label: 'Rutin' },
  ];

  readonly showReminderEditor = signal(false);
  readonly editingReminderId = signal<string | null>(null);
  readonly editorTime = signal('09:00');
  readonly editorWeekdays = signal<ReminderWeekday[]>([1, 2, 3, 4, 5, 6, 0]);
  readonly editorTargetType = signal<ReminderTargetType>('general');
  readonly editorRoutineId = signal('');
  readonly editorLabel = signal('Genel zikir');

  palettes() { return this.themeService.allPalettes; }

  setCounterVariant(v: 'hero' | 'beads' | 'focus') {
    this.counterVariantChange.emit(v);
  }

  setProgressVariant(v: 'bar' | 'segments' | 'dots') {
    this.progressVariantChange.emit(v);
  }

  async toggleFolder(folder: Folder) {
    await this.folderService.toggleFolder(folder.id);
  }

  async deleteFolder(id: string) {
    await this.folderService.deleteFolder(id);
  }

  exportProgress() {
    if (!isPlatformBrowser(this.platformId)) return;
    const data = {
      exportedAt: new Date().toISOString(),
      history: this.historyService.sortedEntries(),
      customPrayers: this.customPrayerService.customPrayers(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailyduas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async confirmResetAll() {
    await this.historyService.clearAllHistory();
    this.showResetAllConfirm.set(false);
  }

  onSignOut() {
    this.signOut.emit();
  }

  permissionText() {
    const permission = this.reminderService.permission();
    if (permission === 'granted') return 'İzin verildi';
    if (permission === 'denied') return 'Reddedildi';
    if (permission === 'unsupported') return 'Desteklenmiyor';
    return 'Henüz izin verilmedi';
  }

  isPermissionActionVisible() {
    const permission = this.reminderService.permission();
    return permission === 'default';
  }

  async requestNotificationPermission() {
    const result = await this.reminderService.requestPermission();
    if (result === 'granted') {
      this.toast.emit('Bildirim izni verildi. Hatırlatmalar hazır ✅');
      return;
    }
    if (result === 'denied') {
      this.toast.emit('Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsiniz.');
      return;
    }
    this.toast.emit('Bu cihaz bildirim özelliğini desteklemiyor.');
  }

  async toggleRemindersMaster() {
    if (!this.reminderService.enabled()) {
      const permission = this.reminderService.permission();
      if (permission !== 'granted') {
        const requested = await this.reminderService.requestPermission();
        if (requested !== 'granted') {
          this.toast.emit('Hatırlatmalar için önce bildirim izni vermeniz gerekir.');
          return;
        }
      }
    }
    const next = !this.reminderService.enabled();
    const ok = await this.reminderService.setEnabled(next);
    if (ok) this.toast.emit(next ? 'Hatırlatmalar açıldı.' : 'Hatırlatmalar kapatıldı.');
  }

  startCreateReminder() {
    this.editingReminderId.set(null);
    this.editorTime.set('09:00');
    this.editorWeekdays.set([1, 2, 3, 4, 5, 6, 0]);
    this.editorTargetType.set('general');
    this.editorRoutineId.set('');
    this.editorLabel.set('Genel zikir');
    this.showReminderEditor.set(true);
  }

  startEditReminder(slot: ReminderSlot) {
    this.editingReminderId.set(slot.id);
    this.editorTime.set(slot.time);
    this.editorWeekdays.set(slot.weekdays);
    this.editorTargetType.set(slot.targetType);
    this.editorRoutineId.set(slot.routineId ?? '');
    this.editorLabel.set(slot.label ?? 'Genel zikir');
    this.showReminderEditor.set(true);
  }

  cancelReminderEdit() {
    this.showReminderEditor.set(false);
    this.editingReminderId.set(null);
  }

  toggleEditorWeekday(day: ReminderWeekday) {
    const days = this.editorWeekdays();
    const next = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day];
    this.editorWeekdays.set(next as ReminderWeekday[]);
  }

  async saveReminderSlot() {
    if (this.editorWeekdays().length === 0) {
      this.toast.emit('En az bir gün seçmelisiniz.');
      return;
    }
    if (this.editorTargetType() === 'routine' && !this.editorRoutineId()) {
      this.toast.emit('Rutin hedefi için bir rutin seçin.');
      return;
    }

    const ok = await this.reminderService.upsertSlot({
      id: this.editingReminderId() ?? undefined,
      time: this.editorTime(),
      weekdays: this.editorWeekdays(),
      enabled: true,
      targetType: this.editorTargetType(),
      routineId: this.editorTargetType() === 'routine' ? this.editorRoutineId() : undefined,
      label: this.editorTargetType() === 'general' ? this.editorLabel() : undefined,
    });

    if (ok) {
      this.showReminderEditor.set(false);
      this.editingReminderId.set(null);
      this.toast.emit('Hatırlatma kaydedildi.');
    }
  }

  async toggleReminderSlot(slot: ReminderSlot) {
    const ok = await this.reminderService.toggleSlot(slot.id);
    if (ok) this.toast.emit(slot.enabled ? 'Hatırlatma kapatıldı.' : 'Hatırlatma açıldı.');
  }

  async deleteReminderSlot(slot: ReminderSlot) {
    const ok = await this.reminderService.deleteSlot(slot.id);
    if (ok) this.toast.emit('Hatırlatma silindi.');
  }

  formatSlotSummary(slot: ReminderSlot) {
    const dayMap: Record<number, string> = { 0: 'Paz', 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt' };
    const days = slot.weekdays.map(day => dayMap[day]).join(', ');
    const target = slot.targetType === 'routine'
      ? (this.activeRoutines().find(r => r.id === slot.routineId)?.title ?? 'Rutin')
      : (slot.label || 'Genel zikir');
    return `${days} • ${target}`;
  }
}
