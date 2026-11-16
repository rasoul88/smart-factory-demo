import { EEquipmentKind, type TEquipmentState } from "@dto/equipment.dto";

const isActiveState = (state: TEquipmentState): boolean => {
  if (!state.online) return false;

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

export const pipeIsActive = (
  fromId: string,
  toId: string,
  states: Record<string, TEquipmentState>,
): boolean => {
  const from = states[fromId];
  const to = states[toId];
  if (!from || !to) return false;
  return isActiveState(from) && to.online;
};
