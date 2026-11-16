import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { type ReadonlyStoreApi } from "./use-shallow-store.model";

export const useShallowStore = <S extends object, K extends keyof S>(
  store: ReadonlyStoreApi<S>,
  fields: K[],
): Pick<S, K> => {
  return useStore(
    store,
    useShallow((state) => {
      const selectedState = {} as Pick<S, K>;
      fields.forEach((prop) => {
        if (prop in state) {
          selectedState[prop] = state[prop];
        }
      });
      return selectedState;
    }),
  );
};
