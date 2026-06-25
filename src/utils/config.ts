import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { BogoConfig } from "../interfaces";

const DEFAULT_CONFIG: BogoConfig = {
  apiDir: "src/api",
  indexFile: "src/index.ts",
  routePrefix: "/api",
};

export function loadConfig(cwd: string): BogoConfig {
  const configPath = join(cwd, ".bogorc.json");

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const raw = readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw) as Partial<BogoConfig>;

  return {
    ...DEFAULT_CONFIG,
    ...parsed,
  };
}

export function getDefaultConfigContent(): string {
  return `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`;
}
