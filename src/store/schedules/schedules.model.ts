import type { ISchedule } from "@dto/schedule.dto";

export interface ISchedulesStore {
  schedules: ISchedule[];
  add: (schedule: ISchedule) => void;
  update: (id: string, patch: Partial<ISchedule>) => void;
  remove: (id: string) => void;
  toggle: (id: string, enabled: boolean) => void;
  markRun: (id: string, lastRunAt: number, nextRunAt: number | null) => void;
}
