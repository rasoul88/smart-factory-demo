import { SEED_EQUIPMENT, SEED_PLCS } from "@services/mock/seed";

import type { TEquipmentDefinition } from "@dto/equipment.dto";
import type { EPlcStatus } from "@dto/factory.dto";

export const PLC_BY_ID = Object.fromEntries(
  SEED_PLCS.map((plc) => [plc.id, plc]),
);

export const EQUIPMENT_BY_LINE: Record<string, TEquipmentDefinition[]> =
  SEED_EQUIPMENT.reduce<Record<string, TEquipmentDefinition[]>>((acc, item) => {
    acc[item.lineId] = [...(acc[item.lineId] ?? []), item];
    return acc;
  }, {});

export type TPlcStatusMap = Record<string, EPlcStatus>;
