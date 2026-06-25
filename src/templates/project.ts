import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { getDefaultConfigContent } from "../utils/config";

const PROJECT_FILES: Record<string, string> = {
  "package.json": `{
  "name": "express-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "body-parser": "^1.20.3",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "express-ipfilter": "^1.3.2",
    "log-timestamp": "^0.3.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/body-parser": "^1.19.5",
    "@types/express": "^4.17.21",
    "@types/node": "^22.5.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.4"
  },
  "engines": {
    "node": ">=18"
  }
}
`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  ".env.example": `PORT=3000
ALLOWED_IPS=
`,
  ".gitignore": `node_modules/
dist/
.env
*.log
.DS_Store
`,
  "src/index.ts": `import bodyParser from "body-parser";
import config from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { IpDeniedError, IpFilter } from "express-ipfilter";
import "log-timestamp";
import { formatResponse } from "./middlewares/formatResponse";
import { logger } from "./middlewares/logger";
import { getAllowedIps } from "./utils/getAllowedIps";

config.config();

const app = express();

app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(formatResponse());

if (process.env.ALLOWED_IPS) {
  const ipsInWhiteList = getAllowedIps(process.env.ALLOWED_IPS);
  console.log("[INFO]: ALLOWED IPS:", ipsInWhiteList);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    console.log(\`[ACCESS ATTEMPT] IP: \${clientIp} | Method: \${req.method} | URL: \${req.originalUrl}\`);
    next();
  });

  app.use(IpFilter(ipsInWhiteList, { mode: "allow" }));
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof IpDeniedError) {
      return res.error(err, "401", 401);
    }
    next(err);
  });
}

app.get("/health", (_req, res) => res.success({ status: "ok" }));

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.log("[Global Error Handler] Unhandled error:", err);
  if (!res.headersSent) {
    return res.error(err, "INTERNAL_ERROR", 500);
  }
  next(err);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(\`[INFO]: Server started on port: \${port}\`);
});
`,
  "src/types/express.d.ts": `declare global {
  namespace Express {
    interface Response {
      success(data: unknown, statusCode?: number): Response;
      error(error: unknown, code?: string, statusCode?: number): Response;
    }
  }
}

export {};
`,
  "src/middlewares/logger.ts": `import { NextFunction, Request, Response } from "express";

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(\`[\${req.method}] \${req.originalUrl} \${res.statusCode} - \${duration}ms\`);
  });
  next();
}
`,
  "src/middlewares/formatResponse.ts": `import { NextFunction, Request, Response } from "express";

export function formatResponse() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.success = (data, statusCode = 200) => {
      return res.status(statusCode).json({ success: true, data });
    };

    res.error = (error, code = "ERROR", statusCode = 500) => {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(statusCode).json({ success: false, error: { code, message } });
    };

    next();
  };
}
`,
  "src/middlewares/validate.ts": `import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.error(result.error.flatten(), "VALIDATION_ERROR", 400);
    }

    next();
  };
}
`,
  "src/utils/getAllowedIps.ts": `export function getAllowedIps(raw: string): string[] {
  return raw.split(",").map(ip => ip.trim()).filter(Boolean);
}
`,
};

function renderPackageJson(projectName: string): string {
  const content = PROJECT_FILES["package.json"];
  return content.replace('"name": "express-api"', `"name": "${projectName}"`);
}

export function writeProjectFiles(targetDir: string, projectName: string): string[] {
  if (existsSync(join(targetDir, "package.json"))) {
    throw new Error(`Directory already contains package.json: ${targetDir}`);
  }

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  mkdirSync(join(targetDir, "src", "api"), { recursive: true });
  mkdirSync(join(targetDir, "src", "middlewares"), { recursive: true });
  mkdirSync(join(targetDir, "src", "utils"), { recursive: true });
  mkdirSync(join(targetDir, "src", "types"), { recursive: true });

  const written: string[] = [];

  for (const [relativePath, content] of Object.entries(PROJECT_FILES)) {
    const filePath = join(targetDir, relativePath);
    const fileContent = relativePath === "package.json" ? renderPackageJson(projectName) : content;
    writeFileSync(filePath, fileContent, "utf-8");
    written.push(filePath);
  }

  const configPath = join(targetDir, ".bogorc.json");
  writeFileSync(configPath, getDefaultConfigContent(), "utf-8");
  written.push(configPath);

  return written;
}
