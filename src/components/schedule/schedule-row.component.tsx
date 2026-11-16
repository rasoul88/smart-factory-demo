import { Factory, GitBranch, Play, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Switch } from "@components/ui/switch";

import type { ISchedule } from "@dto/schedule.dto";

import { cn } from "@utils/cn";
import { factoryNameOf, lineNameOf } from "@utils/factory/factory-lookup";
import { formatRelative } from "@utils/format/format";
import { describeSchedule } from "@utils/schedule/schedule-describe";
import { formatCountdown, scheduleHasEnded } from "@utils/schedule/schedule-math";

interface IScheduleRow {
  schedule: ISchedule;
  now: number;
  canManage: boolean;
  showEquipment?: boolean;
  showLocation?: boolean;
  onToggle: (enabled: boolean) => void;
  onRunNow: () => void;
  onDelete: () => void;
  isRunning?: boolean;
}

export const ScheduleRow = ({
  schedule,
  now,
  canManage,
  showEquipment = false,
  showLocation = false,
  onToggle,
  onRunNow,
  onDelete,
  isRunning = false,
}: IScheduleRow) => {
  const { t } = useTranslation();
  const ended = scheduleHasEnded(schedule);
  const active = schedule.enabled && schedule.nextRunAt !== null;
  const factoryName = factoryNameOf(schedule.factoryId);
  const lineName = lineNameOf(schedule.lineId);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-3 py-2.5 transition-colors",
        active
          ? "border-border/60 bg-secondary/25"
          : "border-border/40 bg-secondary/10",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          {showEquipment && (
            <span className="truncate text-xs font-semibold text-foreground/90">
              {schedule.equipmentName}
            </span>
          )}
          {showLocation && (
            <span className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              {factoryName && (
                <span className="flex items-center gap-1 rounded-md bg-secondary/50 px-1.5 py-0.5">
                  <Factory className="size-2.5" />
                  {factoryName}
                </span>
              )}
              {lineName && (
                <span className="flex items-center gap-1 rounded-md bg-secondary/50 px-1.5 py-0.5">
                  <GitBranch className="size-2.5" />
                  {lineName}
                </span>
              )}
            </span>
          )}
          <span className="truncate text-[11px] text-muted-foreground">
            {describeSchedule(schedule, t)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {ended ? (
            <Badge variant="outline" className="text-[10px]">
              {t("schedule-completed")}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                active
                  ? "border-status-running/30 bg-status-running/10 text-status-running"
                  : "text-muted-foreground",
              )}
            >
              {active ? t("schedules-active") : t("schedules-disabled")}
            </Badge>
          )}
          <Switch
            checked={schedule.enabled}
            onCheckedChange={onToggle}
            disabled={!canManage || ended}
            aria-label={t("schedule-status")}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="num">
          {schedule.nextRunAt !== null
            ? `${t("schedule-next-run")}: ${formatCountdown(schedule.nextRunAt, now)}`
            : t("schedule-never")}
        </span>

        <div className="flex items-center gap-1">
          {schedule.lastRunAt && (
            <span className="num opacity-70">
              {t("schedule-last-run")}: {formatRelative(schedule.lastRunAt)}
            </span>
          )}
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRunNow}
                disabled={isRunning}
                aria-label={t("schedule-run-now")}
              >
                <Play data-icon="inline-start" />
                {t("schedule-run-now")}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("schedule-delete")}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
