import { Lock, PlugZap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@utils/cn";

interface IEquipmentNotice {
  icon: typeof Lock;
  title: string;
  description: string;
  tone: "muted" | "danger";
}

export const EquipmentNotice = ({
  icon: Icon,
  title,
  description,
  tone,
}: IEquipmentNotice) => (
  <div
    className={cn(
      "flex items-start gap-3 rounded-xl border p-3",
      tone === "danger"
        ? "border-status-fault/30 bg-status-fault/8"
        : "border-border/60 bg-secondary/25",
    )}
  >
    <Icon
      className={cn(
        "mt-0.5 size-4 shrink-0",
        tone === "danger" ? "text-status-fault" : "text-muted-foreground",
      )}
    />
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-foreground/90">
        {title}
      </span>
      <span className="text-[10px] leading-5 text-muted-foreground">
        {description}
      </span>
    </div>
  </div>
);

export const ReadonlyNotice = () => {
  const { t } = useTranslation();

  return (
    <EquipmentNotice
      icon={Lock}
      tone="muted"
      title={t("equipment-readonly-title")}
      description={t("equipment-readonly-description")}
    />
  );
};

export const OfflineNotice = () => {
  const { t } = useTranslation();

  return (
    <EquipmentNotice
      icon={PlugZap}
      tone="danger"
      title={t("equipment-offline-title")}
      description={t("equipment-offline-description")}
    />
  );
};
