import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { CsvReader } from "./classes/CsvReader";
import { SearchAnalytics } from "./classes/SearchAnalytics";
import { ReportFormatter } from "./classes/ReportFormatter";

function getDefaultCsvPath(): string {
  const distFile = resolve(process.cwd(), "dist", "result.csv");
  if (existsSync(distFile)) {
    return distFile;
  }

  return resolve(process.cwd(), "result.csv");
}

function parseCliArgs(): { csvPath: string; from?: string; to?: string } {
  const args = process.argv.slice(2);
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--from" || arg === "--to") {
      const next = args[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error(`Не указано значение для ${arg}`);
      }
      flags[arg.slice(2)] = next;
      index += 1;
      continue;
    }

    if (arg.startsWith("--from=")) {
      flags.from = arg.slice("--from=".length);
      continue;
    }

    if (arg.startsWith("--to=")) {
      flags.to = arg.slice("--to=".length);
      continue;
    }

    positional.push(arg);
  }

  const csvPath = positional[0]
    ? resolve(process.cwd(), positional[0])
    : getDefaultCsvPath();

  return {
    csvPath,
    from: flags.from,
    to: flags.to,
  };
}

async function main(): Promise<void> {
  const { csvPath, from, to } = parseCliArgs();
  const reader = new CsvReader();
  const analytics = new SearchAnalytics();
  const formatter = new ReportFormatter();
  const rows = await reader.read(csvPath);
  const report = analytics.buildComparisonReport(rows, from, to);

  console.log(formatter.format(report));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Не удалось обработать CSV: ${message}`);
  process.exitCode = 1;
});