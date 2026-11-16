import { useEffect } from "react";

import { telemetryStore } from "@store/telemetry/telemetry.store";

import { TELEMETRY_INTERVAL_MS } from "@utils/constants";

export const useTelemetrySimulation = () => {
  useEffect(() => {
    const interval = window.setInterval(() => {
      telemetryStore.getState().tick();
    }, TELEMETRY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);
};
