import { useState } from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCurrentUser } from "@hooks/auth/use-auth.hook";

import {
  applyCommandToTelemetry,
  sendCommand,
} from "@services/mock/command-service";
import { SEED_LINES } from "@services/mock/seed";

import { schedulesStore } from "@store/schedules/schedules.store";
import { equipmentById } from "@store/telemetry/equipment-index";
import { telemetryStore } from "@store/telemetry/telemetry.store";

import type { ISchedule, IScheduleDraft } from "@dto/schedule.dto";

import { useShallowStore } from "@utils/hooks/use-shallow-store";
import { computeNextRun } from "@utils/schedule/schedule-math";

const FACTORY_BY_LINE: Record<string, string> = Object.fromEntries(
  SEED_LINES.map((line) => [line.id, line.factoryId]),
);

export const useScheduleActions = () => {
  const { t } = useTranslation();
  const { user, canCommand } = useCurrentUser();
  const { schedules, add, remove, toggle, markRun } = useShallowStore(
    schedulesStore,
    ["schedules", "add", "remove", "toggle", "markRun"],
  );
  const [runningId, setRunningId] = useState<string>();

  const createSchedule = (draft: IScheduleDraft) => {
    const definition = equipmentById(draft.equipmentId);
    if (!definition) return;

    const now = Date.now();
    const schedule: ISchedule = {
      id: `sch-${now}-${Math.random().toString(16).slice(2, 8)}`,
      equipmentId: draft.equipmentId,
      equipmentName: definition.name,
      lineId: definition.lineId,
      factoryId: FACTORY_BY_LINE[definition.lineId] ?? "",
      action: draft.action,
      value: draft.value,
      mode: draft.mode,
      timeOfDay: draft.timeOfDay,
      daysOfWeek: draft.daysOfWeek,
      runAt: draft.runAt,
      enabled: true,
      nextRunAt: computeNextRun(draft, now),
      createdBy: user?.name ?? "",
      createdAt: now,
    };

    add(schedule);
    toast.success(t("schedule-created"), { description: definition.name });
  };

  const runNow = async (schedule: ISchedule) => {
    const definition = equipmentById(schedule.equipmentId);
    const state = telemetryStore.getState().states[schedule.equipmentId];
    if (!definition || !state) return;

    setRunningId(schedule.id);
    const result = await sendCommand({
      definition,
      state,
      action: schedule.action,
      value: schedule.value,
      actorName: user?.name ?? "",
      onApply: (action, value) => {
        applyCommandToTelemetry(schedule.equipmentId, action, value);
      },
    });
    setRunningId(undefined);

    if (result.status === "executed") {
      markRun(schedule.id, Date.now(), computeNextRun(schedule, Date.now()));
      toast.success(t("schedule-fired"), { description: definition.name });
    }
  };

  const deleteSchedule = (id: string) => {
    remove(id);
    toast.success(t("schedule-deleted"));
  };

  const toggleSchedule = (id: string, enabled: boolean) => {
    toggle(id, enabled);
    toast.success(enabled ? t("schedule-toggled-on") : t("schedule-toggled-off"));
  };

  return {
    schedules,
    canManage: canCommand,
    runningId,
    createSchedule,
    runNow,
    deleteSchedule,
    toggleSchedule,
  };
};
