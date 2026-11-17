import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

import { fa } from "@services/ai/snapshot";
import type { IShiftReport } from "@services/ai/snapshot";

import { cn } from "@utils/cn";
import { formatTime } from "@utils/format/format";

interface IShiftReportCard {
  report: IShiftReport;
  generatedAt?: number;
}

export const ShiftReportCard = ({ report, generatedAt }: IShiftReportCard) => {
  const { t } = useTranslation();

  const stats = [
    {
      labelKey: "ai-report-equipment",
      value: `${fa(report.runningEquipment)}/${fa(report.totalEquipment)}`,
    },
    {
      labelKey: "ai-report-plc",
      value: `${fa(report.plcOnline)}/${fa(report.plcTotal)}`,
    },
    {
      labelKey: "ai-report-alarms",
      value: fa(report.alarms.length),
      tone: report.alarms.length > 0 ? "warning" : "ok",
    },
    {
      labelKey: "ai-report-commands",
      value: fa(report.executedCommands),
    },
  ] as const;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <ClipboardList className="size-3.5" />
          {t("ai-report-title")}
        </span>
        {generatedAt && (
          <span className="num text-[9px] text-muted-foreground/70">
            {t("ai-report-generated")} {formatTime(generatedAt)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {stats.map((item) => (
          <div
            key={item.labelKey}
            className="flex flex-col gap-0.5 rounded-lg border border-border/50 bg-secondary/25 px-2.5 py-1.5"
          >
            <span className="text-[9px] text-muted-foreground">
              {t(item.labelKey)}
            </span>
            <span
              className={cn(
                "num text-sm font-semibold text-foreground",
                "tone" in item &&
                  item.tone === "warning" &&
                  "text-status-warning",
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground">
          {t("ai-report-lines")}
        </span>
        {report.lineSummaries.map((line) => (
          <div
            key={line.lineId}
            className="flex items-center justify-between gap-2 rounded-md bg-secondary/20 px-2 py-1 text-[10px]"
          >
            <span className="truncate text-foreground/85">{line.lineName}</span>
            <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  line.statusKey === "status-running"
                    ? "bg-status-running"
                    : line.statusKey === "status-fault"
                      ? "bg-status-warning"
                      : "bg-status-idle",
                )}
              />
              <span className="num">
                {fa(line.running)}/{fa(line.total)}
              </span>
            </span>
          </div>
        ))}
      </div>

      {report.alarms.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground">
            {t("ai-report-alarms")}
          </span>
          {report.alarms.slice(0, 4).map((alarm) => (
            <div
              key={alarm.equipmentId}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[10px]",
                alarm.severity === 2
                  ? "bg-status-fault/10 text-status-fault"
                  : "bg-status-warning/10 text-status-warning",
              )}
            >
              <span className="truncate">{alarm.equipmentName}</span>
              <span className="num shrink-0">
                {fa(alarm.value, 1)} {alarm.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
