import { useCallback, useState } from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCurrentUser } from "@hooks/auth/use-auth.hook";

import { parseIntent } from "@services/ai/assistant";
import { respondToIntent } from "@services/ai/respond";
import type { TAssistantPayload } from "@services/ai/respond";
import {
  applyCommandToTelemetry,
  sendCommand,
} from "@services/mock/command-service";
import { SEED_LINES } from "@services/mock/seed";

import { EAssistantRole } from "@store/ai/ai.model";
import { assistantStore } from "@store/ai/ai.store";
import { commandStore } from "@store/commands/commands.store";
import { EQUIPMENT_INDEX } from "@store/telemetry/equipment-index";
import { telemetryStore } from "@store/telemetry/telemetry.store";

import type { ECommandAction } from "@dto/command.dto";

import { useShallowStore } from "@utils/hooks/use-shallow-store";

const LINE_NAMES = SEED_LINES.map((line) => ({ id: line.id, name: line.name }));

const ALL_DEFINITIONS = Object.values(EQUIPMENT_INDEX);

const createId = () =>
  `msg-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

export const useAssistant = () => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const { messages, isOpen, setOpen } = useShallowStore(assistantStore, [
    "messages",
    "isOpen",
    "setOpen",
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [applyingId, setApplyingId] = useState<string>();

  const ask = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;

      const store = assistantStore.getState();
      store.push({
        id: createId(),
        role: EAssistantRole.User,
        text,
        createdAt: Date.now(),
      });

      setIsThinking(true);

      const telemetry = telemetryStore.getState();
      const commands = commandStore.getState().log;

      const intent = parseIntent(text, {
        equipment: ALL_DEFINITIONS,
        lineNames: LINE_NAMES,
      });

      const answer = respondToIntent(intent, {
        definitions: ALL_DEFINITIONS,
        states: telemetry.states,
        history: telemetry.history,
        plcStatus: telemetry.plcStatus,
        lines: SEED_LINES,
        commands,
        lineNames: LINE_NAMES,
        t,
      });

      // Brief pause so the typing indicator reads as a response, not a flash.
      window.setTimeout(() => {
        assistantStore.getState().push({
          id: createId(),
          role: EAssistantRole.Assistant,
          text: answer.text,
          createdAt: Date.now(),
          payload: answer.payload,
        });
        setIsThinking(false);
      }, 320);
    },
    [t],
  );

  const applyDraft = useCallback(
    async (
      messageId: string,
      equipmentId: string,
      action: ECommandAction,
      value?: number,
    ) => {
      if (!user || user.role !== "admin") {
        toast.error(t("equipment-readonly-title"));
        return;
      }

      const definition = EQUIPMENT_INDEX[equipmentId];
      const state = telemetryStore.getState().states[equipmentId];
      if (!definition || !state) return;

      setApplyingId(messageId);
      const result = await sendCommand({
        definition,
        state,
        action,
        value,
        actorName: user.name,
        onApply: (appliedAction, appliedValue) => {
          applyCommandToTelemetry(equipmentId, appliedAction, appliedValue);
        },
      });
      setApplyingId(undefined);

      if (result.status === "executed") {
        assistantStore.getState().markApplied(messageId);
        toast.success(t("command-success"), { description: definition.name });
      } else {
        toast.error(t("command-rejected"), { description: definition.name });
      }
    },
    [t, user],
  );

  const reset = useCallback(() => {
    assistantStore.getState().reset();
  }, []);

  return {
    messages,
    isOpen,
    setOpen,
    isThinking,
    applyingId,
    ask,
    applyDraft,
    reset,
  };
};

export type { TAssistantPayload };
