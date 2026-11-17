import { buildShiftReport } from "@services/ai/snapshot";
import type { IShiftReport } from "@services/ai/snapshot";
import { SEED_LINES } from "@services/mock/seed";

import { commandStore } from "@store/commands/commands.store";
import { EQUIPMENT_INDEX } from "@store/telemetry/equipment-index";
import { telemetryStore } from "@store/telemetry/telemetry.store";

import { useShallowStore } from "@utils/hooks/use-shallow-store";

export const useShiftReport = (): IShiftReport => {
  const { states, plcStatus, tickCount } = useShallowStore(telemetryStore, [
    "states",
    "plcStatus",
    "tickCount",
  ]);
  const { log } = useShallowStore(commandStore, ["log"]);

  // tickCount keeps the report in sync with the live telemetry loop.
  void tickCount;

  return buildShiftReport({
    definitions: Object.values(EQUIPMENT_INDEX),
    states,
    plcStatus,
    lines: SEED_LINES,
    commands: log,
  });
};
