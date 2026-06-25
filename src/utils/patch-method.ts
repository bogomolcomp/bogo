import { MethodSpec, ModuleTemplateContext, ModulePart } from "../interfaces";
import {
  renderControllerMethod,
  renderDtoBlock,
  renderRouteLine,
  renderServiceMethod,
  renderValidatorBlock,
} from "../templates/render-helpers";
import { routerFn } from "./http";
import { methodToRoutePath } from "./naming";

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

function removeImportSymbol(content: string, importPattern: RegExp, symbol: string): string {
  const match = content.match(importPattern);
  if (!match) {
    return content;
  }

  const symbols = match[1]
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .filter(value => value !== symbol);

  if (symbols.length === 0) {
    return content.replace(`${match[0]}\n`, "");
  }

  return content.replace(match[0], match[0].replace(match[1], symbols.join(", ")));
}

export function patchControllerMethod(content: string, ctx: ModuleTemplateContext, method: MethodSpec): string {
  if (new RegExp(`async ${method.name}\\(`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in controller`);
  }

  const snippet = renderControllerMethod(ctx.names, method);
  const updated = content.replace(/(\n}\n\nexport default new .+Controller\(\);)/, `${snippet}$1`);
  if (updated === content) {
    throw new Error("Could not patch controller file");
  }
  return updated;
}

export function patchServiceMethod(content: string, ctx: ModuleTemplateContext, method: MethodSpec): string {
  if (new RegExp(`async ${method.name}\\(`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in service`);
  }

  let updated = addImportSymbol(
    content,
    new RegExp(`import \\{ (.+) \\} from "\\./${ctx.names.kebab}\\.dto";`),
    `${method.name}DTO`
  );

  const snippet = renderServiceMethod(ctx.names, method);
  updated = updated.replace(/(\n}\n\nexport default new .+Service\(\);)/, `${snippet}$1`);
  if (updated === content) {
    throw new Error("Could not patch service file");
  }
  return updated;
}

export function patchDtoMethod(content: string, _ctx: ModuleTemplateContext, method: MethodSpec): string {
  if (new RegExp(`interface ${method.name}DTO`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in dto`);
  }
  return `${content.trimEnd()}\n${renderDtoBlock(method)}`;
}

export function patchValidatorMethod(content: string, _ctx: ModuleTemplateContext, method: MethodSpec): string {
  if (new RegExp(`export const ${method.name} =`).test(content)) {
    throw new Error(`Method "${method.name}" already exists in validator`);
  }
  return `${content.trimEnd()}\n${renderValidatorBlock(method)}`;
}

export function patchRoutesMethod(content: string, ctx: ModuleTemplateContext, method: MethodSpec): string {
  if (content.includes(`controller.${method.name}(`)) {
    throw new Error(`Method "${method.name}" already exists in routes`);
  }

  let updated = addImportSymbol(
    content,
    new RegExp(`import \\{ (.+) \\} from "\\./${ctx.names.kebab}\\.validator";`),
    method.name
  );

  const snippet = renderRouteLine(method, ctx.middleware);
  updated = updated.replace(/(\n\nexport default router;\n?)$/, `\n${snippet}$1`);
  if (updated === content) {
    throw new Error("Could not patch routes file");
  }
  return updated;
}

function removeBlock(content: string, pattern: RegExp): string {
  return content.replace(pattern, "");
}

export function removeControllerMethod(content: string, methodName: string): string {
  return removeBlock(
    content,
    new RegExp(`\\n  async ${methodName}\\(req: e\\.Request, res: e\\.Response\\) \\{[\\s\\S]*?\\n  \\}`, "m")
  );
}

export function removeServiceMethod(content: string, ctx: ModuleTemplateContext, methodName: string): string {
  let updated = removeBlock(
    content,
    new RegExp(`\\n  async ${methodName}\\(dto: ${methodName}DTO\\) \\{[\\s\\S]*?\\n  \\}`, "m")
  );
  updated = removeImportSymbol(
    updated,
    new RegExp(`import \\{ (.+) \\} from "\\./${ctx.names.kebab}\\.dto";`),
    `${methodName}DTO`
  );
  return updated;
}

export function removeDtoMethod(content: string, methodName: string): string {
  return removeBlock(content, new RegExp(`\\nexport interface ${methodName}DTO \\{[\\s\\S]*?\\}\\n`, "m")).trimEnd() + "\n";
}

export function removeValidatorMethod(content: string, methodName: string): string {
  return removeBlock(
    content,
    new RegExp(`\\nexport const ${methodName} = z\\.object\\(\\{[\\s\\S]*?\\}\\);\\n`, "m")
  ).trimEnd() + "\n";
}

export function removeRoutesMethod(content: string, ctx: ModuleTemplateContext, method: MethodSpec): string {
  const routePath = methodToRoutePath(method.name, method.route);
  const pattern = new RegExp(
    `\\nrouter\\.${routerFn(method.httpMethod)}\\("${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?controller\\.${method.name}\\(req, res\\)\\);`,
    "m"
  );

  let updated = removeBlock(content, pattern);
  updated = removeImportSymbol(
    updated,
    new RegExp(`import \\{ (.+) \\} from "\\./${ctx.names.kebab}\\.validator";`),
    method.name
  );
  return updated;
}

export const PATCHERS: Record<ModulePart, (content: string, ctx: ModuleTemplateContext, method: MethodSpec) => string> = {
  controller: patchControllerMethod,
  service: patchServiceMethod,
  dto: patchDtoMethod,
  validator: patchValidatorMethod,
  routes: patchRoutesMethod,
};

export const REMOVERS: Record<ModulePart, (content: string, ctx: ModuleTemplateContext, method: MethodSpec) => string> = {
  controller: (content, _ctx, method) => removeControllerMethod(content, method.name),
  service: (content, ctx, method) => removeServiceMethod(content, ctx, method.name),
  dto: (content, _ctx, method) => removeDtoMethod(content, method.name),
  validator: (content, _ctx, method) => removeValidatorMethod(content, method.name),
  routes: (content, ctx, method) => removeRoutesMethod(content, ctx, method),
};
