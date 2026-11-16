import { commandStore } from "@store/commands/commands.store";

import {
  ECommandAction,
  ECommandStatus,
  type ICommandLogEntry,
} from "@dto/command.dto";
import {
  EEquipmentKind,
  type TEquipmentDefinition,
  type TEquipmentState,
} from "@dto/equipment.dto";

const REJECTION_RATE = 0.06;
const PUBLISH_DELAY_MS = 420;
const EXECUTE_DELAY_MS = 760;

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export interface ISendCommandArgs {
  definition: TEquipmentDefinition;
  state: TEquipmentState;
  action: ECommandAction;
  value?: number;
  actorName: string;
  onApply: (action: ECommandAction, value?: number) => void;
}

export interface ICommandResult {
  status: ECommandStatus;
  entry: ICommandLogEntry;
}

const createEntry = (
  args: ISendCommandArgs,
  detail: string,
): ICommandLogEntry => ({
  id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  equipmentId: args.definition.id,
  equipmentName: args.definition.name,
  lineId: args.definition.lineId,
  action: args.action,
  detail,
  status: ECommandStatus.Accepted,
  actorName: args.actorName,
  createdAt: Date.now(),
});

export const sendCommand = async (
  args: ISendCommandArgs,
): Promise<ICommandResult> => {
  const { definition, action, value } = args;
  const entry = createEntry(args, describeCommand(definition, action, value));

  commandStore.getState().append(entry);
  commandStore.getState().markPending(definition.id);

  await delay(PUBLISH_DELAY_MS);
  commandStore.getState().patchStatus(entry.id, ECommandStatus.Published);

  await delay(EXECUTE_DELAY_MS);

  const rejected = Math.random() < REJECTION_RATE;
  const finalStatus = rejected
    ? ECommandStatus.Rejected
    : ECommandStatus.Executed;

  commandStore.getState().patchStatus(entry.id, finalStatus);
  commandStore.getState().clearPending(definition.id);

  if (!rejected) args.onApply(action, value);

  return { status: finalStatus, entry: { ...entry, status: finalStatus } };
};

const formatNumber = (value?: number) =>
  value === undefined ? "" : new Intl.NumberFormat("fa-IR").format(value);

export const describeCommand = (
  definition: TEquipmentDefinition,
  action: ECommandAction,
  value?: number,
): string => {
  switch (action) {
    case ECommandAction.Start:
      return `روشن کردن ${definition.name}`;
    case ECommandAction.Stop:
      return `خاموش کردن ${definition.name}`;
    case ECommandAction.Open:
      return `باز کردن ${definition.name}`;
    case ECommandAction.Close:
      return `بستن ${definition.name}`;
    case ECommandAction.TurnOn:
      return `روشن کردن ${definition.name}`;
    case ECommandAction.TurnOff:
      return `خاموش کردن ${definition.name}`;
    case ECommandAction.SetSpeed:
      return `تنظیم سرعت روی ${formatNumber(value)}٪`;
    case ECommandAction.SetPosition:
      return `تنظیم موقعیت روی ${formatNumber(value)}٪`;
    case ECommandAction.SetTemperature:
      return `تنظیم دما روی ${formatNumber(value)} درجه`;
    case ECommandAction.SetBrightness:
      return `تنظیم روشنایی روی ${formatNumber(value)}٪`;
  }
};

export const applyCommandToState = (
  state: TEquipmentState,
  action: ECommandAction,
  value?: number,
): TEquipmentState => {
  switch (state.kind) {
    case EEquipmentKind.Motor:
    case EEquipmentKind.Pump:
    case EEquipmentKind.Conveyor:
      if (action === ECommandAction.Start) return { ...state, running: true };
      if (action === ECommandAction.Stop) return { ...state, running: false };
      if (
        action === ECommandAction.SetSpeed &&
        state.kind !== EEquipmentKind.Conveyor
      )
        return {
          ...state,
          running: (value ?? 0) > 0,
          speedPercent: value ?? state.speedPercent,
        };
      return state;
    case EEquipmentKind.Valve:
      if (action === ECommandAction.Open)
        return { ...state, open: true, positionPercent: 100 };
      if (action === ECommandAction.Close)
        return { ...state, open: false, positionPercent: 0 };
      if (action === ECommandAction.SetPosition)
        return {
          ...state,
          open: (value ?? 0) > 0,
          positionPercent: value ?? state.positionPercent,
        };
      return state;
    case EEquipmentKind.Heater:
      if (action === ECommandAction.TurnOn) return { ...state, on: true };
      if (action === ECommandAction.TurnOff) return { ...state, on: false };
      if (action === ECommandAction.SetTemperature)
        return { ...state, on: true, targetTempC: value ?? state.targetTempC };
      return state;
    case EEquipmentKind.Light:
      if (action === ECommandAction.TurnOn)
        return { ...state, on: true, brightness: state.brightness || 70 };
      if (action === ECommandAction.TurnOff) return { ...state, on: false };
      if (action === ECommandAction.SetBrightness)
        return {
          ...state,
          on: (value ?? 0) > 0,
          brightness: value ?? state.brightness,
        };
      return state;
    case EEquipmentKind.Sensor:
      return state;
  }
};
