import { useState } from "react";

import { ChevronLeft, Cpu, Users, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { PageLayout } from "@components/common/page-layout.component";
import {
  LiveBadge,
  StatusBadge,
} from "@components/common/status-badge.component";
import { EquipmentSheet } from "@components/line/equipment-sheet.component";
import { LineSchematic } from "@components/line/line-schematic.component";
import { PlcRail } from "@components/line/plc-rail.component";
import { Button } from "@components/ui/button";

import { SEED_FACTORIES, SEED_LINES, SEED_PLCS } from "@services/mock/seed";

import { EQUIPMENT_BY_LINE } from "@store/telemetry/telemetry.model";
import { telemetryStore } from "@store/telemetry/telemetry.store";

import { ROUTES } from "@utils/constants";
import { lineStatusVisual } from "@utils/equipment/equipment-status";
import { aggregateLine } from "@utils/factory/factory-aggregate";
import { formatNumber } from "@utils/format/format";
import { useShallowStore } from "@utils/hooks/use-shallow-store";

export default function LinePage() {
  const { t } = useTranslation();
  const { factoryId, lineId } = useParams();
  const { states, plcStatus } = useShallowStore(telemetryStore, [
    "states",
    "plcStatus",
  ]);
  const [selectedId, setSelectedId] = useState<string>();

  const line = SEED_LINES.find((item) => item.id === lineId);
  const factory = SEED_FACTORIES.find((item) => item.id === factoryId);

  if (!line || !factory) {
    return (
      <PageLayout title={t("line-not-found")}>
        <Button variant="outline" asChild>
          <Link to={ROUTES.dashboard}>{t("back-to-dashboard")}</Link>
        </Button>
      </PageLayout>
    );
  }

  const equipment = EQUIPMENT_BY_LINE[line.id] ?? [];
  const plcs = SEED_PLCS.filter((plc) => line.plcIds.includes(plc.id));
  const aggregate = aggregateLine(line, states, plcStatus);
  const selected = equipment.find((item) => item.id === selectedId);

  return (
    <PageLayout
      title={line.name}
      subtitle={line.description}
      actions={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.factory(factory.id)}>
              <ChevronLeft data-icon="inline-start" />
              {t("line-back")}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <LiveBadge />
            <StatusBadge status={lineStatusVisual(aggregate.status)} />
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-card/50 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Wrench className="size-3.5" />
          <span className="num text-foreground">
            {formatNumber(equipment.length)}
          </span>
          {t("line-equipment-count")}
        </span>
        <span className="flex items-center gap-1.5">
          <Cpu className="size-3.5" />
          <span className="num text-foreground">{formatNumber(plcs.length)}</span>
          PLC
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {line.shift}
        </span>
        {aggregate.alarmCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-md bg-status-warning/10 px-2 py-0.5 text-status-warning">
            {formatNumber(aggregate.alarmCount)} {t("status-warning")}
          </span>
        )}
      </div>

      <PlcRail plcs={plcs} />

      <LineSchematic
        line={line}
        states={states}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <EquipmentSheet
        definition={selected}
        onClose={() => setSelectedId(undefined)}
      />
    </PageLayout>
  );
}
