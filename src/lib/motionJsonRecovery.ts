import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { parseJson } from "./jsonStringify.js";
export const closeMotionJsonContainers = (text: string): string | undefined => {
  const stack: string[] = [];
  let quoted = false;
  let escaped = false;
  let changed = false;
  let result = "";
  for (const token of text) {
    if (quoted) {
      result += token;
      if (escaped) escaped = false;
      else if (token === RT_CORE.SYMBOL) escaped = true;
      else if (token === RT_CORE.SYMBOL_8A331F) quoted = false;
      continue;
    }
    if (token === RT_CORE.SYMBOL_8A331F) quoted = true;
    else if (token === RT_CORE.SYMBOL_021FB5) stack.push(RT_CORE.SYMBOL_D10B36);
    else if (token === RT_CORE.SYMBOL_245843) stack.push(RT_SHARED.SYMBOL_CFAE0D);
    else if (token === RT_CORE.SYMBOL_D10B36 || token === RT_SHARED.SYMBOL_CFAE0D) {
      if (!stack.includes(token)) return undefined;
      while (stack.at(-1) !== token) {
        result += stack.pop();
        changed = true;
      }
      stack.pop();
    }
    result += token;
  }
  if (!changed || quoted || stack.length) return undefined;
  try {
    parseJson(result);
    return result;
  } catch {
    return undefined;
  }
};
