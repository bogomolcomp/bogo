import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { ModulePart, RemoveMethodOptions, RemoveModuleOptions } from "../interfaces";
import { loadConfig } from "../utils/config";
import { parseMethodSpec } from "../utils/method-spec";
import { resolveModuleNames } from "../utils/naming";
import { unpatchIndexFile } from "../utils/patch-index";
import { REMOVERS } from "../utils/patch-method";
import { MODULE_PARTS } from "../utils/parts";

function unpatchIndexIfNeeded(
  cwd: string,
  moduleName: string,
  options: RemoveModuleOptions,
  part?: ModulePart
): void {
  if (options.skipIndex || options.dryRun) {
    if (options.skipIndex) {
      console.log("\nSkipped index patch (--skip-index)");
    }
    return;
  }

  if (part && part !== "routes") {
    return;
  }

  const config = loadConfig(cwd);
  const names = resolveModuleNames(moduleName);
  const unpatchd = unpatchIndexFile(cwd, config, names, { dryRun: options.dryRun });
  if (unpatchd) {
    console.log(`\nUpdated ${join(cwd, config.indexFile)}`);
  }
}

export function runRemoveModule(cwd: string, moduleName: string, options: RemoveModuleOptions): void {
  const config = loadConfig(cwd);
  const names = resolveModuleNames(moduleName);
  const targetDir = join(cwd, config.apiDir, names.kebab);

  if (!existsSync(targetDir)) {
    throw new Error(`Module directory not found: ${targetDir}`);
  }

  if (options.dryRun) {
    console.log(`[dry-run] remove ${targetDir}`);
  } else {
    rmSync(targetDir, { recursive: true, force: true });
  }

  console.log(`Module "${names.kebab}" removed:\n  ${targetDir}`);
  unpatchIndexIfNeeded(cwd, moduleName, options);
}

export function runRemovePart(
  cwd: string,
  part: ModulePart,
  moduleName: string,
  options: RemoveModuleOptions
): void {
  const config = loadConfig(cwd);
  const names = resolveModuleNames(moduleName);
  const filePath = join(cwd, config.apiDir, names.kebab, `${names.kebab}.${part}.ts`);

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  if (options.dryRun) {
    console.log(`[dry-run] remove ${filePath}`);
  } else {
    rmSync(filePath);
  }

  console.log(`${part} for "${names.kebab}" removed:\n  ${filePath}`);
  unpatchIndexIfNeeded(cwd, moduleName, options, part);
}

export function runRemoveMethod(cwd: string, moduleName: string, options: RemoveMethodOptions): void {
  const config = loadConfig(cwd);
  const names = resolveModuleNames(moduleName);
  const methods = options.methods.map(parseMethodSpec);
  const targetDir = join(cwd, config.apiDir, names.kebab);

  if (!existsSync(targetDir)) {
    throw new Error(`Module directory not found: ${targetDir}`);
  }

  const parts = options.parts.length > 0 ? options.parts : MODULE_PARTS;
  const ctx = { names, methods: [], middleware: [] as string[] };
  const updated: string[] = [];

  for (const part of parts) {
    const filePath = join(targetDir, `${names.kebab}.${part}.ts`);
    if (!existsSync(filePath)) {
      continue;
    }

    let content = readFileSync(filePath, "utf-8");
    for (const method of methods) {
      content = REMOVERS[part](content, ctx, method);
    }

    if (options.dryRun) {
      console.log(`[dry-run] patch ${filePath}`);
    } else {
      writeFileSync(filePath, content, "utf-8");
    }
    updated.push(filePath);
  }

  if (updated.length === 0) {
    throw new Error(`No module files found to update in ${targetDir}`);
  }

  console.log(`Method(s) removed from "${names.kebab}":\n`);
  for (const file of updated) {
    console.log(`  ${file}`);
  }
}
