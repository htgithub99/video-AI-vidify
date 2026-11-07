import { parseJson } from "./jsonStringify.js";

/** JSON never escapes apostrophes; fix that known AI typo only inside a quoted string. */
export const parseAiJson = <T = any>(raw: string): T => {
  try { return parseJson<T>(raw); }
  catch (originalError) {
    let quoted = false, repaired = "";
    for (let index = 0; index < raw.length; index++) {
      const token = raw[index];
      if (quoted && token === "\\") {
        const next = raw[index + 1];
        if (next === "'") { repaired += next; index++; continue; }
        repaired += token;
        if (next !== undefined) { repaired += next; index++; }
        continue;
      }
      if (token === '"') quoted = !quoted;
      repaired += token;
    }
    if (repaired === raw) throw originalError;
    return parseJson<T>(repaired);
  }
};
