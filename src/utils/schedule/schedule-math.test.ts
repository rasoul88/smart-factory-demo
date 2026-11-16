import { describe, expect, it } from "vitest";

import { EScheduleMode, EWeekday } from "@dto/schedule.dto";

import { computeNextRun, formatCountdown } from "./schedule-math";

const monday = (hour: number, minute = 0) =>
  new Date(2026, 10, 16, hour, minute, 0, 0).getTime();

const wednesdayLate = (hour: number, minute: number) =>
  new Date(2026, 10, 18, hour, minute, 0, 0).getTime();

describe("computeNextRun — once", () => {
  it("returns the run time when it is still in the future", () => {
    const from = monday(14, 30);
    const runAt = from + 60_000;
    expect(
      computeNextRun(
        { mode: EScheduleMode.Once, timeOfDay: "05:00", runAt },
        from,
      ),
    ).toBe(runAt);
  });

  it("returns null when the run time already passed", () => {
    const from = monday(14, 30);
    expect(
      computeNextRun(
        { mode: EScheduleMode.Once, timeOfDay: "05:00", runAt: from - 1000 },
        from,
      ),
    ).toBeNull();
  });
});

describe("computeNextRun — daily", () => {
  it("uses today when the time is still ahead", () => {
    const from = monday(14, 30);
    const next = computeNextRun(
      { mode: EScheduleMode.Daily, timeOfDay: "18:00" },
      from,
    );
    expect(next).toBe(monday(18));
  });

  it("rolls to tomorrow when the time already passed today", () => {
    const from = monday(14, 30);
    const next = computeNextRun(
      { mode: EScheduleMode.Daily, timeOfDay: "05:00" },
      from,
    );
    expect(next).toBe(new Date(2026, 10, 17, 5, 0, 0, 0).getTime());
  });

  it("rolls past midnight correctly", () => {
    const from = wednesdayLate(23, 50);
    const next = computeNextRun(
      { mode: EScheduleMode.Daily, timeOfDay: "05:00" },
      from,
    );
    expect(next).toBe(new Date(2026, 10, 19, 5, 0, 0, 0).getTime());
  });

  it("never returns a time equal to now", () => {
    const from = monday(14, 30);
    const next = computeNextRun(
      { mode: EScheduleMode.Daily, timeOfDay: "14:30" },
      from,
    );
    expect(next).toBeGreaterThan(from);
  });
});

describe("computeNextRun — weekly", () => {
  it("finds the next matching weekday later this week", () => {
    const from = monday(14, 30);
    const next = computeNextRun(
      {
        mode: EScheduleMode.Weekly,
        timeOfDay: "05:00",
        daysOfWeek: [EWeekday.Friday],
      },
      from,
    );
    expect(next).toBe(new Date(2026, 10, 20, 5, 0, 0, 0).getTime());
  });

  it("skips a matching day whose time already passed", () => {
    const from = monday(14, 30);
    const next = computeNextRun(
      {
        mode: EScheduleMode.Weekly,
        timeOfDay: "09:00",
        daysOfWeek: [EWeekday.Monday],
      },
      from,
    );
    expect(next).toBe(new Date(2026, 10, 23, 9, 0, 0, 0).getTime());
  });

  it("wraps around the Persian week starting Saturday", () => {
    const from = monday(14, 30);
    const next = computeNextRun(
      {
        mode: EScheduleMode.Weekly,
        timeOfDay: "05:00",
        daysOfWeek: [EWeekday.Saturday],
      },
      from,
    );
    expect(next).toBe(new Date(2026, 10, 21, 5, 0, 0, 0).getTime());
  });

  it("returns null when no day is selected", () => {
    expect(
      computeNextRun(
        { mode: EScheduleMode.Weekly, timeOfDay: "05:00", daysOfWeek: [] },
        monday(14, 30),
      ),
    ).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("formats minutes, hours and days in Persian", () => {
    const now = monday(12);
    expect(formatCountdown(now + 30 * 60_000, now)).toBe("30 دقیقه دیگر");
    expect(formatCountdown(now + 3 * 3_600_000, now)).toBe("3 ساعت دیگر");
    expect(formatCountdown(now + 2 * 24 * 3_600_000, now)).toBe("2 روز دیگر");
  });

  it("reports the due state", () => {
    expect(formatCountdown(monday(12), monday(12))).toBe("اکنون");
  });
});
