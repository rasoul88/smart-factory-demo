import { useTranslation } from "react-i18next";

import { Badge } from "@components/ui/badge";

import { cn } from "@utils/cn";
import {
  EVisualStatus,
  statusDotClass,
  statusLabelKey,
  statusTextClass,
} from "@utils/equipment/equipment-status";

interface IStatusDot {
  status: EVisualStatus;
  className?: string;
  pulse?: boolean;
}

export const StatusDot = ({ status, className, pulse = true }: IStatusDot) => {
  return (
    <span className={cn("relative flex size-2.5", className)}>
      {pulse && status === EVisualStatus.Running && (
        <span
          className={cn(
            "live-blip absolute inset-0 rounded-full",
            statusDotClass(status),
          )}
        />
      )}
      <span
        className={cn(
          "relative size-2.5 rounded-full",
          statusDotClass(status),
          status === EVisualStatus.Idle && "opacity-70",
        )}
      />
    </span>
  );
};

interface IStatusBadge {
  status: EVisualStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: IStatusBadge) => {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] font-medium",
        statusTextClass(status),
        className,
      )}
    >
      <StatusDot status={status} />
      {t(statusLabelKey(status))}
    </span>
  );
};

interface ILiveBadge {
  className?: string;
}

export const LiveBadge = ({ className }: ILiveBadge) => {
  const { t } = useTranslation();

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-status-running/30 bg-status-running/10 text-status-running",
        className,
      )}
    >
      <StatusDot status={EVisualStatus.Running} className="size-2" />
      {t("dashboard-live")}
    </Badge>
  );
};
