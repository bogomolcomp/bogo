import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { loadConfig } from "../utils/config";

function parseControllerMethods(filePath: string): string[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, "utf-8");
  const matches = content.matchAll(/async (\w+)\(req: e\.Request, res: e\.Response\)/g);
  return [...matches].map(match => match[1]);
}

export function runList(cwd: string): void {
  const config = loadConfig(cwd);
  const apiRoot = join(cwd, config.apiDir);

  if (!existsSync(apiRoot)) {
    console.log(`No modules found. Directory does not exist: ${apiRoot}`);
    return;
  }

  const modules = readdirSync(apiRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
  if (modules.length === 0) {
    console.log("No modules found.");
    return;
  }

  console.log("Modules:\n");
  for (const moduleDir of modules) {
    const kebab = moduleDir.name;
    const controllerPath = join(apiRoot, kebab, `${kebab}.controller.ts`);
    const methods = parseControllerMethods(controllerPath);
    const methodLabel = methods.length > 0 ? methods.join(", ") : "no methods detected";
    console.log(`  ${kebab}  →  ${methodLabel}`);
  }
}
