import { describe, expect, it } from "vitest";

import { ECommandAction } from "@dto/command.dto";
import {
  EEquipmentKind,
  ESensorMetric,
  type IMotorDefinition,
  type IMotorState,
  type ISensorDefinition,
  type ISensorState,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";
import { EPlcStatus } from "@dto/factory.dto";

import { parseIntent } from "./assistant";
import type { IParseContext } from "./assistant";
import { EDiagnosisSeverity, diagnoseEquipment } from "./diagnose";
import { analyzeEquipmentRootCause } from "./root-cause";
import { analyzeSignal, projectSamplesUntil } from "./signal-analysis";

const sensorDef: ISensorDefinition = {
  id: "sensor-temp",
  lineId: "line-1",
  plcId: "plc-1",
  name: "سنسور دمای برج",
  zone: "واحد ۲",
  kind: EEquipmentKind.Sensor,
  metric: ESensorMetric.Temperature,
  unit: "°C",
  min: 0,
  max: 400,
  warningAt: 300,
  criticalAt: 350,
  layout: { x: 0, y: 0 },
};

const motorDef: IMotorDefinition = {
  id: "motor-main",
  lineId: "line-1",
  plcId: "plc-1",
  name: "موتور نورد اصلی",
  zone: "سالن ۱",
  kind: EEquipmentKind.Motor,
  ratedRpm: 1480,
  ratedCurrentA: 320,
  layout: { x: 0, y: 0 },
};

const sensorState = (value: number): ISensorState => ({
  kind: EEquipmentKind.Sensor,
  metric: ESensorMetric.Temperature,
  value,
  online: true,
  updatedAt: Date.now(),
});

const motorState = (over: Partial<IMotorState> = {}): IMotorState => ({
  kind: EEquipmentKind.Motor,
  running: true,
  speedPercent: 72,
  rpm: 1065,
  currentA: 200,
  windingTempC: 58,
  online: true,
  updatedAt: Date.now(),
  ...over,
});

const rising = (start: number, step: number, count = 60) =>
  Array.from({ length: count }, (_, index) => start + index * step);

describe("analyzeSignal", () => {
  it("is flat and stable for a constant series", () => {
    const trend = analyzeSignal(Array(60).fill(100));
    expect(trend.slope).toBe(0);
    expect(trend.direction).toBe("stable");
    expect(trend.volatility).toBe(0);
  });

  it("recovers an exact least-squares slope", () => {
    const trend = analyzeSignal(rising(600, 5));
    expect(trend.slope).toBeCloseTo(5, 6);
    expect(trend.direction).toBe("rising");
  });

  it("detects a falling series", () => {
    const trend = analyzeSignal(rising(900, -5));
    expect(trend.direction).toBe("falling");
  });

  it("handles empty and single-sample input without throwing", () => {
    expect(analyzeSignal([]).sampleCount).toBe(0);
    expect(analyzeSignal([42]).latest).toBe(42);
  });

  it("projects samples until a threshold", () => {
    const trend = analyzeSignal(rising(600, 5));
    expect(projectSamplesUntil(trend, 900)).toBe(1);
    expect(projectSamplesUntil(trend, 100)).toBeNull();
  });
});

describe("diagnoseEquipment", () => {
  const base = {
    plcStatus: EPlcStatus.Online,
    commands: [],
  };

  it("reports healthy for a sensor inside range", () => {
    const diagnosis = diagnoseEquipment({
      ...base,
      definition: sensorDef,
      state: sensorState(120),
      history: Array(60).fill(120),
    });
    expect(diagnosis.healthy).toBe(true);
    expect(diagnosis.severity).toBe(EDiagnosisSeverity.Ok);
  });

  it("escalates to critical past the critical threshold", () => {
    const diagnosis = diagnoseEquipment({
      ...base,
      definition: sensorDef,
      state: sensorState(360),
      history: Array(60).fill(360),
    });
    expect(diagnosis.severity).toBe(EDiagnosisSeverity.Critical);
    expect(diagnosis.findings.some((f) => f.id === "sensor-critical")).toBe(true);
  });

  it("warns on a rising trend approaching the limit", () => {
    const history = rising(250, 1.2);
    const diagnosis = diagnoseEquipment({
      ...base,
      definition: sensorDef,
      state: sensorState(history[history.length - 1]),
      history,
    });
    expect(diagnosis.findings.some((f) => f.id === "sensor-projecting")).toBe(
      true,
    );
  });

  it("flags motor overcurrent against the rated value", () => {
    const diagnosis = diagnoseEquipment({
      ...base,
      definition: motorDef,
      state: motorState({ currentA: 400 }),
      history: Array(60).fill(1065),
    });
    expect(diagnosis.findings.some((f) => f.id === "motor-overcurrent")).toBe(
      true,
    );
  });

  it("flags repeated rejected commands", () => {
    const now = Date.now();
    const diagnosis = diagnoseEquipment({
      ...base,
      definition: motorDef,
      state: motorState(),
      history: Array(60).fill(1065),
      commands: [
        {
          id: "c1",
          equipmentId: motorDef.id,
          equipmentName: motorDef.name,
          lineId: motorDef.lineId,
          action: ECommandAction.Start,
          detail: "",
          status: "rejected" as never,
          actorName: "x",
          createdAt: now - 1000,
        },
        {
          id: "c2",
          equipmentId: motorDef.id,
          equipmentName: motorDef.name,
          lineId: motorDef.lineId,
          action: ECommandAction.Start,
          detail: "",
          status: "rejected" as never,
          actorName: "x",
          createdAt: now - 2000,
        },
      ],
    });
    expect(diagnosis.findings.some((f) => f.id === "command-rejected")).toBe(
      true,
    );
  });

  it("reports offline when the PLC is down", () => {
    const diagnosis = diagnoseEquipment({
      ...base,
      plcStatus: EPlcStatus.Offline,
      definition: motorDef,
      state: { ...motorState(), online: false },
      history: [],
    });
    expect(diagnosis.severity).toBe(EDiagnosisSeverity.Critical);
    expect(diagnosis.findings.some((f) => f.id === "offline")).toBe(true);
  });
});

describe("parseIntent", () => {
  const context: IParseContext = {
    equipment: [sensorDef, motorDef],
    lineNames: [{ id: "line-1", name: "خط نورد گرم" }],
  };

  it("parses a factory status question", () => {
    expect(parseIntent("وضعیت کارخانه چطور است؟", context).kind).toBe("status");
  });

  it("parses an alarm question", () => {
    expect(parseIntent("چه هشدارهایی فعال است؟", context).kind).toBe("alarms");
  });

  it("parses a shift report request", () => {
    expect(parseIntent("گزارش شیفت بده", context).kind).toBe("report");
  });

  it("parses a diagnose request for a named equipment", () => {
    const intent = parseIntent("موتور نورد اصلی را عیب‌یابی کن", context);
    expect(intent).toMatchObject({ kind: "diagnose", equipmentId: "motor-main" });
  });

  it("parses a stop command", () => {
    const intent = parseIntent("موتور نورد اصلی را خاموش کن", context);
    expect(intent).toMatchObject({
      kind: "command",
      equipmentId: "motor-main",
      action: ECommandAction.Stop,
    });
  });

  it("parses a percentage into a set-speed command", () => {
    const intent = parseIntent("سرعت موتور نورد اصلی را ۴۵ درصد کن", context);
    expect(intent).toMatchObject({
      kind: "command",
      action: ECommandAction.SetSpeed,
      value: 45,
    });
  });

  it("maps start to turnOn for heaters", () => {
    const heater: IParseContext["equipment"][number] = {
      ...motorDef,
      id: "heater-1",
      name: "کوره پیش‌گرم",
      kind: EEquipmentKind.Heater,
      maxTempC: 1150,
    };
    const intent = parseIntent("کوره پیش‌گرم را روشن کن", {
      ...context,
      equipment: [heater],
    });
    expect(intent).toMatchObject({ action: ECommandAction.TurnOn });
  });

  it("returns help for unknown input", () => {
    expect(parseIntent("سلام خوبی", context).kind).toBe("help");
  });
});

describe("analyzeEquipmentRootCause", () => {
  const pipes = [
    { from: "pump-1", to: "valve-1" },
    { from: "valve-1", to: "motor-1" },
    { from: "motor-1", to: "temp-1" },
  ];

  const definitions: TEquipmentDefinition[] = [
    {
      id: "temp-1",
      lineId: "line-1",
      plcId: "plc-1",
      name: "سنسور دما",
      zone: "z",
      kind: EEquipmentKind.Sensor,
      metric: ESensorMetric.Temperature,
      unit: "°C",
      min: 0,
      max: 900,
      warningAt: 700,
      criticalAt: 800,
      layout: { x: 0, y: 0 },
    },
    {
      id: "valve-1",
      lineId: "line-1",
      plcId: "plc-1",
      name: "شیر خنک‌کننده",
      zone: "z",
      kind: EEquipmentKind.Valve,
      ratedFlowLpm: 200,
      layout: { x: 0, y: 0 },
    },
    {
      id: "pump-1",
      lineId: "line-1",
      plcId: "plc-1",
      name: "پمپ آب",
      zone: "z",
      kind: EEquipmentKind.Pump,
      ratedFlowLpm: 240,
      layout: { x: 0, y: 0 },
    },
    {
      id: "motor-1",
      lineId: "line-1",
      plcId: "plc-1",
      name: "موتور نورد",
      zone: "z",
      kind: EEquipmentKind.Motor,
      ratedRpm: 1400,
      ratedCurrentA: 300,
      layout: { x: 0, y: 0 },
    },
  ];

  const baseStates = (): Record<string, TEquipmentState> => ({
    "temp-1": { ...sensorState(500) } as TEquipmentState,
    "valve-1": {
      kind: EEquipmentKind.Valve,
      open: true,
      positionPercent: 60,
      flowLpm: 120,
      online: true,
      updatedAt: Date.now(),
    },
    "pump-1": {
      kind: EEquipmentKind.Pump,
      running: true,
      speedPercent: 60,
      flowLpm: 120,
      pressureBar: 3,
      online: true,
      updatedAt: Date.now(),
    },
    "motor-1": { ...motorState() } as TEquipmentState,
  });

  it("blames a closed upstream valve for a sensor alarm", () => {
    const states = baseStates();
    states["temp-1"] = sensorState(850) as TEquipmentState;
    states["valve-1"] = {
      kind: EEquipmentKind.Valve,
      open: false,
      positionPercent: 0,
      flowLpm: 0,
      online: true,
      updatedAt: Date.now(),
    };

    const result = analyzeEquipmentRootCause({
      equipmentId: "temp-1",
      definitions,
      states,
      pipes,
    });

    expect(result.hasSignal).toBe(true);
    expect(result.direction).toBe("upstream");
    expect(result.confidence).toBe("high");
    expect(result.suspectedEquipmentId).toBe("valve-1");
    expect(result.remedies.some((item) => item.command)).toBe(true);
  });

  it("reports an isolated fault when upstream is healthy", () => {
    const states = baseStates();
    states["temp-1"] = sensorState(850) as TEquipmentState;

    const result = analyzeEquipmentRootCause({
      equipmentId: "temp-1",
      definitions,
      states,
      pipes,
    });

    expect(result.hasSignal).toBe(true);
    expect(result.direction).toBe("downstream");
    expect(result.suspectedEquipmentId).toBeUndefined();
  });

  it("treats a stopped actuator as its own root cause", () => {
    const states = baseStates();
    states["motor-1"] = { ...motorState(), running: false } as TEquipmentState;

    const result = analyzeEquipmentRootCause({
      equipmentId: "motor-1",
      definitions,
      states,
      pipes,
    });

    expect(result.direction).toBe("self");
    expect(result.suspectedEquipmentId).toBe("motor-1");
  });

  it("returns no signal for healthy equipment", () => {
    const result = analyzeEquipmentRootCause({
      equipmentId: "temp-1",
      definitions,
      states: baseStates(),
      pipes,
    });

    expect(result.hasSignal).toBe(false);
    expect(result.direction).toBe("none");
  });
});
