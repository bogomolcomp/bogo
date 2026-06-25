import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ModulePart, ModuleTemplateContext } from "../interfaces";
import { methodToRoutePath } from "../utils/naming";

export function renderController(ctx: ModuleTemplateContext): string {
  const { names, methods } = ctx;
  const methodsCode = methods
    .map(
      method => `
  async ${method.name}(req: e.Request, res: e.Response) {
    try {
      const result = await ${names.pascal}Service.${method.name}(req.body);
      return res.success(result);
    } catch (error) {
      return res.error(error);
    }
  }`
    )
    .join("\n");

  return `import e from "express";
import ${names.pascal}Service from "./${names.kebab}.service";

class ${names.pascal}Controller {${methodsCode}
}

export default new ${names.pascal}Controller();
`;
}

export function renderService(ctx: ModuleTemplateContext): string {
  const { names, methods } = ctx;
  const imports =
    methods.length > 0
      ? `import { ${methods.map(m => `${m.name}DTO`).join(", ")} } from "./${names.kebab}.dto";\n`
      : "";

  const methodsCode = methods
    .map(
      method => `
  async ${method.name}(body: ${method.name}DTO) {
    throw new Error("${names.pascal}Service.${method.name} is not implemented");
  }`
    )
    .join("\n");

  return `${imports}
class ${names.pascal}Service {${methodsCode}
}

export default new ${names.pascal}Service();
`;
}

export function renderDto(ctx: ModuleTemplateContext): string {
  const blocks = ctx.methods.map(
    method => `export interface ${method.name}DTO {
  // TODO: define fields
}
`
  );

  return blocks.join("\n");
}

export function renderValidator(ctx: ModuleTemplateContext): string {
  const exports = ctx.methods.map(
    method => `export const ${method.name} = z.object({
  body: z.object({
    // TODO: define validation schema
  }),
});
`
  );

  return `import { z } from "zod";

${exports.join("\n")}`;
}

export function renderRoutes(ctx: ModuleTemplateContext): string {
  const { names, methods } = ctx;
  const validatorImports = methods.map(m => m.name).join(", ");
  const routes = methods
    .map(method => {
      const routePath = methodToRoutePath(method.name, method.route);
      return `router.post("${routePath}", validate(${method.name}), (req: Request, res: Response) => controller.${method.name}(req, res));`;
    })
    .join("\n");

  return `import { Request, Response, Router } from "express";
import { validate } from "../../middlewares/validate";
import ${names.pascal}Controller from "./${names.kebab}.controller";
import { ${validatorImports} } from "./${names.kebab}.validator";

const router = Router();
const controller = ${names.pascal}Controller;

${routes}

export default router;
`;
}

const PART_RENDERERS: Record<ModulePart, (ctx: ModuleTemplateContext) => string> = {
  controller: renderController,
  service: renderService,
  dto: renderDto,
  validator: renderValidator,
  routes: renderRoutes,
};

export function writePartFile(targetDir: string, part: ModulePart, ctx: ModuleTemplateContext): string {
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const fileName = `${ctx.names.kebab}.${part}.ts`;
  const filePath = join(targetDir, fileName);

  if (existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  writeFileSync(filePath, PART_RENDERERS[part](ctx), "utf-8");
  return filePath;
}

export function writeModuleFiles(targetDir: string, ctx: ModuleTemplateContext): string[] {
  const parts: ModulePart[] = ["controller", "service", "dto", "validator", "routes"];
  return parts.map(part => writePartFile(targetDir, part, ctx));
}
