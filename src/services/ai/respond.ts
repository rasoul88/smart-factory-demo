import type { TFunction } from "i18next";

import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition, TEquipmentState } from "@dto/equipment.dto";
import { EPlcStatus, type IProductLine } from "@dto/factory.dto";

import type { TIntent } from "./assistant";
import { diagnoseEquipment } from "./diagnose";
import type { IDiagnosis } from "./diagnose";
import { analyzeLineRootCause } from "./root-cause";
import type { IRootCauseChain } from "./root-cause";
import {
  buildShiftReport,
  collectAlarms,
  fa,
  lineStatusKey,
  lineStatusOf,
} from "./snapshot";
import type { IShiftReport, IStatusSnapshot } from "./snapshot";

export type TAssistantPayload =
  | { type: "diagnosis"; diagnosis: IDiagnosis }
  | { type: "rootCause"; chain: IRootCauseChain }
  | { type: "report"; report: IShiftReport }
  | {
      type: "commandDraft";
      equipmentId: string;
      equipmentName: string;
      action: string;
      actionLabelKey: string;
      value?: number;
      unit?: string;
    }
  | { type: "alarms"; alarms: ReturnType<typeof collectAlarms> };

export interface IAssistantAnswer {
  text: string;
  payload?: TAssistantPayload;
}

export interface IRespondContext extends IStatusSnapshot {
  t: TFunction;
  lineNames: { id: string; name: string }[];
  history: Record<string, number[]>;
}

const statusWord = (state: TEquipmentState | undefined, ctx: IRespondContext) => {
  if (!state) return "-";
  if (!state.online) return ctx.t("status-offline");

  switch (state.kind) {
    case EEquipmentKind.Motor:
    case EEquipmentKind.Pump:
    case EEquipmentKind.Conveyor:
      return state.running
        ? `${ctx.t("status-running")} — ${fa(
            state.kind === EEquipmentKind.Pump
              ? state.flowLpm
              : state.kind === EEquipmentKind.Conveyor
                ? state.speedMps
                : state.speedPercent,
            state.kind === EEquipmentKind.Conveyor ? 1 : 0,
          )}`
        : ctx.t("status-idle");
    case EEquipmentKind.Valve:
      return state.open
        ? `${ctx.t("status-running")} — ${fa(state.positionPercent)}٪`
        : ctx.t("status-idle");
    case EEquipmentKind.Heater:
      return state.on
        ? `${ctx.t("status-running")} — ${fa(state.currentTempC)}°C`
        : ctx.t("status-idle");
    case EEquipmentKind.Light:
      return state.on
        ? `${ctx.t("status-running")} — ${fa(state.brightness)}٪`
        : ctx.t("status-idle");
    case EEquipmentKind.Sensor:
      return `${fa(state.value, 1)}`;
  }
};

const equipmentLine = (
  definition: TEquipmentDefinition,
  lineNames: { id: string; name: string }[],
) => lineNames.find((line) => line.id === definition.lineId)?.name ?? "";

export const respondToIntent = (
  intent: TIntent,
  ctx: IRespondContext,
): IAssistantAnswer => {
  switch (intent.kind) {
    case "help":
      return { text: ctx.t("ai-help-body") };

    case "alarms": {
      const alarms = collectAlarms(ctx);
      if (alarms.length === 0) {
        return { text: ctx.t("ai-alarms-none") };
      }
      return {
        text: ctx.t("ai-alarms-found", { count: fa(alarms.length) }),
        payload: { type: "alarms", alarms },
      };
    }

    case "report": {
      const report = buildShiftReport(ctx);
      return {
        text: ctx.t(report.headlineKey),
        payload: { type: "report", report },
      };
    }

    case "rootCause": {
      const line =
        ctx.lines.find((item) => item.id === intent.lineId) ?? ctx.lines[0];
      if (!line) return { text: ctx.t("ai-help-body") };

      const chain = analyzeLineRootCause({
        line,
        definitions: ctx.definitions.filter((item) => item.lineId === line.id),
        states: ctx.states,
      });

      if (!chain.hasSignal) {
        return { text: ctx.t("ai-root-none", { line: line.name }) };
      }

      return {
        text: ctx.t("ai-root-found", { line: line.name }),
        payload: { type: "rootCause", chain },
      };
    }

    case "diagnose": {
      const definition = ctx.definitions.find(
        (item) => item.id === intent.equipmentId,
      );
      if (!definition) return { text: ctx.t("ai-help-body") };

      const state = ctx.states[definition.id];
      const plcState = ctx.plcStatus[definition.plcId] ?? EPlcStatus.Online;
      const diagnosis = diagnoseEquipment({
        definition,
        state,
        history: ctx.history[definition.id] ?? [],
        plcStatus: plcState,
        commands: ctx.commands,
      });

      return {
        text: ctx.t(diagnosis.summaryKey, diagnosis.summaryParams),
        payload: { type: "diagnosis", diagnosis },
      };
    }

    case "command": {
      const definition = ctx.definitions.find(
        (item) => item.id === intent.equipmentId,
      );
      if (!definition) return { text: ctx.t("ai-help-body") };

      if (intent.unsupported) {
        return {
          text: ctx.t("ai-command-unsupported", { name: definition.name }),
        };
      }

      return {
        text: ctx.t("ai-command-draft", { name: definition.name }),
        payload: {
          type: "commandDraft",
          equipmentId: definition.id,
          equipmentName: definition.name,
          action: intent.action,
          actionLabelKey: `control-${intent.action}`,
          value: intent.value,
        },
      };
    }

    case "status": {
      if (intent.scope === "equipment" && intent.equipmentId) {
        const definition = ctx.definitions.find(
          (item) => item.id === intent.equipmentId,
        );
        if (!definition) return { text: ctx.t("ai-help-body") };
        const state = ctx.states[definition.id];
        return {
          text: ctx.t("ai-status-equipment", {
            name: definition.name,
            line: equipmentLine(definition, ctx.lineNames),
            status: statusWord(state, ctx),
          }),
        };
      }

      if (intent.scope === "line" && intent.lineName) {
        const line: IProductLine | undefined = ctx.lines.find(
          (item) => item.name === intent.lineName,
        );
        if (!line) return { text: ctx.t("ai-help-body") };
        const status = lineStatusOf(line, ctx);
        const equipment = ctx.definitions.filter(
          (item) => item.lineId === line.id,
        );
        return {
          text: ctx.t("ai-status-line", {
            line: line.name,
            status: ctx.t(lineStatusKey(status)),
            count: fa(equipment.length),
          }),
        };
      }

      const alarms = collectAlarms(ctx);
      return {
        text: ctx.t("ai-status-factory", {
          lines: fa(ctx.lines.length),
          equipment: fa(ctx.definitions.length),
          alarms: fa(alarms.length),
        }),
      };
    }
  }
};

export const buildParseContext = (
  definitions: TEquipmentDefinition[],
  lineNames: { id: string; name: string }[],
) => ({ equipment: definitions, lineNames });
