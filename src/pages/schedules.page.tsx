import { useState } from "react";

import { CalendarClock, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageLayout } from "@components/common/page-layout.component";
import { LiveBadge } from "@components/common/status-badge.component";
import { EquipmentPicker } from "@components/schedule/equipment-picker.component";
import { ScheduleForm } from "@components/schedule/schedule-form.component";
import { ScheduleRow } from "@components/schedule/schedule-row.component";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

import { useNow } from "@hooks/schedule/use-now.hook";
import { useScheduleActions } from "@hooks/schedule/use-schedule-actions.hook";

import { SEED_FACTORIES } from "@services/mock/seed";

import { EQUIPMENT_INDEX } from "@store/telemetry/equipment-index";

import type { IScheduleDraft } from "@dto/schedule.dto";

import { cn } from "@utils/cn";
import { initialSelectionForFactory } from "@utils/factory/equipment-selection";
import { schedulableEquipmentForLine } from "@utils/factory/factory-lookup";
import { formatNumber } from "@utils/format/format";
import { isScheduleActive } from "@utils/schedule/schedule-describe";

const ALL = "all";

export default function SchedulesPage() {
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

  const [factoryFilter, setFactoryFilter] = useState<string>(ALL);
  const [open, setOpen] = useState(false);

  const visible = schedules.filter(
    (schedule) => factoryFilter === ALL || schedule.factoryId === factoryFilter,
  );

  const activeCount = schedules.filter(isScheduleActive).length;

  const initialFactoryId =
    factoryFilter === ALL ? SEED_FACTORIES[0].id : factoryFilter;
  const initialSelection = initialSelectionForFactory(initialFactoryId);

  const [pickedFactoryId, setPickedFactoryId] = useState(initialFactoryId);
  const [pickedLineId, setPickedLineId] = useState(initialSelection.lineId);
  const [equipmentId, setEquipmentId] = useState(initialSelection.equipmentId);
  const selectedDefinition = EQUIPMENT_INDEX[equipmentId];

  const handleOpenDialog = () => {
    const baseFactoryId =
      factoryFilter === ALL ? SEED_FACTORIES[0].id : factoryFilter;
    const selection = initialSelectionForFactory(baseFactoryId);
    setPickedFactoryId(baseFactoryId);
    setPickedLineId(selection.lineId);
    setEquipmentId(selection.equipmentId);
    setOpen(true);
  };

  const handleFactoryChange = (nextFactoryId: string) => {
    const selection = initialSelectionForFactory(nextFactoryId);
    setPickedFactoryId(nextFactoryId);
    setPickedLineId(selection.lineId);
    setEquipmentId(selection.equipmentId);
  };

  const handleLineChange = (nextLineId: string) => {
    const firstEquipment = schedulableEquipmentForLine(nextLineId)[0];
    setPickedLineId(nextLineId);
    setEquipmentId(firstEquipment?.id ?? "");
  };

  return (
    <PageLayout
      title={t("schedules-title")}
      subtitle={t("schedules-subtitle")}
      actions={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Select value={factoryFilter} onValueChange={setFactoryFilter}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("schedules-filter-all")}</SelectItem>
                {SEED_FACTORIES.map((factory) => (
                  <SelectItem key={factory.id} value={factory.id}>
                    {factory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && (
              <Button size="sm" onClick={handleOpenDialog}>
                <Plus data-icon="inline-start" />
                {t("schedules-new")}
              </Button>
            )}
          </div>
          <LiveBadge />
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label={t("schedules-total")} value={schedules.length} />
        <StatCard
          label={t("schedules-active")}
          value={activeCount}
          tone="running"
        />
        <StatCard
          label={t("schedules-disabled")}
          value={schedules.length - activeCount}
        />
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 py-14 text-center">
          <CalendarClock className="size-6 text-muted-foreground/60" />
          <p className="text-xs font-medium text-foreground/80">
            {t("schedules-empty")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("schedules-empty-hint")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              now={now}
              canManage={canManage}
              showEquipment
              showLocation
              isRunning={runningId === schedule.id}
              onToggle={(enabled) => toggleSchedule(schedule.id, enabled)}
              onRunNow={() => void runNow(schedule)}
              onDelete={() => deleteSchedule(schedule.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("schedules-new")}</DialogTitle>
            <DialogDescription>{t("schedules-subtitle")}</DialogDescription>
          </DialogHeader>

          <EquipmentPicker
            factoryId={pickedFactoryId}
            lineId={pickedLineId}
            equipmentId={equipmentId}
            onFactoryChange={handleFactoryChange}
            onLineChange={handleLineChange}
            onEquipmentChange={setEquipmentId}
          />

          {selectedDefinition && (
            <ScheduleForm
              key={selectedDefinition.id}
              definition={selectedDefinition}
              submitLabelKey="schedule-create"
              onCancel={() => setOpen(false)}
              onSubmit={(draft: IScheduleDraft) => {
                createSchedule(draft);
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "running";
}) => (
  <Card className="border-border/60 bg-card/70 py-0">
    <CardContent className="flex flex-col gap-1 p-4">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "num text-xl font-bold text-foreground",
          tone === "running" && "text-status-running",
        )}
      >
        {formatNumber(value)}
      </span>
    </CardContent>
  </Card>
);
