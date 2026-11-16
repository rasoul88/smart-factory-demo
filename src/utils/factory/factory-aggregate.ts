import { EQUIPMENT_BY_LINE, PLC_BY_ID } from "@store/telemetry/telemetry.model";

import {
  EEquipmentKind,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";
import {
  ELineStatus,
  EPlcStatus,
  type IFactory,
  type IProductLine,
} from "@dto/factory.dto";

export const factoryEquipment = (factory: IFactory): TEquipmentDefinition[] =>
  factory.lineIds.flatMap((lineId) => EQUIPMENT_BY_LINE[lineId] ?? []);

export const factoryPlcs = (factory: IFactory) =>
  factory.lineIds.flatMap((lineId) =>
    (EQUIPMENT_BY_LINE[lineId] ?? [])
      .map((item) => PLC_BY_ID[item.plcId])
      .filter((plc): plc is NonNullable<typeof plc> => Boolean(plc)),
  );

export const uniqueFactoryPlcs = (factory: IFactory) =>
  Array.from(new Map(factoryPlcs(factory).map((plc) => [plc.id, plc])).values());

export interface ILineAggregate {
  line: IProductLine;
  status: ELineStatus;
  equipmentCount: number;
  runningCount: number;
  onlineCount: number;
  alarmCount: number;
  plcOnlineCount: number;
  plcCount: number;
}

const isStateActive = (state: TEquipmentState): boolean => {
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

const isStateAlarm = (
  definition: TEquipmentDefinition,
  state: TEquipmentState,
) => {
  if (definition.kind !== EEquipmentKind.Sensor) return false;
  if (state.kind !== EEquipmentKind.Sensor) return false;
  return state.value >= definition.warningAt;
};

export const aggregateLine = (
  line: IProductLine,
  states: Record<string, TEquipmentState>,
  plcStatus: Record<string, EPlcStatus>,
): ILineAggregate => {
  const equipment = EQUIPMENT_BY_LINE[line.id] ?? [];
  const plcOnlineCount = line.plcIds.filter(
    (plcId) => plcStatus[plcId] === EPlcStatus.Online,
  ).length;
  const onlineCount = equipment.filter(
    (item) => states[item.id]?.online !== false,
  ).length;
  const runningCount = equipment.filter((item) => {
    const state = states[item.id];
    return state ? state.online && isStateActive(state) : false;
  }).length;
  const alarmCount = equipment
    .filter((item) => {
      const state = states[item.id];
      return state ? state.online && isStateAlarm(item, state) : false;
    })
    .filter((item) => item.kind === EEquipmentKind.Sensor).length;

  let status = ELineStatus.Running;
  if (onlineCount === 0) status = ELineStatus.Stopped;
  else if (alarmCount > 0) status = ELineStatus.Fault;
  else if (runningCount === 0) status = ELineStatus.Idle;

  return {
    line,
    status,
    equipmentCount: equipment.length,
    runningCount,
    onlineCount,
    alarmCount,
    plcOnlineCount,
    plcCount: line.plcIds.length,
  };
};
