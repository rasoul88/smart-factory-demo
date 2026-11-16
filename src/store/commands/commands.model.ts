import type { ICommandLogEntry } from "@dto/command.dto";
import type { ECommandStatus } from "@dto/command.dto";

export interface ICommandStore {
  log: ICommandLogEntry[];
  pendingByEquipment: Record<string, number>;
  append: (entry: ICommandLogEntry) => void;
  patchStatus: (id: string, status: ECommandStatus) => void;
  markPending: (equipmentId: string) => void;
  clearPending: (equipmentId: string) => void;
}
