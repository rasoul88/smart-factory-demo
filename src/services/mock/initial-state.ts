import {
  EEquipmentKind,
  ESensorMetric,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";

export const createInitialState = (
  definition: TEquipmentDefinition,
): TEquipmentState => {
  const base = { online: true, updatedAt: Date.now() };

  switch (definition.kind) {
    case EEquipmentKind.Motor:
      return {
        ...base,
        kind: EEquipmentKind.Motor,
        running: true,
        speedPercent: 72,
        rpm: Math.round(definition.ratedRpm * 0.72),
        currentA: definition.ratedCurrentA * 0.68,
        windingTempC: 58,
      };
    case EEquipmentKind.Pump:
      return {
        ...base,
        kind: EEquipmentKind.Pump,
        running: true,
        speedPercent: 65,
        flowLpm: definition.ratedFlowLpm * 0.62,
        pressureBar: 3.4,
      };
    case EEquipmentKind.Valve:
      return {
        ...base,
        kind: EEquipmentKind.Valve,
        open: true,
        positionPercent: 55,
        flowLpm: definition.ratedFlowLpm * 0.5,
      };
    case EEquipmentKind.Heater:
      return {
        ...base,
        kind: EEquipmentKind.Heater,
        on: true,
        targetTempC: Math.round(definition.maxTempC * 0.62),
        currentTempC: Math.round(definition.maxTempC * 0.58),
        powerKw: 18.4,
      };
    case EEquipmentKind.Light:
      return {
        ...base,
        kind: EEquipmentKind.Light,
        on: true,
        brightness: 78,
        lux: definition.maxLux * 0.78,
      };
    case EEquipmentKind.Conveyor:
      return {
        ...base,
        kind: EEquipmentKind.Conveyor,
        running: true,
        speedMps: definition.maxSpeedMps * 0.66,
        loadPercent: 48,
      };
    case EEquipmentKind.Sensor:
      return {
        ...base,
        kind: EEquipmentKind.Sensor,
        metric: definition.metric,
        value: initialSensorValue(
          definition.metric,
          definition.min,
          definition.max,
        ),
      };
  }
};

const initialSensorValue = (
  metric: ESensorMetric,
  min: number,
  max: number,
): number => {
  const span = max - min;

  switch (metric) {
    case ESensorMetric.Temperature:
      return min + span * 0.63;
    case ESensorMetric.Pressure:
      return min + span * 0.55;
    case ESensorMetric.Level:
      return min + span * 0.52;
    case ESensorMetric.Flow:
      return min + span * 0.58;
    case ESensorMetric.Vibration:
      return min + span * 0.34;
  }
};
