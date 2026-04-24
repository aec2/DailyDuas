import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DailyRoutineService } from '../../core/services/daily-routine.service';
import { DailyRoutine, RoutineTargetUnit } from '../../shared/types/daily-routine.types';

type Mode = { kind: 'list' } | { kind: 'edit'; routine: DailyRoutine } | { kind: 'create' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-routine-manage-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="absolute inset-0 z-[55] flex items-end sm:items-center justify-center animate-fade-in-fast"
           style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);"
           (click)="close.emit()">
        <div (click)="$event.stopPropagation()"
             class="w-full sm:max-w-md dd-bg-surface animate-slide-up overflow-y-auto"
             style="border-radius:24px 24px 0 0;max-height:90vh;">

          <!-- Drag handle -->
          <div style="width:40px;height:4px;border-radius:4px;background:var(--dd-line);margin:10px auto 8px;"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 pb-3">
            <div class="font-serif text-[20px] dd-text-ink">
              {{ headerLabel() }}
            </div>
            <button (click)="onHeaderAction()"
                    class="border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale dd-bg-card"
                    [attr.aria-label]="mode().kind === 'list' ? 'Yeni rutin' : 'Geri'">
              @if (mode().kind === 'list') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.8" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              }
            </button>
          </div>

          @switch (mode().kind) {
            @case ('list') {
              @if (routineService.routines().length === 0) {
                <div class="px-5 py-10 text-center dd-text-faint font-sans text-[13px]">
                  Henüz rutin yok.
                </div>
              }

              <div class="px-3 pb-5 flex flex-col gap-1.5">
                @for (r of routineService.routines(); track r.id) {
                  <div class="flex items-center gap-2 p-2.5 rounded-[14px]"
                       [style.background]="r.isActive ? 'transparent' : 'var(--dd-card)'"
                       [style.opacity]="r.isActive ? 1 : 0.55">
                    <!-- active dot -->
                    <span class="w-2 h-2 rounded-full shrink-0"
                          [style.background]="r.isActive ? 'var(--dd-accent2)' : 'var(--dd-line)'"></span>
                    <div class="flex-1 min-w-0">
                      <div class="font-serif text-[15px] dd-text-ink truncate">{{ r.title }}</div>
                      @if (r.targetValue && r.targetUnit) {
                        <div class="font-mono text-[10px] dd-text-faint tracking-[0.5px] mt-0.5">
                          {{ r.targetValue }} {{ unitLabel(r.targetUnit) }} · sıra {{ r.sortOrder }}
                        </div>
                      }
                    </div>

                    <!-- reorder -->
                    <button (click)="moveUp(r)" [disabled]="isFirst(r)"
                            class="w-7 h-7 border-none rounded-full flex items-center justify-center cursor-pointer bg-transparent press-scale"
                            [style.opacity]="isFirst(r) ? 0.3 : 1"
                            aria-label="Yukarı">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.8" stroke-linecap="round"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                    <button (click)="moveDown(r)" [disabled]="isLast(r)"
                            class="w-7 h-7 border-none rounded-full flex items-center justify-center cursor-pointer bg-transparent press-scale"
                            [style.opacity]="isLast(r) ? 0.3 : 1"
                            aria-label="Aşağı">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.8" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
                    </button>

                    <!-- toggle active -->
                    <button (click)="toggleActive(r)"
                            class="w-7 h-7 border-none rounded-full flex items-center justify-center cursor-pointer bg-transparent press-scale"
                            [attr.aria-label]="r.isActive ? 'Devre dışı bırak' : 'Aktif et'">
                      @if (r.isActive) {
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
                      } @else {
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/></svg>
                      }
                    </button>

                    <!-- edit -->
                    <button (click)="startEdit(r)"
                            class="w-7 h-7 border-none rounded-full flex items-center justify-center cursor-pointer bg-transparent press-scale"
                            aria-label="Düzenle">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink-faint)" stroke-width="1.8" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    </button>
                  </div>
                }
              </div>
            }

            @case ('create') { <ng-container *ngTemplateOutlet="formTpl"></ng-container> }
            @case ('edit')   { <ng-container *ngTemplateOutlet="formTpl"></ng-container> }
          }

          <!-- Form -->
          <ng-template #formTpl>
            <div class="px-5 pb-6 flex flex-col gap-3">
              <label class="flex flex-col gap-1">
                <span class="font-mono text-[10px] dd-text-faint tracking-[0.8px] uppercase">Başlık</span>
                <input [value]="formTitle()" (input)="formTitle.set(getVal($event))"
                       class="font-serif text-[16px] dd-text-ink bg-transparent border-none outline-none px-0 py-2"
                       style="border-bottom: 1px solid var(--dd-line);" maxlength="60"/>
              </label>

              <label class="flex flex-col gap-1">
                <span class="font-mono text-[10px] dd-text-faint tracking-[0.8px] uppercase">Açıklama</span>
                <input [value]="formDescription()" (input)="formDescription.set(getVal($event))"
                       class="font-sans text-[13px] dd-text-muted bg-transparent border-none outline-none px-0 py-2"
                       style="border-bottom: 1px solid var(--dd-line);" maxlength="140"/>
              </label>

              <div class="grid grid-cols-[1fr_auto] gap-3 items-end">
                <label class="flex flex-col gap-1">
                  <span class="font-mono text-[10px] dd-text-faint tracking-[0.8px] uppercase">Hedef</span>
                  <input type="number" min="1" [value]="formTargetValue()"
                         (input)="formTargetValue.set(+getVal($event) || 1)"
                         class="font-serif text-[16px] dd-text-ink bg-transparent border-none outline-none px-0 py-2"
                         style="border-bottom: 1px solid var(--dd-line);"/>
                </label>
                <div class="flex gap-1 pb-1">
                  @for (u of unitOptions; track u) {
                    <button (click)="formTargetUnit.set(u)"
                            class="border-none rounded-full px-2.5 py-1.5 cursor-pointer font-mono text-[10px] tracking-[0.5px] uppercase press-scale"
                            [style.background]="formTargetUnit() === u ? 'var(--dd-accent)' : 'var(--dd-card)'"
                            [style.color]="formTargetUnit() === u ? '#fff' : 'var(--dd-ink-faint)'">
                      {{ unitLabel(u) }}
                    </button>
                  }
                </div>
              </div>

              <label class="flex items-center justify-between py-2">
                <span class="font-sans text-[14px] dd-text-ink">Aktif</span>
                <button (click)="formActive.set(!formActive())"
                        class="border-none cursor-pointer press-scale rounded-full"
                        style="width:44px;height:26px;padding:3px;transition:background 200ms;"
                        [style.background]="formActive() ? 'var(--dd-accent2)' : 'var(--dd-line)'">
                  <span class="block rounded-full bg-white"
                        style="width:20px;height:20px;transition:transform 200ms;"
                        [style.transform]="formActive() ? 'translateX(18px)' : 'translateX(0)'"></span>
                </button>
              </label>

              <!-- Actions -->
              <div class="flex items-center justify-between gap-2 mt-2">
                @if (mode().kind === 'edit') {
                  <button (click)="deleteRoutine()"
                          class="border-none rounded-full px-4 py-2.5 cursor-pointer font-sans text-[13px] font-medium press-scale"
                          style="background:rgba(239,68,68,0.1);color:#ef4444;">
                    Sil
                  </button>
                } @else { <span></span> }
                <div class="flex gap-2">
                  <button (click)="mode.set({ kind: 'list' })"
                          class="border-none rounded-full px-4 py-2.5 cursor-pointer font-sans text-[13px] font-medium press-scale dd-bg-card dd-text-muted">
                    İptal
                  </button>
                  <button (click)="save()" [disabled]="!formTitle().trim()"
                          class="border-none rounded-full px-5 py-2.5 cursor-pointer font-sans text-[13px] font-medium press-scale"
                          [style.background]="formTitle().trim() ? 'var(--dd-accent)' : 'var(--dd-line)'"
                          [style.color]="formTitle().trim() ? '#fff' : 'var(--dd-ink-faint)'">
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </ng-template>
        </div>
      </div>
    }
  `,
  imports: [NgTemplateOutlet],
})
export class RoutineManageModalComponent {
  readonly routineService = inject(DailyRoutineService);

  open = input.required<boolean>();
  close = output<void>();

  mode = signal<Mode>({ kind: 'list' });

  // Form state
  formTitle = signal('');
  formDescription = signal('');
  formTargetValue = signal<number>(5);
  formTargetUnit = signal<RoutineTargetUnit>('minute');
  formActive = signal(true);

  readonly unitOptions: RoutineTargetUnit[] = ['minute', 'page', 'count'];

  headerLabel = computed(() => {
    const m = this.mode();
    if (m.kind === 'list') return 'Rutinleri Yönet';
    if (m.kind === 'create') return 'Yeni Rutin';
    return 'Rutini Düzenle';
  });

  getVal(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  unitLabel(unit: string): string {
    switch (unit) {
      case 'minute': return 'dakika';
      case 'page': return 'sayfa';
      case 'count': return 'adet';
      default: return unit;
    }
  }

  onHeaderAction() {
    if (this.mode().kind === 'list') this.startCreate();
    else this.mode.set({ kind: 'list' });
  }

  startCreate() {
    this.formTitle.set('');
    this.formDescription.set('');
    this.formTargetValue.set(5);
    this.formTargetUnit.set('minute');
    this.formActive.set(true);
    this.mode.set({ kind: 'create' });
  }

  startEdit(r: DailyRoutine) {
    this.formTitle.set(r.title);
    this.formDescription.set(r.description ?? '');
    this.formTargetValue.set(r.targetValue ?? 5);
    this.formTargetUnit.set(r.targetUnit ?? 'minute');
    this.formActive.set(r.isActive);
    this.mode.set({ kind: 'edit', routine: r });
  }

  async save() {
    const title = this.formTitle().trim();
    if (!title) return;
    const m = this.mode();

    const common = {
      title,
      description: this.formDescription().trim() || undefined,
      targetType: 'duration' as const,
      targetValue: this.formTargetValue(),
      targetUnit: this.formTargetUnit(),
      isActive: this.formActive(),
    };

    if (m.kind === 'edit') {
      await this.routineService.updateRoutine(m.routine.id, common);
    } else if (m.kind === 'create') {
      const maxOrder = Math.max(0, ...this.routineService.routines().map(r => r.sortOrder));
      await this.routineService.createRoutine({
        ...common,
        category: undefined,
        sortOrder: maxOrder + 1,
      });
    }

    this.mode.set({ kind: 'list' });
  }

  async deleteRoutine() {
    const m = this.mode();
    if (m.kind !== 'edit') return;
    await this.routineService.deleteRoutine(m.routine.id, false);
    this.mode.set({ kind: 'list' });
  }

  async toggleActive(r: DailyRoutine) {
    await this.routineService.updateRoutine(r.id, { isActive: !r.isActive });
  }

  isFirst(r: DailyRoutine): boolean {
    const sorted = [...this.routineService.routines()].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[0]?.id === r.id;
  }

  isLast(r: DailyRoutine): boolean {
    const sorted = [...this.routineService.routines()].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[sorted.length - 1]?.id === r.id;
  }

  async moveUp(r: DailyRoutine) {
    const sorted = [...this.routineService.routines()].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(x => x.id === r.id);
    if (idx <= 0) return;
    const other = sorted[idx - 1];
    await this.routineService.updateRoutine(r.id, { sortOrder: other.sortOrder });
    await this.routineService.updateRoutine(other.id, { sortOrder: r.sortOrder });
  }

  async moveDown(r: DailyRoutine) {
    const sorted = [...this.routineService.routines()].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(x => x.id === r.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const other = sorted[idx + 1];
    await this.routineService.updateRoutine(r.id, { sortOrder: other.sortOrder });
    await this.routineService.updateRoutine(other.id, { sortOrder: r.sortOrder });
  }
}
