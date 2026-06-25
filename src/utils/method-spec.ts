import { MethodSpec } from "../interfaces";
import { isHttpMethod } from "./http";
import { methodToRoutePath } from "./naming";

export function parseMethodSpec(raw: string): MethodSpec {
  const match = raw.match(/^([a-zA-Z][a-zA-Z0-9]*)(?::(.*))?$/);
  if (!match) {
    throw new Error(`Invalid method name: "${raw}". Examples: getList, getList:GET, getOrder:GET:/:id`);
  }

  const name = match[1];
  const rest = match[2];

  if (!rest) {
    return { name, httpMethod: "POST" };
  }

  if (isHttpMethod(rest)) {
    return { name, httpMethod: rest.toUpperCase() as MethodSpec["httpMethod"] };
  }

  const verbMatch = rest.match(/^(GET|POST|PUT|PATCH|DELETE):(.+)$/i);
  if (verbMatch) {
    return {
      name,
      httpMethod: verbMatch[1].toUpperCase() as MethodSpec["httpMethod"],
      route: methodToRoutePath(name, verbMatch[2]),
    };
  }

  return {
    name,
    httpMethod: "POST",
    route: methodToRoutePath(name, rest),
  };
}

export function methodExistsInContent(content: string, methodName: string, part: string): boolean {
  switch (part) {
    case "controller":
    case "service":
      return new RegExp(`async ${methodName}\\(`).test(content);
    case "dto":
      return new RegExp(`interface ${methodName}DTO`).test(content);
    case "validator":
      return new RegExp(`export const ${methodName} =`).test(content);
    case "routes":
      return content.includes(`controller.${methodName}(`);
    default:
      return false;
  }
}
