import { ArrowLeft, Cpu, MapPin, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { StatusDot } from "@components/common/status-badge.component";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

import type { IFactory } from "@dto/factory.dto";

import { cn } from "@utils/cn";
import { ROUTES } from "@utils/constants";
import {
  EVisualStatus,
  lineStatusVisual,
} from "@utils/equipment/equipment-status";
import type { ILineAggregate } from "@utils/factory/factory-aggregate";
import { formatNumber } from "@utils/format/format";

interface IFactoryCard {
  factory: IFactory;
  lines: ILineAggregate[];
  equipmentCount: number;
  plcOnline: number;
  plcTotal: number;
  alarmCount: number;
}

export const FactoryCard = ({
  factory,
  lines,
  equipmentCount,
  plcOnline,
  plcTotal,
  alarmCount,
}: IFactoryCard) => {
  const { t } = useTranslation();

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/70 transition-colors hover:border-primary/40">
      <div className="pointer-events-none absolute -end-16 -top-16 size-40 rounded-full bg-primary/8 blur-3xl transition-opacity group-hover:opacity-150" />

      <CardHeader className="relative gap-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="truncate text-sm font-semibold">
              {factory.name}
            </CardTitle>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3" />
              {factory.city}
            </span>
          </div>
          {alarmCount > 0 ? (
            <Badge
              variant="outline"
              className="border-status-warning/40 bg-status-warning/10 text-status-warning"
            >
              {formatNumber(alarmCount)} {t("kpi-alarms")}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-status-running/30 bg-status-running/10 text-status-running"
            >
              {t("status-normal")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1">
            <Wrench className="size-3" />
            <span className="num">{formatNumber(equipmentCount)}</span>
            {t("line-equipment-count")}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1">
            <Cpu className="size-3" />
            <span className="num">
              {formatNumber(plcOnline)}/{formatNumber(plcTotal)}
            </span>
            PLC
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {lines.map((aggregate) => {
            const visual = lineStatusVisual(aggregate.status);

            return (
              <Link
                key={aggregate.line.id}
                to={ROUTES.line(factory.id, aggregate.line.id)}
                className="flex items-center gap-2.5 rounded-lg border border-transparent bg-secondary/30 px-2.5 py-2 text-xs transition-colors hover:border-border/70 hover:bg-secondary/60"
              >
                <StatusDot status={visual} />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground/90">
                  {aggregate.line.name}
                </span>
                <span
                  className={cn(
                    "num shrink-0 text-[10px]",
                    visual === EVisualStatus.Running
                      ? "text-status-running"
                      : visual === EVisualStatus.Fault
                        ? "text-status-warning"
                        : "text-muted-foreground",
                  )}
                >
                  {formatNumber(aggregate.runningCount)}/
                  {formatNumber(aggregate.equipmentCount)}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          to={ROUTES.factory(factory.id)}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-border/70 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {t("factory-open")}
          <ArrowLeft className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
};
