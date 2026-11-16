import { ChevronLeft, Factory } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { PageLayout } from "@components/common/page-layout.component";
import { LiveBadge } from "@components/common/status-badge.component";
import {
  FactoryMetaRow,
  LineGrid,
} from "@components/factory/line-grid.component";
import { Button } from "@components/ui/button";

import { SEED_FACTORIES, SEED_LINES } from "@services/mock/seed";

import { telemetryStore } from "@store/telemetry/telemetry.store";

import { ROUTES } from "@utils/constants";
import { aggregateLine } from "@utils/factory/factory-aggregate";
import { useShallowStore } from "@utils/hooks/use-shallow-store";

export default function FactoryPage() {
  const { t } = useTranslation();
  const { factoryId } = useParams();
  const { states, plcStatus } = useShallowStore(telemetryStore, [
    "states",
    "plcStatus",
  ]);

  const factory = SEED_FACTORIES.find((item) => item.id === factoryId);

  if (!factory) {
    return (
      <PageLayout title={t("factory-not-found")}>
        <Button variant="outline" asChild>
          <Link to={ROUTES.dashboard}>{t("back-to-dashboard")}</Link>
        </Button>
      </PageLayout>
    );
  }

  const lines = SEED_LINES.filter((line) => factory.lineIds.includes(line.id));
  const aggregates = lines.map((line) => aggregateLine(line, states, plcStatus));

  return (
    <PageLayout
      title={factory.name}
      subtitle={factory.address}
      actions={
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.dashboard}>
              <ChevronLeft data-icon="inline-start" />
              {t("back-to-dashboard")}
            </Link>
          </Button>
          <LiveBadge />
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
            <Factory className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold">
              {t("factory-lines")}: {aggregates.length}
            </span>
            <FactoryMetaRow factory={factory} />
          </div>
        </div>
      </div>

      <LineGrid
        factoryId={factory.id}
        aggregates={aggregates}
        plcStatus={plcStatus}
      />
    </PageLayout>
  );
}
