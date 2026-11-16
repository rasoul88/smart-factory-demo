import type { IUser } from "@dto/user.dto";
import { EUserRole } from "@dto/user.dto";

export interface IAuthStore {
  user?: IUser;
  setUser: (user: IUser) => void;
  logout: () => void;
}

export const canCommand = (user?: IUser): boolean =>
  user?.role === EUserRole.Admin;
