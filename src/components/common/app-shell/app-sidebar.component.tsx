import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { Badge } from "@components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

import { useCurrentUser } from "@hooks/auth/use-auth.hook";

import { SEED_USERS } from "@services/mock/seed";

import { authStore } from "@store/auth/auth.store";

import { EUserRole } from "@dto/user.dto";

import { cn } from "@utils/cn";
import { ROUTES } from "@utils/constants";

interface INavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface IAppSidebar {
  onNavigate?: () => void;
}

export const AppSidebar = ({ onNavigate }: IAppSidebar) => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();

  const setUser = authStore.getState().setUser;

  const navItems: INavItem[] = [
    {
      to: ROUTES.dashboard,
      labelKey: "nav-dashboard",
      end: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="size-4.5">
          <path
            d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      to: ROUTES.schedules,
      labelKey: "nav-schedules",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="size-4.5">
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3 10h18M8 3v4M16 3v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="15.5" r="1.6" fill="currentColor" />
        </svg>
      ),
    },
  ];

  const handleSwitchRole = (role: EUserRole) => {
    const next = SEED_USERS.find((item) => item.role === role);
    if (next) setUser(next);
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
          <svg viewBox="0 0 32 32" fill="none" className="size-6">
            <path
              d="M6 24V13.5l5 3V13.5l5 3V13.5l5 3V10h5v14H6z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              className="text-primary"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-sidebar-foreground">
            {t("app-title")}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("app-subtitle")}
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <span className="px-3 py-2 text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          {t("nav-section-monitoring")}
        </span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              )
            }
          >
            {item.icon}
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
        <span className="px-3 pt-1 text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          {t("role-switch-hint")}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              {user?.name}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {user?.role === EUserRole.Admin
                ? t("role-admin")
                : t("role-read-only")}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>{t("role-switch")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSwitchRole(EUserRole.Admin)}>
              {t("login-demo-admin")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSwitchRole(EUserRole.ReadOnly)}
            >
              {t("login-demo-viewer")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
