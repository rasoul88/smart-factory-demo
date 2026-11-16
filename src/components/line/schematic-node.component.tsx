import { memo } from "react";

import { useTranslation } from "react-i18next";

import { EquipmentIcon } from "@components/common/equipment-icon.component";

import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition, TEquipmentState } from "@dto/equipment.dto";

import { cn } from "@utils/cn";
import { primaryReadout } from "@utils/equipment/equipment-readout";
import {
  EVisualStatus,
  equipmentStatus,
  kindLabelKey,
  statusTextClass,
} from "@utils/equipment/equipment-status";

import { NODE_HEIGHT, NODE_WIDTH, positionStyle } from "./schematic-geometry";

interface ISchematicNode {
  definition: TEquipmentDefinition;
  state: TEquipmentState;
  isSelected: boolean;
  onSelect: (equipmentId: string) => void;
}

const ringColor: Record<EVisualStatus, string> = {
  [EVisualStatus.Running]: "ring-status-running/45",
  [EVisualStatus.Idle]: "ring-border",
  [EVisualStatus.Warning]: "ring-status-warning/55",
  [EVisualStatus.Fault]: "ring-status-fault/60",
  [EVisualStatus.Offline]: "ring-status-offline/40",
};

const dotColor: Record<EVisualStatus, string> = {
  [EVisualStatus.Running]: "bg-status-running",
  [EVisualStatus.Idle]: "bg-status-idle",
  [EVisualStatus.Warning]: "bg-status-warning",
  [EVisualStatus.Fault]: "bg-status-fault node-pulse",
  [EVisualStatus.Offline]: "bg-status-offline",
};

const KindGlyph = ({
  kind,
  status,
}: {
  kind: EEquipmentKind;
  status: EVisualStatus;
}) => {
  if (kind === EEquipmentKind.Motor) {
    return (
      <span className="relative flex size-8 items-center justify-center">
        <span
          className={cn(
            "absolute inset-0 rounded-full border border-dashed",
            status === EVisualStatus.Running
              ? "border-status-running/40"
              : "border-border/50",
          )}
        />
        <EquipmentIcon
          kind={kind}
          className={cn(
            "size-4",
            status === EVisualStatus.Running && "rotor-spin",
            statusTextClass(status),
          )}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-secondary/70",
        statusTextClass(status),
      )}
    >
      <EquipmentIcon kind={kind} className="size-4" />
    </span>
  );
};

export const SchematicNode = memo(
  ({ definition, state, isSelected, onSelect }: ISchematicNode) => {
    const { t } = useTranslation();
    const status = equipmentStatus(definition, state);
    const readout = primaryReadout(definition, state);

    return (
      <button
        type="button"
        onClick={() => onSelect(definition.id)}
        style={{
          ...positionStyle(definition.layout),
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        }}
        className={cn(
          "group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg text-center transition-transform duration-200",
          "focus-visible:outline-none",
          isSelected ? "z-30 scale-[1.04]" : "hover:scale-[1.03]",
        )}
        aria-label={`${definition.name} — ${t(kindLabelKey(definition.kind))}`}
        aria-pressed={isSelected}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-lg ring-1",
            ringColor[status],
            status === EVisualStatus.Fault && "node-pulse",
          )}
        />

        <span
          className={cn(
            "relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border bg-card px-2 py-1.5 transition-colors",
            isSelected
              ? "border-primary/70 bg-primary/10"
              : "border-border/70 group-hover:border-primary/40",
            status === EVisualStatus.Offline && "opacity-60",
          )}
        >
          <KindGlyph kind={definition.kind} status={status} />

          <span className="w-full truncate text-[10px] leading-3 font-medium text-foreground/90">
            {definition.name}
          </span>

          <span
            className={cn(
              "num flex items-baseline gap-0.5 text-[11px] leading-3 font-semibold",
              status === EVisualStatus.Fault
                ? "text-status-fault"
                : status === EVisualStatus.Warning
                  ? "text-status-warning"
                  : "text-foreground",
            )}
          >
            {readout.value}
            {readout.unit && (
              <span className="text-[8px] font-normal text-muted-foreground">
                {readout.unit}
              </span>
            )}
          </span>

          <span
            className={cn(
              "absolute end-1.5 top-1.5 size-1.5 rounded-full",
              dotColor[status],
            )}
          />
        </span>

        {state.kind === EEquipmentKind.Valve && (
          <span className="absolute inset-x-2 bottom-1 h-1 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full bg-status-running/70 transition-all duration-700"
              style={{ width: `${state.positionPercent}%` }}
            />
          </span>
        )}
      </button>
    );
  },
);

SchematicNode.displayName = "SchematicNode";
