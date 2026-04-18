export interface Folder {
  id: string;
  name: string;
  emoji: string;
  order: number;
  enabled: boolean;
  prayerIds: number[];
  createdAt: string;
}

export interface FolderDraft {
  name: string;
  emoji: string;
  prayerIds: number[];
}
