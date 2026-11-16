import { ArrowLeft, Cpu, MapPin, Ruler, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  StatusBadge,
  StatusDot,
} from "@components/common/status-badge.component";
import { Card, CardContent } from "@components/ui/card";
import { Progress } from "@components/ui/progress";

import { EPlcStatus, type IProductLine } from "@dto/factory.dto";

import { cn } from "@utils/cn";
import { ROUTES } from "@utils/constants";
import {
  EVisualStatus,
  lineStatusVisual,
} from "@utils/equipment/equipment-status";
import type { ILineAggregate } from "@utils/factory/factory-aggregate";
import { formatNumber } from "@utils/format/format";

interface ILineCard {
  factoryId: string;
  aggregate: ILineAggregate;
  plcStatus: Record<string, EPlcStatus>;
  line: IProductLine;
}

const LineCard = ({ factoryId, aggregate, plcStatus, line }: ILineCard) => {
  const { t } = useTranslation();
  const visual = lineStatusVisual(aggregate.status);
  const healthPercent =
    aggregate.equipmentCount === 0
      ? 0
      : Math.round((aggregate.runningCount / aggregate.equipmentCount) * 100);

  return (
    <Link
      to={ROUTES.line(factoryId, line.id)}
      className="group block focus-visible:outline-none"
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden border-border/60 bg-card/70 py-0 transition-all",
          "group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]",
        )}
      >
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-px",
            visual === EVisualStatus.Running
              ? "bg-gradient-to-r from-transparent via-status-running/70 to-transparent"
              : visual === EVisualStatus.Fault
                ? "bg-gradient-to-r from-transparent via-status-warning/70 to-transparent"
                : "bg-gradient-to-r from-transparent via-border to-transparent",
          )}
        />

        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="flex items-center gap-2 truncate text-sm font-semibold">
                <StatusDot status={visual} />
                {line.name}
              </h3>
              <p className="line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                {line.description}
              </p>
            </div>
            <StatusBadge status={visual} className="shrink-0" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{t("line-active-equipment")}</span>
              <span className="num text-foreground">
                {formatNumber(aggregate.runningCount)}/
                {formatNumber(aggregate.equipmentCount)}
              </span>
            </div>
            <Progress
              value={healthPercent}
              className={cn(
                "h-1.5",
                visual === EVisualStatus.Fault && "[&>div]:bg-status-warning",
                visual === EVisualStatus.Idle && "[&>div]:bg-status-idle",
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1">
              <Wrench className="size-3" />
              <span className="num">
                {formatNumber(aggregate.equipmentCount)}
              </span>
              {t("line-equipment-count")}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1">
              <Cpu className="size-3" />
              <span className="num">
                {formatNumber(aggregate.plcOnlineCount)}/
                {formatNumber(aggregate.plcCount)}
              </span>
              PLC
            </span>
            {aggregate.alarmCount > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-status-warning/10 px-2 py-1 text-status-warning">
                {formatNumber(aggregate.alarmCount)} {t("status-warning")}
              </span>
            )}
            <span className="ms-auto flex items-center gap-1 font-medium text-muted-foreground transition-colors group-hover:text-primary">
              {t("line-open")}
              <ArrowLeft className="size-3" />
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {line.plcIds.map((plcId) => (
              <span
                key={plcId}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px]",
                  plcStatus[plcId] === EPlcStatus.Online
                    ? "border-status-running/25 bg-status-running/8 text-status-running/90"
                    : "border-border/60 bg-secondary/40 text-muted-foreground",
                )}
              >
                {plcId}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

interface IFactoryMeta {
  city: string;
  areaSqm: number;
  establishedAt: string;
}

export const FactoryMetaRow = ({ factory }: { factory: IFactoryMeta }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <MapPin className="size-3" />
        {factory.city}
      </span>
      <span className="flex items-center gap-1">
        <Ruler className="size-3" />
        {formatNumber(factory.areaSqm)} m²
      </span>
      <span>
        {t("factory-established")}: {factory.establishedAt}
      </span>
    </div>
  );
};

interface ILineGrid {
  factoryId: string;
  aggregates: ILineAggregate[];
  plcStatus: Record<string, EPlcStatus>;
}

export const LineGrid = ({ factoryId, aggregates, plcStatus }: ILineGrid) => {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {aggregates.map((aggregate) => (
        <LineCard
          key={aggregate.line.id}
          factoryId={factoryId}
          aggregate={aggregate}
          plcStatus={plcStatus}
          line={aggregate.line}
        />
      ))}
    </div>
  );
};
