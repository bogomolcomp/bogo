import { describe, expect, it } from "vitest";
import { parseMethodSpec } from "../src/utils/method-spec";
import { buildIndexLines } from "../src/utils/index-path";
import { methodToRoutePath, resolveModuleNames } from "../src/utils/naming";

describe("parseMethodSpec", () => {
  it("parses method name only", () => {
    expect(parseMethodSpec("getList")).toEqual({ name: "getList", httpMethod: "POST", route: undefined });
  });

  it("parses custom route", () => {
    expect(parseMethodSpec("getOrder:/:id")).toEqual({
      name: "getOrder",
      httpMethod: "POST",
      route: "/:id",
    });
  });

  it("parses HTTP verb", () => {
    expect(parseMethodSpec("getList:GET")).toEqual({
      name: "getList",
      httpMethod: "GET",
      route: undefined,
    });
  });

  it("parses HTTP verb and route", () => {
    expect(parseMethodSpec("getOrder:GET:/:id")).toEqual({
      name: "getOrder",
      httpMethod: "GET",
      route: "/:id",
    });
  });
});

describe("index paths", () => {
  it("builds relative import from index to routes", () => {
    const names = resolveModuleNames("users");
    const lines = buildIndexLines("src/index.ts", "src/api", names, "/api");
    expect(lines.importLine).toBe('import UsersRoutes from "./api/users/users.routes";');
    expect(lines.useLine).toBe('app.use("/api/users", UsersRoutes);');
  });
});

describe("naming", () => {
  it("resolves module names", () => {
    expect(resolveModuleNames("user-profile")).toEqual({
      kebab: "user-profile",
      pascal: "UserProfile",
      camel: "userProfile",
    });
  });

  it("builds route path", () => {
    expect(methodToRoutePath("getList")).toBe("/get-list");
    expect(methodToRoutePath("getList", "/custom")).toBe("/custom");
  });
});
