import { EScheduleMode, EWeekday, type ISchedule } from "@dto/schedule.dto";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export const WEEK_ORDER: EWeekday[] = [
  EWeekday.Saturday,
  EWeekday.Sunday,
  EWeekday.Monday,
  EWeekday.Tuesday,
  EWeekday.Wednesday,
  EWeekday.Thursday,
  EWeekday.Friday,
];

const JS_DAY_TO_WEEKDAY: EWeekday[] = [
  EWeekday.Sunday,
  EWeekday.Monday,
  EWeekday.Tuesday,
  EWeekday.Wednesday,
  EWeekday.Thursday,
  EWeekday.Friday,
  EWeekday.Saturday,
];

export const weekdayOf = (date: Date): EWeekday =>
  JS_DAY_TO_WEEKDAY[date.getDay()];

export const parseTimeOfDay = (timeOfDay: string) => {
  const [hours, minutes] = timeOfDay.split(":").map(Number);
  return { hours, minutes };
};

export const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const atTimeOfDay = (date: Date, timeOfDay: string): Date => {
  const { hours, minutes } = parseTimeOfDay(timeOfDay);
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
};

interface IComputeNextRunArgs {
  mode: EScheduleMode;
  timeOfDay: string;
  daysOfWeek?: EWeekday[];
  runAt?: number;
}

export const computeNextRun = (
  schedule: IComputeNextRunArgs,
  from: number,
): number | null => {
  const now = new Date(from);

  if (schedule.mode === EScheduleMode.Once) {
    if (schedule.runAt === undefined) return null;
    return schedule.runAt > from ? schedule.runAt : null;
  }

  if (schedule.mode === EScheduleMode.Daily) {
    const todayRun = atTimeOfDay(now, schedule.timeOfDay).getTime();
    if (todayRun > from) return todayRun;
    const tomorrow = new Date(now.getTime() + DAY_MS);
    return atTimeOfDay(tomorrow, schedule.timeOfDay).getTime();
  }

  const days = schedule.daysOfWeek ?? [];
  if (days.length === 0) return null;

  const base = startOfDay(now);
  for (let offset = 0; offset < 8; offset += 1) {
    const candidateDay = new Date(base.getTime() + offset * DAY_MS);
    if (!days.includes(weekdayOf(candidateDay))) continue;

    const candidate = atTimeOfDay(candidateDay, schedule.timeOfDay).getTime();
    if (candidate > from) return candidate;
  }

  return null;
};

export const isScheduleDue = (schedule: ISchedule, now: number): boolean =>
  schedule.enabled && schedule.nextRunAt !== null && schedule.nextRunAt <= now;

export const scheduleHasEnded = (schedule: ISchedule): boolean =>
  !schedule.enabled &&
  schedule.mode === EScheduleMode.Once &&
  schedule.nextRunAt === null;

export const formatCountdown = (nextRunAt: number, now: number): string => {
  const remainingMs = nextRunAt - now;
  if (remainingMs <= 0) return "اکنون";

  const totalMinutes = Math.ceil(remainingMs / MINUTE_MS);
  if (totalMinutes < 60) return `${totalMinutes} دقیقه دیگر`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) {
    return minutes > 0
      ? `${hours} ساعت و ${minutes} دقیقه دیگر`
      : `${hours} ساعت دیگر`;
  }

  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0
    ? `${days} روز و ${remainHours} ساعت دیگر`
    : `${days} روز دیگر`;
};
