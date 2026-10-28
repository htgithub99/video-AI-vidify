import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { stringifyJson } from "./jsonStringify.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as C, type MotionResponseSchema } from "../constants/motionResponseContract.js";
export const motionResponseType = (value: unknown): string => (value === undefined ? RT_CORE.MISSING : value === null ? RT_CORE.NULL : Array.isArray(value) ? RT_CORE.ARRAY : typeof value);
export const motionResponseShape = (schema: MotionResponseSchema): string => {
  if (schema.anyOf) return schema.anyOf.map(motionResponseShape).join(RT_CORE.OR);
  if (schema.type === RT_SHARED.OBJECT)
    return `${RT_CORE.SYMBOL_021FB5}${Object.entries(schema.properties || {})
      .map(([key, field]) => `${key}${schema.required?.includes(key) ? "" : RT_CORE.SYMBOL_8A8DE8}${RT_SHARED.SYMBOL_E7AC07}${motionResponseShape(field)}`)
      .join(RT_SHARED.SYMBOL_D03502)}${RT_CORE.SYMBOL_D10B36}`;
  if (schema.type === RT_CORE.ARRAY) return `${motionResponseShape(schema.items || {})}${RT_CORE.SYMBOL_4F53CD}${schema.minItems ? `${RT_CORE.MIN}${schema.minItems}${RT_SHARED.SYMBOL_BA5EC5}` : ""}${schema.maxItems !== undefined ? `${RT_CORE.MAX}${schema.maxItems}${RT_SHARED.SYMBOL_BA5EC5}` : ""}`;
  if (schema.enum) return schema.enum.map((value) => stringifyJson(value)).join(RT_CORE.SYMBOL_CBE5CF);
  return `${schema.type || RT_CORE.VALUE}${schema.minLength ? `${RT_CORE.MIN}${schema.minLength}${RT_CORE.CHARS}` : ""}${schema.maxLength ? `${RT_CORE.MAX}${schema.maxLength}${RT_CORE.CHARS}` : ""}${schema.minimum !== undefined ? `${RT_CORE.SYMBOL_88F853}${schema.minimum}${RT_SHARED.SYMBOL_BA5EC5}` : ""}${schema.maximum !== undefined ? `${RT_CORE.SYMBOL_BCEC42}${schema.maximum}${RT_SHARED.SYMBOL_BA5EC5}` : ""}`;
};
export interface MotionResponseIssue {
  path: string;
  expected: string;
  actual: string;
  value: string;
}
export const motionResponseIssues = (value: unknown, schema: MotionResponseSchema, path: string = "", partial = false): MotionResponseIssue[] => {
  const fail = (): MotionResponseIssue[] => [{ path: path || RT_CORE.SYMBOL_09FC96, expected: motionResponseShape(schema), actual: motionResponseType(value), value: C.VALUE(value) }];
  if (schema.anyOf) {
    const alternatives = schema.anyOf.map((option) => motionResponseIssues(value, option, path, partial));
    return alternatives.some((issues) => !issues.length) ? [] : fail();
  }
  if (schema.type === RT_SHARED.OBJECT) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
    const record = value as Record<string, unknown>;
    return Object.entries(schema.properties || {}).flatMap(([key, field]) => (record[key] === undefined && (partial || !schema.required?.includes(key)) ? [] : motionResponseIssues(record[key], field, path ? `${path}${RT_SHARED.SYMBOL_CDB4EE}${key}` : key, partial)));
  }
  if (schema.type === RT_CORE.ARRAY) {
    if (!Array.isArray(value) || (schema.minItems !== undefined && value.length < schema.minItems) || (schema.maxItems !== undefined && value.length > schema.maxItems)) return fail();
    return value.flatMap((entry, index) => motionResponseIssues(entry, schema.items || {}, `${path}${RT_CORE.SYMBOL_245843}${index}${RT_SHARED.SYMBOL_CFAE0D}`, partial));
  }
  if (schema.type === RT_CORE.NULL) return value === null ? [] : fail();
  if (schema.type === RT_CORE.STRING && (typeof value !== "string" || (schema.minLength !== undefined && value.trim().length < schema.minLength) || (schema.maxLength !== undefined && value.trim().length > schema.maxLength))) return fail();
  if ((schema.type === RT_CORE.NUMBER || schema.type === RT_CORE.INTEGER) && (typeof value !== "number" || !Number.isFinite(value) || (schema.type === RT_CORE.INTEGER && !Number.isInteger(value)) || (schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum))) return fail();
  if (schema.type === RT_CORE.BOOLEAN && typeof value !== "boolean") return fail();
  if (schema.enum && !schema.enum.includes(value as string)) return fail();
  return [];
};
export const motionResponseErrors = (value: unknown, schema: MotionResponseSchema, path: string = "", partial = false): string[] => motionResponseIssues(value, schema, path, partial).map((issue) => C.EXPECTED(issue.path, issue.expected, issue.actual));
export const motionResponsePrompt = (artifact: string): string => (MOTION_RESPONSE_SCHEMAS[artifact] ? C.HEADER + motionResponseShape(MOTION_RESPONSE_SCHEMAS[artifact]).replaceAll(C.NONEMPTY_TYPE.VERBOSE, C.NONEMPTY_TYPE.COMPACT) + RT_SHARED.SYMBOL_01BA47 + C.RULES : "");
export const withMotionResponsePrompt = (artifact: string, prompt: string): string => {
  const contract = motionResponsePrompt(artifact);
  return !contract || prompt.includes(contract) || prompt.includes(C.DIAGNOSTICS) ? prompt : prompt + RT_SHARED.SYMBOL_01BA47 + contract;
};
export const motionResponseRepair = (prompt: string, diagnostics: unknown): string => C.REPAIR + prompt + C.DIAGNOSTICS + stringifyJson(diagnostics);
export const normalizeMotionResponseOptionals = (value: any, schema: MotionResponseSchema): any => {
  if (Array.isArray(value) && schema.type === RT_CORE.ARRAY && schema.items) return value.map((item) => normalizeMotionResponseOptionals(item, schema.items!));
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const objectSchema = schema.type === RT_SHARED.OBJECT ? schema : schema.anyOf?.find((option) => option.type === RT_SHARED.OBJECT);
  if (!objectSchema) return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      const field = objectSchema.properties?.[key];
      if (item === null && field?.anyOf?.some((option) => option.type === RT_CORE.NULL) && !objectSchema.required?.includes(key)) return [];
      return [[key, field ? normalizeMotionResponseOptionals(item, field) : item]];
    }),
  );
};
export const normalizeMotionResponseText = (value: any, schema: MotionResponseSchema): any => {
  if (schema.type === RT_CORE.STRING && !schema.enum && Array.isArray(value) && value.length && value.every((item) => typeof item === "string" && item.trim())) return value.map((item: string) => item.trim()).join(C.JOIN);
  if (schema.type === RT_SHARED.OBJECT && value && typeof value === "object" && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, schema.properties?.[key] ? normalizeMotionResponseText(item, schema.properties[key]) : item]));
  if (schema.type === RT_CORE.ARRAY && Array.isArray(value) && schema.items) return value.map((item) => normalizeMotionResponseText(item, schema.items!));
  return value;
};
