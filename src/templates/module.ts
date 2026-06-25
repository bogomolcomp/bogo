import { join } from "path";
import { ModulePart, ModuleTemplateContext } from "../interfaces";
import { ensureDir, writeTextFile } from "../utils/io";
import {
  renderControllerMethod,
  renderDtoBlock,
  renderMiddlewareImports,
  renderRouteLine,
  renderServiceMethod,
  renderValidatorBlock,
} from "./render-helpers";
import { renderWithTemplate } from "../utils/template-loader";

export function renderController(ctx: ModuleTemplateContext, templatesDir?: string): string {
  return renderWithTemplate("controller", ctx, templatesDir, ({ names, methods }) => {
    const methodsCode = methods.map(method => renderControllerMethod(names, method)).join("\n");
    return `import e from "express";
import ${names.pascal}Service from "./${names.kebab}.service";

class ${names.pascal}Controller {${methodsCode}
}

export default new ${names.pascal}Controller();
`;
  });
}

export function renderService(ctx: ModuleTemplateContext, templatesDir?: string): string {
  return renderWithTemplate("service", ctx, templatesDir, ({ names, methods }) => {
    const imports =
      methods.length > 0
        ? `import { ${methods.map(m => `${m.name}DTO`).join(", ")} } from "./${names.kebab}.dto";\n`
        : "";
    const methodsCode = methods.map(method => renderServiceMethod(names, method)).join("\n");
    return `${imports}
class ${names.pascal}Service {${methodsCode}
}

export default new ${names.pascal}Service();
`;
  });
}

export function renderDto(ctx: ModuleTemplateContext, templatesDir?: string): string {
  return renderWithTemplate("dto", ctx, templatesDir, ({ methods }) => methods.map(renderDtoBlock).join("\n"));
}

export function renderValidator(ctx: ModuleTemplateContext, templatesDir?: string): string {
  return renderWithTemplate("validator", ctx, templatesDir, ({ methods }) => {
    return `import { z } from "zod";

${methods.map(renderValidatorBlock).join("\n")}`;
  });
}

export function renderRoutes(ctx: ModuleTemplateContext, templatesDir?: string): string {
  return renderWithTemplate("routes", ctx, templatesDir, ({ names, methods, middleware }) => {
    const validatorImports = methods.map(method => method.name).join(", ");
    const routes = methods.map(method => renderRouteLine(method, middleware)).join("\n");
    return `${renderMiddlewareImports(middleware)}import { Request, Response, Router } from "express";
import { validate } from "../../middlewares/validate";
import ${names.pascal}Controller from "./${names.kebab}.controller";
import { ${validatorImports} } from "./${names.kebab}.validator";

const router = Router();
const controller = ${names.pascal}Controller;

${routes}

export default router;
`;
  });
}

const PART_RENDERERS: Record<ModulePart, (ctx: ModuleTemplateContext, templatesDir?: string) => string> = {
  controller: renderController,
  service: renderService,
  dto: renderDto,
  validator: renderValidator,
  routes: renderRoutes,
};

export function renderPart(part: ModulePart, ctx: ModuleTemplateContext, templatesDir?: string): string {
  return PART_RENDERERS[part](ctx, templatesDir);
}

export function writePartFile(
  targetDir: string,
  part: ModulePart,
  ctx: ModuleTemplateContext,
  templatesDir?: string,
  options: { dryRun?: boolean; force?: boolean } = {}
): string {
  ensureDir(targetDir, options);

  const fileName = `${ctx.names.kebab}.${part}.ts`;
  const filePath = join(targetDir, fileName);
  writeTextFile(filePath, renderPart(part, ctx, templatesDir), options);
  return filePath;
}

export function writeModuleFiles(
  targetDir: string,
  ctx: ModuleTemplateContext,
  templatesDir?: string,
  options: { dryRun?: boolean; force?: boolean } = {}
): string[] {
  const parts: ModulePart[] = ["controller", "service", "dto", "validator", "routes"];
  return parts.map(part => writePartFile(targetDir, part, ctx, templatesDir, options));
}
