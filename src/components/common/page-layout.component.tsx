import { AppHeader } from "@components/common/app-shell/app-header.component";
import { useShell } from "@components/common/app-shell/shell-context";

import { cn } from "@utils/cn";

interface IPageLayout {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageLayout = ({
  title,
  subtitle,
  actions,
  children,
  className,
}: IPageLayout) => {
  const { openSidebar } = useShell();

  return (
    <>
      <AppHeader title={title} subtitle={subtitle} onOpenSidebar={openSidebar} />
      {actions && (
        <div className="border-b border-border/60 bg-background/60 px-4 py-2.5 md:px-6">
          {actions}
        </div>
      )}
      <div className={cn("flex flex-1 flex-col gap-5 p-4 md:p-6", className)}>
        {children}
      </div>
    </>
  );
};

interface ISectionTitle {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionTitle = ({ title, description, action }: ISectionTitle) => {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
};
