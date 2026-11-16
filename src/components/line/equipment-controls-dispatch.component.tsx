import { useTranslation } from "react-i18next";

import { ECommandAction } from "@dto/command.dto";
import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentState } from "@dto/equipment.dto";

import {
  ConveyorControls,
  HeaterControls,
  LightControls,
  MotorControls,
  PumpControls,
  ValveControls,
} from "./controls/equipment-controls.component";

export interface IControlContext {
  disabled: boolean;
  isPending: boolean;
  onCommand: (action: ECommandAction, value?: number) => void;
}

interface IEquipmentControls {
  state: TEquipmentState;
  context: IControlContext;
}

export const EquipmentControls = ({ state, context }: IEquipmentControls) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-medium text-muted-foreground">
        {t("equipment-controls")}
      </span>

      {state.kind === EEquipmentKind.Motor && (
        <MotorControls state={state} {...context} />
      )}
      {state.kind === EEquipmentKind.Pump && (
        <PumpControls state={state} {...context} />
      )}
      {state.kind === EEquipmentKind.Valve && (
        <ValveControls state={state} {...context} />
      )}
      {state.kind === EEquipmentKind.Heater && (
        <HeaterControls state={state} {...context} />
      )}
      {state.kind === EEquipmentKind.Light && (
        <LightControls state={state} {...context} />
      )}
      {state.kind === EEquipmentKind.Conveyor && (
        <ConveyorControls state={state} {...context} />
      )}
    </div>
  );
};
