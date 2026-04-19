import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Folder, FolderDraft } from '../../shared/types/folder.types';
import { Prayer } from '../../data/data';

const EMOJI_OPTIONS = ['🌹','📖','✨','🕌','🌙','⭐','🤲','💎','🌿','🕊️','🌸','🔮'];

@Component({
  selector: 'app-folder-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
           style="background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);"
           role="button" tabindex="-1"
           (click)="close.emit()" (keydown.escape)="close.emit()">
        <div class="dd-bg-surface rounded-[24px] max-w-lg w-full p-6 animate-fade-in overflow-y-auto"
             style="box-shadow:0 12px 40px rgba(0,0,0,0.15);max-height:90vh;"
             role="dialog" aria-modal="true"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1.2px] uppercase mb-1">Sahîfe</div>
              <div class="font-serif text-[22px] dd-text-ink" style="letter-spacing:-0.3px;">
                {{ editingFolder() ? 'Sahîfeyi Düzenle' : 'Yeni Sahîfe' }}
              </div>
            </div>
            <button (click)="close.emit()"
                    class="dd-bg-card border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer press-scale"
                    aria-label="Kapat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dd-ink)" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <form class="flex flex-col gap-4" (ngSubmit)="submit()">
            <!-- Emoji picker -->
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5">Simge</div>
              <div class="flex flex-wrap gap-2">
                @for (e of emojiOptions; track e) {
                  <button type="button"
                          (click)="emoji.set(e)"
                          class="border-none rounded-[12px] w-10 h-10 text-[20px] cursor-pointer press-scale"
                          [style.background]="emoji() === e ? 'var(--dd-accent)' : 'var(--dd-card)'">
                    {{ e }}
                  </button>
                }
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="block font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5" for="folder-name">Sahîfe Adı</label>
              <input id="folder-name" name="name"
                     [ngModel]="name()" (ngModelChange)="name.set($event)"
                     class="w-full dd-bg-card dd-text-ink border-none rounded-[14px] px-3.5 py-3 font-sans text-[15px] outline-none"
                     style="border:1px solid var(--dd-line);"
                     placeholder="Örnek: Sabah Zikirlerim" required />
            </div>

            <!-- Prayer picker -->
            <div>
              <div class="font-mono text-[10px] dd-text-faint tracking-[1px] uppercase mb-1.5">
                Zikirler ({{ selectedIds().length }} seçili)
              </div>
              <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto rounded-[14px] dd-bg-card p-2">
                @for (prayer of allPrayers(); track prayer.id) {
                  <label class="flex items-center gap-3 px-2 py-2 rounded-[10px] cursor-pointer"
                         [style.background]="isSelected(prayer.id) ? 'rgba(212,165,116,0.12)' : 'transparent'">
                    <input type="checkbox"
                           [checked]="isSelected(prayer.id)"
                           (change)="togglePrayer(prayer.id)"
                           class="accent-[var(--dd-accent)] w-4 h-4" />
                    <span class="font-serif text-[14px] dd-text-ink">{{ prayer.title || prayer.transliteration }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-1">
              <button type="button" (click)="close.emit()"
                      class="dd-bg-card border-none rounded-full px-4 py-2.5 font-sans text-[14px] font-medium dd-text-ink cursor-pointer press-scale">
                Vazgeç
              </button>
              <button type="submit" [disabled]="!name().trim()"
                      class="border-none rounded-full px-5 py-2.5 font-sans text-[14px] font-medium text-white cursor-pointer press-scale"
                      style="background:var(--dd-accent)">
                {{ editingFolder() ? 'Kaydet' : 'Oluştur' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class FolderModalComponent {
  open = input.required<boolean>();
  allPrayers = input.required<Prayer[]>();
  editingFolder = input<Folder | null>(null);

  close = output<void>();
  save = output<FolderDraft>();

  readonly emojiOptions = EMOJI_OPTIONS;

  name = signal('');
  emoji = signal('🌹');
  selectedIds = signal<number[]>([]);

  constructor() {
    effect(() => {
      const f = this.editingFolder();
      if (f) {
        this.name.set(f.name);
        this.emoji.set(f.emoji);
        this.selectedIds.set([...f.prayerIds]);
      } else if (this.open()) {
        this.name.set('');
        this.emoji.set('🌹');
        this.selectedIds.set([]);
      }
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  togglePrayer(id: number) {
    this.selectedIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  submit() {
    if (!this.name().trim()) return;
    this.save.emit({ name: this.name(), emoji: this.emoji(), prayerIds: this.selectedIds() });
  }
}
