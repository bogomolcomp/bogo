import { existsSync, rmSync } from "fs";
import { join } from "path";
import { ModulePart, RemoveModuleOptions } from "../interfaces";
import { loadConfig } from "../utils/config";
import { resolveModuleNames } from "../utils/naming";
import { unpatchIndexFile } from "../utils/patch-index";

function unpatchIndexIfNeeded(
  cwd: string,
  moduleName: string,
  skipIndex: boolean,
  part?: ModulePart
): void {
  if (skipIndex) {
    console.log(`\nSkipped index patch (--skip-index)`);
    return;
  }

  if (part && part !== "routes") {
    return;
  }

  const config = loadConfig(cwd);
  const names = resolveModuleNames(moduleName);
  const indexPath = join(cwd, config.indexFile);
  const unpatchd = unpatchIndexFile(indexPath, names, config.routePrefix);

  if (unpatchd) {
    console.log(`\nUpdated ${indexPath}`);
  }
}

export function runRemoveModule(cwd: string, moduleName: string, options: RemoveModuleOptions): void {
  const config = loadConfig(cwd);
  const names = resolveModuleNames(moduleName);
  const targetDir = join(cwd, config.apiDir, names.kebab);

  if (!existsSync(targetDir)) {
    throw new Error(`Module directory not found: ${targetDir}`);
  }

  rmSync(targetDir, { recursive: true, force: true });
  console.log(`Module "${names.kebab}" removed:\n  ${targetDir}`);

  unpatchIndexIfNeeded(cwd, moduleName, options.skipIndex);
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

  rmSync(filePath);
  console.log(`${part} for "${names.kebab}" removed:\n  ${filePath}`);

  unpatchIndexIfNeeded(cwd, moduleName, options.skipIndex, part);
}
