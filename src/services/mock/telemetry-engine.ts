import {
  EEquipmentKind,
  ESensorMetric,
  type IConveyorState,
  type IHeaterState,
  type ILightState,
  type IMotorState,
  type IPumpState,
  type ISensorState,
  type IValveState,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";

const noise = (magnitude: number) => (Math.random() - 0.5) * magnitude;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const glide = (current: number, target: number, rate: number) =>
  current + (target - current) * rate;

const jitterOnline = (state: TEquipmentState): TEquipmentState => ({
  ...state,
  online: true,
  updatedAt: Date.now(),
});

const stepMotor = (state: IMotorState, definition: TEquipmentDefinition) => {
  if (definition.kind !== EEquipmentKind.Motor) return state;

  const nextSpeed = state.running ? state.speedPercent : 0;
  const speedPercent = clamp(glide(state.speedPercent, nextSpeed, 0.24), 0, 100);
  const rpm = clamp(
    glide(state.rpm, (definition.ratedRpm * speedPercent) / 100, 0.22),
    0,
    definition.ratedRpm * 1.05,
  );
  const currentA = clamp(
    glide(state.currentA, (definition.ratedCurrentA * speedPercent) / 100, 0.2) +
      noise(0.5),
    0,
    definition.ratedCurrentA * 1.15,
  );
  const heat = currentA / definition.ratedCurrentA;
  const windingTempC = clamp(
    glide(state.windingTempC, 34 + heat * 62, 0.05) + noise(0.25),
    20,
    140,
  );

  return { ...state, speedPercent, rpm, currentA, windingTempC };
};

const stepPump = (state: IPumpState, definition: TEquipmentDefinition) => {
  if (definition.kind !== EEquipmentKind.Pump) return state;

  const targetSpeed = state.running ? state.speedPercent : 0;
  const speedPercent = clamp(
    glide(state.speedPercent, targetSpeed, 0.24),
    0,
    100,
  );

  return {
    ...state,
    speedPercent,
    flowLpm: clamp(
      (definition.ratedFlowLpm * speedPercent) / 100 + noise(3),
      0,
      definition.ratedFlowLpm * 1.08,
    ),
    pressureBar: clamp(0.4 + (speedPercent / 100) * 5.2 + noise(0.16), 0, 7),
  };
};

const stepValve = (state: IValveState, definition: TEquipmentDefinition) => {
  if (definition.kind !== EEquipmentKind.Valve) return state;

  const targetPosition = state.open ? Math.max(state.positionPercent, 1) : 0;
  const positionPercent = clamp(
    glide(state.positionPercent, targetPosition, 0.3),
    0,
    100,
  );

  return {
    ...state,
    positionPercent,
    flowLpm: clamp(
      (definition.ratedFlowLpm * positionPercent) / 100 + noise(2.5),
      0,
      definition.ratedFlowLpm * 1.05,
    ),
  };
};

const stepHeater = (state: IHeaterState) => {
  const target = state.on ? state.targetTempC : 24;
  const currentTempC = clamp(
    glide(state.currentTempC, target, state.on ? 0.06 : 0.03) + noise(0.18),
    18,
    1500,
  );
  const powerKw = state.on
    ? clamp(
        glide(state.powerKw, 12 + (state.targetTempC / 150) * 22, 0.12),
        0,
        90,
      )
    : clamp(glide(state.powerKw, 0, 0.3), 0, 90);

  return { ...state, currentTempC, powerKw };
};

const stepLight = (state: ILightState, definition: TEquipmentDefinition) => {
  if (definition.kind !== EEquipmentKind.Light) return state;

  const brightness = state.on ? state.brightness : 0;

  return {
    ...state,
    lux: clamp(
      (definition.maxLux * brightness) / 100 + noise(12),
      0,
      definition.maxLux,
    ),
  };
};

const stepConveyor = (
  state: IConveyorState,
  definition: TEquipmentDefinition,
) => {
  if (definition.kind !== EEquipmentKind.Conveyor) return state;

  const targetSpeed = state.running ? definition.maxSpeedMps * 0.7 : 0;
  const speedMps = clamp(
    glide(state.speedMps, targetSpeed, 0.22),
    0,
    definition.maxSpeedMps,
  );

  return {
    ...state,
    speedMps,
    loadPercent: clamp(
      glide(state.loadPercent, state.running ? 56 : 0, 0.18) + noise(1.6),
      0,
      100,
    ),
  };
};

const sensorAmbient: Record<ESensorMetric, number> = {
  [ESensorMetric.Temperature]: 0.38,
  [ESensorMetric.Pressure]: 0.55,
  [ESensorMetric.Level]: 0.52,
  [ESensorMetric.Flow]: 0.58,
  [ESensorMetric.Vibration]: 0.22,
};

const sensorOperating: Record<ESensorMetric, number> = {
  [ESensorMetric.Temperature]: 0.66,
  [ESensorMetric.Pressure]: 0.62,
  [ESensorMetric.Level]: 0.55,
  [ESensorMetric.Flow]: 0.66,
  [ESensorMetric.Vibration]: 0.4,
};

const sensorDrift: Record<ESensorMetric, number> = {
  [ESensorMetric.Temperature]: 0.02,
  [ESensorMetric.Pressure]: 0.05,
  [ESensorMetric.Level]: 0.014,
  [ESensorMetric.Flow]: 0.06,
  [ESensorMetric.Vibration]: 0.11,
};

const stepSensor = (
  state: ISensorState,
  definition: TEquipmentDefinition,
  runningShare: number,
) => {
  if (definition.kind !== EEquipmentKind.Sensor) return state;

  const span = definition.max - definition.min;
  const ambient = sensorAmbient[state.metric];
  const operating = sensorOperating[state.metric];
  const target =
    definition.min + span * (ambient + (operating - ambient) * runningShare);
  const pull = (target - state.value) * 0.05;
  const activity = 0.3 + runningShare * 0.85;
  const next =
    state.value + noise(span * sensorDrift[state.metric] * activity) + pull;

  return { ...state, value: clamp(next, definition.min, definition.max) };
};

export const stepEquipment = (
  definition: TEquipmentDefinition,
  state: TEquipmentState,
  runningShare: number,
): TEquipmentState => {
  if (!state.online) return state;

  const stepped = (() => {
    switch (state.kind) {
      case EEquipmentKind.Motor:
        return stepMotor(state, definition);
      case EEquipmentKind.Pump:
        return stepPump(state, definition);
      case EEquipmentKind.Valve:
        return stepValve(state, definition);
      case EEquipmentKind.Heater:
        return stepHeater(state);
      case EEquipmentKind.Light:
        return stepLight(state, definition);
      case EEquipmentKind.Conveyor:
        return stepConveyor(state, definition);
      case EEquipmentKind.Sensor:
        return stepSensor(state, definition, runningShare);
    }
  })();

  return jitterOnline(stepped);
};
