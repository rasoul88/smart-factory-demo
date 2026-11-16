import type { ECommandAction } from "./command.dto";

export enum EScheduleMode {
  Once = "once",
  Daily = "daily",
  Weekly = "weekly",
}

export enum EWeekday {
  Saturday = "sat",
  Sunday = "sun",
  Monday = "mon",
  Tuesday = "tue",
  Wednesday = "wed",
  Thursday = "thu",
  Friday = "fri",
}

export interface ISchedule {
  id: string;
  equipmentId: string;
  equipmentName: string;
  lineId: string;
  factoryId: string;
  action: ECommandAction;
  value?: number;
  mode: EScheduleMode;
  timeOfDay: string;
  daysOfWeek?: EWeekday[];
  runAt?: number;
  enabled: boolean;
  nextRunAt: number | null;
  lastRunAt?: number;
  createdBy: string;
  createdAt: number;
}

export interface IScheduleDraft {
  equipmentId: string;
  action: ECommandAction;
  value?: number;
  mode: EScheduleMode;
  timeOfDay: string;
  daysOfWeek?: EWeekday[];
  runAt?: number;
}
