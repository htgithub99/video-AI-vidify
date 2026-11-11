import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { parseJson } from "./jsonStringify.js";
export const parseAiJson = <T = any>(raw: string): T => {
  try {
    return parseJson<T>(raw);
  } catch (originalError) {
    let quoted = false,
      repaired = "";
    for (let index = 0; index < raw.length; index++) {
      const token = raw[index];
      if (quoted && token === RT_MAINTENANCE.BACKSLASH) {
        const next = raw[index + 1];
        if (next === RT_MAINTENANCE.SINGLE_QUOTE) {
          repaired += next;
          index++;
          continue;
        }
        repaired += token;
        if (next !== undefined) {
          repaired += next;
          index++;
        }
        continue;
      }
      if (token === RT_MAINTENANCE.DOUBLE_QUOTE) quoted = !quoted;
      repaired += token;
    }
    if (repaired === raw) throw originalError;
    return parseJson<T>(repaired);
  }
};
