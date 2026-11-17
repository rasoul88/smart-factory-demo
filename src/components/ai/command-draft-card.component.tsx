import { CheckCircle2, Loader2, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@components/ui/button";

import type { TAssistantPayload } from "@services/ai/respond";

import { cn } from "@utils/cn";
import { formatNumber } from "@utils/format/format";

type TCommandDraft = Extract<TAssistantPayload, { type: "commandDraft" }>;

interface ICommandDraftCard {
  draft: TCommandDraft;
  applied: boolean;
  isApplying: boolean;
  canManage: boolean;
  onApply: () => void;
}

export const CommandDraftCard = ({
  draft,
  applied,
  isApplying,
  canManage,
  onApply,
}: ICommandDraftCard) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3",
        applied
          ? "border-status-running/30 bg-status-running/8"
          : "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Terminal className="size-3.5" />
          {t("ai-command-draft-title")}
        </span>
        {applied && (
          <span className="flex items-center gap-1 rounded-full border border-status-running/30 px-2 py-0.5 text-[10px] text-status-running">
            <CheckCircle2 className="size-3" />
            {t("ai-command-applied")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
        <span className="text-[11px] font-semibold text-foreground/90">
          {draft.equipmentName}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t(draft.actionLabelKey)}
          {draft.value !== undefined && (
            <span className="num ms-1">— {formatNumber(draft.value)}</span>
          )}
        </span>
      </div>

      {!applied && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] text-muted-foreground/70">
            {canManage ? "" : t("equipment-readonly-title")}
          </span>
          <Button size="sm" onClick={onApply} disabled={isApplying || !canManage}>
            {isApplying && (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            )}
            {t("ai-command-apply")}
          </Button>
        </div>
      )}
    </div>
  );
};
