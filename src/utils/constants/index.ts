export const TELEMETRY_INTERVAL_MS = 1000;

export const ROUTES = {
  login: "/login",
  dashboard: "/",
  factories: "/factories",
  factory: (factoryId: string) => `/factories/${factoryId}`,
  line: (factoryId: string, lineId: string) =>
    `/factories/${factoryId}/lines/${lineId}`,
} as const;
