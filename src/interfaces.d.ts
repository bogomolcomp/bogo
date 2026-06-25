export interface GenerateModuleOptions {
  methods: string[];
  skipIndex: boolean;
}

export interface AddMethodOptions {
  methods: string[];
  parts: ModulePart[];
}

export type ModulePart = "controller" | "service" | "dto" | "validator" | "routes";

export interface RemoveModuleOptions {
  skipIndex: boolean;
}

export interface MethodSpec {
  name: string;
  route?: string;
}

export interface ModuleNames {
  kebab: string;
  pascal: string;
  camel: string;
}

export interface ModuleTemplateContext {
  names: ModuleNames;
  methods: MethodSpec[];
}

export interface BogoConfig {
  apiDir: string;
  indexFile: string;
  routePrefix: string;
}
