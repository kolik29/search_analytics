import type { ComparisonReport } from "../interfaces/ComparisonReport";

export class ReportFormatter {
  format(report: ComparisonReport): string {
    const oldSearch = report.old;
    const currentSearch = report.current;

    return [
      "Анализ поисковых запросов",
      "",
      `Старый поиск (${oldSearch.path}):`,
      `- записей после фильтрации: ${this.formatInteger(oldSearch.total)}`,
      `- нулевая выдача: ${this.formatInteger(oldSearch.zeroResults)} (${this.formatPercent(oldSearch.zeroResultsPercent)})`,
      "",
      `Новый поиск (${currentSearch.path}):`,
      `- записей после фильтрации: ${this.formatInteger(currentSearch.total)}`,
      `- нулевая выдача: ${this.formatInteger(currentSearch.zeroResults)} (${this.formatPercent(currentSearch.zeroResultsPercent)})`,
      "",
      `Разница: ${this.formatNumber(report.differencePercentagePoints)} п.п.`,
      `Относительное изменение: ${this.formatPercent(report.relativeDifferencePercent)}`,
    ].join("\n");
  }

  private formatPercent(value: number): string {
    return `${this.formatNumber(value)}%`;
  }

  private formatInteger(value: number): string {
    return value.toLocaleString("ru-RU");
  }

  private formatNumber(value: number): string {
    return value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  }
}