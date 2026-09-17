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
    // Если переданы даты, ограничиваем выборку по диапазону, иначе анализируем весь CSV.
    const fromDate = from ? this.parseDateInput(from, "from") : undefined;
    const toDate = to ? this.parseDateInput(to, "to") : undefined;

    const selectedRows = rows.filter((row) => {
      const rowDate = this.parseRowDate(row.DATE);
      const isInRange =
        (!fromDate || (rowDate !== null && rowDate >= fromDate)) &&
        (!toDate || (rowDate !== null && rowDate <= toDate));

      // 1) Сравниваем только нужный путь поиска без параметров URL.
      // 2) Оставляем только общий поиск global.
      // 3) Исключаем клики и пустые запросы.
      return (
        isInRange &&
        this.getPath(row.PAGE_URL) === path &&
        row.SEARCH_TYPE === "global" &&
        row.CLICK.trim() === "" &&
        row.QUERY.trim() !== ""
      );
    });

    // Формула: число записей с RESULTS_COUNT = 0 / число оставшихся записей * 100%.
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
    // Сравниваем старый и новый поиск по одинаковой логике фильтрации.
    const old = this.calculateMetric(rows, "/search/", from, to);
    const current = this.calculateMetric(rows, "/searchSmart/", from, to);

    // Разница в процентных пунктах: 5,69% − 5,01% = 0,68 п.п.
    const differencePercentagePoints = this.round(
      old.zeroResultsPercent - current.zeroResultsPercent,
    );

    // Относительное улучшение относительно старого значения.
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

  // Убираем параметры URL и оставляем только pathname, чтобы старый и новый поиск
  // сравнивались по одной логике независимо от query-параметров.
  private getPath(url: string): string | null {
    try {
      return new URL(url).pathname;
    } catch {
      return null;
    }
  }

  // Даты в CSV бывают в разных форматах: dd.mm.yyyy HH:mm:ss и yyyy-mm-dd HH:mm:ss.
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

  // Поддерживаем даты вида YYYY-MM-DD и DD.MM.YYYY.
  // Для "to" добавляем конец дня, чтобы интервал включал весь день.
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