import { MethodSpec, ModuleNames, ModuleTemplateContext } from "../interfaces";
import { routerFn } from "../utils/http";
import { methodToRoutePath } from "../utils/naming";

export function renderControllerMethod(names: ModuleNames, method: MethodSpec): string {
  return `
  async ${method.name}(req: e.Request, res: e.Response) {
    try {
      const result = await ${names.pascal}Service.${method.name}({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return res.success(result);
    } catch (error) {
      return res.error(error);
    }
  }`;
}

export function renderServiceMethod(names: ModuleNames, method: MethodSpec): string {
  return `
  async ${method.name}(dto: ${method.name}DTO) {
    throw new Error("${names.pascal}Service.${method.name} is not implemented");
  }`;
}

export function renderDtoBlock(method: MethodSpec): string {
  return `export interface ${method.name}DTO {
  params?: Record<string, string>;
  query?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
}
`;
}

export function renderValidatorBlock(method: MethodSpec): string {
  return `export const ${method.name} = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});
`;
}

export function renderRouteLine(method: MethodSpec, middleware: string[]): string {
  const routePath = methodToRoutePath(method.name, method.route);
  const chain = [...middleware, `validate(${method.name})`, `(req: Request, res: Response) => controller.${method.name}(req, res)`];
  return `router.${routerFn(method.httpMethod)}("${routePath}", ${chain.join(", ")});`;
}

export function renderMiddlewareImports(middleware: string[]): string {
  if (middleware.length === 0) {
    return "";
  }

  return `${middleware.map(name => `import ${name} from "../../middlewares/${name}";`).join("\n")}\n`;
}

export function applyTemplate(template: string, ctx: ModuleTemplateContext, part: string): string {
  const { names, methods, middleware } = ctx;
  const methodsCode =
    part === "controller"
      ? methods.map(method => renderControllerMethod(names, method)).join("\n")
      : part === "service"
        ? methods.map(method => renderServiceMethod(names, method)).join("\n")
        : "";

  return template
    .replaceAll("{{pascalName}}", names.pascal)
    .replaceAll("{{kebabName}}", names.kebab)
    .replaceAll("{{camelName}}", names.camel)
    .replaceAll("{{methodsCode}}", methodsCode)
    .replaceAll("{{dtoBlocks}}", methods.map(renderDtoBlock).join("\n"))
    .replaceAll("{{validatorBlocks}}", methods.map(renderValidatorBlock).join("\n"))
    .replaceAll("{{routes}}", methods.map(method => renderRouteLine(method, middleware)).join("\n"))
    .replaceAll("{{validatorImports}}", methods.map(method => method.name).join(", "))
    .replaceAll("{{middlewareImports}}", renderMiddlewareImports(middleware));
}
