import { HttpMethod } from "../interfaces";

export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function isHttpMethod(value: string): value is HttpMethod {
  return HTTP_METHODS.includes(value.toUpperCase() as HttpMethod);
}

export function routerFn(httpMethod: HttpMethod): string {
  return httpMethod.toLowerCase();
}
