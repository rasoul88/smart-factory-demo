import {
  EEquipmentKind,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";

import { formatDecimal, formatNumber } from "@utils/format/format";

export interface IReadout {
  labelKey: string;
  value: string;
  unit?: string;
}

export const equipmentReadouts = (
  definition: TEquipmentDefinition,
  state: TEquipmentState,
): IReadout[] => {
  switch (state.kind) {
    case EEquipmentKind.Motor:
      return [
        {
          labelKey: "metric-speed",
          value: formatNumber(state.speedPercent),
          unit: "٪",
        },
        { labelKey: "metric-rpm", value: formatNumber(state.rpm), unit: "rpm" },
        {
          labelKey: "metric-current",
          value: formatDecimal(state.currentA),
          unit: "A",
        },
        {
          labelKey: "metric-winding-temp",
          value: formatNumber(state.windingTempC),
          unit: "°C",
        },
      ];
    case EEquipmentKind.Pump:
      return [
        {
          labelKey: "metric-speed",
          value: formatNumber(state.speedPercent),
          unit: "٪",
        },
        {
          labelKey: "metric-flow",
          value: formatNumber(state.flowLpm),
          unit: "L/min",
        },
        {
          labelKey: "metric-pressure",
          value: formatDecimal(state.pressureBar),
          unit: "bar",
        },
      ];
    case EEquipmentKind.Valve:
      return [
        {
          labelKey: "metric-position",
          value: formatNumber(state.positionPercent),
          unit: "٪",
        },
        {
          labelKey: "metric-flow",
          value: formatNumber(state.flowLpm),
          unit: "L/min",
        },
      ];
    case EEquipmentKind.Heater:
      return [
        {
          labelKey: "metric-temp",
          value: formatNumber(state.currentTempC),
          unit: "°C",
        },
        {
          labelKey: "metric-target-temp",
          value: formatNumber(state.targetTempC),
          unit: "°C",
        },
        {
          labelKey: "metric-power",
          value: formatDecimal(state.powerKw),
          unit: "kW",
        },
      ];
    case EEquipmentKind.Light:
      return [
        {
          labelKey: "metric-brightness",
          value: formatNumber(state.brightness),
          unit: "٪",
        },
        { labelKey: "metric-lux", value: formatNumber(state.lux), unit: "lux" },
      ];
    case EEquipmentKind.Conveyor:
      return [
        {
          labelKey: "metric-speed-mps",
          value: formatDecimal(state.speedMps),
          unit: "m/s",
        },
        {
          labelKey: "metric-load",
          value: formatNumber(state.loadPercent),
          unit: "٪",
        },
      ];
    case EEquipmentKind.Sensor:
      return [
        {
          labelKey: "metric-value",
          value: formatDecimal(state.value),
          unit: definition.kind === EEquipmentKind.Sensor ? definition.unit : "",
        },
      ];
  }
};

export const primaryReadout = (
  definition: TEquipmentDefinition,
  state: TEquipmentState,
): IReadout => equipmentReadouts(definition, state)[0];

export const primaryMetricKey = (definition: TEquipmentDefinition): string => {
  switch (definition.kind) {
    case EEquipmentKind.Motor:
      return "metric-rpm";
    case EEquipmentKind.Pump:
      return "metric-flow";
    case EEquipmentKind.Valve:
      return "metric-position";
    case EEquipmentKind.Heater:
      return "metric-temp";
    case EEquipmentKind.Light:
      return "metric-lux";
    case EEquipmentKind.Conveyor:
      return "metric-speed-mps";
    case EEquipmentKind.Sensor:
      return "metric-value";
  }
};
