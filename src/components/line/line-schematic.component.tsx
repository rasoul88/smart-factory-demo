import { useMemo } from "react";

import { useTranslation } from "react-i18next";

import { EQUIPMENT_BY_LINE } from "@store/telemetry/telemetry.model";

import type { TEquipmentState } from "@dto/equipment.dto";
import type { IProductLine } from "@dto/factory.dto";

import { cn } from "@utils/cn";
import { pipeIsActive } from "@utils/line/line-utils";

import {
  NODE_HEIGHT,
  SCHEMATIC_HEIGHT,
  SCHEMATIC_WIDTH,
  pipeGeometry,
} from "./schematic-geometry";
import { SchematicNode } from "./schematic-node.component";

interface ILineSchematic {
  line: IProductLine;
  states: Record<string, TEquipmentState>;
  selectedId?: string;
  onSelect: (equipmentId: string) => void;
}

export const LineSchematic = ({
  line,
  states,
  selectedId,
  onSelect,
}: ILineSchematic) => {
  const { t } = useTranslation();

  const pipes = useMemo(
    () =>
      line.pipes
        .map((pipe) => {
          const lineEquipment = EQUIPMENT_BY_LINE[line.id] ?? [];
          const from = lineEquipment.find((item) => item.id === pipe.from);
          const to = lineEquipment.find((item) => item.id === pipe.to);
          if (!from || !to) return undefined;
          return {
            key: `${pipe.from}-${pipe.to}`,
            geometry: pipeGeometry(from.layout, to.layout),
            active: pipeIsActive(pipe.from, pipe.to, states),
          };
        })
        .filter((pipe): pipe is NonNullable<typeof pipe> => Boolean(pipe)),
    [line, states],
  );

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card/60 via-background/40 to-card/30">
      <div className="industrial-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="relative m-2 rounded-lg border border-dashed border-border/40">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${SCHEMATIC_WIDTH} / ${SCHEMATIC_HEIGHT}` }}
        >
          <svg
            viewBox={`0 0 ${SCHEMATIC_WIDTH} ${SCHEMATIC_HEIGHT}`}
            className="absolute inset-0 size-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="pipe-base" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
              </linearGradient>
            </defs>

            {pipes.map((pipe) => (
              <g key={pipe.key}>
                <path
                  d={pipe.geometry.path}
                  fill="none"
                  strokeWidth={6}
                  className="stroke-foreground/6"
                  strokeLinecap="round"
                />
                <path
                  d={pipe.geometry.path}
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="6 10"
                  strokeLinecap="round"
                  className={cn(
                    "transition-colors",
                    pipe.active
                      ? "stroke-status-running/70 pipe-flow"
                      : "stroke-muted-foreground/25",
                  )}
                />
              </g>
            ))}

            {pipes
              .filter((pipe) => pipe.active)
              .map((pipe) => (
                <circle
                  key={`flow-${pipe.key}`}
                  r={2.5}
                  className="fill-status-running/80"
                >
                  <animateMotion
                    dur="2.6s"
                    repeatCount="indefinite"
                    path={pipe.geometry.path}
                  />
                </circle>
              ))}
          </svg>

          <div
            className="absolute inset-0"
            style={{
              paddingTop: `${(NODE_HEIGHT / 2 / SCHEMATIC_HEIGHT) * 100}%`,
            }}
          >
            {(EQUIPMENT_BY_LINE[line.id] ?? []).map((definition) => {
              const state = states[definition.id];
              if (!state) return null;

              return (
                <SchematicNode
                  key={definition.id}
                  definition={definition}
                  state={state}
                  isSelected={selectedId === definition.id}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <LegendItem
            className="bg-status-running"
            label={t("line-legend-running")}
          />
          <LegendItem className="bg-status-idle" label={t("line-legend-idle")} />
          <LegendItem
            className="bg-status-warning"
            label={t("line-legend-warning")}
          />
          <LegendItem
            className="bg-status-fault"
            label={t("line-legend-fault")}
          />
          <LegendItem
            className="bg-status-offline"
            label={t("line-legend-offline")}
          />
        </div>
        <span className="text-[10px] text-muted-foreground/70">
          {t("line-select-hint")}
        </span>
      </div>
    </div>
  );
};

const LegendItem = ({
  className,
  label,
}: {
  className: string;
  label: string;
}) => (
  <span className="flex items-center gap-1.5">
    <span className={cn("size-2 rounded-full", className)} />
    {label}
  </span>
);
