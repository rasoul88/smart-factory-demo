import { createStore } from "zustand";
import { persist } from "zustand/middleware";

import { ECommandAction } from "@dto/command.dto";
import { EScheduleMode, EWeekday } from "@dto/schedule.dto";
import type { ISchedule } from "@dto/schedule.dto";

import { computeNextRun } from "@utils/schedule/schedule-math";

import type { ISchedulesStore } from "./schedules.model";

const now = Date.now();

const seedSchedules: ISchedule[] = [
  {
    id: "sch-seed-heater-daily",
    equipmentId: "eq-rolling-furnace",
    equipmentName: "کوره پیش‌گرم",
    lineId: "line-rolling",
    factoryId: "fac-steel",
    action: ECommandAction.SetTemperature,
    value: 900,
    mode: EScheduleMode.Daily,
    timeOfDay: "05:00",
    enabled: true,
    nextRunAt: computeNextRun(
      { mode: EScheduleMode.Daily, timeOfDay: "05:00" },
      now,
    ),
    lastRunAt: now - 86_400_000,
    createdBy: "مهندس رضا کریمی",
    createdAt: now - 86_400_000 * 6,
  },
  {
    id: "sch-seed-feed-pump-start",
    equipmentId: "eq-dist-feed-pump",
    equipmentName: "پمپ خوراک",
    lineId: "line-distillation",
    factoryId: "fac-petro",
    action: ECommandAction.Start,
    mode: EScheduleMode.Weekly,
    timeOfDay: "06:30",
    daysOfWeek: [EWeekday.Saturday, EWeekday.Monday, EWeekday.Wednesday],
    enabled: true,
    nextRunAt: computeNextRun(
      {
        mode: EScheduleMode.Weekly,
        timeOfDay: "06:30",
        daysOfWeek: [EWeekday.Saturday, EWeekday.Monday, EWeekday.Wednesday],
      },
      now,
    ),
    createdBy: "مهندس رضا کریمی",
    createdAt: now - 86_400_000 * 3,
  },
  {
    id: "sch-seed-pack-light",
    equipmentId: "eq-pack-light",
    equipmentName: "روشنایی خط",
    lineId: "line-packaging",
    factoryId: "fac-food",
    action: ECommandAction.TurnOff,
    mode: EScheduleMode.Daily,
    timeOfDay: "22:00",
    enabled: false,
    nextRunAt: null,
    createdBy: "مهندس رضا کریمی",
    createdAt: now - 86_400_000,
  },
];

export const schedulesStore = createStore<ISchedulesStore>()(
  persist(
    (set) => ({
      schedules: seedSchedules,
      add: (schedule) =>
        set((store) => ({ schedules: [schedule, ...store.schedules] })),
      update: (id, patch) =>
        set((store) => ({
          schedules: store.schedules.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        })),
      remove: (id) =>
        set((store) => ({
          schedules: store.schedules.filter((item) => item.id !== id),
        })),
      toggle: (id, enabled) =>
        set((store) => ({
          schedules: store.schedules.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              enabled,
              nextRunAt: enabled
                ? computeNextRun(item, Date.now())
                : item.nextRunAt,
            };
          }),
        })),
      markRun: (id, lastRunAt, nextRunAt) =>
        set((store) => ({
          schedules: store.schedules.map((item) =>
            item.id === id
              ? {
                  ...item,
                  lastRunAt,
                  nextRunAt,
                  enabled: nextRunAt === null ? false : item.enabled,
                }
              : item,
          ),
        })),
    }),
    { name: "smart-factory-schedules" },
  ),
);
