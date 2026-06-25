import { existsSync, mkdirSync, writeFileSync } from "fs";

export interface WriteOptions {
  dryRun?: boolean;
  force?: boolean;
}

export function writeTextFile(filePath: string, content: string, options: WriteOptions = {}): void {
  if (options.dryRun) {
    console.log(`[dry-run] write ${filePath}`);
    return;
  }

  if (existsSync(filePath) && !options.force) {
    throw new Error(`File already exists: ${filePath}`);
  }

  writeFileSync(filePath, content, "utf-8");
}

export function ensureDir(dirPath: string, options: WriteOptions = {}): void {
  if (options.dryRun) {
    console.log(`[dry-run] mkdir ${dirPath}`);
    return;
  }

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export function removePath(_path: string, options: WriteOptions = {}): void {
  if (options.dryRun) {
    console.log(`[dry-run] remove ${_path}`);
  }
}
