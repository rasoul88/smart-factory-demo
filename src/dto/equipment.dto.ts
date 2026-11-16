export enum ESensorMetric {
  Temperature = "temperature",
  Pressure = "pressure",
  Level = "level",
  Flow = "flow",
  Vibration = "vibration",
}

export enum EEquipmentKind {
  Motor = "motor",
  Valve = "valve",
  Heater = "heater",
  Light = "light",
  Sensor = "sensor",
  Pump = "pump",
  Conveyor = "conveyor",
}

export interface IEquipmentLayout {
  x: number;
  y: number;
}

interface IEquipmentBase {
  id: string;
  lineId: string;
  plcId: string;
  name: string;
  zone: string;
  layout: IEquipmentLayout;
}

export interface IMotorDefinition extends IEquipmentBase {
  kind: EEquipmentKind.Motor;
  ratedRpm: number;
  ratedCurrentA: number;
}

export interface IPumpDefinition extends IEquipmentBase {
  kind: EEquipmentKind.Pump;
  ratedFlowLpm: number;
}

export interface IValveDefinition extends IEquipmentBase {
  kind: EEquipmentKind.Valve;
  ratedFlowLpm: number;
}

export interface IHeaterDefinition extends IEquipmentBase {
  kind: EEquipmentKind.Heater;
  maxTempC: number;
}

export interface ILightDefinition extends IEquipmentBase {
  kind: EEquipmentKind.Light;
  maxLux: number;
}

export interface IConveyorDefinition extends IEquipmentBase {
  kind: EEquipmentKind.Conveyor;
  maxSpeedMps: number;
}

export interface ISensorDefinition extends IEquipmentBase {
  kind: EEquipmentKind.Sensor;
  metric: ESensorMetric;
  unit: string;
  min: number;
  max: number;
  warningAt: number;
  criticalAt: number;
}

export type TEquipmentDefinition =
  | IMotorDefinition
  | IPumpDefinition
  | IValveDefinition
  | IHeaterDefinition
  | ILightDefinition
  | IConveyorDefinition
  | ISensorDefinition;

interface IEquipmentStateBase {
  online: boolean;
  updatedAt: number;
}

export interface IMotorState extends IEquipmentStateBase {
  kind: EEquipmentKind.Motor;
  running: boolean;
  speedPercent: number;
  rpm: number;
  currentA: number;
  windingTempC: number;
}

export interface IPumpState extends IEquipmentStateBase {
  kind: EEquipmentKind.Pump;
  running: boolean;
  speedPercent: number;
  flowLpm: number;
  pressureBar: number;
}

export interface IValveState extends IEquipmentStateBase {
  kind: EEquipmentKind.Valve;
  open: boolean;
  positionPercent: number;
  flowLpm: number;
}

export interface IHeaterState extends IEquipmentStateBase {
  kind: EEquipmentKind.Heater;
  on: boolean;
  targetTempC: number;
  currentTempC: number;
  powerKw: number;
}

export interface ILightState extends IEquipmentStateBase {
  kind: EEquipmentKind.Light;
  on: boolean;
  brightness: number;
  lux: number;
}

export interface IConveyorState extends IEquipmentStateBase {
  kind: EEquipmentKind.Conveyor;
  running: boolean;
  speedMps: number;
  loadPercent: number;
}

export interface ISensorState extends IEquipmentStateBase {
  kind: EEquipmentKind.Sensor;
  metric: ESensorMetric;
  value: number;
}

export type TEquipmentState =
  | IMotorState
  | IPumpState
  | IValveState
  | IHeaterState
  | ILightState
  | IConveyorState
  | ISensorState;

export type TEquipmentStates = Record<string, TEquipmentState>;

export interface IPipe {
  from: string;
  to: string;
  active: boolean;
}
