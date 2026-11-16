import { ECommandAction } from "@dto/command.dto";
import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition } from "@dto/equipment.dto";

export interface IScheduleActionOption {
  action: ECommandAction;
  labelKey: string;
  valueRange?: { min: number; max: number; step: number; unit: string };
}

export const scheduleActionsForKind = (
  definition: TEquipmentDefinition,
): IScheduleActionOption[] => {
  switch (definition.kind) {
    case EEquipmentKind.Motor:
      return [
        { action: ECommandAction.Start, labelKey: "control-start" },
        { action: ECommandAction.Stop, labelKey: "control-stop" },
        {
          action: ECommandAction.SetSpeed,
          labelKey: "control-speed",
          valueRange: { min: 0, max: 100, step: 5, unit: "٪" },
        },
      ];
    case EEquipmentKind.Pump:
      return [
        { action: ECommandAction.Start, labelKey: "control-start" },
        { action: ECommandAction.Stop, labelKey: "control-stop" },
        {
          action: ECommandAction.SetSpeed,
          labelKey: "control-speed",
          valueRange: { min: 0, max: 100, step: 5, unit: "٪" },
        },
      ];
    case EEquipmentKind.Conveyor:
      return [
        { action: ECommandAction.Start, labelKey: "control-start" },
        { action: ECommandAction.Stop, labelKey: "control-stop" },
      ];
    case EEquipmentKind.Valve:
      return [
        { action: ECommandAction.Open, labelKey: "control-open" },
        { action: ECommandAction.Close, labelKey: "control-close" },
        {
          action: ECommandAction.SetPosition,
          labelKey: "control-position",
          valueRange: { min: 0, max: 100, step: 5, unit: "٪" },
        },
      ];
    case EEquipmentKind.Heater:
      return [
        { action: ECommandAction.TurnOn, labelKey: "control-turn-on" },
        { action: ECommandAction.TurnOff, labelKey: "control-turn-off" },
        {
          action: ECommandAction.SetTemperature,
          labelKey: "control-temperature",
          valueRange: {
            min: 40,
            max: Math.round(definition.maxTempC),
            step: 10,
            unit: "°C",
          },
        },
      ];
    case EEquipmentKind.Light:
      return [
        { action: ECommandAction.TurnOn, labelKey: "control-turn-on" },
        { action: ECommandAction.TurnOff, labelKey: "control-turn-off" },
        {
          action: ECommandAction.SetBrightness,
          labelKey: "control-brightness",
          valueRange: { min: 0, max: 100, step: 5, unit: "٪" },
        },
      ];
    case EEquipmentKind.Sensor:
      return [];
  }
};

export const actionOptionFor = (
  definition: TEquipmentDefinition,
  action: ECommandAction,
): IScheduleActionOption | undefined =>
  scheduleActionsForKind(definition).find((item) => item.action === action);
