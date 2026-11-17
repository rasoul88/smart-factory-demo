import { ECommandStatus } from "@dto/command.dto";
import type { ICommandLogEntry } from "@dto/command.dto";
import {
  EEquipmentKind,
  ESensorMetric,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";
import { EPlcStatus } from "@dto/factory.dto";

import { analyzeSignal, projectSamplesUntil } from "./signal-analysis";
import type { ISignalTrend } from "./signal-analysis";

export enum EDiagnosisSeverity {
  Ok = "ok",
  Info = "info",
  Warning = "warning",
  Critical = "critical",
}

export interface IDiagnosisFinding {
  id: string;
  severity: EDiagnosisSeverity;
  titleKey: string;
  detailKey: string;
  detailParams: Record<string, string>;
  evidence?: number;
}

export interface IDiagnosis {
  equipmentId: string;
  equipmentName: string;
  severity: EDiagnosisSeverity;
  healthy: boolean;
  findings: IDiagnosisFinding[];
  summaryKey: string;
  summaryParams: Record<string, string>;
  trend?: ISignalTrend;
}

export interface IDiagnoseInput {
  definition: TEquipmentDefinition;
  state: TEquipmentState;
  history: number[];
  plcStatus: EPlcStatus;
  commands: ICommandLogEntry[];
}

const SEVERITY_RANK: Record<EDiagnosisSeverity, number> = {
  [EDiagnosisSeverity.Ok]: 0,
  [EDiagnosisSeverity.Info]: 1,
  [EDiagnosisSeverity.Warning]: 2,
  [EDiagnosisSeverity.Critical]: 3,
};

const REJECTED_WINDOW_MS = 10 * 60 * 1000;
const REJECTED_THRESHOLD = 2;

const worstOf = (severities: EDiagnosisSeverity[]): EDiagnosisSeverity =>
  severities.reduce<EDiagnosisSeverity>(
    (worst, current) =>
      SEVERITY_RANK[current] > SEVERITY_RANK[worst] ? current : worst,
    EDiagnosisSeverity.Ok,
  );

const fmt = (value: number, digits = 0): string =>
  value.toLocaleString("fa-IR", { maximumFractionDigits: digits });

const sensorMetricKey = (metric: ESensorMetric): string => {
  switch (metric) {
    case ESensorMetric.Temperature:
      return "sensor-temperature";
    case ESensorMetric.Pressure:
      return "sensor-pressure";
    case ESensorMetric.Level:
      return "sensor-level";
    case ESensorMetric.Flow:
      return "sensor-flow";
    case ESensorMetric.Vibration:
      return "sensor-vibration";
  }
};

const sensorFindings = (
  definition: Extract<TEquipmentDefinition, { kind: EEquipmentKind.Sensor }>,
  state: Extract<TEquipmentState, { kind: EEquipmentKind.Sensor }>,
  trend: ISignalTrend,
): IDiagnosisFinding[] => {
  const findings: IDiagnosisFinding[] = [];
  const metricKey = sensorMetricKey(definition.metric);

  if (state.value >= definition.criticalAt) {
    findings.push({
      id: "sensor-critical",
      severity: EDiagnosisSeverity.Critical,
      titleKey: "ai-finding-sensor-critical-title",
      detailKey: "ai-finding-sensor-critical-detail",
      detailParams: {
        metric: metricKey,
        value: fmt(state.value, 1),
        unit: definition.unit,
        threshold: fmt(definition.criticalAt),
      },
      evidence: state.value,
    });
    return findings;
  }

  if (state.value >= definition.warningAt) {
    findings.push({
      id: "sensor-warning",
      severity: EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-sensor-warning-title",
      detailKey: "ai-finding-sensor-warning-detail",
      detailParams: {
        metric: metricKey,
        value: fmt(state.value, 1),
        unit: definition.unit,
        threshold: fmt(definition.warningAt),
      },
      evidence: state.value,
    });
  }

  const projection = projectSamplesUntil(trend, definition.criticalAt);
  if (
    state.value < definition.criticalAt &&
    projection !== null &&
    projection <= 300
  ) {
    const minutes = Math.max(1, Math.round(projection / 60));
    findings.push({
      id: "sensor-projecting",
      severity:
        projection <= 120
          ? EDiagnosisSeverity.Critical
          : EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-projecting-title",
      detailKey: "ai-finding-projecting-detail",
      detailParams: {
        metric: metricKey,
        minutes: fmt(minutes),
        threshold: fmt(definition.criticalAt),
        unit: definition.unit,
      },
      evidence: projection,
    });
  }

  if (trend.zScore >= 3 && trend.direction === "stable") {
    findings.push({
      id: "sensor-spike",
      severity: EDiagnosisSeverity.Info,
      titleKey: "ai-finding-spike-title",
      detailKey: "ai-finding-spike-detail",
      detailParams: {
        metric: metricKey,
        value: fmt(state.value, 1),
        unit: definition.unit,
        mean: fmt(trend.mean, 1),
      },
      evidence: trend.zScore,
    });
  }

  return findings;
};

const motorFindings = (
  definition: Extract<TEquipmentDefinition, { kind: EEquipmentKind.Motor }>,
  state: Extract<TEquipmentState, { kind: EEquipmentKind.Motor }>,
  trend: ISignalTrend,
): IDiagnosisFinding[] => {
  const findings: IDiagnosisFinding[] = [];

  if (state.running && state.currentA > definition.ratedCurrentA) {
    const overPercent = Math.round(
      ((state.currentA - definition.ratedCurrentA) / definition.ratedCurrentA) *
        100,
    );
    findings.push({
      id: "motor-overcurrent",
      severity: EDiagnosisSeverity.Critical,
      titleKey: "ai-finding-overcurrent-title",
      detailKey: "ai-finding-overcurrent-detail",
      detailParams: {
        value: fmt(state.currentA, 1),
        rated: fmt(definition.ratedCurrentA),
        percent: fmt(overPercent),
      },
      evidence: state.currentA,
    });
  }

  if (state.windingTempC >= 90) {
    findings.push({
      id: "motor-winding-hot",
      severity:
        state.windingTempC >= 110
          ? EDiagnosisSeverity.Critical
          : EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-winding-title",
      detailKey: "ai-finding-winding-detail",
      detailParams: {
        value: fmt(state.windingTempC),
        direction:
          trend.direction === "rising"
            ? "ai-direction-rising"
            : "ai-direction-steady",
      },
      evidence: state.windingTempC,
    });
  }

  if (!state.running && state.speedPercent > 5) {
    findings.push({
      id: "motor-nominal",
      severity: EDiagnosisSeverity.Info,
      titleKey: "ai-finding-stopping-title",
      detailKey: "ai-finding-stopping-detail",
      detailParams: { value: fmt(state.speedPercent) },
      evidence: state.speedPercent,
    });
  }

  return findings;
};

const pumpFindings = (
  state: Extract<TEquipmentState, { kind: EEquipmentKind.Pump }>,
  trend: ISignalTrend,
): IDiagnosisFinding[] => {
  const findings: IDiagnosisFinding[] = [];

  if (state.running && state.flowLpm < 5) {
    findings.push({
      id: "pump-deadhead",
      severity: EDiagnosisSeverity.Critical,
      titleKey: "ai-finding-deadhead-title",
      detailKey: "ai-finding-deadhead-detail",
      detailParams: {
        flow: fmt(state.flowLpm, 1),
        pressure: fmt(state.pressureBar, 1),
      },
      evidence: state.flowLpm,
    });
  } else if (state.running && state.pressureBar > 6) {
    findings.push({
      id: "pump-high-pressure",
      severity: EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-highpressure-title",
      detailKey: "ai-finding-highpressure-detail",
      detailParams: { pressure: fmt(state.pressureBar, 1) },
      evidence: state.pressureBar,
    });
  }

  if (state.running && trend.direction === "falling" && trend.slope < -0.5) {
    findings.push({
      id: "pump-flow-falling",
      severity: EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-flowfalling-title",
      detailKey: "ai-finding-flowfalling-detail",
      detailParams: { value: fmt(state.flowLpm, 1) },
      evidence: trend.slope,
    });
  }

  return findings;
};

const valveFindings = (
  state: Extract<TEquipmentState, { kind: EEquipmentKind.Valve }>,
): IDiagnosisFinding[] => {
  if (!state.open || state.positionPercent <= 5) {
    return [
      {
        id: "valve-closed",
        severity: EDiagnosisSeverity.Warning,
        titleKey: "ai-finding-valveclosed-title",
        detailKey: "ai-finding-valveclosed-detail",
        detailParams: { position: fmt(state.positionPercent) },
        evidence: state.positionPercent,
      },
    ];
  }
  return [];
};

const conveyorFindings = (
  state: Extract<TEquipmentState, { kind: EEquipmentKind.Conveyor }>,
): IDiagnosisFinding[] => {
  if (state.running && state.speedMps < 0.1) {
    return [
      {
        id: "conveyor-stalled",
        severity: EDiagnosisSeverity.Critical,
        titleKey: "ai-finding-stalled-title",
        detailKey: "ai-finding-stalled-detail",
        detailParams: { speed: fmt(state.speedMps, 2) },
        evidence: state.speedMps,
      },
    ];
  }
  if (state.running && state.loadPercent > 95) {
    return [
      {
        id: "conveyor-overload",
        severity: EDiagnosisSeverity.Warning,
        titleKey: "ai-finding-overload-title",
        detailKey: "ai-finding-overload-detail",
        detailParams: { load: fmt(state.loadPercent) },
        evidence: state.loadPercent,
      },
    ];
  }
  return [];
};

const lightFindings = (
  state: Extract<TEquipmentState, { kind: EEquipmentKind.Light }>,
): IDiagnosisFinding[] => {
  if (state.on && state.brightness < 5) {
    return [
      {
        id: "light-dead",
        severity: EDiagnosisSeverity.Warning,
        titleKey: "ai-finding-lightdead-title",
        detailKey: "ai-finding-lightdead-detail",
        detailParams: { brightness: fmt(state.brightness) },
        evidence: state.brightness,
      },
    ];
  }
  return [];
};

const heaterFindings = (
  state: Extract<TEquipmentState, { kind: EEquipmentKind.Heater }>,
): IDiagnosisFinding[] => {
  const findings: IDiagnosisFinding[] = [];
  const gap = state.targetTempC - state.currentTempC;

  if (state.on && gap > 120) {
    findings.push({
      id: "heater-lagging",
      severity: EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-heaterlag-title",
      detailKey: "ai-finding-heaterlag-detail",
      detailParams: {
        current: fmt(state.currentTempC),
        target: fmt(state.targetTempC),
        gap: fmt(gap),
      },
      evidence: gap,
    });
  }

  return findings;
};

export const diagnoseEquipment = ({
  definition,
  state,
  history,
  plcStatus,
  commands,
}: IDiagnoseInput): IDiagnosis => {
  const trend = analyzeSignal(history);
  const findings: IDiagnosisFinding[] = [];

  if (!state.online || plcStatus === EPlcStatus.Offline) {
    findings.push({
      id: "offline",
      severity: EDiagnosisSeverity.Critical,
      titleKey: "ai-finding-offline-title",
      detailKey: "ai-finding-offline-detail",
      detailParams: {},
    });
  } else if (plcStatus === EPlcStatus.Degraded) {
    findings.push({
      id: "plc-degraded",
      severity: EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-plcdegraded-title",
      detailKey: "ai-finding-plcdegraded-detail",
      detailParams: {},
    });
  }

  if (state.online) {
    if (
      definition.kind === EEquipmentKind.Sensor &&
      state.kind === EEquipmentKind.Sensor
    ) {
      findings.push(...sensorFindings(definition, state, trend));
    }
    if (
      definition.kind === EEquipmentKind.Motor &&
      state.kind === EEquipmentKind.Motor
    ) {
      findings.push(...motorFindings(definition, state, trend));
    }
    if (
      definition.kind === EEquipmentKind.Pump &&
      state.kind === EEquipmentKind.Pump
    ) {
      findings.push(...pumpFindings(state, trend));
    }
    if (
      definition.kind === EEquipmentKind.Heater &&
      state.kind === EEquipmentKind.Heater
    ) {
      findings.push(...heaterFindings(state));
    }
    if (
      definition.kind === EEquipmentKind.Valve &&
      state.kind === EEquipmentKind.Valve
    ) {
      findings.push(...valveFindings(state));
    }
    if (
      definition.kind === EEquipmentKind.Conveyor &&
      state.kind === EEquipmentKind.Conveyor
    ) {
      findings.push(...conveyorFindings(state));
    }
    if (
      definition.kind === EEquipmentKind.Light &&
      state.kind === EEquipmentKind.Light
    ) {
      findings.push(...lightFindings(state));
    }
  }

  const now = Date.now();
  const rejected = commands.filter(
    (entry) =>
      entry.equipmentId === definition.id &&
      entry.status === ECommandStatus.Rejected &&
      now - entry.createdAt <= REJECTED_WINDOW_MS,
  ).length;

  if (rejected >= REJECTED_THRESHOLD) {
    findings.push({
      id: "command-rejected",
      severity: EDiagnosisSeverity.Warning,
      titleKey: "ai-finding-rejected-title",
      detailKey: "ai-finding-rejected-detail",
      detailParams: { count: fmt(rejected) },
      evidence: rejected,
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "healthy",
      severity: EDiagnosisSeverity.Ok,
      titleKey: "ai-finding-healthy-title",
      detailKey: "ai-finding-healthy-detail",
      detailParams: { value: fmt(trend.latest, 1) },
    });
  }

  const severity = worstOf(findings.map((item) => item.severity));

  return {
    equipmentId: definition.id,
    equipmentName: definition.name,
    severity,
    healthy: severity === EDiagnosisSeverity.Ok,
    findings,
    summaryKey:
      severity === EDiagnosisSeverity.Ok
        ? "ai-summary-healthy"
        : severity === EDiagnosisSeverity.Info
          ? "ai-summary-info"
          : severity === EDiagnosisSeverity.Warning
            ? "ai-summary-warning"
            : "ai-summary-critical",
    summaryParams: {
      name: definition.name,
      count: fmt(findings.length),
    },
    trend,
  };
};
