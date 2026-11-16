export enum ECommandAction {
  Start = "start",
  Stop = "stop",
  SetSpeed = "setSpeed",
  Open = "open",
  Close = "close",
  SetPosition = "setPosition",
  TurnOn = "turnOn",
  TurnOff = "turnOff",
  SetTemperature = "setTemperature",
  SetBrightness = "setBrightness",
}

export enum ECommandStatus {
  Accepted = "accepted",
  Published = "published",
  Executed = "executed",
  Rejected = "rejected",
  TimedOut = "timedOut",
}

export interface ICommandLogEntry {
  id: string;
  equipmentId: string;
  equipmentName: string;
  lineId: string;
  action: ECommandAction;
  detail: string;
  status: ECommandStatus;
  actorName: string;
  createdAt: number;
}

export interface ICommandRequest {
  equipmentId: string;
  action: ECommandAction;
  value?: number;
}
