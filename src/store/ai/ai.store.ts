import { createStore } from "zustand";
import { persist } from "zustand/middleware";

import type { IAssistantStore } from "./ai.model";

const MAX_MESSAGES = 60;

export const assistantStore = createStore<IAssistantStore>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      setOpen: (open) => set({ isOpen: open }),
      push: (message) =>
        set((store) => ({
          messages: [...store.messages, message].slice(-MAX_MESSAGES),
        })),
      markApplied: (messageId) =>
        set((store) => ({
          messages: store.messages.map((message) =>
            message.id === messageId ? { ...message, applied: true } : message,
          ),
        })),
      reset: () => set({ messages: [] }),
    }),
    {
      name: "smart-factory-assistant",
      partialize: (store) => ({ messages: store.messages }),
    },
  ),
);
