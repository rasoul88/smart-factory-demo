import {
  AlertTriangle,
  CheckCircle2,
  Info,
  OctagonAlert,
  ScanSearch,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { EDiagnosisSeverity } from "@services/ai/diagnose";
import type { IDiagnosis } from "@services/ai/diagnose";

import { cn } from "@utils/cn";

const severityStyle: Record<
  EDiagnosisSeverity,
  { border: string; text: string; icon: typeof Info; labelKey: string }
> = {
  [EDiagnosisSeverity.Ok]: {
    border: "border-status-running/30 bg-status-running/8",
    text: "text-status-running",
    icon: CheckCircle2,
    labelKey: "ai-diagnosis-clear",
  },
  [EDiagnosisSeverity.Info]: {
    border: "border-chart-2/30 bg-chart-2/8",
    text: "text-chart-2",
    icon: Info,
    labelKey: "schedule-status",
  },
  [EDiagnosisSeverity.Warning]: {
    border: "border-status-warning/30 bg-status-warning/8",
    text: "text-status-warning",
    icon: AlertTriangle,
    labelKey: "status-warning",
  },
  [EDiagnosisSeverity.Critical]: {
    border: "border-status-fault/30 bg-status-fault/8",
    text: "text-status-fault",
    icon: OctagonAlert,
    labelKey: "status-critical",
  },
};

interface IDiagnosisCard {
  diagnosis: IDiagnosis;
  compact?: boolean;
}

export const DiagnosisCard = ({ diagnosis, compact = false }: IDiagnosisCard) => {
  const { t } = useTranslation();
  const style = severityStyle[diagnosis.severity];
  const Icon = style.icon;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/70 p-3">
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <ScanSearch className="size-3.5" />
            {t("ai-diagnosis-title")}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              style.border,
              style.text,
            )}
          >
            <Icon className="size-3" />
            {t(style.labelKey)}
          </span>
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {diagnosis.findings.map((finding) => {
          const findingStyle = severityStyle[finding.severity];
          const FindingIcon = findingStyle.icon;

          return (
            <li
              key={finding.id}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-2.5 py-2",
                findingStyle.border,
              )}
            >
              <FindingIcon
                className={cn("mt-0.5 size-3.5 shrink-0", findingStyle.text)}
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-foreground/90">
                  {t(finding.titleKey)}
                </span>
                <span className="text-[10px] leading-5 text-muted-foreground">
                  {t(finding.detailKey, {
                    ...finding.detailParams,
                    metric: t(finding.detailParams.metric ?? ""),
                    direction: t(finding.detailParams.direction ?? ""),
                  })}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[9px] leading-4 text-muted-foreground/70">
        {t("ai-diagnosis-hint")}
      </p>
    </div>
  );
};
