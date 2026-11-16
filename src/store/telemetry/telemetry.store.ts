import { createStore } from "zustand";

import { createInitialState } from "@services/mock/initial-state";
import { SEED_EQUIPMENT, SEED_PLCS } from "@services/mock/seed";
import { stepEquipment } from "@services/mock/telemetry-engine";

import { EEquipmentKind, type TEquipmentState } from "@dto/equipment.dto";
import { EPlcStatus } from "@dto/factory.dto";

const HISTORY_LENGTH = 60;

export interface ITelemetryStore {
  states: Record<string, TEquipmentState>;
  history: Record<string, number[]>;
  plcStatus: Record<string, EPlcStatus>;
  plcRtt: Record<string, number>;
  tickCount: number;
  tick: () => void;
  setPlcStatus: (plcId: string, status: EPlcStatus) => void;
}

export const primaryValue = (state: TEquipmentState): number => {
  switch (state.kind) {
    case EEquipmentKind.Motor:
      return state.rpm;
    case EEquipmentKind.Pump:
      return state.flowLpm;
    case EEquipmentKind.Valve:
      return state.positionPercent;
    case EEquipmentKind.Heater:
      return state.currentTempC;
    case EEquipmentKind.Light:
      return state.lux;
    case EEquipmentKind.Conveyor:
      return state.speedMps;
    case EEquipmentKind.Sensor:
      return state.value;
  }
};

const isActuatorRunning = (state: TEquipmentState): boolean => {
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
      return false;
  }
};

const initialState = Object.fromEntries(
  SEED_EQUIPMENT.map((definition) => [
    definition.id,
    createInitialState(definition),
  ]),
);

const initialHistory = Object.fromEntries(
  SEED_EQUIPMENT.map((definition) => {
    const seedValue = primaryValue(initialState[definition.id]);
    const warmup = Array.from({ length: HISTORY_LENGTH }, (_, index) => {
      const wave = Math.sin(index / 4) * seedValue * 0.02;
      return seedValue + wave;
    });
    return [definition.id, warmup];
  }),
);

const initialPlcStatus = Object.fromEntries(
  SEED_PLCS.map((plc) => [plc.id, EPlcStatus.Online]),
);

const initialPlcRtt = Object.fromEntries(
  SEED_PLCS.map((plc) => [plc.id, 18 + Math.round(Math.random() * 26)]),
);

export const telemetryStore = createStore<ITelemetryStore>()((set) => ({
  states: initialState,
  history: initialHistory,
  plcStatus: initialPlcStatus,
  plcRtt: initialPlcRtt,
  tickCount: 0,
  tick: () =>
    set((store) => {
      const states: Record<string, TEquipmentState> = {};
      const history: Record<string, number[]> = {};

      const actuatorsByLine = SEED_EQUIPMENT.reduce<
        Record<string, typeof SEED_EQUIPMENT>
      >((acc, item) => {
        if (item.kind === EEquipmentKind.Sensor) return acc;
        acc[item.lineId] = [...(acc[item.lineId] ?? []), item];
        return acc;
      }, {});

      const runningShareByLine = Object.fromEntries(
        Object.entries(actuatorsByLine).map(([lineId, items]) => {
          const running = items.filter((item) => {
            const state = store.states[item.id];
            return state?.online && isActuatorRunning(state);
          }).length;
          const online = items.filter(
            (item) => store.states[item.id]?.online,
          ).length;
          return [lineId, online === 0 ? 0 : running / online];
        }),
      );

      SEED_EQUIPMENT.forEach((definition) => {
        const current = store.states[definition.id];
        const runningShare = current.online
          ? (runningShareByLine[definition.lineId] ?? 0)
          : 0;
        const next = stepEquipment(definition, current, runningShare);
        states[definition.id] = next;

        const samples = store.history[definition.id] ?? [];
        history[definition.id] = [
          ...samples.slice(-(HISTORY_LENGTH - 1)),
          primaryValue(next),
        ];
      });

      const plcRtt = Object.fromEntries(
        Object.entries(store.plcRtt).map(([plcId, rtt]) => {
          const status = store.plcStatus[plcId];
          if (status === EPlcStatus.Offline) return [plcId, 0];
          const base = status === EPlcStatus.Degraded ? 96 : 22;
          const jittered = Math.max(8, rtt + (Math.random() - 0.5) * 10);
          return [plcId, Math.round(jittered * 0.7 + base * 0.3)];
        }),
      );

      return {
        states,
        history,
        plcRtt,
        tickCount: store.tickCount + 1,
      };
    }),
  setPlcStatus: (plcId, status) =>
    set((store) => {
      const online = status !== EPlcStatus.Offline;
      const states = { ...store.states };

      SEED_EQUIPMENT.filter((item) => item.plcId === plcId).forEach((item) => {
        states[item.id] = { ...states[item.id], online };
      });

      return {
        states,
        plcStatus: { ...store.plcStatus, [plcId]: status },
        plcRtt: {
          ...store.plcRtt,
          [plcId]:
            status === EPlcStatus.Offline
              ? 0
              : status === EPlcStatus.Degraded
                ? 118
                : 24,
        },
      };
    }),
}));
