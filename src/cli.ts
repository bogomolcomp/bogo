#!/usr/bin/env node

import { Command } from "commander";
import { runAddMethod } from "./commands/add-method";
import { runCreateApp } from "./commands/create-app";
import { runGenerateModule, runGeneratePart, runInit } from "./commands/generate-module";
import { runRemoveModule, runRemovePart } from "./commands/remove-module";
import { ModulePart } from "./interfaces";
import { isModulePart } from "./utils/parts";

const program = new Command();

program.name("bogo").description("CLI generator for Express API modules").version("0.1.0");

program
  .command("init")
  .description("Create .bogorc.json in the current directory")
  .action(() => {
    try {
      runInit(process.cwd());
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("create")
  .description("Create a new project")
  .argument("<type>", "project type (app)")
  .argument("[path]", "target directory", ".")
  .action((type: string, path: string) => {
    try {
      if (type !== "app") {
        throw new Error(`Unknown type "${type}". Available: app`);
      }
      runCreateApp(process.cwd(), path);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("generate")
  .alias("g")
  .description("Generate API module, part, or method")
  .argument("<target>", "module name, part, or method")
  .argument("[name]", "module name for part/method")
  .option("-m, --method <method>", "method name (repeatable), format: getList or getList:/custom-path", collect, [])
  .option("-p, --part <part>", "target part only (repeatable): controller|service|dto|validator|routes", collect, [])
  .option("--skip-index", "do not patch index file", false)
  .action(
    (
      target: string,
      name: string | undefined,
      options: { method: string[]; part: string[]; skipIndex: boolean }
    ) => {
      try {
        const generateOptions = {
          methods: options.method,
          skipIndex: options.skipIndex,
        };

        if (target === "method") {
          if (!name) {
            throw new Error("Module name required. Example: bogo g method users -m getList");
          }
          if (options.method.length === 0) {
            throw new Error("At least one -m is required. Example: bogo g method users -m getList");
          }

          const parts = parseParts(options.part);
          runAddMethod(process.cwd(), name, { methods: options.method, parts });
          return;
        }

        if (isModulePart(target)) {
          if (!name) {
            throw new Error(`Module name required. Example: bogo g ${target} users`);
          }
          runGeneratePart(process.cwd(), target, name, generateOptions);
          return;
        }

        if (name) {
          throw new Error(`Unexpected argument "${name}". Use: bogo g <module>, bogo g <part> <module>, or bogo g method <module> -m <name>`);
        }

        runGenerateModule(process.cwd(), target, generateOptions);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );

program
  .command("remove")
  .alias("r")
  .description("Remove API module or a single part")
  .argument("<target>", "module name or part: controller|service|dto|validator|routes")
  .argument("[name]", "module name when removing a single part")
  .option("--skip-index", "do not patch index file", false)
  .action((target: string, name: string | undefined, options: { skipIndex: boolean }) => {
    try {
      const removeOptions = { skipIndex: options.skipIndex };

      if (isModulePart(target)) {
        if (!name) {
          throw new Error(`Module name required. Example: bogo r ${target} users`);
        }
        runRemovePart(process.cwd(), target, name, removeOptions);
        return;
      }

      if (name) {
        throw new Error(`Unexpected argument "${name}". Use: bogo r <module> or bogo r <part> <module>`);
      }

      runRemoveModule(process.cwd(), target, removeOptions);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

function parseParts(values: string[]): ModulePart[] {
  if (values.length === 0) {
    return [];
  }

  const invalid = values.filter(value => !isModulePart(value));
  if (invalid.length > 0) {
    throw new Error(`Unknown part "${invalid[0]}". Use: controller, service, dto, validator, routes`);
  }

  return values as ModulePart[];
}

program.parse();
