import { useEffect, useRef, useState } from "react";

import { Bot, Eraser, Loader2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";

import { useAssistant } from "@hooks/ai/use-assistant.hook";
import { useCurrentUser } from "@hooks/auth/use-auth.hook";

import { cn } from "@utils/cn";

import { AssistantMessageBubble } from "./assistant-message.component";

const SUGGESTIONS = [
  "ai-suggestion-status",
  "ai-suggestion-alarms",
  "ai-suggestion-report",
  "ai-suggestion-diagnose",
  "ai-suggestion-rootcause",
  "ai-suggestion-command",
];

export const AssistantPanel = () => {
  const { t } = useTranslation();
  const { canCommand } = useCurrentUser();
  const {
    messages,
    isOpen,
    setOpen,
    isThinking,
    applyingId,
    ask,
    applyDraft,
    reset,
  } = useAssistant();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const container = scrollRef.current;
    if (!container) return;

    // Pin to the newest message. Rich cards (report, diagnosis) grow after
    // their first paint, so re-pin once layout settles.
    const pin = () => {
      container.scrollTop = container.scrollHeight;
    };

    pin();
    const frame = requestAnimationFrame(pin);
    const timer = window.setTimeout(pin, 120);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [messages.length, isOpen, isThinking]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || isThinking) return;
    ask(value);
    setDraft("");
  };

  const handleApply = (messageId: string) => {
    const message = messages.find((item) => item.id === messageId);
    if (!message || message.payload?.type !== "commandDraft") return;
    void applyDraft(
      messageId,
      message.payload.equipmentId,
      message.payload.action as Parameters<typeof applyDraft>[2],
      message.payload.value,
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1 border-b border-border/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                <Bot className="size-4" />
              </span>
              <SheetTitle className="text-sm font-semibold">
                {t("ai-assistant-title")}
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              aria-label={t("ai-assistant-clear")}
              disabled={messages.length === 0}
              className="me-10"
            >
              <Eraser />
            </Button>
          </div>
          <span className="text-[9px] text-muted-foreground/70">
            {t("ai-assistant-subtitle")}
          </span>
        </SheetHeader>

        <div
          ref={scrollRef}
          data-slot="assistant-scroll"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col gap-3 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/50 p-3">
                <span className="text-[11px] leading-6 text-muted-foreground">
                  {t("ai-assistant-welcome")}
                </span>
              </div>
            )}

            {messages.map((message) => (
              <AssistantMessageBubble
                key={message.id}
                message={message}
                canManage={canCommand}
                isApplying={applyingId === message.id}
                onApplyDraft={handleApply}
              />
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                {t("ai-assistant-thinking")}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {SUGGESTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => submit(t(key))}
                className={cn(
                  "rounded-full border border-border/70 px-2 py-0.5 text-[9px] text-muted-foreground transition-colors",
                  "hover:border-primary/40 hover:text-primary",
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("ai-assistant-input-placeholder")}
              aria-label={t("ai-assistant-input-placeholder")}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || isThinking}
              aria-label={t("ai-assistant-send")}
            >
              <Send />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface IAssistantTrigger {
  onClick: () => void;
}

export const AssistantTrigger = ({ onClick }: IAssistantTrigger) => {
  const { t } = useTranslation();

  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-5 end-5 z-40 size-12 rounded-full shadow-lg"
      aria-label={t("ai-assistant-open")}
    >
      <Bot className="size-5" />
    </Button>
  );
};
