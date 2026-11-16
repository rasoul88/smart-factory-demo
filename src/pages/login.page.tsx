import { useState } from "react";

import { ArrowLeft, Eye, Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";

import { SEED_CREDENTIALS, SEED_USERS } from "@services/mock/seed";

import { authStore } from "@store/auth/auth.store";

import { EUserRole } from "@dto/user.dto";

import { cn } from "@utils/cn";
import { ROUTES } from "@utils/constants";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const normalized = username.trim();
    if (SEED_CREDENTIALS[normalized] !== password) {
      setError(t("login-error-invalid"));
      return;
    }

    const user = SEED_USERS.find((item) => item.username === normalized);
    if (!user) {
      setError(t("login-error-invalid"));
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      authStore.getState().setUser(user);
      navigate(ROUTES.dashboard, { replace: true });
    }, 420);
  };

  const fillDemo = (role: EUserRole) => {
    const user = SEED_USERS.find((item) => item.role === role);
    if (!user) return;
    setUsername(user.username);
    setPassword(SEED_CREDENTIALS[user.username]);
    setError("");
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4">
      <div className="industrial-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 start-1/4 size-[38rem] rounded-full bg-primary/12 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-52 end-1/4 size-[34rem] rounded-full bg-chart-5/10 blur-[150px]" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border/70 bg-card/60 panel-glow backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden flex-col justify-between gap-10 border-e border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-chart-5/10 p-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="size-6 text-primary"
              >
                <path
                  d="M6 24V13.5l5 3V13.5l5 3V13.5l5 3V10h5v14H6z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{t("app-title")}</span>
              <span className="text-[11px] text-muted-foreground">
                {t("app-subtitle")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-2xl leading-snug font-bold text-glow-primary">
              {t("login-brand-headline")}
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("login-brand-description")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "۳", label: t("kpi-factories") },
              { value: "۷", label: t("kpi-lines") },
              { value: "۹", label: t("kpi-plcs") },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/60 bg-background/40 px-3 py-3 text-center"
              >
                <div className="num text-xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 md:p-10">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold">{t("login-title")}</h1>
            <p className="text-xs leading-6 text-muted-foreground">
              {t("login-subtitle")}
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{t("login-username")}</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                dir="ltr"
                className="text-start"
                placeholder="admin"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("login-password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                dir="ltr"
                className="text-start"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  {t("login-submitting")}
                </>
              ) : (
                <>
                  {t("login-submit")}
                  <ArrowLeft data-icon="inline-end" />
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                {t("login-demo-hint")}
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <DemoAccountButton
                icon={<ShieldCheck className="size-4 text-primary" />}
                title={t("role-admin")}
                description={t("login-demo-admin")}
                onSelect={() => fillDemo(EUserRole.Admin)}
              />
              <DemoAccountButton
                icon={<Eye className="size-4 text-status-idle" />}
                title={t("role-read-only")}
                description={t("login-demo-viewer")}
                onSelect={() => fillDemo(EUserRole.ReadOnly)}
              />
            </div>

            <p className="text-center text-[10px] text-muted-foreground/70">
              {t("login-footer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IDemoAccountButton {
  icon: React.ReactNode;
  title: string;
  description: string;
  onSelect: () => void;
}

const DemoAccountButton = ({
  icon,
  title,
  description,
  onSelect,
}: IDemoAccountButton) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-xl border border-border/70 bg-background/40 p-3 text-start transition-colors",
        "hover:border-primary/40 hover:bg-primary/5",
      )}
    >
      <span className="flex w-full items-center justify-between">
        {icon}
        <Badge variant="outline" className="text-[10px]">
          {t("login-fill")}
        </Badge>
      </span>
      <span className="text-xs font-semibold">{title}</span>
      <span className="text-[10px] leading-4 text-muted-foreground">
        {description}
      </span>
    </button>
  );
};
