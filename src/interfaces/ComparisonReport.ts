import type { SearchMetric } from "./SearchMetric";

export interface ComparisonReport {
  old: SearchMetric;
  current: SearchMetric;
  differencePercentagePoints: number;
  relativeDifferencePercent: number;
}