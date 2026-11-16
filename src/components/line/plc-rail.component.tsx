import { useTranslation } from "react-i18next";

import { StatusDot } from "@components/common/status-badge.component";

import { telemetryStore } from "@store/telemetry/telemetry.store";

import { EPlcStatus, type IPlc } from "@dto/factory.dto";

import { cn } from "@utils/cn";
import { plcStatusVisual } from "@utils/equipment/equipment-status";
import { formatNumber } from "@utils/format/format";
import { useShallowStore } from "@utils/hooks/use-shallow-store";

interface IPlcRail {
  plcs: IPlc[];
}

export const PlcRail = ({ plcs }: IPlcRail) => {
  const { t } = useTranslation();
  const { plcStatus, plcRtt, setPlcStatus } = useShallowStore(telemetryStore, [
    "plcStatus",
    "plcRtt",
    "setPlcStatus",
  ]);

  const toggle = (plcId: string) => {
    const current = plcStatus[plcId];
    setPlcStatus(
      plcId,
      current === EPlcStatus.Offline ? EPlcStatus.Online : EPlcStatus.Offline,
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("plc-title")}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {t("plc-demo-hint")}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {plcs.map((plc) => {
          const status = plcStatus[plc.id] ?? EPlcStatus.Online;
          const visual = plcStatusVisual(status);
          const offline = status === EPlcStatus.Offline;

          return (
            <div
              key={plc.id}
              className={cn(
                "flex min-w-52 flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                offline
                  ? "border-status-fault/25 bg-status-fault/5"
                  : status === EPlcStatus.Degraded
                    ? "border-status-warning/30 bg-status-warning/5"
                    : "border-border/60 bg-card/60",
              )}
            >
              <StatusDot status={visual} />

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[11px] font-semibold text-foreground/90">
                  {plc.name}
                </span>
                <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="truncate">{plc.model}</span>
                  <span className="num shrink-0 opacity-70" dir="ltr">
                    {plc.ip}
                  </span>
                </span>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={cn(
                    "num text-[10px] font-semibold",
                    offline
                      ? "text-status-fault"
                      : status === EPlcStatus.Degraded
                        ? "text-status-warning"
                        : "text-status-running",
                  )}
                >
                  {offline
                    ? t("status-offline")
                    : `${formatNumber(plcRtt[plc.id] ?? 0)} ms`}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(plc.id)}
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                    offline
                      ? "border-status-running/40 text-status-running hover:bg-status-running/10"
                      : "border-border/70 text-muted-foreground hover:border-status-fault/40 hover:text-status-fault",
                  )}
                >
                  {offline ? t("plc-toggle-online") : t("plc-toggle-offline")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
