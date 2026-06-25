import { dirname, join, relative } from "path";
import { ModuleNames } from "../interfaces";

function normalizeRelativePath(fromDir: string, toPath: string): string {
  let rel = relative(fromDir, toPath).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel;
}

export function routesImportPath(indexFile: string, apiDir: string, names: ModuleNames): string {
  const indexDir = dirname(indexFile);
  const routesFile = join(apiDir, names.kebab, `${names.kebab}.routes`);
  return normalizeRelativePath(indexDir, routesFile);
}

export function buildIndexLines(indexFile: string, apiDir: string, names: ModuleNames, routePrefix: string) {
  const importPath = routesImportPath(indexFile, apiDir, names);
  return {
    importLine: `import ${names.pascal}Routes from "${importPath}";`,
    useLine: `app.use("${routePrefix}/${names.kebab}", ${names.pascal}Routes);`,
  };
}
