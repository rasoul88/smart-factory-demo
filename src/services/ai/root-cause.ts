import { ECommandAction } from "@dto/command.dto";
import {
  EEquipmentKind,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";
import type { IProductLine } from "@dto/factory.dto";

export interface IRootCauseNode {
  equipmentId: string;
  equipmentName: string;
  role: "cause" | "effect" | "suspect";
  noteKey: string;
  noteParams: Record<string, string>;
}

export interface IRootCauseChain {
  hasSignal: boolean;
  headEquipmentId?: string;
  chain: IRootCauseNode[];
  confidence: "high" | "medium" | "low";
}

export interface IEquipmentRootCause extends IRootCauseChain {
  suspectedEquipmentId?: string;
  suspectedEquipmentName?: string;
  rationaleKey: string;
  rationaleParams: Record<string, string>;
  direction: "upstream" | "downstream" | "self" | "none";
  remedies: IRootCauseRemedy[];
}

export interface IRootCauseRemedy {
  id: string;
  equipmentId: string;
  labelKey: string;
  command?: {
    action: ECommandAction;
    value?: number;
  };
}

interface IAnalyzeEquipmentRootCause {
  equipmentId: string;
  definitions: TEquipmentDefinition[];
  states: Record<string, TEquipmentState>;
  pipes: { from: string; to: string }[];
}

interface IAnalyzeRootCause {
  line: IProductLine;
  definitions: TEquipmentDefinition[];
  states: Record<string, TEquipmentState>;
}

const isActuatorIdle = (state: TEquipmentState): boolean => {
  switch (state.kind) {
    case EEquipmentKind.Valve:
      return !state.open || state.positionPercent <= 5;
    case EEquipmentKind.Motor:
    case EEquipmentKind.Pump:
    case EEquipmentKind.Conveyor:
      return !state.running;
    case EEquipmentKind.Heater:
    case EEquipmentKind.Light:
      return !state.on;
    case EEquipmentKind.Sensor:
      return false;
  }
};

const alarmSeverity = (
  definition: TEquipmentDefinition,
  state: TEquipmentState,
): number => {
  if (definition.kind !== EEquipmentKind.Sensor) return 0;
  if (state.kind !== EEquipmentKind.Sensor) return 0;
  if (state.value >= definition.criticalAt) return 2;
  if (state.value >= definition.warningAt) return 1;
  return 0;
};

const upstreamOf = (
  line: IProductLine,
  equipmentId: string,
  depth = 2,
): string[] => {
  const result: string[] = [];
  let frontier = [equipmentId];

  for (let step = 0; step < depth; step += 1) {
    const next: string[] = [];
    frontier.forEach((current) => {
      line.pipes
        .filter((pipe) => pipe.to === current)
        .forEach((pipe) => {
          if (!result.includes(pipe.from) && pipe.from !== equipmentId) {
            result.push(pipe.from);
            next.push(pipe.from);
          }
        });
    });
    frontier = next;
  }

  return result;
};

const downstreamOf = (
  line: IProductLine,
  equipmentId: string,
  depth = 2,
): string[] => {
  const result: string[] = [];
  let frontier = [equipmentId];

  for (let step = 0; step < depth; step += 1) {
    const next: string[] = [];
    frontier.forEach((current) => {
      line.pipes
        .filter((pipe) => pipe.from === current)
        .forEach((pipe) => {
          if (!result.includes(pipe.to) && pipe.to !== equipmentId) {
            result.push(pipe.to);
            next.push(pipe.to);
          }
        });
    });
    frontier = next;
  }

  return result;
};

export const analyzeLineRootCause = ({
  line,
  definitions,
  states,
}: IAnalyzeRootCause): IRootCauseChain => {
  const byId = Object.fromEntries(
    definitions.map((item) => [item.id, item]),
  ) as Record<string, TEquipmentDefinition>;

  const alarming = definitions
    .filter((item) => item.kind === EEquipmentKind.Sensor)
    .map((item) => ({
      item,
      severity: alarmSeverity(item, states[item.id]),
    }))
    .filter((entry) => entry.severity > 0)
    .sort((a, b) => b.severity - a.severity);

  if (alarming.length === 0) {
    return { hasSignal: false, chain: [], confidence: "low" };
  }

  const head = alarming[0].item;
  const chain: IRootCauseNode[] = [
    {
      equipmentId: head.id,
      equipmentName: head.name,
      role: "effect",
      noteKey: "ai-root-alarm",
      noteParams: {
        value: (() => {
          const state = states[head.id];
          return state && state.kind === EEquipmentKind.Sensor
            ? state.value.toLocaleString("fa-IR", {
                maximumFractionDigits: 1,
              })
            : "-";
        })(),
      },
    },
  ];

  const idledUpstream = upstreamOf(line, head.id)
    .map((id) => ({ id, definition: byId[id], state: states[id] }))
    .filter(
      (entry) =>
        entry.definition &&
        entry.state &&
        entry.definition.kind !== EEquipmentKind.Sensor &&
        isActuatorIdle(entry.state),
    );

  if (idledUpstream.length > 0) {
    const culprit = idledUpstream[0];
    chain.unshift({
      equipmentId: culprit.id,
      equipmentName: culprit.definition.name,
      role: "cause",
      noteKey: "ai-root-idle-actuator",
      noteParams: {},
    });

    idledUpstream.slice(1).forEach((entry) => {
      chain.splice(1, 0, {
        equipmentId: entry.id,
        equipmentName: entry.definition.name,
        role: "suspect",
        noteKey: "ai-root-idle-actuator",
        noteParams: {},
      });
    });

    return {
      hasSignal: true,
      headEquipmentId: head.id,
      chain,
      confidence: "high",
    };
  }

  const activeUpstream = upstreamOf(line, head.id)
    .map((id) => ({ id, definition: byId[id] }))
    .filter((entry) => entry.definition);

  if (activeUpstream.length > 0) {
    chain.unshift({
      equipmentId: activeUpstream[0].id,
      equipmentName: activeUpstream[0].definition.name,
      role: "suspect",
      noteKey: "ai-root-upstream-suspect",
      noteParams: {},
    });
    return {
      hasSignal: true,
      headEquipmentId: head.id,
      chain,
      confidence: "medium",
    };
  }

  downstreamOf(line, head.id)
    .map((id) => ({ id, definition: byId[id] }))
    .filter((entry) => entry.definition)
    .slice(0, 1)
    .forEach((entry) => {
      chain.push({
        equipmentId: entry.id,
        equipmentName: entry.definition.name,
        role: "suspect",
        noteKey: "ai-root-downstream",
        noteParams: {},
      });
    });

  return { hasSignal: true, headEquipmentId: head.id, chain, confidence: "low" };
};

const describeIdleActuator = (definition: TEquipmentDefinition): string => {
  switch (definition.kind) {
    case EEquipmentKind.Valve:
      return "ai-remedy-open-valve";
    case EEquipmentKind.Pump:
    case EEquipmentKind.Motor:
      return "ai-remedy-start-device";
    case EEquipmentKind.Heater:
      return "ai-remedy-turn-on-heater";
    default:
      return "ai-remedy-check-device";
  }
};

const startCommandFor = (
  definition: TEquipmentDefinition,
): IEquipmentRootCause["remedies"][number]["command"] => {
  switch (definition.kind) {
    case EEquipmentKind.Valve:
      return { action: ECommandAction.Open };
    case EEquipmentKind.Pump:
    case EEquipmentKind.Motor:
      return { action: ECommandAction.Start };
    case EEquipmentKind.Heater:
    case EEquipmentKind.Light:
      return { action: ECommandAction.TurnOn };
    default:
      return undefined;
  }
};

const remediesForSuspect = (
  definition: TEquipmentDefinition | undefined,
): IRootCauseRemedy[] => {
  if (!definition) return [];

  const remedies: IRootCauseRemedy[] = [];
  const command = startCommandFor(definition);

  if (command) {
    remedies.push({
      id: `remedy-actuate-${definition.id}`,
      equipmentId: definition.id,
      labelKey: describeIdleActuator(definition),
      command,
    });
  }

  remedies.push({
    id: `remedy-inspect-${definition.id}`,
    equipmentId: definition.id,
    labelKey: "ai-remedy-inspect-manual",
  });

  return remedies;
};

export const analyzeEquipmentRootCause = ({
  equipmentId,
  definitions,
  states,
  pipes,
}: IAnalyzeEquipmentRootCause): IEquipmentRootCause => {
  const byId = Object.fromEntries(
    definitions.map((item) => [item.id, item]),
  ) as Record<string, TEquipmentDefinition>;
  const target = byId[equipmentId];

  const empty: IEquipmentRootCause = {
    hasSignal: false,
    chain: [],
    confidence: "low",
    rationaleKey: "ai-root-none-for-equipment",
    rationaleParams: { name: target?.name ?? "" },
    direction: "none",
    remedies: [],
  };

  if (!target) return empty;

  const pseudoLine: IProductLine = {
    id: target.lineId,
    factoryId: "",
    name: "",
    description: "",
    shift: "",
    plcIds: [],
    equipmentIds: [],
    pipes,
  };

  const state = states[equipmentId];
  const isAlarm =
    target.kind === EEquipmentKind.Sensor && state
      ? alarmSeverity(target, state) > 0
      : false;

  // An actuator can itself be the fault (stopped, closed, off).
  const selfFaulty =
    target.kind !== EEquipmentKind.Sensor && state
      ? isActuatorIdle(state)
      : false;

  if (!isAlarm && !selfFaulty) {
    return empty;
  }

  // The alarming (or faulty) equipment plays the "effect" role; walk upstream
  // to find an idle actuator that plausibly caused it.
  const upstreamIds = upstreamOf(pseudoLine, equipmentId, 4);
  const idleUpstream = upstreamIds
    .map((id) => ({ definition: byId[id], state: states[id] }))
    .filter(
      (
        entry,
      ): entry is { definition: TEquipmentDefinition; state: TEquipmentState } =>
        Boolean(entry.definition && entry.state) &&
        entry.definition.kind !== EEquipmentKind.Sensor &&
        isActuatorIdle(entry.state),
    );

  const effectName = target.name;
  const chain: IRootCauseNode[] = [
    {
      equipmentId: target.id,
      equipmentName: target.name,
      role: "effect",
      noteKey: isAlarm ? "ai-root-alarm" : "ai-root-symptom",
      noteParams: {
        value:
          state && state.kind === EEquipmentKind.Sensor
            ? state.value.toLocaleString("fa-IR", { maximumFractionDigits: 1 })
            : "-",
      },
    },
  ];

  if (idleUpstream.length > 0) {
    const culprit = idleUpstream[0];
    chain.unshift({
      equipmentId: culprit.definition.id,
      equipmentName: culprit.definition.name,
      role: "cause",
      noteKey: "ai-root-idle-actuator",
      noteParams: {},
    });

    idleUpstream.slice(1, 3).forEach((entry) => {
      chain.splice(1, 0, {
        equipmentId: entry.definition.id,
        equipmentName: entry.definition.name,
        role: "suspect",
        noteKey: "ai-root-idle-actuator",
        noteParams: {},
      });
    });

    return {
      hasSignal: true,
      headEquipmentId: target.id,
      suspectedEquipmentId: culprit.definition.id,
      suspectedEquipmentName: culprit.definition.name,
      chain,
      confidence: "high",
      direction: "upstream",
      rationaleKey: "ai-root-rationale-upstream",
      rationaleParams: {
        cause: culprit.definition.name,
        effect: effectName,
      },
      remedies: remediesForSuspect(culprit.definition),
    };
  }

  if (selfFaulty) {
    return {
      hasSignal: true,
      headEquipmentId: target.id,
      suspectedEquipmentId: target.id,
      suspectedEquipmentName: target.name,
      chain,
      confidence: "medium",
      direction: "self",
      rationaleKey: "ai-root-rationale-self",
      rationaleParams: { name: target.name },
      remedies: remediesForSuspect(target),
    };
  }

  // Nothing idle upstream: report the alarm with an inspection remedy.
  const downstreamIds = downstreamOf(pseudoLine, equipmentId, 1).filter(
    (id) => byId[id],
  );
  downstreamIds.slice(0, 1).forEach((id) => {
    chain.push({
      equipmentId: id,
      equipmentName: byId[id].name,
      role: "suspect",
      noteKey: "ai-root-downstream",
      noteParams: {},
    });
  });

  return {
    hasSignal: true,
    headEquipmentId: target.id,
    chain,
    confidence: "low",
    direction: "downstream",
    rationaleKey: "ai-root-rationale-isolated",
    rationaleParams: { name: target.name },
    remedies: remediesForSuspect(target),
  };
};
