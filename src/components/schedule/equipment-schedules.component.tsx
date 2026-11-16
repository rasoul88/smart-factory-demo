import { useState } from "react";

import { CalendarClock, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

import { useNow } from "@hooks/schedule/use-now.hook";
import { useScheduleActions } from "@hooks/schedule/use-schedule-actions.hook";

import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition } from "@dto/equipment.dto";

import { ScheduleForm } from "./schedule-form.component";
import { ScheduleRow } from "./schedule-row.component";

interface IEquipmentSchedules {
  definition: TEquipmentDefinition;
}

export const EquipmentSchedules = ({ definition }: IEquipmentSchedules) => {
  const { t } = useTranslation();
  const now = useNow();
  const {
    schedules,
    canManage,
    runningId,
    createSchedule,
    runNow,
    deleteSchedule,
    toggleSchedule,
  } = useScheduleActions();
  const [open, setOpen] = useState(false);

  const equipmentSchedules = schedules.filter(
    (item) => item.equipmentId === definition.id,
  );

  if (definition.kind === EEquipmentKind.Sensor) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("schedule-section-title")}
        </span>
        <p className="rounded-lg border border-dashed border-border/70 px-3 py-3 text-[10px] text-muted-foreground">
          {t("schedule-non-controllable")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <CalendarClock className="size-3.5" />
          {t("schedule-section-title")}
        </span>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" />
            {t("schedule-add-for-equipment")}
          </Button>
        )}
      </div>

      {equipmentSchedules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-3 py-3 text-[10px] text-muted-foreground">
          {t("schedules-empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {equipmentSchedules.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              now={now}
              canManage={canManage}
              isRunning={runningId === schedule.id}
              onToggle={(enabled) => toggleSchedule(schedule.id, enabled)}
              onRunNow={() => void runNow(schedule)}
              onDelete={() => deleteSchedule(schedule.id)}
            />
          ))}
        </div>
      )}

      {!canManage && (
        <p className="text-[10px] text-muted-foreground/70">
          {t("schedule-readonly-hint")}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("schedule-add-for-equipment")}</DialogTitle>
            <DialogDescription>
              {definition.name} · {definition.zone}
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm
            definition={definition}
            submitLabelKey="schedule-create"
            onCancel={() => setOpen(false)}
            onSubmit={(draft) => {
              createSchedule(draft);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
