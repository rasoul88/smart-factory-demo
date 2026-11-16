import { EQUIPMENT_BY_LINE } from "@store/telemetry/telemetry.model";

import type { TEquipmentDefinition } from "@dto/equipment.dto";

const ALL_EQUIPMENT: TEquipmentDefinition[] =
  Object.values(EQUIPMENT_BY_LINE).flat();

export const EQUIPMENT_INDEX: Record<string, TEquipmentDefinition> =
  Object.fromEntries(ALL_EQUIPMENT.map((item) => [item.id, item]));

export const equipmentById = (
  equipmentId: string,
): TEquipmentDefinition | undefined => EQUIPMENT_INDEX[equipmentId];
