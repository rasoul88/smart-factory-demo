import { SEED_FACTORIES, SEED_LINES } from "@services/mock/seed";

import { EQUIPMENT_INDEX } from "@store/telemetry/equipment-index";

import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition } from "@dto/equipment.dto";
import type { IFactory, IProductLine } from "@dto/factory.dto";

export const FACTORY_BY_ID: Record<string, IFactory> = Object.fromEntries(
  SEED_FACTORIES.map((factory) => [factory.id, factory]),
);

export const LINE_BY_ID: Record<string, IProductLine> = Object.fromEntries(
  SEED_LINES.map((line) => [line.id, line]),
);

export const linesForFactory = (factoryId: string): IProductLine[] =>
  SEED_LINES.filter((line) => line.factoryId === factoryId);

export const schedulableEquipmentForLine = (
  lineId: string,
): TEquipmentDefinition[] =>
  Object.values(EQUIPMENT_INDEX).filter(
    (item) => item.lineId === lineId && item.kind !== EEquipmentKind.Sensor,
  );

export const factoryNameOf = (factoryId: string): string =>
  FACTORY_BY_ID[factoryId]?.name ?? "";

export const lineNameOf = (lineId: string): string =>
  LINE_BY_ID[lineId]?.name ?? "";
