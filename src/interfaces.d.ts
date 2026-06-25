export interface GenerateModuleOptions {
  methods: string[];
  skipIndex: boolean;
  dryRun: boolean;
  force: boolean;
  middleware: string[];
}

export interface AddMethodOptions {
  methods: string[];
  parts: ModulePart[];
  dryRun: boolean;
  middleware: string[];
}

export interface RemoveMethodOptions {
  methods: string[];
  parts: ModulePart[];
  dryRun: boolean;
}

export interface RemoveModuleOptions {
  skipIndex: boolean;
  dryRun: boolean;
}

export interface CreateAppOptions {
  withDocker: boolean;
  withEslint: boolean;
  dryRun: boolean;
  force: boolean;
}

export type ModulePart = "controller" | "service" | "dto" | "validator" | "routes";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface MethodSpec {
  name: string;
  route?: string;
  httpMethod: HttpMethod;
}

export interface ModuleNames {
  kebab: string;
  pascal: string;
  camel: string;
}

export interface ModuleTemplateContext {
  names: ModuleNames;
  methods: MethodSpec[];
  middleware: string[];
}

export interface BogoConfig {
  apiDir: string;
  indexFile: string;
  routePrefix: string;
  templatesDir?: string;
}
