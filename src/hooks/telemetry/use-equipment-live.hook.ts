import { useStore } from "zustand";

import { telemetryStore } from "@store/telemetry/telemetry.store";

import type { TEquipmentState } from "@dto/equipment.dto";

export const useEquipmentLive = (equipmentId: string): TEquipmentState =>
  useStore(telemetryStore, (state) => state.states[equipmentId]);

export const usePlcStatuses = () =>
  useStore(telemetryStore, (state) => state.plcStatus);

export const usePlcRtt = () => useStore(telemetryStore, (state) => state.plcRtt);

export const useEquipmentHistory = (equipmentId: string): number[] =>
  useStore(telemetryStore, (state) => state.history[equipmentId] ?? []);
