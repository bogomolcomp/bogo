import { MethodSpec } from "../interfaces";
import { methodToRoutePath } from "./naming";

export function parseMethodSpec(raw: string): MethodSpec {
  const [name, route] = raw.split(":");
  if (!name || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
    throw new Error(`Invalid method name: "${raw}". Use camelCase, e.g. getList or getList:/custom-path`);
  }
  return {
    name,
    route: route ? methodToRoutePath(name, route) : undefined,
  };
}

function addImportSymbol(content: string, importPattern: RegExp, symbol: string): string {
  const match = content.match(importPattern);
  if (!match) {
    return content;
  }

  const symbols = match[1].split(",").map(value => value.trim()).filter(Boolean);
  if (symbols.includes(symbol)) {
    return content;
  }

  return content.replace(match[0], match[0].replace(match[1], `${match[1]}, ${symbol}`));
}

export function patchControllerMethod(content: string, ctx: { names: { pascal: string } }, method: MethodSpec): string {
  if (new RegExp(`async ${method.name}\\(`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in controller`);
  }

  const snippet = `
  async ${method.name}(req: e.Request, res: e.Response) {
    try {
      const result = await ${ctx.names.pascal}Service.${method.name}(req.body);
      return res.success(result);
    } catch (error) {
      return res.error(error);
    }
  }`;

  const updated = content.replace(/(\n}\n\nexport default new .+Controller\(\);)/, `${snippet}$1`);
  if (updated === content) {
    throw new Error("Could not patch controller file");
  }

  return updated;
}

export function patchServiceMethod(
  content: string,
  ctx: { names: { kebab: string; pascal: string } },
  method: MethodSpec
): string {
  if (new RegExp(`async ${method.name}\\(`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in service`);
  }

  let updated = addImportSymbol(
    content,
    new RegExp(`import \\{ (.+) \\} from "\\./${ctx.names.kebab}\\.dto";`),
    `${method.name}DTO`
  );

  const snippet = `
  async ${method.name}(body: ${method.name}DTO) {
    throw new Error("${ctx.names.pascal}Service.${method.name} is not implemented");
  }`;

  updated = updated.replace(/(\n}\n\nexport default new .+Service\(\);)/, `${snippet}$1`);
  if (updated === content) {
    throw new Error("Could not patch service file");
  }

  return updated;
}

export function patchDtoMethod(content: string, _ctx: unknown, method: MethodSpec): string {
  if (new RegExp(`interface ${method.name}DTO`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in dto`);
  }

  return `${content.trimEnd()}\nexport interface ${method.name}DTO {
  // TODO: define fields
}
`;
}

export function patchValidatorMethod(content: string, _ctx: unknown, method: MethodSpec): string {
  if (new RegExp(`export const ${method.name} =`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in validator`);
  }

  return `${content.trimEnd()}
export const ${method.name} = z.object({
  body: z.object({
    // TODO: define validation schema
  }),
});
`;
}

export function patchRoutesMethod(
  content: string,
  ctx: { names: { kebab: string } },
  method: MethodSpec
): string {
  if (content.includes(`controller.${method.name}(`)) {
    throw new Error(`Method "${method.name}" already exists in routes`);
  }

  let updated = addImportSymbol(
    content,
    new RegExp(`import \\{ (.+) \\} from "\\./${ctx.names.kebab}\\.validator";`),
    method.name
  );

  const routePath = methodToRoutePath(method.name, method.route);
  const snippet = `router.post("${routePath}", validate(${method.name}), (req: Request, res: Response) => controller.${method.name}(req, res));`;

  updated = updated.replace(/(\n\nexport default router;\n?)$/, `\n${snippet}$1`);
  if (updated === content) {
    throw new Error("Could not patch routes file");
  }

  return updated;
}
