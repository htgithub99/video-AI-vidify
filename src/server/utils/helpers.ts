import { appLog } from "../../lib/logger.js";
import { eq, lt, includes, gt, isEmpty, trim, replace, isNil, add, padStart, toString, round, floor } from "lodash";

export const extractBalancedJSON = (text: string): string | null => {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  let startIdx = -1;
  if (!eq(firstBrace, -1) && (eq(firstBracket, -1) || lt(firstBrace, firstBracket))) {
    startIdx = firstBrace;
  } else if (!eq(firstBracket, -1)) {
    startIdx = firstBracket;
  }
  if (eq(startIdx, -1)) return null;

  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = startIdx; lt(i, text.length); i++) {
    const char = text[i];
    if (eq(inString, true)) {
      if (eq(escape, true)) {
        escape = false;
      } else if (eq(char, "\\")) {
        escape = true;
      } else if (eq(char, '"')) {
        inString = false;
      }
    } else {
      if (eq(char, '"')) {
        inString = true;
      } else if (includes(["{", "["], char)) {
        stack.push(char);
      } else if (eq(char, "}")) {
        const last = stack[stack.length - 1];
        if (eq(last, "{")) {
          stack.pop();
          if (eq(stack.length, 0)) {
            return text.substring(startIdx, i + 1);
          }
        }
      } else if (eq(char, "]")) {
        const last = stack[stack.length - 1];
        if (eq(last, "[")) {
          stack.pop();
          if (eq(stack.length, 0)) {
            return text.substring(startIdx, i + 1);
          }
        }
      }
    }
  }
  return null;
};

export const repairUnescapedDoubleQuotes = (jsonStr: string): string => {
  let out = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; lt(i, jsonStr.length); i++) {
    const char = jsonStr[i];

    if (eq(escapeNext, true)) {
      out += char;
      escapeNext = false;
      continue;
    }

    if (eq(char, "\\")) {
      out += char;
      escapeNext = true;
      continue;
    }

    if (eq(char, '"')) {
      if (eq(inString, true)) {
        let isTrueEnd = false;
        let j = i + 1;
        while (lt(j, jsonStr.length) && /\s/.test(jsonStr[j])) {
          j++;
        }
        if (lt(j, jsonStr.length)) {
          const nextChar = jsonStr[j];
          if (includes([",", "}", "]", ":"], nextChar)) {
            isTrueEnd = true;
          }
        } else {
          isTrueEnd = true;
        }

        if (eq(isTrueEnd, true)) {
          inString = false;
          out += char;
        } else {
          out += '\\"';
        }
      } else {
        inString = true;
        out += char;
      }
      continue;
    }

    if (eq(inString, true)) {
      if (eq(char, "\n")) {
        out += "\\n";
      } else if (eq(char, "\r")) {
        out += "\\r";
      } else if (eq(char, "\t")) {
        out += "\\t";
      } else {
        out += char;
      }
    } else {
      out += char;
    }
  }
  return out;
};

export const completeCutoffJSON = (jsonStr: string): string => {
  let out = "";
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; lt(i, jsonStr.length); i++) {
    const char = jsonStr[i];
    out += char;

    if (eq(escape, true)) {
      escape = false;
      continue;
    }
    if (eq(char, "\\")) {
      escape = true;
      continue;
    }

    if (eq(inString, true)) {
      if (eq(char, '"')) {
        inString = false;
      }
    } else {
      if (eq(char, '"')) {
        inString = true;
      } else if (includes(["{", "["], char)) {
        stack.push(char);
      } else if (eq(char, "}")) {
        if (eq(stack[stack.length - 1], "{")) {
          stack.pop();
        }
      } else if (eq(char, "]")) {
        if (eq(stack[stack.length - 1], "[")) {
          stack.pop();
        }
      }
    }
  }

  if (eq(inString, true)) {
    out += '"';
  }

  while (gt(stack.length, 0)) {
    const last = stack.pop();
    if (eq(last, "{")) {
      out += "}";
    } else if (eq(last, "[")) {
      out += "]";
    }
  }

  return out;
};

export const safeParseJSON = (text: string, defaultVal: any): any => {
  if (isEmpty(text)) return defaultVal;
  let trimmed = trim(text);
  if (includes(["", "undefined", "null"], trimmed)) {
    return defaultVal;
  }

  const tryParseClean = (str: string): any => {
    try {
      return JSON.parse(str);
    } catch {
      const cleanCommas = replace(replace(str, /,\s*}/g, "}"), /,\s*]/g, "]");
      try {
        return JSON.parse(cleanCommas);
      } catch {
        try {
          const repaired = repairUnescapedDoubleQuotes(str);
          return JSON.parse(repaired);
        } catch {
          try {
            const repairedCommas = repairUnescapedDoubleQuotes(cleanCommas);
            return JSON.parse(repairedCommas);
          } catch {
            try {
              const completed = completeCutoffJSON(str);
              return JSON.parse(completed);
            } catch {
              try {
                const completedCommas = completeCutoffJSON(cleanCommas);
                return JSON.parse(completedCommas);
              } catch {
                return null;
              }
            }
          }
        }
      }
    }
  };

  let parsed = tryParseClean(trimmed);
  if (!isNil(parsed)) return parsed;

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (!isNil(match) && !isNil(match[1])) {
    parsed = tryParseClean(trim(match[1]));
    if (!isNil(parsed)) return parsed;
  }

  const balanced = extractBalancedJSON(trimmed);
  if (!isNil(balanced)) {
    parsed = tryParseClean(balanced);
    if (!isNil(parsed)) return parsed;
  }

  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  let startIdx = -1;
  let endIdx = -1;

  if (!eq(firstBrace, -1) && (eq(firstBracket, -1) || lt(firstBrace, firstBracket))) {
    startIdx = firstBrace;
    endIdx = trimmed.lastIndexOf("}");
  } else if (!eq(firstBracket, -1)) {
    startIdx = firstBracket;
    endIdx = trimmed.lastIndexOf("]");
  }

  if (!eq(startIdx, -1) && !eq(endIdx, -1) && gt(endIdx, startIdx)) {
    const candidate = trimmed.substring(startIdx, add(endIdx, 1));
    parsed = tryParseClean(candidate);
    if (!isNil(parsed)) return parsed;
  }

  appLog("JSON_PARSE_WARNING", text.substring(0, 150) + "...");
  return defaultVal;
};

export const formatTime = (secs: number): string => {
  const totalSecs = round(secs);
  const minutes = floor(totalSecs / 60);
  const remainingSecs = totalSecs % 60;
  return `${padStart(toString(minutes), 2, "0")}:${padStart(toString(remainingSecs), 2, "0")}`;
};
