import { createStore } from "zustand";

import {
  ECommandAction,
  ECommandStatus,
  type ICommandLogEntry,
} from "@dto/command.dto";

import type { ICommandStore } from "./commands.model";

const MAX_LOG = 120;

const seedLog: ICommandLogEntry[] = [
  {
    id: "log-seed-1",
    equipmentId: "eq-dist-feed-pump",
    equipmentName: "پمپ خوراک",
    lineId: "line-distillation",
    action: ECommandAction.SetSpeed,
    detail: "۶۵٪",
    status: ECommandStatus.Executed,
    actorName: "مهندس رضا کریمی",
    createdAt: Date.now() - 1000 * 60 * 14,
  },
  {
    id: "log-seed-2",
    equipmentId: "eq-rolling-furnace",
    equipmentName: "کوره پیش‌گرم",
    lineId: "line-rolling",
    action: ECommandAction.SetTemperature,
    detail: "۸۲۰ °C",
    status: ECommandStatus.Executed,
    actorName: "مهندس رضا کریمی",
    createdAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: "log-seed-3",
    equipmentId: "eq-dew-main-valve",
    equipmentName: "شیر اصلی",
    lineId: "line-dewatering",
    action: ECommandAction.SetPosition,
    detail: "۴۰٪",
    status: ECommandStatus.Rejected,
    actorName: "مهندس رضا کریمی",
    createdAt: Date.now() - 1000 * 60 * 96,
  },
];

export const commandStore = createStore<ICommandStore>()((set) => ({
  log: seedLog,
  pendingByEquipment: {},
  append: (entry) =>
    set((store) => ({ log: [entry, ...store.log].slice(0, MAX_LOG) })),
  patchStatus: (id, status) =>
    set((store) => ({
      log: store.log.map((entry) =>
        entry.id === id ? { ...entry, status } : entry,
      ),
    })),
  markPending: (equipmentId) =>
    set((store) => ({
      pendingByEquipment: {
        ...store.pendingByEquipment,
        [equipmentId]: (store.pendingByEquipment[equipmentId] ?? 0) + 1,
      },
    })),
  clearPending: (equipmentId) =>
    set((store) => {
      const next = { ...store.pendingByEquipment };
      const count = (next[equipmentId] ?? 0) - 1;
      if (count > 0) next[equipmentId] = count;
      else delete next[equipmentId];
      return { pendingByEquipment: next };
    }),
}));
