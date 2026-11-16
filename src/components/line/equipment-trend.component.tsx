import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

import { formatNumber } from "@utils/format/format";

interface ILiveSparkline {
  samples: number[];
  className?: string;
  height?: number;
}

export const LiveSparkline = ({
  samples,
  className,
  height = 48,
}: ILiveSparkline) => {
  if (samples.length < 2) return null;

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = max - min || 1;
  const width = 100;

  const points = samples.map((sample, index) => {
    const x = (index / (samples.length - 1)) * width;
    const y = height - ((sample - min) / span) * (height - 6) - 3;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className="stroke-primary"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface IEquipmentTrend {
  samples: number[];
  label: string;
  unit: string;
}

export const EquipmentTrend = ({ samples, label, unit }: IEquipmentTrend) => {
  const { t } = useTranslation();

  if (samples.length < 2) return null;

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const latest = samples[samples.length - 1];
  const first = samples[0];
  const delta = latest - first;
  const trendUp = delta >= 0;

  return (
    <Card className="border-border/60 bg-card/60 py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-0">
        <CardTitle className="text-[11px] font-medium text-muted-foreground">
          {t("equipment-trend")}
        </CardTitle>
        <span
          className={
            trendUp
              ? "num text-[10px] text-status-running"
              : "num text-[10px] text-status-warning"
          }
        >
          {trendUp ? "▲" : "▼"} {formatNumber(Math.abs(Math.round(delta)))}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-2">
        <LiveSparkline samples={samples} height={56} className="h-14 w-full" />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="num">
            {formatNumber(Math.round(min))} {unit}
          </span>
          <span className="text-foreground/70">{label}</span>
          <span className="num">
            {formatNumber(Math.round(max))} {unit}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
