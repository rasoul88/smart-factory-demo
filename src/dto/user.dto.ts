export enum EUserRole {
  Admin = "admin",
  ReadOnly = "read-only",
}

export interface IUser {
  id: string;
  name: string;
  username: string;
  role: EUserRole;
  factoryIds: string[];
}

export interface ICredentials {
  username: string;
  password: string;
}
