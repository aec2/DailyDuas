import { DailyHistoryEntry } from '../../core/services/daily-history.service';

export interface CalendarDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  entry: DailyHistoryEntry | null;
}
