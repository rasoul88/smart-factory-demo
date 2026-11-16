import { linesForFactory, schedulableEquipmentForLine } from "./factory-lookup";

export const initialSelectionForFactory = (factoryId: string) => {
  const firstLine = linesForFactory(factoryId)[0];
  const firstEquipment = firstLine
    ? schedulableEquipmentForLine(firstLine.id)[0]
    : undefined;

  return {
    lineId: firstLine?.id ?? "",
    equipmentId: firstEquipment?.id ?? "",
  };
};
