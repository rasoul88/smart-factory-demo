// Demo fixtures: sensors that stay in an alarm state for the whole session so
// the monitoring, troubleshooting and AI features always have live signal.
export interface IPinnedFault {
  id: string;
  base: number;
  amplitude: number;
  period: number;
}

export const PINNED_FAULTS: IPinnedFault[] = [
  { id: "eq-dist-temp", base: 0.85, amplitude: 0.15, period: 90 },
];

const BY_ID: Record<string, IPinnedFault> = Object.fromEntries(
  PINNED_FAULTS.map((item) => [item.id, item]),
);

export const pinnedFaultFor = (equipmentId: string): IPinnedFault | undefined =>
  BY_ID[equipmentId];

export const isPinnedFault = (equipmentId: string): boolean =>
  equipmentId in BY_ID;

export const pinnedStressAt = (
  equipmentId: string,
  tickCount: number,
): number => {
  const pinned = BY_ID[equipmentId];
  if (!pinned) return 0;

  const phase = (2 * Math.PI * tickCount) / pinned.period;
  return Math.max(
    0,
    Math.min(1, pinned.base + pinned.amplitude * Math.sin(phase)),
  );
};
