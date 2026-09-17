import { resolve } from "node:path";
import { CsvReader } from "./classes/CsvReader";
import { SearchAnalytics } from "./classes/SearchAnalytics";
import { ReportFormatter } from "./classes/ReportFormatter";

const inputPath = resolve(process.argv[2] ?? "result.csv");

async function main(): Promise<void> {
  const reader = new CsvReader();
  const analytics = new SearchAnalytics();
  const formatter = new ReportFormatter();
  const rows = await reader.read(inputPath);
  const report = analytics.buildComparisonReport(rows);

  console.log(formatter.format(report));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Не удалось обработать CSV: ${message}`);
  process.exitCode = 1;
});