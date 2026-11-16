import { Navigate, Outlet } from "react-router-dom";

import { useCurrentUser } from "@hooks/auth/use-auth.hook";

import { ROUTES } from "@utils/constants";

export const RequireSession = () => {
  const { user } = useCurrentUser();

  if (!user) return <Navigate to={ROUTES.login} replace />;

  return <Outlet />;
};

export const RedirectIfSession = () => {
  const { user } = useCurrentUser();

  if (user) return <Navigate to={ROUTES.dashboard} replace />;

  return <Outlet />;
};
