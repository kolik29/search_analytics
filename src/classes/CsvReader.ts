import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import type { SearchRecord } from "../interfaces/SearchRecord";

export class CsvReader {
  async read(filePath: string): Promise<SearchRecord[]> {
    const content = await readFile(filePath, "utf8");

    return parse(content, {
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
      trim: false,
    }) as SearchRecord[];
  }
}