const persianNumber = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const persianNumberOneDecimal = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const persianTime = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export const formatNumber = (value: number): string =>
  persianNumber.format(value);

export const formatDecimal = (value: number): string =>
  persianNumberOneDecimal.format(value);

export const formatTime = (timestamp: number): string =>
  persianTime.format(new Date(timestamp));

export const formatRelative = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${persianNumber.format(minutes)} دقیقه پیش`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${persianNumber.format(hours)} ساعت پیش`;

  return `${persianNumber.format(Math.round(hours / 24))} روز پیش`;
};

const persianWeekday = new Intl.DateTimeFormat("fa-IR", { weekday: "long" });

const persianDayMonth = new Intl.DateTimeFormat("fa-IR", {
  month: "long",
  day: "numeric",
});

const persianClock = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatWeekdayName = (timestamp: number): string =>
  persianWeekday.format(new Date(timestamp));

export const formatDayMonth = (timestamp: number): string =>
  persianDayMonth.format(new Date(timestamp));

export const formatClock = (timestamp: number): string =>
  persianClock.format(new Date(timestamp));
