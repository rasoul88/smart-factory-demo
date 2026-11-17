export type TTrendDirection = "rising" | "falling" | "stable";

export interface ISignalTrend {
  latest: number;
  min: number;
  max: number;
  mean: number;
  slope: number;
  volatility: number;
  zScore: number;
  direction: TTrendDirection;
  sampleCount: number;
}

const STABLE_SLOPE_RATIO = 0.002;

export const analyzeSignal = (samples: number[]): ISignalTrend => {
  const count = samples.length;

  if (count === 0) {
    return {
      latest: 0,
      min: 0,
      max: 0,
      mean: 0,
      slope: 0,
      volatility: 0,
      zScore: 0,
      direction: "stable",
      sampleCount: 0,
    };
  }

  const latest = samples[count - 1];
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const mean = samples.reduce((sum, value) => sum + value, 0) / count;

  // Least-squares slope over the index domain (units per sample).
  let numerator = 0;
  let denominator = 0;
  const meanIndex = (count - 1) / 2;

  samples.forEach((value, index) => {
    numerator += (index - meanIndex) * (value - mean);
    denominator += (index - meanIndex) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;

  const variance =
    samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
  const volatility = Math.sqrt(variance);

  const zScore = volatility === 0 ? 0 : (latest - mean) / volatility;

  const scale = Math.max(Math.abs(mean), Math.abs(max - min), 1);
  const direction: TTrendDirection =
    slope > scale * STABLE_SLOPE_RATIO
      ? "rising"
      : slope < -scale * STABLE_SLOPE_RATIO
        ? "falling"
        : "stable";

  return {
    latest,
    min,
    max,
    mean,
    slope,
    volatility,
    zScore,
    direction,
    sampleCount: count,
  };
};

export const projectSamplesUntil = (
  trend: ISignalTrend,
  threshold: number,
): number | null => {
  if (trend.direction !== "rising" || trend.slope <= 0) return null;
  // Already at or past the threshold: there is nothing left to project.
  if (trend.latest >= threshold) return null;

  const remaining = (threshold - trend.latest) / trend.slope;
  if (!Number.isFinite(remaining) || remaining <= 0) return null;

  return Math.round(remaining);
};

export const rangePosition = (
  value: number,
  min: number,
  max: number,
): number => {
  const span = max - min;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (value - min) / span));
};
