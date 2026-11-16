import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

import { SEED_FACTORIES } from "@services/mock/seed";

import {
  linesForFactory,
  schedulableEquipmentForLine,
} from "@utils/factory/factory-lookup";

interface IEquipmentPicker {
  factoryId: string;
  lineId: string;
  equipmentId: string;
  onFactoryChange: (factoryId: string) => void;
  onLineChange: (lineId: string) => void;
  onEquipmentChange: (equipmentId: string) => void;
}

export const EquipmentPicker = ({
  factoryId,
  lineId,
  equipmentId,
  onFactoryChange,
  onLineChange,
  onEquipmentChange,
}: IEquipmentPicker) => {
  const { t } = useTranslation();
  const lines = linesForFactory(factoryId);
  const equipment = schedulableEquipmentForLine(lineId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-muted-foreground">
          {t("schedule-factory")}
        </span>
        <Select value={factoryId} onValueChange={onFactoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEED_FACTORIES.map((factory) => (
              <SelectItem key={factory.id} value={factory.id}>
                {factory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-muted-foreground">
          {t("schedule-line")}
        </span>
        <Select value={lineId} onValueChange={onLineChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lines.map((line) => (
              <SelectItem key={line.id} value={line.id}>
                {line.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-muted-foreground">
          {t("schedule-equipment")}
        </span>
        <Select
          value={equipmentId}
          onValueChange={onEquipmentChange}
          disabled={equipment.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {equipment.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
