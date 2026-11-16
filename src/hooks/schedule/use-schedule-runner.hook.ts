import { useEffect } from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  applyCommandToTelemetry,
  sendCommand,
} from "@services/mock/command-service";

import { schedulesStore } from "@store/schedules/schedules.store";
import { equipmentById } from "@store/telemetry/equipment-index";
import { telemetryStore } from "@store/telemetry/telemetry.store";

import { SCHEDULE_CLOCK_INTERVAL_MS } from "@utils/constants";
import { computeNextRun, isScheduleDue } from "@utils/schedule/schedule-math";

export const SCHEDULER_ACTOR_NAME = "زمان‌بند خودکار";

export const useScheduleRunner = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const firing = new Set<string>();

    const interval = window.setInterval(() => {
      const now = Date.now();
      const { schedules, markRun } = schedulesStore.getState();

      schedules.forEach((schedule) => {
        if (!isScheduleDue(schedule, now)) return;
        if (firing.has(schedule.id)) return;

        const definition = equipmentById(schedule.equipmentId);
        const state = telemetryStore.getState().states[schedule.equipmentId];

        // Advance first so a slow command can never fire twice.
        markRun(schedule.id, now, computeNextRun(schedule, now));

        if (!definition || !state) {
          toast.error(t("schedule-failed"), {
            description: schedule.equipmentName,
          });
          return;
        }

        firing.add(schedule.id);

        void sendCommand({
          definition,
          state,
          action: schedule.action,
          value: schedule.value,
          actorName: SCHEDULER_ACTOR_NAME,
          onApply: (action, value) => {
            applyCommandToTelemetry(schedule.equipmentId, action, value);
          },
        })
          .then((result) => {
            if (result.status === "executed") {
              toast.success(t("schedule-fired"), {
                description: definition.name,
              });
            }
          })
          .finally(() => {
            firing.delete(schedule.id);
          });
      });
    }, SCHEDULE_CLOCK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [t]);
};
