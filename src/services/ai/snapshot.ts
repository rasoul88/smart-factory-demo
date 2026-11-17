import { ECommandStatus } from "@dto/command.dto";
import type { ICommandLogEntry } from "@dto/command.dto";
import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition, TEquipmentState } from "@dto/equipment.dto";
import { ELineStatus, EPlcStatus, type IProductLine } from "@dto/factory.dto";

export interface IStatusSnapshot {
  definitions: TEquipmentDefinition[];
  states: Record<string, TEquipmentState>;
  plcStatus: Record<string, EPlcStatus>;
  lines: IProductLine[];
  commands: ICommandLogEntry[];
}

export const fa = (value: number, digits = 0): string =>
  value.toLocaleString("fa-IR", { maximumFractionDigits: digits });

export const isActive = (state: TEquipmentState): boolean => {
  switch (state.kind) {
    case EEquipmentKind.Motor:
    case EEquipmentKind.Pump:
    case EEquipmentKind.Conveyor:
      return state.running;
    case EEquipmentKind.Valve:
      return state.open && state.positionPercent > 2;
    case EEquipmentKind.Heater:
    case EEquipmentKind.Light:
      return state.on;
    case EEquipmentKind.Sensor:
      return true;
  }
};

export const alarmSeverityOf = (
  definition: TEquipmentDefinition,
  state: TEquipmentState | undefined,
): 0 | 1 | 2 => {
  if (!state || !state.online) return 0;
  if (definition.kind !== EEquipmentKind.Sensor) return 0;
  if (state.kind !== EEquipmentKind.Sensor) return 0;
  if (state.value >= definition.criticalAt) return 2;
  if (state.value >= definition.warningAt) return 1;
  return 0;
};

export interface IAlarmEntry {
  equipmentId: string;
  equipmentName: string;
  lineId: string;
  value: number;
  unit: string;
  severity: 1 | 2;
  threshold: number;
}

export const collectAlarms = (snapshot: IStatusSnapshot): IAlarmEntry[] =>
  snapshot.definitions
    .filter((definition) => definition.kind === EEquipmentKind.Sensor)
    .map((definition) => {
      if (definition.kind !== EEquipmentKind.Sensor) return undefined;
      const state = snapshot.states[definition.id];
      const severity = alarmSeverityOf(definition, state);
      if (severity === 0 || !state || state.kind !== EEquipmentKind.Sensor) {
        return undefined;
      }
      return {
        equipmentId: definition.id,
        equipmentName: definition.name,
        lineId: definition.lineId,
        value: state.value,
        unit: definition.unit,
        severity,
        threshold: severity === 2 ? definition.criticalAt : definition.warningAt,
      };
    })
    .filter((entry): entry is IAlarmEntry => Boolean(entry))
    .sort((a, b) => b.severity - a.severity);

export const lineStatusOf = (
  line: IProductLine,
  snapshot: IStatusSnapshot,
): ELineStatus => {
  const equipment = snapshot.definitions.filter(
    (item) => item.lineId === line.id,
  );
  const online = equipment.filter(
    (item) => snapshot.states[item.id]?.online !== false,
  );
  const alarms = equipment.filter(
    (item) => alarmSeverityOf(item, snapshot.states[item.id]) > 0,
  );
  const running = equipment.filter((item) => {
    const state = snapshot.states[item.id];
    return state?.online && isActive(state);
  });

  if (online.length === 0) return ELineStatus.Stopped;
  if (alarms.length > 0) return ELineStatus.Fault;
  if (running.length === 0) return ELineStatus.Idle;
  return ELineStatus.Running;
};

export const lineStatusKey = (status: ELineStatus): string => {
  switch (status) {
    case ELineStatus.Running:
      return "status-running";
    case ELineStatus.Idle:
      return "status-idle";
    case ELineStatus.Stopped:
      return "status-stopped";
    case ELineStatus.Fault:
      return "status-fault";
  }
};

export interface IShiftReport {
  totalEquipment: number;
  onlineEquipment: number;
  runningEquipment: number;
  plcOnline: number;
  plcTotal: number;
  alarms: IAlarmEntry[];
  executedCommands: number;
  rejectedCommands: number;
  lineSummaries: {
    lineId: string;
    lineName: string;
    statusKey: string;
    running: number;
    total: number;
  }[];
  headlineKey: string;
}

export const buildShiftReport = (snapshot: IStatusSnapshot): IShiftReport => {
  const online = snapshot.definitions.filter(
    (item) => snapshot.states[item.id]?.online !== false,
  );
  const running = snapshot.definitions.filter((item) => {
    const state = snapshot.states[item.id];
    return (
      state?.online && isActive(state) && item.kind !== EEquipmentKind.Sensor
    );
  });
  const plcValues = Object.values(snapshot.plcStatus);

  const alarms = collectAlarms(snapshot);
  const executed = snapshot.commands.filter(
    (entry) => entry.status === ECommandStatus.Executed,
  ).length;
  const rejected = snapshot.commands.filter(
    (entry) => entry.status === ECommandStatus.Rejected,
  ).length;

  const lineSummaries = snapshot.lines.map((line) => {
    const equipment = snapshot.definitions.filter(
      (item) => item.lineId === line.id,
    );
    const runningCount = equipment.filter((item) => {
      const state = snapshot.states[item.id];
      return (
        state?.online && isActive(state) && item.kind !== EEquipmentKind.Sensor
      );
    }).length;

    return {
      lineId: line.id,
      lineName: line.name,
      statusKey: lineStatusKey(lineStatusOf(line, snapshot)),
      running: runningCount,
      total: equipment.length,
    };
  });

  const headlineKey = alarms.some((alarm) => alarm.severity === 2)
    ? "ai-report-headline-critical"
    : alarms.length > 0
      ? "ai-report-headline-warning"
      : "ai-report-headline-ok";

  return {
    totalEquipment: snapshot.definitions.length,
    onlineEquipment: online.length,
    runningEquipment: running.length,
    plcOnline: plcValues.filter((status) => status === EPlcStatus.Online).length,
    plcTotal: plcValues.length,
    alarms,
    executedCommands: executed,
    rejectedCommands: rejected,
    lineSummaries,
    headlineKey,
  };
};
