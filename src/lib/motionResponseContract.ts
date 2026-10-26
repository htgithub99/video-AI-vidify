import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as C, type MotionResponseSchema } from "../constants/motionResponseContract.js";
export const motionResponseType = (value: unknown): string => (value === undefined ? "missing" : value === null ? "null" : Array.isArray(value) ? "array" : typeof value);
export const motionResponseShape = (schema: MotionResponseSchema): string => {
  if (schema.anyOf) return schema.anyOf.map(motionResponseShape).join(" OR ");
  if (schema.type === "object")
    return `{${Object.entries(schema.properties || {})
      .map(([key, field]) => `${key}${schema.required?.includes(key) ? "" : "?"}:${motionResponseShape(field)}`)
      .join(",")}}`;
  if (schema.type === "array") return `${motionResponseShape(schema.items || {})}[]${schema.minItems ? `(min ${schema.minItems})` : ""}${schema.maxItems !== undefined ? `(max ${schema.maxItems})` : ""}`;
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join("|");
  return `${schema.type || "value"}${schema.minLength ? `(min ${schema.minLength} chars)` : ""}${schema.maxLength ? `(max ${schema.maxLength} chars)` : ""}${schema.minimum !== undefined ? `(>=${schema.minimum})` : ""}${schema.maximum !== undefined ? `(<=${schema.maximum})` : ""}`;
};
export interface MotionResponseIssue {
  path: string;
  expected: string;
  actual: string;
  value: string;
}
export const motionResponseIssues = (value: unknown, schema: MotionResponseSchema, path = "", partial = false): MotionResponseIssue[] => {
  const fail = (): MotionResponseIssue[] => [{ path: path || "$", expected: motionResponseShape(schema), actual: motionResponseType(value), value: C.VALUE(value) }];
  if (schema.anyOf) {
    const alternatives = schema.anyOf.map((option) => motionResponseIssues(value, option, path, partial));
    return alternatives.some((issues) => !issues.length) ? [] : fail();
  }
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
    const record = value as Record<string, unknown>;
    return Object.entries(schema.properties || {}).flatMap(([key, field]) => (record[key] === undefined && (partial || !schema.required?.includes(key)) ? [] : motionResponseIssues(record[key], field, path ? `${path}.${key}` : key, partial)));
  }
  if (schema.type === "array") {
    if (!Array.isArray(value) || (schema.minItems !== undefined && value.length < schema.minItems) || (schema.maxItems !== undefined && value.length > schema.maxItems)) return fail();
    return value.flatMap((entry, index) => motionResponseIssues(entry, schema.items || {}, `${path}[${index}]`, partial));
  }
  if (schema.type === "null") return value === null ? [] : fail();
  if (schema.type === "string" && (typeof value !== "string" || (schema.minLength !== undefined && value.trim().length < schema.minLength) || (schema.maxLength !== undefined && value.trim().length > schema.maxLength))) return fail();
  if ((schema.type === "number" || schema.type === "integer") && (typeof value !== "number" || !Number.isFinite(value) || (schema.type === "integer" && !Number.isInteger(value)) || (schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum))) return fail();
  if (schema.type === "boolean" && typeof value !== "boolean") return fail();
  if (schema.enum && !schema.enum.includes(value as string)) return fail();
  return [];
};
export const motionResponseErrors = (value: unknown, schema: MotionResponseSchema, path = "", partial = false): string[] => motionResponseIssues(value, schema, path, partial).map((issue) => C.EXPECTED(issue.path, issue.expected, issue.actual));
export const motionResponsePrompt = (artifact: string): string => (MOTION_RESPONSE_SCHEMAS[artifact] ? C.HEADER + motionResponseShape(MOTION_RESPONSE_SCHEMAS[artifact]).replaceAll(C.NONEMPTY_TYPE.VERBOSE, C.NONEMPTY_TYPE.COMPACT) + "\n" + C.RULES : "");
export const withMotionResponsePrompt = (artifact: string, prompt: string): string => {
  const contract = motionResponsePrompt(artifact);
  return !contract || prompt.includes(contract) || prompt.includes(C.DIAGNOSTICS) ? prompt : prompt + "\n" + contract;
};
export const motionResponseRepair = (prompt: string, diagnostics: unknown): string => C.REPAIR + prompt + C.DIAGNOSTICS + JSON.stringify(diagnostics);
export const normalizeMotionResponseOptionals = (value: any, schema: MotionResponseSchema): any => {
  if (Array.isArray(value) && schema.type === "array" && schema.items) return value.map((item) => normalizeMotionResponseOptionals(item, schema.items!));
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const objectSchema = schema.type === "object" ? schema : schema.anyOf?.find((option) => option.type === "object");
  if (!objectSchema) return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      const field = objectSchema.properties?.[key];
      if (item === null && field?.anyOf?.some((option) => option.type === "null") && !objectSchema.required?.includes(key)) return [];
      return [[key, field ? normalizeMotionResponseOptionals(item, field) : item]];
    }),
  );
};
export const normalizeMotionResponseText = (value: any, schema: MotionResponseSchema): any => {
  if (schema.type === "string" && !schema.enum && Array.isArray(value) && value.length && value.every((item) => typeof item === "string" && item.trim())) return value.map((item: string) => item.trim()).join(C.JOIN);
  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, schema.properties?.[key] ? normalizeMotionResponseText(item, schema.properties[key]) : item]));
  if (schema.type === "array" && Array.isArray(value) && schema.items) return value.map((item) => normalizeMotionResponseText(item, schema.items!));
  return value;
};
