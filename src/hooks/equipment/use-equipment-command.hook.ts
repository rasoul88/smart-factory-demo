import { useState } from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { IControlContext } from "@components/line/equipment-controls-dispatch.component";

import { useCurrentUser } from "@hooks/auth/use-auth.hook";

import { applyCommandToState, sendCommand } from "@services/mock/command-service";

import { commandStore } from "@store/commands/commands.store";
import { primaryValue, telemetryStore } from "@store/telemetry/telemetry.store";

import { ECommandAction } from "@dto/command.dto";
import type { TEquipmentDefinition, TEquipmentState } from "@dto/equipment.dto";

import { useShallowStore } from "@utils/hooks/use-shallow-store";

interface IUseEquipmentCommand {
  definition: TEquipmentDefinition;
  state?: TEquipmentState;
  disabled: boolean;
}

export const useEquipmentCommand = ({
  definition,
  state,
  disabled,
}: IUseEquipmentCommand): IControlContext => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const { pendingByEquipment } = useShallowStore(commandStore, [
    "pendingByEquipment",
  ]);
  const [submitting, setSubmitting] = useState(false);

  const isPending = submitting || (pendingByEquipment[definition.id] ?? 0) > 0;

  const onCommand = async (action: ECommandAction, value?: number) => {
    if (!state || disabled) return;

    setSubmitting(true);
    const result = await sendCommand({
      definition,
      state,
      action,
      value,
      actorName: user?.name ?? "",
      onApply: (appliedAction, appliedValue) => {
        const current = telemetryStore.getState().states[definition.id];
        const next = applyCommandToState(current, appliedAction, appliedValue);
        const history = telemetryStore.getState().history[definition.id] ?? [];

        telemetryStore.setState((store) => ({
          states: { ...store.states, [definition.id]: next },
          history: {
            ...store.history,
            [definition.id]: [...history.slice(-59), primaryValue(next)],
          },
        }));
      },
    });
    setSubmitting(false);

    if (result.status === "executed") {
      toast.success(t("command-success"), { description: definition.name });
    } else {
      toast.error(t("command-rejected"), { description: definition.name });
    }
  };

  return { disabled, isPending, onCommand };
};
