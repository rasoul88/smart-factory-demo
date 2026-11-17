import { ECommandAction } from "@dto/command.dto";
import { EEquipmentKind } from "@dto/equipment.dto";
import type { TEquipmentDefinition } from "@dto/equipment.dto";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const normalizePersian = (text: string): string =>
  text
    .replace(/[۰-۹]/g, (char) => String(PERSIAN_DIGITS.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String(ARABIC_DIGITS.indexOf(char)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/[.,،؛:!؟?"'«»()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const parseNumber = (text: string): number | undefined => {
  const normalized = normalizePersian(text);
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
};

// Word-level matching avoids substring traps such as "نور" inside "موتور".
const tokensOf = (text: string): string[] => normalizePersian(text).split(" ");

// Persian attaches suffixes directly ("هشدارهایی", "وضعیت‌مان"). Only whitelisted
// suffixes are tolerated, so "نورد" is not mistaken for "نور".
const PERSIAN_SUFFIXES = ["هایی", "های", "ها", "مان", "تان", "شان", "یم", "ی"];

const hasPhrase = (tokens: string[], phrase: string): boolean => {
  const phraseTokens = tokensOf(phrase);
  if (phraseTokens.length === 0) return false;

  const matchesAt = (token: string, expected: string, isLast: boolean) => {
    if (token === expected) return true;
    if (!isLast || expected.length < 3) return false;
    return PERSIAN_SUFFIXES.some((suffix) => token === expected + suffix);
  };

  for (let start = 0; start <= tokens.length - phraseTokens.length; start += 1) {
    const matched = phraseTokens.every((expected, offset) =>
      matchesAt(
        tokens[start + offset],
        expected,
        offset === phraseTokens.length - 1,
      ),
    );
    if (matched) return true;
  }
  return false;
};

interface IActionVerb {
  action: ECommandAction;
  words: string[];
}

const ACTION_VERBS: IActionVerb[] = [
  {
    action: ECommandAction.Stop,
    words: ["خاموش", "قطع", "متوقف", "بخوابان", "stop", "off", "halt"],
  },
  {
    action: ECommandAction.Start,
    words: ["روشن", "راه انداز", "استارت", "بچرخان", "start", "run", "on"],
  },
  {
    action: ECommandAction.Open,
    words: ["باز کن", "بازکن", "باز", "open"],
  },
  {
    action: ECommandAction.Close,
    words: ["ببند", "بسته", "close", "shut"],
  },
  {
    action: ECommandAction.SetTemperature,
    words: ["دما", "حرارت", "گرمای", "temperature", "temp"],
  },
  {
    action: ECommandAction.SetSpeed,
    words: ["سرعت", "دور", "speed", "rpm"],
  },
  {
    action: ECommandAction.SetPosition,
    words: ["موقعیت", "درجه باز", "میزان باز", "position"],
  },
  {
    action: ECommandAction.SetBrightness,
    words: ["روشنایی", "نور", "brightness"],
  },
];

const VALUE_ACTIONS: ECommandAction[] = [
  ECommandAction.SetSpeed,
  ECommandAction.SetPosition,
  ECommandAction.SetTemperature,
  ECommandAction.SetBrightness,
];

const supportsAction = (
  definition: TEquipmentDefinition,
  action: ECommandAction,
): boolean => {
  switch (definition.kind) {
    case EEquipmentKind.Motor:
    case EEquipmentKind.Pump:
      return [
        ECommandAction.Start,
        ECommandAction.Stop,
        ECommandAction.SetSpeed,
      ].includes(action);
    case EEquipmentKind.Conveyor:
      return [ECommandAction.Start, ECommandAction.Stop].includes(action);
    case EEquipmentKind.Valve:
      return [
        ECommandAction.Open,
        ECommandAction.Close,
        ECommandAction.SetPosition,
      ].includes(action);
    case EEquipmentKind.Heater:
      return [
        ECommandAction.TurnOn,
        ECommandAction.TurnOff,
        ECommandAction.SetTemperature,
      ].includes(action);
    case EEquipmentKind.Light:
      return [
        ECommandAction.TurnOn,
        ECommandAction.TurnOff,
        ECommandAction.SetBrightness,
      ].includes(action);
    case EEquipmentKind.Sensor:
      return false;
  }
};

// Heaters/lights use turnOn/turnOff rather than start/stop.
const toKindAction = (
  definition: TEquipmentDefinition,
  action: ECommandAction,
): ECommandAction => {
  if (
    definition.kind === EEquipmentKind.Heater ||
    definition.kind === EEquipmentKind.Light
  ) {
    if (action === ECommandAction.Start) return ECommandAction.TurnOn;
    if (action === ECommandAction.Stop) return ECommandAction.TurnOff;
  }
  if (
    definition.kind !== EEquipmentKind.Heater &&
    definition.kind !== EEquipmentKind.Light
  ) {
    if (action === ECommandAction.TurnOn) return ECommandAction.Start;
    if (action === ECommandAction.TurnOff) return ECommandAction.Stop;
  }
  return action;
};

export type TIntent =
  | {
      kind: "status";
      scope: "factory" | "line" | "equipment";
      equipmentId?: string;
      lineName?: string;
    }
  | { kind: "alarms" }
  | { kind: "diagnose"; equipmentId: string }
  | { kind: "rootCause"; lineId?: string }
  | {
      kind: "command";
      equipmentId: string;
      action: ECommandAction;
      value?: number;
      unsupported?: boolean;
    }
  | { kind: "report" }
  | { kind: "help" };

export interface IParseContext {
  equipment: TEquipmentDefinition[];
  lineNames: { id: string; name: string }[];
}

const findEquipment = (
  normalized: string,
  context: IParseContext,
): TEquipmentDefinition | undefined => {
  const candidates = context.equipment
    .map((item) => ({ item, key: normalizePersian(item.name) }))
    .sort((a, b) => b.key.length - a.key.length);

  const direct = candidates.find((entry) => normalized.includes(entry.key));
  if (direct) return direct.item;

  // Fall back to a distinctive token (longest word) to tolerate partial mentions.
  const tokenMatch = candidates.find((entry) =>
    entry.key
      .split(" ")
      .filter((word) => word.length >= 4)
      .some((word) => normalized.includes(word)),
  );

  return tokenMatch?.item;
};

const findLine = (normalized: string, context: IParseContext) =>
  context.lineNames
    .map((line) => ({ line, key: normalizePersian(line.name) }))
    .sort((a, b) => b.key.length - a.key.length)
    .find((entry) => normalized.includes(entry.key))?.line;

const detectAction = (
  tokens: string[],
  normalized: string,
): ECommandAction | undefined => {
  for (const verb of ACTION_VERBS) {
    if (verb.words.some((word) => hasPhrase(tokens, word))) {
      return verb.action;
    }
  }
  // "روشن کن" style imperatives without a matching single token.
  if (normalized.includes("روشن کن")) return ECommandAction.TurnOn;
  return undefined;
};

const REPORT_WORDS = ["گزارش", "خلاصه", "report", "summary", "شیفت"];
const ALARM_WORDS = [
  "هشدار",
  "آلارم",
  "خطا",
  "مشکل",
  "alarm",
  "alert",
  "warning",
];
const DIAGNOSE_WORDS = [
  "عیب",
  "عیب یابی",
  "خراب",
  "تشخیص",
  "چرا",
  "علت",
  "مشکل",
  "diagnose",
  "why",
];
const STATUS_WORDS = ["وضعیت", "چطور", "چگونه", "status", "state", "how"];
const ROOT_WORDS = ["ریشه", "علت اصلی", "root cause", "منشا"];

export const parseIntent = (rawText: string, context: IParseContext): TIntent => {
  const normalized = normalizePersian(rawText);
  if (!normalized) return { kind: "help" };

  const tokens = tokensOf(rawText);
  const has = (words: string[]) => words.some((word) => hasPhrase(tokens, word));

  const equipment = findEquipment(normalized, context);
  const number = parseNumber(normalized);

  if (has(ROOT_WORDS)) {
    const line = findLine(normalized, context);
    return { kind: "rootCause", lineId: line?.id };
  }

  // Diagnose/why questions win over imperative verbs ("چرا موتور روشن نمی‌شود").
  if (has(DIAGNOSE_WORDS)) {
    if (equipment) return { kind: "diagnose", equipmentId: equipment.id };
    return { kind: "rootCause" };
  }

  const action = detectAction(tokens, normalized);

  if (equipment && action) {
    const kindAction = toKindAction(equipment, action);
    const supported = supportsAction(equipment, kindAction);
    const needsValue = VALUE_ACTIONS.includes(kindAction);

    return {
      kind: "command",
      equipmentId: equipment.id,
      action: kindAction,
      value: needsValue ? number : undefined,
      unsupported: !supported,
    };
  }

  if (has(REPORT_WORDS)) {
    return { kind: "report" };
  }

  if (has(ALARM_WORDS)) {
    return { kind: "alarms" };
  }

  if (equipment) {
    return { kind: "status", scope: "equipment", equipmentId: equipment.id };
  }

  const line = findLine(normalized, context);
  if (line) {
    return { kind: "status", scope: "line", lineName: line.name };
  }

  if (has(STATUS_WORDS)) {
    return { kind: "status", scope: "factory" };
  }

  return { kind: "help" };
};
