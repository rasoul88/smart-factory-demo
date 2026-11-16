import {
  EEquipmentKind,
  ESensorMetric,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";
import { ELineStatus, EPlcStatus } from "@dto/factory.dto";

export enum EVisualStatus {
  Running = "running",
  Idle = "idle",
  Warning = "warning",
  Fault = "fault",
  Offline = "offline",
}

export const equipmentStatus = (
  definition: TEquipmentDefinition,
  state: TEquipmentState,
): EVisualStatus => {
  if (!state.online) return EVisualStatus.Offline;

  if (
    definition.kind === EEquipmentKind.Sensor &&
    state.kind === EEquipmentKind.Sensor
  ) {
    if (state.value >= definition.criticalAt) return EVisualStatus.Fault;
    if (state.value >= definition.warningAt) return EVisualStatus.Warning;
    return EVisualStatus.Running;
  }

  switch (state.kind) {
    case EEquipmentKind.Motor:
    case EEquipmentKind.Pump:
    case EEquipmentKind.Conveyor:
      return state.running ? EVisualStatus.Running : EVisualStatus.Idle;
    case EEquipmentKind.Valve:
      return state.open && state.positionPercent > 2
        ? EVisualStatus.Running
        : EVisualStatus.Idle;
    case EEquipmentKind.Heater:
    case EEquipmentKind.Light:
      return state.on ? EVisualStatus.Running : EVisualStatus.Idle;
    default:
      return EVisualStatus.Idle;
  }
};

export const statusLabelKey = (status: EVisualStatus): string => {
  switch (status) {
    case EVisualStatus.Running:
      return "status-running";
    case EVisualStatus.Idle:
      return "status-idle";
    case EVisualStatus.Warning:
      return "status-warning";
    case EVisualStatus.Fault:
      return "status-fault";
    case EVisualStatus.Offline:
      return "status-offline";
  }
};

export const lineStatusVisual = (status: ELineStatus): EVisualStatus => {
  switch (status) {
    case ELineStatus.Running:
      return EVisualStatus.Running;
    case ELineStatus.Idle:
      return EVisualStatus.Idle;
    case ELineStatus.Fault:
      return EVisualStatus.Fault;
    case ELineStatus.Stopped:
      return EVisualStatus.Offline;
  }
};

export const plcStatusVisual = (status: EPlcStatus): EVisualStatus => {
  switch (status) {
    case EPlcStatus.Online:
      return EVisualStatus.Running;
    case EPlcStatus.Degraded:
      return EVisualStatus.Warning;
    case EPlcStatus.Offline:
      return EVisualStatus.Offline;
  }
};

export const kindLabelKey = (kind: EEquipmentKind): string => {
  switch (kind) {
    case EEquipmentKind.Motor:
      return "kind-motor";
    case EEquipmentKind.Pump:
      return "kind-pump";
    case EEquipmentKind.Valve:
      return "kind-valve";
    case EEquipmentKind.Heater:
      return "kind-heater";
    case EEquipmentKind.Light:
      return "kind-light";
    case EEquipmentKind.Sensor:
      return "kind-sensor";
    case EEquipmentKind.Conveyor:
      return "kind-conveyor";
  }
};

export const metricLabelKey = (metric: ESensorMetric): string => {
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

export const statusTextClass = (status: EVisualStatus): string => {
  switch (status) {
    case EVisualStatus.Running:
      return "text-status-running";
    case EVisualStatus.Idle:
      return "text-status-idle";
    case EVisualStatus.Warning:
      return "text-status-warning";
    case EVisualStatus.Fault:
      return "text-status-fault";
    case EVisualStatus.Offline:
      return "text-status-offline";
  }
};

export const statusDotClass = (status: EVisualStatus): string => {
  switch (status) {
    case EVisualStatus.Running:
      return "bg-status-running";
    case EVisualStatus.Idle:
      return "bg-status-idle";
    case EVisualStatus.Warning:
      return "bg-status-warning";
    case EVisualStatus.Fault:
      return "bg-status-fault";
    case EVisualStatus.Offline:
      return "bg-status-offline";
  }
};

export const statusStrokeClass = (status: EVisualStatus): string => {
  switch (status) {
    case EVisualStatus.Running:
      return "stroke-status-running";
    case EVisualStatus.Idle:
      return "stroke-status-idle";
    case EVisualStatus.Warning:
      return "stroke-status-warning";
    case EVisualStatus.Fault:
      return "stroke-status-fault";
    case EVisualStatus.Offline:
      return "stroke-status-offline";
  }
};
