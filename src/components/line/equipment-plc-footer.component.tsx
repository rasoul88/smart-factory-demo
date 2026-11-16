import { Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusDot } from "@components/common/status-badge.component";
import { Separator } from "@components/ui/separator";

import { EVisualStatus } from "@utils/equipment/equipment-status";
import { formatTime } from "@utils/format/format";

interface IEquipmentPlcFooter {
  plcName: string;
  plcStatus: EVisualStatus;
  updatedAt?: number;
}

export const EquipmentPlcFooter = ({
  plcName,
  plcStatus,
  updatedAt,
}: IEquipmentPlcFooter) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("equipment-plc")}
        </span>
        <span className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1 text-[10px]">
          <Cpu className="size-3 text-muted-foreground" />
          <StatusDot status={plcStatus} />
          <span className="text-foreground/85">{plcName}</span>
        </span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{t("equipment-last-update")}</span>
        <span className="num text-foreground/80">
          {updatedAt ? formatTime(updatedAt) : "-"}
        </span>
      </div>
    </div>
  );
};
