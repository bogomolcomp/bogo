import { ModuleNames } from "../interfaces";

export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

export function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function normalizeModuleName(name: string): string {
  return toKebabCase(name.replace(/Controller$|Service$|Routes$|Dto$|Validator$/i, ""));
}

export function resolveModuleNames(name: string): ModuleNames {
  const kebab = normalizeModuleName(name);
  return {
    kebab,
    pascal: toPascalCase(kebab),
    camel: toCamelCase(kebab),
  };
}

export function methodToRoutePath(method: string, customPath?: string): string {
  if (customPath) {
    return customPath.startsWith("/") ? customPath : `/${customPath}`;
  }
  return `/${toKebabCase(method)}`;
}
