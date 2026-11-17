import { useState } from "react";

import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ShiftReportCard } from "@components/ai/shift-report-card.component";
import { PageLayout } from "@components/common/page-layout.component";
import { LiveBadge } from "@components/common/status-badge.component";
import { ActivityFeed } from "@components/dashboard/activity-feed.component";
import { FactoryCard } from "@components/dashboard/factory-card.component";
import { KpiStrip } from "@components/dashboard/kpi-strip.component";
import { Button } from "@components/ui/button";

import { useShiftReport } from "@hooks/ai/use-shift-report.hook";

import { SEED_FACTORIES, SEED_LINES, SEED_PLCS } from "@services/mock/seed";

import { telemetryStore } from "@store/telemetry/telemetry.store";

import { EPlcStatus } from "@dto/factory.dto";

import {
  aggregateLine,
  factoryEquipment,
  uniqueFactoryPlcs,
} from "@utils/factory/factory-aggregate";
import { useShallowStore } from "@utils/hooks/use-shallow-store";

export default function DashboardPage() {
  const { t } = useTranslation();
  const shiftReport = useShiftReport();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<number>();
  const { states, plcStatus } = useShallowStore(telemetryStore, [
    "states",
    "plcStatus",
  ]);

  const allLineIds = SEED_LINES.map((line) => line.id);
  const lineAggregates = SEED_LINES.map((line) =>
    aggregateLine(line, states, plcStatus),
  );

  const plcTotal = SEED_PLCS.length;

  const plcOnline = Object.values(plcStatus).filter(
    (status) => status === EPlcStatus.Online,
  ).length;

  const activeLineCount = lineAggregates.filter(
    (aggregate) => aggregate.status === "running",
  ).length;

  const alarmCount = lineAggregates.reduce(
    (total, aggregate) => total + aggregate.alarmCount,
    0,
  );

  const equipmentCount = SEED_LINES.reduce(
    (total, line) => total + line.equipmentIds.length,
    0,
  );

  return (
    <PageLayout
      title={t("dashboard-title")}
      subtitle={t("dashboard-subtitle")}
      actions={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LiveBadge />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReportOpen((open) => {
                  const next = !open;
                  if (next) setReportGeneratedAt(Date.now());
                  return next;
                });
              }}
            >
              <ClipboardList data-icon="inline-start" />
              {t("ai-report-open")}
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {t("dashboard-updated")} — {t("kpi-alarms")}:{" "}
            <span className="num text-foreground">{alarmCount}</span>
          </span>
        </div>
      }
    >
      {reportOpen && (
        <ShiftReportCard report={shiftReport} generatedAt={reportGeneratedAt} />
      )}

      <KpiStrip
        factoryCount={SEED_FACTORIES.length}
        activeLineCount={activeLineCount}
        lineCount={SEED_LINES.length}
        plcOnline={plcOnline}
        plcTotal={plcTotal}
        alarmCount={alarmCount}
        equipmentCount={equipmentCount}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{t("dashboard-factories")}</h2>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {SEED_FACTORIES.map((factory) => {
              const aggregates = lineAggregates.filter((aggregate) =>
                factory.lineIds.includes(aggregate.line.id),
              );
              const plcs = uniqueFactoryPlcs(factory);

              return (
                <FactoryCard
                  key={factory.id}
                  factory={factory}
                  lines={aggregates}
                  equipmentCount={factoryEquipment(factory).length}
                  plcOnline={
                    plcs.filter((plc) => plcStatus[plc.id] === EPlcStatus.Online)
                      .length
                  }
                  plcTotal={plcs.length}
                  alarmCount={aggregates.reduce(
                    (total, item) => total + item.alarmCount,
                    0,
                  )}
                />
              );
            })}
          </div>
        </section>

        <ActivityFeed lineIds={allLineIds} />
      </div>
    </PageLayout>
  );
}
