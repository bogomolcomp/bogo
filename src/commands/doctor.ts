import { existsSync } from "fs";
import { join } from "path";
import { loadConfig } from "../utils/config";

interface Check {
  ok: boolean;
  message: string;
}

export function runDoctor(cwd: string): void {
  const config = loadConfig(cwd);
  const checks: Check[] = [];

  checks.push({
    ok: existsSync(join(cwd, ".bogorc.json")),
    message: ".bogorc.json exists (optional, defaults are used if missing)",
  });

  checks.push({
    ok: existsSync(join(cwd, config.indexFile)),
    message: `index file exists: ${config.indexFile}`,
  });

  checks.push({
    ok: existsSync(join(cwd, config.apiDir)),
    message: `api directory exists: ${config.apiDir}`,
  });

  checks.push({
    ok: existsSync(join(cwd, "src/middlewares/validate.ts")) || existsSync(join(cwd, "src/middlewares/validate.js")),
    message: "validate middleware exists at src/middlewares/validate",
  });

  checks.push({
    ok: existsSync(join(cwd, "src/middlewares/formatResponse.ts")) || existsSync(join(cwd, "src/middlewares/formatResponse.js")),
    message: "formatResponse middleware exists at src/middlewares/formatResponse",
  });

  if (config.templatesDir) {
    checks.push({
      ok: existsSync(config.templatesDir),
      message: `custom templates directory exists: ${config.templatesDir}`,
    });
  }

  console.log("bogo doctor\n");
  let failed = 0;

  for (const check of checks) {
    const icon = check.ok ? "✓" : "✗";
    console.log(`  ${icon} ${check.message}`);
    if (!check.ok) {
      failed++;
    }
  }

  if (failed > 0) {
    console.log(`\n${failed} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll checks passed.");
  }
}
