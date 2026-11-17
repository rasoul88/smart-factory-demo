import { Bot, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EAssistantRole } from "@store/ai/ai.model";
import type { IAssistantMessage } from "@store/ai/ai.model";

import { cn } from "@utils/cn";
import { formatNumber } from "@utils/format/format";

import { CommandDraftCard } from "./command-draft-card.component";
import { DiagnosisCard } from "./diagnosis-card.component";
import { RootCauseCard } from "./root-cause-card.component";
import { ShiftReportCard } from "./shift-report-card.component";

interface IAssistantMessageBubble {
  message: IAssistantMessage;
  canManage: boolean;
  isApplying: boolean;
  onApplyDraft: (messageId: string) => void;
}

export const AssistantMessageBubble = ({
  message,
  canManage,
  isApplying,
  onApplyDraft,
}: IAssistantMessageBubble) => {
  const { t } = useTranslation();
  const isUser = message.role === EAssistantRole.User;

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ring-1",
          isUser
            ? "bg-secondary text-muted-foreground ring-border/70"
            : "bg-primary/15 text-primary ring-primary/30",
        )}
      >
        {isUser ? <User className="size-3" /> : <Bot className="size-3" />}
      </span>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2",
          isUser && "items-end",
        )}
      >
        <div
          className={cn(
            "max-w-full rounded-xl px-3 py-2 text-[11px] leading-6 whitespace-pre-wrap",
            isUser
              ? "bg-primary/15 text-foreground"
              : "border border-border/60 bg-card/70 text-foreground/90",
          )}
        >
          {message.text}
        </div>

        {message.payload?.type === "diagnosis" && (
          <div className="w-full">
            <DiagnosisCard diagnosis={message.payload.diagnosis} compact />
          </div>
        )}

        {message.payload?.type === "rootCause" && (
          <div className="w-full">
            <RootCauseCard chain={message.payload.chain} />
          </div>
        )}

        {message.payload?.type === "report" && (
          <div className="w-full">
            <ShiftReportCard
              report={message.payload.report}
              generatedAt={message.createdAt}
            />
          </div>
        )}

        {message.payload?.type === "alarms" && (
          <div className="flex w-full flex-col gap-1">
            {message.payload.alarms.map((alarm) => (
              <div
                key={alarm.equipmentId}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[10px]",
                  alarm.severity === 2
                    ? "bg-status-fault/10 text-status-fault"
                    : "bg-status-warning/10 text-status-warning",
                )}
              >
                <span className="truncate">{alarm.equipmentName}</span>
                <span className="num shrink-0">
                  {formatNumber(alarm.value)} {alarm.unit}
                </span>
              </div>
            ))}
          </div>
        )}

        {message.payload?.type === "commandDraft" && (
          <div className="w-full">
            <CommandDraftCard
              draft={message.payload}
              applied={Boolean(message.applied)}
              isApplying={isApplying}
              canManage={canManage}
              onApply={() => onApplyDraft(message.id)}
            />
          </div>
        )}

        {!isUser && !message.payload && (
          <span className="text-[9px] text-muted-foreground/60">
            {t("ai-assistant-subtitle")}
          </span>
        )}
      </div>
    </div>
  );
};
