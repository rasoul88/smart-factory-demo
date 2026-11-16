import { createStore } from "zustand";
import { persist } from "zustand/middleware";

import type { IAuthStore } from "./auth.model";

export const authStore = createStore<IAuthStore>()(
  persist(
    (set) => ({
      user: undefined,
      setUser: (user) => set({ user }),
      logout: () => set({ user: undefined }),
    }),
    { name: "smart-factory-session" },
  ),
);
