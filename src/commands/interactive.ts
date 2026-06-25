import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { GenerateModuleOptions } from "../interfaces";
import { runGenerateModule } from "./generate-module";

export async function runInteractiveGenerate(cwd: string, baseOptions: Omit<GenerateModuleOptions, "methods">): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    const moduleName = (await rl.question("Module name: ")).trim();
    if (!moduleName) {
      throw new Error("Module name is required");
    }

    const methodsRaw = (await rl.question("Methods (comma-separated, e.g. getList, createUser:POST:/create): ")).trim();
    const methods = methodsRaw
      ? methodsRaw.split(",").map(value => value.trim()).filter(Boolean)
      : [];

    const middlewareRaw = (await rl.question("Middleware (comma-separated, optional): ")).trim();
    const middleware = middlewareRaw
      ? middlewareRaw.split(",").map(value => value.trim()).filter(Boolean)
      : [];

    runGenerateModule(cwd, moduleName, {
      ...baseOptions,
      methods,
      middleware,
    });
  } finally {
    rl.close();
  }
}
