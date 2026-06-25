import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { AddMethodOptions, ModulePart, ModuleTemplateContext } from "../interfaces";
import { loadConfig } from "../utils/config";
import { parseMethodSpec } from "../utils/method-spec";
import { resolveModuleNames } from "../utils/naming";
import { PATCHERS } from "../utils/patch-method";
import { MODULE_PARTS } from "../utils/parts";

export function runAddMethod(cwd: string, moduleName: string, options: AddMethodOptions): void {
  const config = loadConfig(cwd);
  const names = resolveModuleNames(moduleName);
  const methods = options.methods.map(parseMethodSpec);
  const targetDir = join(cwd, config.apiDir, names.kebab);

  if (!existsSync(targetDir)) {
    throw new Error(`Module directory not found: ${targetDir}`);
  }

  const parts = options.parts.length > 0 ? options.parts : MODULE_PARTS;
  const ctx: ModuleTemplateContext = { names, methods: [], middleware: options.middleware };
  const updated: string[] = [];

  for (const part of parts) {
    const filePath = join(targetDir, `${names.kebab}.${part}.ts`);
    if (!existsSync(filePath)) {
      continue;
    }

    let content = readFileSync(filePath, "utf-8");
    for (const method of methods) {
      content = PATCHERS[part](content, ctx, method);
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

  console.log(`Method(s) added to "${names.kebab}":\n`);
  for (const file of updated) {
    console.log(`  ${file}`);
  }
}
