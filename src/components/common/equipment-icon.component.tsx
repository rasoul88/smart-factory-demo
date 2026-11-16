import {
  Boxes,
  CircleGauge,
  Cog,
  Flame,
  Lightbulb,
  type LucideIcon,
  MoveRight,
  Waves,
} from "lucide-react";

import { EEquipmentKind } from "@dto/equipment.dto";

import { cn } from "@utils/cn";

const ICONS: Record<EEquipmentKind, LucideIcon> = {
  [EEquipmentKind.Motor]: Cog,
  [EEquipmentKind.Pump]: CircleGauge,
  [EEquipmentKind.Valve]: Boxes,
  [EEquipmentKind.Heater]: Flame,
  [EEquipmentKind.Light]: Lightbulb,
  [EEquipmentKind.Sensor]: Waves,
  [EEquipmentKind.Conveyor]: MoveRight,
};

interface IEquipmentIcon {
  kind: EEquipmentKind;
  className?: string;
}

export const EquipmentIcon = ({ kind, className }: IEquipmentIcon) => {
  const Icon = ICONS[kind];
  return <Icon className={cn("size-4", className)} />;
};
