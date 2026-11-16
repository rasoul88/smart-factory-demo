import { type StoreApi } from "zustand";

export type ExtractStoreState<S> = S extends { getState: () => infer T }
  ? T
  : never;

export type ReadonlyStoreApi<T> = Pick<
  StoreApi<T>,
  "getState" | "getInitialState" | "subscribe"
>;
