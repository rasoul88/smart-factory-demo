import { StrictMode } from "react";

import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import { TooltipProvider } from "@components/ui/tooltip";

import { initI18n } from "@utils/i18n";

import "./index.css";
import { AppRouter } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const bootstrap = async () => {
  await initI18n();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <DirectionProvider dir="rtl">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <AppRouter />
          </TooltipProvider>
        </QueryClientProvider>
      </DirectionProvider>
    </StrictMode>,
  );
};

void bootstrap();
