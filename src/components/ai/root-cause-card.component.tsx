import {
  AlertTriangle,
  ArrowLeft,
  CircleAlert,
  GitBranch,
  Loader2,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@components/ui/button";

import type {
  IEquipmentRootCause,
  IRootCauseChain,
  IRootCauseRemedy,
} from "@services/ai/root-cause";

import { cn } from "@utils/cn";

const roleStyle = {
  cause: {
    border: "border-status-fault/40 bg-status-fault/10",
    text: "text-status-fault",
    icon: AlertTriangle,
    labelKey: "ai-root-idle-actuator",
  },
  effect: {
    border: "border-status-warning/35 bg-status-warning/8",
    text: "text-status-warning",
    icon: CircleAlert,
    labelKey: "ai-root-alarm",
  },
  suspect: {
    border: "border-border/70 bg-secondary/30",
    text: "text-muted-foreground",
    icon: GitBranch,
    labelKey: "ai-root-upstream-suspect",
  },
} as const;

const confidenceKey = (confidence: IRootCauseChain["confidence"]) =>
  confidence === "high"
    ? "ai-root-confidence-high"
    : confidence === "medium"
      ? "ai-root-confidence-medium"
      : "ai-root-confidence-low";

const ChainList = ({ chain }: { chain: IRootCauseChain["chain"] }) => {
  const { t } = useTranslation();

  return (
    <ol className="flex flex-col gap-1">
      {chain.map((node, index) => {
        const style = roleStyle[node.role];
        const Icon = style.icon;

        return (
          <li
            key={`${node.equipmentId}-${index}`}
            className="flex flex-col gap-1"
          >
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border px-2.5 py-2",
                style.border,
              )}
            >
              <Icon className={cn("mt-0.5 size-3.5 shrink-0", style.text)} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-foreground/90">
                  {node.equipmentName}
                </span>
                <span className="text-[10px] leading-4 text-muted-foreground">
                  {t(node.noteKey, node.noteParams)}
                </span>
              </div>
            </div>

            {index < chain.length - 1 && (
              <ArrowLeft className="mx-auto size-3 rotate-[-90deg] text-muted-foreground/50" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

interface IRootCauseCardLine {
  chain: IRootCauseChain;
  rootCause?: never;
  canManage?: never;
  isPending?: never;
  onApplyRemedy?: never;
}

interface IRootCauseCardEquipment {
  rootCause: IEquipmentRootCause;
  chain?: never;
  canManage: boolean;
  isPending: boolean;
  onApplyRemedy: (remedy: IRootCauseRemedy) => void;
}

type TRootCauseCard = IRootCauseCardLine | IRootCauseCardEquipment;

export const RootCauseCard = (props: TRootCauseCard) => {
  const { t } = useTranslation();
  const chainData = props.rootCause ?? props.chain;

  if (!chainData?.hasSignal) {
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-status-running/25 bg-status-running/6 p-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-status-running">
          <GitBranch className="size-3.5" />
          {t("ai-root-title")}
        </span>
        <span className="text-[10px] leading-5 text-muted-foreground">
          {props.rootCause
            ? t(props.rootCause.rationaleKey, props.rootCause.rationaleParams)
            : t("ai-root-none-generic")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <GitBranch className="size-3.5" />
          {t("ai-root-title")}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px]",
            chainData.confidence === "high"
              ? "border-status-fault/30 text-status-fault"
              : chainData.confidence === "medium"
                ? "border-status-warning/30 text-status-warning"
                : "border-border/70 text-muted-foreground",
          )}
        >
          {t(confidenceKey(chainData.confidence))}
        </span>
      </div>

      <ChainList chain={chainData.chain} />

      {props.rootCause && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-secondary/20 px-2.5 py-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            {t("ai-root-rationale-label")}
          </span>
          <span className="text-[10px] leading-5 text-foreground/85">
            {t(props.rootCause.rationaleKey, props.rootCause.rationaleParams)}
          </span>
        </div>
      )}

      {props.rootCause && props.rootCause.remedies.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <Wrench className="size-3" />
            {t("ai-remedy-title")}
          </span>
          {props.rootCause.remedies.map((remedy) => (
            <div
              key={remedy.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-secondary/15 px-2.5 py-1.5"
            >
              <span className="text-[10px] leading-4 text-foreground/85">
                {t(remedy.labelKey)}
              </span>
              {remedy.command && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!props.canManage || props.isPending}
                  onClick={() => props.onApplyRemedy(remedy)}
                >
                  {props.isPending && (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  )}
                  {t("ai-remedy-apply")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
