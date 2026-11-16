import { useTranslation } from "react-i18next";

import { canCommand } from "@store/auth/auth.model";
import { authStore } from "@store/auth/auth.store";

import { useShallowStore } from "@utils/hooks/use-shallow-store";

export const useCurrentUser = () => {
  const { user, logout } = useShallowStore(authStore, ["user", "logout"]);
  return { user, logout, canCommand: canCommand(user) };
};

export const useRoleLabel = () => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();

  if (!user) return "";

  return user.role === "admin" ? t("role-admin") : t("role-read-only");
};
