import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { AppShell } from "@components/common/app-shell/app-shell.component";
import {
  RedirectIfSession,
  RequireSession,
} from "@components/common/session-guard.component";

import DashboardPage from "@pages/dashboard.page";
import FactoryPage from "@pages/factory.page";
import LinePage from "@pages/line.page";
import LoginPage from "@pages/login.page";
import SchedulesPage from "@pages/schedules.page";

const router = createBrowserRouter([
  {
    element: <RedirectIfSession />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <RequireSession />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/factories/:factoryId", element: <FactoryPage /> },
          { path: "/schedules", element: <SchedulesPage /> },
          {
            path: "/factories/:factoryId/lines/:lineId",
            element: <LinePage />,
          },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
