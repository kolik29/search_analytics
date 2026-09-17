import type { ComparisonReport } from "../interfaces/ComparisonReport";
import type { SearchMetric } from "../interfaces/SearchMetric";
import type { SearchRecord } from "../interfaces/SearchRecord";

export class SearchAnalytics {
  calculateMetric(rows: SearchRecord[], path: string): SearchMetric {
    const selectedRows = rows.filter((row) => {
      return (
        this.getPath(row.PAGE_URL) === path &&
        row.SEARCH_TYPE === "global" &&
        row.CLICK.trim() === "" &&
        row.QUERY.trim() !== ""
      );
    });
    const zeroResults = selectedRows.filter(
      (row) => row.RESULTS_COUNT.trim() === "0",
    ).length;

    return {
      path,
      total: selectedRows.length,
      zeroResults,
      zeroResultsPercent:
        selectedRows.length === 0
          ? 0
          : this.round((zeroResults / selectedRows.length) * 100),
    };
  }

  buildComparisonReport(rows: SearchRecord[]): ComparisonReport {
    const old = this.calculateMetric(rows, "/search/");
    const current = this.calculateMetric(rows, "/searchSmart/");
    const differencePercentagePoints = this.round(
      old.zeroResultsPercent - current.zeroResultsPercent,
    );
    const oldRate = old.zeroResults / old.total;
    const currentRate = current.zeroResults / current.total;

    return {
      old,
      current,
      differencePercentagePoints,
      relativeDifferencePercent:
        old.total === 0
          ? 0
          : this.round(((oldRate - currentRate) / oldRate) * 100),
    };
  }

  private getPath(url: string): string | null {
    try {
      return new URL(url).pathname;
    } catch {
      return null;
    }
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}