import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { GenerateModuleOptions, ModulePart, ModuleTemplateContext } from "../interfaces";
import { writeModuleFiles, writePartFile } from "../templates/module";
import { getDefaultConfigContent, loadConfig } from "../utils/config";
import { resolveModuleNames } from "../utils/naming";
import { parseMethodSpec } from "../utils/patch-method";
import { patchIndexFile, suggestIndexPatch } from "../utils/patch-index";

function buildContext(moduleName: string, options: GenerateModuleOptions): ModuleTemplateContext {
  const names = resolveModuleNames(moduleName);
  const methods = options.methods.length > 0 ? options.methods.map(parseMethodSpec) : [{ name: "execute" }];
  return { names, methods };
}

function patchIndexIfNeeded(
  cwd: string,
  ctx: ModuleTemplateContext,
  skipIndex: boolean,
  part?: ModulePart
): void {
  if (skipIndex || (part && part !== "routes")) {
    if (skipIndex) {
      console.log(`\nSkipped index patch (--skip-index)`);
    }
    return;
  }

  const config = loadConfig(cwd);
  const indexPath = join(cwd, config.indexFile);
  const patched = patchIndexFile(indexPath, ctx.names, config.routePrefix);

  if (patched) {
    console.log(`\nUpdated ${indexPath}`);
  } else if (!part) {
    console.log(`\n${suggestIndexPatch(ctx.names, config.routePrefix)}`);
  }
}

export function runInit(cwd: string): void {
  const configPath = join(cwd, ".bogorc.json");

  if (existsSync(configPath)) {
    console.log(`.bogorc.json already exists at ${configPath}`);
    return;
  }

  writeFileSync(configPath, getDefaultConfigContent(), "utf-8");
  console.log(`Created ${configPath}`);
}

export function runGenerateModule(cwd: string, moduleName: string, options: GenerateModuleOptions): void {
  const config = loadConfig(cwd);
  const ctx = buildContext(moduleName, options);
  const targetDir = join(cwd, config.apiDir, ctx.names.kebab);

  if (existsSync(targetDir)) {
    throw new Error(`Module directory already exists: ${targetDir}`);
  }

  const written = writeModuleFiles(targetDir, ctx);

  console.log(`Module "${ctx.names.kebab}" created:\n`);
  for (const file of written) {
    console.log(`  ${file}`);
  }

  patchIndexIfNeeded(cwd, ctx, options.skipIndex);
}

export function runGeneratePart(
  cwd: string,
  part: ModulePart,
  moduleName: string,
  options: GenerateModuleOptions
): void {
  const config = loadConfig(cwd);
  const ctx = buildContext(moduleName, options);
  const targetDir = join(cwd, config.apiDir, ctx.names.kebab);
  const written = writePartFile(targetDir, part, ctx);

  console.log(`${part} for "${ctx.names.kebab}" created:\n  ${written}`);

  patchIndexIfNeeded(cwd, ctx, options.skipIndex, part);
}
