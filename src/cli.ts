#!/usr/bin/env node

import { readFileSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import { runAddMethod } from "./commands/add-method";
import { runCreateApp } from "./commands/create-app";
import { runDoctor } from "./commands/doctor";
import { runGenerateModule, runGeneratePart, runInit } from "./commands/generate-module";
import { runInteractiveGenerate } from "./commands/interactive";
import { runList } from "./commands/list-modules";
import { runRemoveMethod, runRemoveModule, runRemovePart } from "./commands/remove-module";
import { GenerateModuleOptions, ModulePart } from "./interfaces";
import { isModulePart } from "./utils/parts";

const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8")) as { version: string };

const program = new Command();

program.name("bogo").description("CLI generator for Express API modules").version(pkg.version);

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
  .option("--with-docker", "Add Dockerfile and docker-compose.yml", false)
  .option("--with-eslint", "Add ESLint config", false)
  .option("--dry-run", "Preview files without writing", false)
  .option("--force", "Overwrite existing files", false)
  .action((type: string, path: string, options: { withDocker: boolean; withEslint: boolean; dryRun: boolean; force: boolean }) => {
    try {
      if (type !== "app") {
        throw new Error(`Unknown type "${type}". Available: app`);
      }
      runCreateApp(process.cwd(), path, options);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List API modules in the project")
  .action(() => {
    try {
      runList(process.cwd());
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("doctor")
  .description("Check project setup for bogo")
  .action(() => {
    try {
      runDoctor(process.cwd());
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

const generate = program
  .command("generate")
  .alias("g")
  .description("Generate API module, part, or method")
  .argument("[target]", "module name, part, or method")
  .argument("[name]", "module name for part/method")
  .option("-m, --method <method>", "method spec (repeatable): getList, getList:GET, getOrder:GET:/:id", collect, [])
  .option("-p, --part <part>", "target part only (repeatable)", collect, [])
  .option("-w, --middleware <name>", "route middleware (repeatable)", collect, [])
  .option("-i, --interactive", "Interactive mode", false)
  .option("--skip-index", "Do not patch index file", false)
  .option("--dry-run", "Preview changes without writing", false)
  .option("--force", "Overwrite existing files", false)
  .action(
    async (
      target: string | undefined,
      name: string | undefined,
      options: {
        method: string[];
        part: string[];
        middleware: string[];
        interactive: boolean;
        skipIndex: boolean;
        dryRun: boolean;
        force: boolean;
      }
    ) => {
      try {
        const generateOptions = buildGenerateOptions(options);

        if (options.interactive) {
          await runInteractiveGenerate(process.cwd(), generateOptions);
          return;
        }

        if (!target) {
          throw new Error("Target required. Example: bogo g users -m getList");
        }

        if (target === "method") {
          if (!name) {
            throw new Error("Module name required. Example: bogo g method users -m getList");
          }
          if (options.method.length === 0) {
            throw new Error("At least one -m is required. Example: bogo g method users -m getList");
          }
          runAddMethod(process.cwd(), name, {
            methods: options.method,
            parts: parseParts(options.part),
            dryRun: options.dryRun,
            middleware: options.middleware,
          });
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
  .description("Remove API module, part, or method")
  .argument("<target>", "module name, part, or method")
  .argument("[name]", "module name for part/method")
  .option("-m, --method <method>", "method name to remove (repeatable)", collect, [])
  .option("-p, --part <part>", "target part only (repeatable)", collect, [])
  .option("--skip-index", "Do not patch index file", false)
  .option("--dry-run", "Preview changes without writing", false)
  .action((target: string, name: string | undefined, options: { method: string[]; part: string[]; skipIndex: boolean; dryRun: boolean }) => {
    try {
      const removeOptions = { skipIndex: options.skipIndex, dryRun: options.dryRun };

      if (target === "method") {
        if (!name) {
          throw new Error("Module name required. Example: bogo r method users -m getList");
        }
        if (options.method.length === 0) {
          throw new Error("At least one -m is required. Example: bogo r method users -m getList");
        }
        runRemoveMethod(process.cwd(), name, {
          methods: options.method,
          parts: parseParts(options.part),
          dryRun: options.dryRun,
        });
        return;
      }

      if (isModulePart(target)) {
        if (!name) {
          throw new Error(`Module name required. Example: bogo r ${target} users`);
        }
        runRemovePart(process.cwd(), target, name, removeOptions);
        return;
      }

      if (name) {
        throw new Error(`Unexpected argument "${name}". Use: bogo r <module>, bogo r <part> <module>, or bogo r method <module> -m <name>`);
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

function buildGenerateOptions(options: {
  method: string[];
  middleware: string[];
  skipIndex: boolean;
  dryRun: boolean;
  force: boolean;
}): GenerateModuleOptions {
  return {
    methods: options.method,
    middleware: options.middleware,
    skipIndex: options.skipIndex,
    dryRun: options.dryRun,
    force: options.force,
  };
}

program.parse();
