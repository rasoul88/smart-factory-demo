import { LogOut, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";

import { useCurrentUser } from "@hooks/auth/use-auth.hook";
import { useLiveClock } from "@hooks/common/use-live-clock.hook";

import { EUserRole } from "@dto/user.dto";

interface IAppHeader {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
}

export const AppHeader = ({ title, subtitle, onOpenSidebar }: IAppHeader) => {
  const { t } = useTranslation();
  const { user, logout } = useCurrentUser();
  const clock = useLiveClock();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border/70 bg-background px-4 py-3 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label={t("nav-dashboard")}
      >
        <Menu />
      </Button>

      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="ms-auto flex items-center gap-2 md:gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs sm:flex">
          <span className="size-1.5 rounded-full bg-status-running node-pulse" />
          <span className="text-muted-foreground">{t("dashboard-updated")}</span>
          <span className="num font-medium text-foreground">{clock}</span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-foreground">
              {user?.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {user?.username}
            </span>
          </div>
          <Badge
            variant={user?.role === EUserRole.Admin ? "default" : "secondary"}
            className="text-[10px]"
          >
            {user?.role === EUserRole.Admin
              ? t("role-admin")
              : t("role-read-only")}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label={t("nav-logout")}
        >
          <LogOut />
        </Button>
      </div>
    </header>
  );
};
