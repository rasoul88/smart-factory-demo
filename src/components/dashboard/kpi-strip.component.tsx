import { AlertTriangle, Cpu, Factory, GitBranch, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@components/ui/card";

import { cn } from "@utils/cn";
import { formatNumber } from "@utils/format/format";

interface IKpiStrip {
  factoryCount: number;
  activeLineCount: number;
  lineCount: number;
  plcOnline: number;
  plcTotal: number;
  alarmCount: number;
  equipmentCount: number;
}

export const KpiStrip = ({
  factoryCount,
  activeLineCount,
  lineCount,
  plcOnline,
  plcTotal,
  alarmCount,
  equipmentCount,
}: IKpiStrip) => {
  const { t } = useTranslation();

  const items = [
    {
      key: "kpi-factories",
      value: formatNumber(factoryCount),
      hint: t("kpi-factories"),
      icon: Factory,
      tone: "text-primary",
    },
    {
      key: "kpi-lines",
      value: formatNumber(activeLineCount),
      suffix: `/${formatNumber(lineCount)}`,
      hint: t("kpi-lines"),
      icon: GitBranch,
      tone: "text-status-running",
    },
    {
      key: "kpi-plcs",
      value: formatNumber(plcOnline),
      suffix: `/${formatNumber(plcTotal)}`,
      hint: t("kpi-plcs"),
      icon: Cpu,
      tone: "text-chart-2",
    },
    {
      key: "kpi-equipment",
      value: formatNumber(equipmentCount),
      hint: t("kpi-equipment"),
      icon: Wrench,
      tone: "text-chart-5",
    },
    {
      key: "kpi-alarms",
      value: formatNumber(alarmCount),
      hint: t("kpi-alarms"),
      icon: AlertTriangle,
      tone: alarmCount > 0 ? "text-status-warning" : "text-status-running",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card
          key={item.key}
          className="relative overflow-hidden border-border/60 bg-card/70 py-0"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 ring-1 ring-border/60",
                item.tone,
              )}
            >
              <item.icon className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col items-center">
              <span className="truncate text-[11px] text-muted-foreground">
                {item.hint}
              </span>
              <span className="num flex items-baseline gap-1 text-xl leading-tight font-bold text-foreground">
                {item.value}
                {item.suffix && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.suffix}
                  </span>
                )}
              </span>
            </div>
          </CardContent>
          {item.key === "kpi-alarms" && alarmCount > 0 && (
            <span className="absolute end-3 top-3 flex size-1.5">
              <span className="live-blip absolute inset-0 rounded-full bg-status-warning" />
              <span className="relative size-1.5 rounded-full bg-status-warning" />
            </span>
          )}
        </Card>
      ))}
    </div>
  );
};
