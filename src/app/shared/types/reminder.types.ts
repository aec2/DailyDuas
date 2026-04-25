export type ReminderTargetType = 'routine' | 'general';
export type ReminderWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ReminderSlot {
  id: string;
  time: string; // HH:mm
  weekdays: ReminderWeekday[];
  enabled: boolean;
  targetType: ReminderTargetType;
  routineId?: string;
  label?: string;
}

export interface ReminderPreferences {
  enabled: boolean;
  slots: ReminderSlot[];
  updatedAt?: string;
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: false,
  slots: [],
};
