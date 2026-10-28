import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { stringifyJson } from "./jsonStringify.js";
export const canonicalMotionValue = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalMotionValue)
    : value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonicalMotionValue((value as Record<string, unknown>)[key])]),
        )
      : value;
export const motionValueKey = (value: unknown): string => {
  const input = stringifyJson(canonicalMotionValue(value));
  let a = 2166136261,
    b = 5381;
  for (let index = 0; index < input.length; index++) {
    a = Math.imul(a ^ input.charCodeAt(index), 16777619);
    b = Math.imul(b, 33) ^ input.charCodeAt(index);
  }
  return [input.length, (a >>> 0).toString(16), (b >>> 0).toString(16)].join(RT_SHARED.SYMBOL_E7AC07);
};
