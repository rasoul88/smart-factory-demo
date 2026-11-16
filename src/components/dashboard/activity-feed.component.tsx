import { History } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CommandStatusBadge } from "@components/common/command-status-badge.component";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { ScrollArea } from "@components/ui/scroll-area";

import { commandStore } from "@store/commands/commands.store";

import type { ICommandLogEntry } from "@dto/command.dto";

import { cn } from "@utils/cn";
import { formatRelative } from "@utils/format/format";
import { useShallowStore } from "@utils/hooks/use-shallow-store";

interface IRecentCommands {
  entries: ICommandLogEntry[];
  selectedEquipmentId?: string;
  className?: string;
  emptyText?: string;
  maxHeight?: string;
}

export const CommandList = ({
  entries,
  selectedEquipmentId,
  className,
  emptyText,
  maxHeight = "20rem",
}: IRecentCommands) => {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 py-8 text-center",
          className,
        )}
      >
        <History className="size-5 text-muted-foreground/60" />
        <p className="text-[11px] text-muted-foreground">
          {emptyText ?? t("equipment-history-empty")}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }} className={className}>
      <ul className="flex flex-col gap-1.5 pe-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              "flex flex-col gap-1 rounded-lg border border-border/50 bg-secondary/25 px-3 py-2",
              selectedEquipmentId === entry.equipmentId &&
                "border-primary/30 bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-foreground/90">
                {entry.equipmentName}
              </span>
              <CommandStatusBadge status={entry.status} />
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span className="truncate">{entry.detail}</span>
              <span className="num shrink-0">
                {formatRelative(entry.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

interface IActivityFeed {
  lineIds: string[];
  className?: string;
}

export const ActivityFeed = ({ lineIds, className }: IActivityFeed) => {
  const { t } = useTranslation();
  const { log } = useShallowStore(commandStore, ["log"]);

  const entries = log.filter((entry) => lineIds.includes(entry.lineId));

  return (
    <Card className={cn("border-border/60 bg-card/70", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <History className="size-4 text-primary" />
          {t("dashboard-activity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CommandList entries={entries} maxHeight="24rem" />
      </CardContent>
    </Card>
  );
};
