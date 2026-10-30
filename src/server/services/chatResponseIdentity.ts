import * as COMMON_RUNTIME from "../../constants/sourceText.js";
import { parseJson } from "../../lib/jsonStringify.js";
export const chatResponseIdentity = (text: string): { artifactType?: string; requestId?: string } => {
  const result: { artifactType?: string; requestId?: string } = {};
  const start = text.indexOf(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_42);
  if (start < 0) return result;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_42 || ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_43) depth++;
    else if (ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_44 || ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_45) depth--;
    else if (ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_3) {
      const from = i;
      let escaped = false;
      for (i++; i < text.length; i++) {
        if (escaped) escaped = false;
        else if (text[i] === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_22) escaped = true;
        else if (text[i] === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_3) break;
      }
      if (depth !== 1) continue;
      const key = text.slice(from + 1, i);
      if (key !== COMMON_RUNTIME.SOURCE_TEXT_ARTIFACTTYPE && key !== COMMON_RUNTIME.SOURCE_TEXT_REQUESTID) continue;
      const value = text.slice(i + 1).match(/^\s*:\s*("(?:\\.|[^"\\])*")/);
      if (value) {
        try {
          result[key] = parseJson(value[1]);
        } catch {
          continue;
        }
      }
      if (result.artifactType && result.requestId) return result;
    }
    if (depth === 0) break;
  }
  return result;
};
