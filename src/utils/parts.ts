import { ModulePart } from "../interfaces";

export const MODULE_PARTS: ModulePart[] = ["controller", "service", "dto", "validator", "routes"];

export function isModulePart(value: string): value is ModulePart {
  return MODULE_PARTS.includes(value as ModulePart);
}
