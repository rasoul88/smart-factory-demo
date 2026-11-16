import { useTranslation } from "react-i18next";

import { EquipmentIcon } from "@components/common/equipment-icon.component";
import {
  StatusBadge,
  StatusDot,
} from "@components/common/status-badge.component";
import { CommandList } from "@components/dashboard/activity-feed.component";
import { EquipmentSchedules } from "@components/schedule/equipment-schedules.component";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";

import { useCurrentUser } from "@hooks/auth/use-auth.hook";
import { useEquipmentCommand } from "@hooks/equipment/use-equipment-command.hook";
import { useEquipmentHistory } from "@hooks/telemetry/use-equipment-live.hook";

import { commandStore } from "@store/commands/commands.store";
import { PLC_BY_ID } from "@store/telemetry/telemetry.model";
import { telemetryStore } from "@store/telemetry/telemetry.store";

import type { ICommandLogEntry } from "@dto/command.dto";
import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition, TEquipmentState } from "@dto/equipment.dto";
import { EPlcStatus } from "@dto/factory.dto";

import { cn } from "@utils/cn";
import {
  equipmentReadouts,
  primaryMetricKey,
} from "@utils/equipment/equipment-readout";
import {
  EVisualStatus,
  equipmentStatus,
  kindLabelKey,
  metricLabelKey,
  plcStatusVisual,
} from "@utils/equipment/equipment-status";
import { formatNumber } from "@utils/format/format";
import { useShallowStore } from "@utils/hooks/use-shallow-store";

import { EquipmentControls } from "./equipment-controls-dispatch.component";
import { OfflineNotice, ReadonlyNotice } from "./equipment-notice.component";
import { EquipmentPlcFooter } from "./equipment-plc-footer.component";
import { EquipmentTrend } from "./equipment-trend.component";

interface IEquipmentSheet {
  definition?: TEquipmentDefinition;
  onClose: () => void;
}

export const EquipmentSheet = ({ definition, onClose }: IEquipmentSheet) => {
  const states = useShallowStore(telemetryStore, ["states"]).states;
  const plcStatus = useShallowStore(telemetryStore, ["plcStatus"]).plcStatus;
  const log = useShallowStore(commandStore, ["log"]).log;

  if (!definition) return null;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <EquipmentSheetBody
          definition={definition}
          states={states}
          plcStatus={plcStatus}
          log={log}
        />
      </SheetContent>
    </Sheet>
  );
};

interface IEquipmentSheetBody {
  definition: TEquipmentDefinition;
  states: Record<string, TEquipmentState>;
  plcStatus: Record<string, EPlcStatus>;
  log: ICommandLogEntry[];
}

const EquipmentSheetBody = ({
  definition,
  states,
  plcStatus,
  log,
}: IEquipmentSheetBody) => {
  const { t } = useTranslation();
  const { canCommand } = useCurrentUser();
  const state = states[definition.id];
  const plc = PLC_BY_ID[definition.plcId];
  const plcState = plcStatus[definition.plcId] ?? EPlcStatus.Online;
  const history = useEquipmentHistory(definition.id);

  const status = state
    ? equipmentStatus(definition, state)
    : EVisualStatus.Offline;
  const readOnly = !canCommand;
  const plcOffline = plcState === EPlcStatus.Offline;
  const disabled = readOnly || plcOffline || !state?.online;

  const controlContext = useEquipmentCommand({
    definition,
    state,
    disabled,
  });

  const readouts = state ? equipmentReadouts(definition, state) : [];
  const trendReadout = readouts.find(
    (readout) => readout.labelKey === primaryMetricKey(definition),
  );
  const equipmentLog = log.filter((entry) => entry.equipmentId === definition.id);

  return (
    <>
      <SheetHeader className="gap-3 border-b border-border/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-xl bg-secondary/70 ring-1 ring-border/60",
                status === EVisualStatus.Running
                  ? "text-status-running"
                  : status === EVisualStatus.Fault
                    ? "text-status-fault"
                    : "text-muted-foreground",
              )}
            >
              <EquipmentIcon kind={definition.kind} className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-sm font-semibold">
                {definition.name}
              </SheetTitle>
              <SheetDescription className="text-[11px]">
                {t(kindLabelKey(definition.kind))} · {definition.zone}
              </SheetDescription>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 p-5">
        {readOnly && <ReadonlyNotice />}
        {plcOffline && <OfflineNotice />}

        {!plcOffline && state && state.kind !== EEquipmentKind.Sensor && (
          <EquipmentControls state={state} context={controlContext} />
        )}

        <div className="grid grid-cols-2 gap-2">
          {readouts.map((readout) => (
            <div
              key={readout.labelKey}
              className="flex flex-col gap-1 rounded-lg border border-border/50 bg-secondary/25 px-3 py-2"
            >
              <span className="text-[10px] text-muted-foreground">
                {t(readout.labelKey)}
              </span>
              <span className="num text-sm font-semibold text-foreground">
                {readout.value}
                {readout.unit && (
                  <span className="ms-1.5 text-[10px] font-normal text-muted-foreground">
                    {readout.unit}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {definition.kind === EEquipmentKind.Sensor && state && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
            <span className="text-[10px] text-muted-foreground">
              {t(metricLabelKey(definition.metric))}
            </span>
            <div className="num flex items-center justify-between gap-1 text-[10px]">
              <span className="text-status-running">
                &lt; {formatNumber(definition.warningAt)} {definition.unit}
              </span>
              <span className="text-status-warning">
                ≥ {formatNumber(definition.warningAt)} {definition.unit}
              </span>
              <span className="text-status-fault">
                ≥ {formatNumber(definition.criticalAt)} {definition.unit}
              </span>
            </div>
          </div>
        )}

        <EquipmentTrend
          samples={history}
          label={t(primaryMetricKey(definition))}
          unit={
            definition.kind === EEquipmentKind.Sensor
              ? definition.unit
              : (trendReadout?.unit ?? "")
          }
        />

        <EquipmentPlcFooter
          plcName={plc?.name ?? "-"}
          plcStatus={plcStatusVisual(plcState)}
          updatedAt={state?.updatedAt}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("equipment-history")}
          </span>
          <CommandList entries={equipmentLog} maxHeight="13rem" />
        </div>

        <EquipmentSchedules definition={definition} />

        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-[10px] text-muted-foreground">
          <span>{definition.zone}</span>
          <span className="flex items-center gap-1.5">
            <StatusDot status={status} pulse={false} />
            {plc?.rack}
          </span>
        </div>
      </div>
    </>
  );
};
