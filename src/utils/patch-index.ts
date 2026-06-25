import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { BogoConfig, ModuleNames } from "../interfaces";
import { buildIndexLines } from "./index-path";

export function patchIndexFile(
  cwd: string,
  config: BogoConfig,
  names: ModuleNames,
  options: { dryRun?: boolean } = {}
): boolean {
  const indexPath = join(cwd, config.indexFile);
  if (!existsSync(indexPath)) {
    return false;
  }

  const { importLine, useLine } = buildIndexLines(config.indexFile, config.apiDir, names, config.routePrefix);
  let content = readFileSync(indexPath, "utf-8");

  if (content.includes(importLine) || content.includes(useLine)) {
    return false;
  }

  const lines = content.split("\n");
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^import .+ from .+;$/.test(lines[i])) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importLine);
  } else {
    lines.unshift(importLine);
  }

  content = lines.join("\n");

  const useAnchor = content.match(/app\.use\("[^"]+", .+Routes\);/);
  if (useAnchor) {
    content = content.replace(useAnchor[0], `${useAnchor[0]}\n${useLine}`);
  } else {
    const listenAnchor = content.match(/app\.listen\(/);
    if (listenAnchor) {
      content = content.replace(listenAnchor[0], `${useLine}\n\n${listenAnchor[0]}`);
    } else {
      content = `${content.trimEnd()}\n${useLine}\n`;
    }
  }

  if (options.dryRun) {
    console.log(`[dry-run] patch ${indexPath}`);
    return true;
  }

  writeFileSync(indexPath, content, "utf-8");
  return true;
}

export function suggestIndexPatch(config: BogoConfig, names: ModuleNames): string {
  const { importLine, useLine } = buildIndexLines(config.indexFile, config.apiDir, names, config.routePrefix);
  return `Add to index manually:

${importLine}
${useLine}`;
}

export function unpatchIndexFile(
  cwd: string,
  config: BogoConfig,
  names: ModuleNames,
  options: { dryRun?: boolean } = {}
): boolean {
  const indexPath = join(cwd, config.indexFile);
  if (!existsSync(indexPath)) {
    return false;
  }

  const { importLine, useLine } = buildIndexLines(config.indexFile, config.apiDir, names, config.routePrefix);
  const lines = readFileSync(indexPath, "utf-8").split("\n");
  const filtered = lines.filter(line => line !== importLine && line !== useLine);

  if (filtered.length === lines.length) {
    return false;
  }

  if (options.dryRun) {
    console.log(`[dry-run] unpatch ${indexPath}`);
    return true;
  }

  writeFileSync(indexPath, filtered.join("\n"), "utf-8");
  return true;
}
