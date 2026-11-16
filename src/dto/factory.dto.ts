export enum EPlcStatus {
  Online = "online",
  Degraded = "degraded",
  Offline = "offline",
}

export enum ELineStatus {
  Running = "running",
  Idle = "idle",
  Stopped = "stopped",
  Fault = "fault",
}

export interface IPlc {
  id: string;
  lineId: string;
  name: string;
  model: string;
  ip: string;
  firmware: string;
  rack: string;
}

export interface IProductLine {
  id: string;
  factoryId: string;
  name: string;
  description: string;
  shift: string;
  plcIds: string[];
  equipmentIds: string[];
  pipes: { from: string; to: string }[];
}

export interface IFactory {
  id: string;
  name: string;
  city: string;
  address: string;
  areaSqm: number;
  establishedAt: string;
  lineIds: string[];
}
