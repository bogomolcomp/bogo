import { basename, join, resolve } from "path";
import { writeProjectFiles } from "../templates/project";

export function runCreateApp(cwd: string, targetPath: string): void {
  const targetDir = resolve(cwd, targetPath);
  const projectName = basename(targetDir).replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "express-api";
  const written = writeProjectFiles(targetDir, projectName);

  console.log(`Express API project created at ${targetDir}:\n`);
  for (const file of written) {
    console.log(`  ${file}`);
  }

  const cdStep = targetPath === "." ? "" : `  cd ${targetPath}\n`;

  console.log(`\nNext steps:\n${cdStep}  copy .env.example .env
  npm install
  npm run dev`);
}
