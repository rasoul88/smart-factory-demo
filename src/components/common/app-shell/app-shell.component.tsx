import { useState } from "react";

import { Outlet } from "react-router-dom";

import { Sheet, SheetContent, SheetTitle } from "@components/ui/sheet";
import { Toaster } from "@components/ui/sonner";

import { useScheduleRunner } from "@hooks/schedule/use-schedule-runner.hook";
import { useTelemetrySimulation } from "@hooks/simulation/use-telemetry-simulation.hook";

import { AppSidebar } from "./app-sidebar.component";
import { ShellContext } from "./shell-context";

export const AppShell = () => {
  useTelemetrySimulation();
  useScheduleRunner();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ShellContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
      <div className="flex h-dvh overflow-hidden bg-background">
        <div className="hidden lg:flex">
          <AppSidebar />
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">منو</SheetTitle>
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>

        <Toaster position="bottom-left" richColors closeButton />
      </div>
    </ShellContext.Provider>
  );
};
