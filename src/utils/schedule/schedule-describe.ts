import type { TFunction } from "i18next";

import { EScheduleMode, EWeekday, type ISchedule } from "@dto/schedule.dto";

import { formatClock, formatDayMonth } from "@utils/format/format";
import { WEEK_ORDER } from "@utils/schedule/schedule-math";

interface IDescribable {
  mode: EScheduleMode;
  timeOfDay: string;
  daysOfWeek?: EWeekday[];
  runAt?: number;
}

export const describeSchedule = (
  schedule: IDescribable,
  t: TFunction,
): string => {
  if (schedule.mode === EScheduleMode.Once) {
    if (schedule.runAt === undefined) return t("schedule-mode-once");
    return `${formatDayMonth(schedule.runAt)} — ${formatClock(schedule.runAt)}`;
  }

  if (schedule.mode === EScheduleMode.Daily) {
    return `${t("schedule-mode-daily")} — ${schedule.timeOfDay}`;
  }

  const days = (schedule.daysOfWeek ?? [])
    .slice()
    .sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b));

  if (days.length === 0)
    return `${t("schedule-mode-weekly")} — ${schedule.timeOfDay}`;

  const dayLabels = days.map((day) => t(`weekday-${day}`)).join("، ");
  return `${dayLabels} — ${schedule.timeOfDay}`;
};

export const scheduleModeLabelKey = (mode: EScheduleMode): string => {
  switch (mode) {
    case EScheduleMode.Once:
      return "schedule-mode-once";
    case EScheduleMode.Daily:
      return "schedule-mode-daily";
    case EScheduleMode.Weekly:
      return "schedule-mode-weekly";
  }
};

export const isScheduleActive = (schedule: ISchedule): boolean =>
  schedule.enabled && schedule.nextRunAt !== null;
