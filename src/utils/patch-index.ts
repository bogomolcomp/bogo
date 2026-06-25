import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ModuleNames } from "../interfaces";

export function patchIndexFile(indexPath: string, names: ModuleNames, routePrefix: string): boolean {
  if (!existsSync(indexPath)) {
    return false;
  }

  const importLine = `import ${names.pascal}Routes from "./api/${names.kebab}/${names.kebab}.routes";`;
  const useLine = `app.use("${routePrefix}/${names.kebab}", ${names.pascal}Routes);`;

  let content = readFileSync(indexPath, "utf-8");

  if (content.includes(importLine) || content.includes(useLine)) {
    return false;
  }

  const importAnchor = content.match(/^import .+ from .+;$/m);
  if (importAnchor && importAnchor.index !== undefined) {
    const lines = content.split("\n");
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (/^import .+ from .+;$/.test(lines[i])) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join("\n");
    } else {
      content = `${importLine}\n${content}`;
    }
  } else {
    content = `${importLine}\n${content}`;
  }

  const useAnchor = content.match(/app\.use\("\/api\/.+", .+Routes\);/);
  if (useAnchor && useAnchor.index !== undefined) {
    content = content.replace(useAnchor[0], `${useAnchor[0]}\n${useLine}`);
  } else {
    const listenAnchor = content.match(/app\.listen\(/);
    if (listenAnchor && listenAnchor.index !== undefined) {
      content = content.replace(listenAnchor[0], `${useLine}\n\n${listenAnchor[0]}`);
    } else {
      content = `${content.trimEnd()}\n${useLine}\n`;
    }
  }

  writeFileSync(indexPath, content, "utf-8");
  return true;
}

export function suggestIndexPatch(names: ModuleNames, routePrefix: string): string {
  return `Add to index manually:

import ${names.pascal}Routes from "./api/${names.kebab}/${names.kebab}.routes";
app.use("${routePrefix}/${names.kebab}", ${names.pascal}Routes);`;
}

export function unpatchIndexFile(indexPath: string, names: ModuleNames, routePrefix: string): boolean {
  if (!existsSync(indexPath)) {
    return false;
  }

  const importLine = `import ${names.pascal}Routes from "./api/${names.kebab}/${names.kebab}.routes";`;
  const useLine = `app.use("${routePrefix}/${names.kebab}", ${names.pascal}Routes);`;

  const lines = readFileSync(indexPath, "utf-8").split("\n");
  const filtered = lines.filter(line => line !== importLine && line !== useLine);

  if (filtered.length === lines.length) {
    return false;
  }

  writeFileSync(indexPath, filtered.join("\n"), "utf-8");
  return true;
}
