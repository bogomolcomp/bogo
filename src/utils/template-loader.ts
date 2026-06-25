import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { ModulePart, ModuleTemplateContext } from "../interfaces";
import { applyTemplate } from "../templates/render-helpers";

export function renderWithTemplate(
  part: ModulePart,
  ctx: ModuleTemplateContext,
  templatesDir: string | undefined,
  fallback: (ctx: ModuleTemplateContext) => string
): string {
  if (!templatesDir) {
    return fallback(ctx);
  }

  const templatePath = join(templatesDir, `${part}.template`);
  if (!existsSync(templatePath)) {
    return fallback(ctx);
  }

  return applyTemplate(readFileSync(templatePath, "utf-8"), ctx, part);
}
