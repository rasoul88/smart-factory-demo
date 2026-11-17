import type { TAssistantPayload } from "@services/ai/respond";

export enum EAssistantRole {
  User = "user",
  Assistant = "assistant",
}

export interface IAssistantMessage {
  id: string;
  role: EAssistantRole;
  text: string;
  createdAt: number;
  payload?: TAssistantPayload;
  applied?: boolean;
}

export interface IAssistantStore {
  messages: IAssistantMessage[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  push: (message: IAssistantMessage) => void;
  markApplied: (messageId: string) => void;
  reset: () => void;
}
