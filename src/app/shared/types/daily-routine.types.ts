export type RoutineTargetType = 'duration' | 'count' | 'boolean';
export type RoutineTargetUnit = 'minute' | 'page' | 'count';

export interface DailyRoutine {
  id: string;
  title: string;
  description?: string;
  category?: string;
  targetType: RoutineTargetType;
  targetValue?: number;
  targetUnit?: RoutineTargetUnit;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyRoutineProgressItem {
  routineId: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
}

export interface DailyRoutineProgress {
  dateKey: string;
  timezone: string;
  completedCount: number;
  totalActiveCount: number;
  isFullyCompleted: boolean;
  items: Record<string, DailyRoutineProgressItem>;
  updatedAt?: string;
}

export type DailyRoutineDraft = Omit<DailyRoutine, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> & {
  isDefault?: boolean;
};
