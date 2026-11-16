import { createContext, useContext } from "react";

export interface IShellContext {
  openSidebar: () => void;
}

export const ShellContext = createContext<IShellContext>({
  openSidebar: () => {},
});

export const useShell = () => useContext(ShellContext);
