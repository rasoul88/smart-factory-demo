import {
  CheckCircle2,
  Clock,
  Loader2,
  type LucideIcon,
  Send,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { ECommandStatus } from "@dto/command.dto";

import { cn } from "@utils/cn";

const STATUS_MAP: Record<
  ECommandStatus,
  { icon: LucideIcon; className: string; spin?: boolean }
> = {
  [ECommandStatus.Accepted]: {
    icon: Loader2,
    className: "text-muted-foreground border-border/60 bg-secondary/50",
    spin: true,
  },
  [ECommandStatus.Published]: {
    icon: Send,
    className: "text-chart-2 border-chart-2/30 bg-chart-2/10",
  },
  [ECommandStatus.Executed]: {
    icon: CheckCircle2,
    className:
      "text-status-running border-status-running/30 bg-status-running/10",
  },
  [ECommandStatus.Rejected]: {
    icon: XCircle,
    className: "text-status-fault border-status-fault/30 bg-status-fault/10",
  },
  [ECommandStatus.TimedOut]: {
    icon: Clock,
    className:
      "text-status-warning border-status-warning/30 bg-status-warning/10",
  },
};

interface ICommandStatusBadge {
  status: ECommandStatus;
  className?: string;
}

export const CommandStatusBadge = ({
  status,
  className,
}: ICommandStatusBadge) => {
  const { t } = useTranslation();
  const config = STATUS_MAP[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        config.className,
        className,
      )}
    >
      <Icon className={cn("size-3", config.spin && "animate-spin")} />
      {t(`command-status-${status}`)}
    </span>
  );
};
