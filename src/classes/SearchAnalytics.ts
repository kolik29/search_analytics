import type { ComparisonReport } from "../interfaces/ComparisonReport";
import type { SearchMetric } from "../interfaces/SearchMetric";
import type { SearchRecord } from "../interfaces/SearchRecord";

export class SearchAnalytics {
  calculateMetric(
    rows: SearchRecord[],
    path: string,
    from?: string,
    to?: string,
  ): SearchMetric {
    const fromDate = from ? this.parseDateInput(from, "from") : undefined;
    const toDate = to ? this.parseDateInput(to, "to") : undefined;

    const selectedRows = rows.filter((row) => {
      const rowDate = this.parseRowDate(row.DATE);
      const isInRange =
        (!fromDate || (rowDate !== null && rowDate >= fromDate)) &&
        (!toDate || (rowDate !== null && rowDate <= toDate));

      return (
        isInRange &&
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

  buildComparisonReport(
    rows: SearchRecord[],
    from?: string,
    to?: string,
  ): ComparisonReport {
    const old = this.calculateMetric(rows, "/search/", from, to);
    const current = this.calculateMetric(rows, "/searchSmart/", from, to);
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

  private parseRowDate(value: string): Date | null {
    const date = value.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})$/);
    if (date) {
      const [, day, month, year, time] = date;
      return new Date(`${year}-${month}-${day}T${time}Z`);
    }

    const iso = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/);
    if (iso) {
      const [, datePart, timePart] = iso;
      return new Date(`${datePart}T${timePart}Z`);
    }

    return null;
  }

  private parseDateInput(value: string, mode: "from" | "to"): Date {
    const trimmed = value.trim();
    const dateOnly = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
    const dateOnlyRu = trimmed.match(/^\d{2}\.\d{2}.\d{4}$/);

    if (dateOnly) {
      const base = new Date(`${dateOnly[0]}T00:00:00Z`);
      return mode === "to" ? new Date(`${dateOnly[0]}T23:59:59Z`) : base;
    }

    if (dateOnlyRu) {
      const [day, month, year] = trimmed.split(".");
      const base = new Date(`${year}-${month}-${day}T00:00:00Z`);
      return mode === "to" ? new Date(`${year}-${month}-${day}T23:59:59Z`) : base;
    }

    const parsed = new Date(trimmed.replace(" ", "T") + (trimmed.includes("T") ? "" : "Z"));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    throw new Error(`Некорректная дата: ${value}`);
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}