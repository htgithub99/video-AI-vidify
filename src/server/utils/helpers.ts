import { appLog } from "../../lib/logger.js";
import { JSON_CLEANUP_CURLY_REGEX, JSON_CLEANUP_SQUARE_REGEX } from "../../constants/index.js";
import _ from "lodash";

const extractBalancedJSON = (text: string): string | null => {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  let startIdx = -1;
  if (!_.eq(firstBrace, -1) && (_.eq(firstBracket, -1) || _.lt(firstBrace, firstBracket))) {
    startIdx = firstBrace;
  } else if (!_.eq(firstBracket, -1)) {
    startIdx = firstBracket;
  }
  if (_.eq(startIdx, -1)) return null;

  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = startIdx; _.lt(i, text.length); i++) {
    const char = text[i];
    if (_.eq(inString, true)) {
      if (_.eq(escape, true)) {
        escape = false;
      } else if (_.eq(char, "\\")) {
        escape = true;
      } else if (_.eq(char, '"')) {
        inString = false;
      }
    } else {
      if (_.eq(char, '"')) {
        inString = true;
      } else if (_.includes(["{", "["], char)) {
        stack.push(char);
      } else if (_.eq(char, "}")) {
        const last = stack[stack.length - 1];
        if (_.eq(last, "{")) {
          stack.pop();
          if (_.eq(stack.length, 0)) {
            return text.substring(startIdx, i + 1);
          }
        }
      } else if (_.eq(char, "]")) {
        const last = stack[stack.length - 1];
        if (_.eq(last, "[")) {
          stack.pop();
          if (_.eq(stack.length, 0)) {
            return text.substring(startIdx, i + 1);
          }
        }
      }
    }
  }
  return null;
};

const repairUnescapedDoubleQuotes = (jsonStr: string): string => {
  let out = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; _.lt(i, jsonStr.length); i++) {
    const char = jsonStr[i];

    if (_.eq(escapeNext, true)) {
      out += char;
      escapeNext = false;
      continue;
    }

    if (_.eq(char, "\\")) {
      out += char;
      escapeNext = true;
      continue;
    }

    if (_.eq(char, '"')) {
      if (_.eq(inString, true)) {
        let isTrueEnd = false;
        let j = i + 1;
        while (_.lt(j, jsonStr.length) && /\s/.test(jsonStr[j])) {
          j++;
        }
        if (_.lt(j, jsonStr.length)) {
          const nextChar = jsonStr[j];
          if (_.includes([",", "}", "]", ":"], nextChar)) {
            isTrueEnd = true;
          }
        } else {
          isTrueEnd = true;
        }

        if (_.eq(isTrueEnd, true)) {
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

    if (_.eq(inString, true)) {
      if (_.eq(char, "\n")) {
        out += "\\n";
      } else if (_.eq(char, "\r")) {
        out += "\\r";
      } else if (_.eq(char, "\t")) {
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

const completeCutoffJSON = (jsonStr: string): string => {
  let out = "";
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; _.lt(i, jsonStr.length); i++) {
    const char = jsonStr[i];
    out += char;

    if (_.eq(escape, true)) {
      escape = false;
      continue;
    }
    if (_.eq(char, "\\")) {
      escape = true;
      continue;
    }

    if (_.eq(inString, true)) {
      if (_.eq(char, '"')) {
        inString = false;
      }
    } else {
      if (_.eq(char, '"')) {
        inString = true;
      } else if (_.includes(["{", "["], char)) {
        stack.push(char);
      } else if (_.eq(char, "}")) {
        if (_.eq(stack[stack.length - 1], "{")) {
          stack.pop();
        }
      } else if (_.eq(char, "]")) {
        if (_.eq(stack[stack.length - 1], "[")) {
          stack.pop();
        }
      }
    }
  }

  if (_.eq(inString, true)) {
    out += '"';
  }

  while (_.gt(stack.length, 0)) {
    const last = stack.pop();
    if (_.eq(last, "{")) {
      out += "}";
    } else if (_.eq(last, "[")) {
      out += "]";
    }
  }

  return out;
};

const parseJSON = (text: string, defaultVal: any, logFailure: boolean): any => {
  if (_.isEmpty(text)) return defaultVal;
  let trimmed = _.trim(text);
  if (_.includes(["", "undefined", "null"], trimmed)) {
    return defaultVal;
  }

  const tryParseClean = (str: string): any => {
    const parseQuietly = (value: string): any => {
      const result = _.attempt(JSON.parse, value);
      return _.isError(result) ? undefined : result;
    };
    let res = parseQuietly(str);
    if (!_.isUndefined(res)) return res;

    const cleanCommas = _.replace(_.replace(str, JSON_CLEANUP_CURLY_REGEX, "}"), JSON_CLEANUP_SQUARE_REGEX, "]");
    res = parseQuietly(cleanCommas);
    if (!_.isUndefined(res)) return res;

    const repaired = repairUnescapedDoubleQuotes(str);
    res = parseQuietly(repaired);
    if (!_.isUndefined(res)) return res;

    const repairedCommas = repairUnescapedDoubleQuotes(cleanCommas);
    res = parseQuietly(repairedCommas);
    if (!_.isUndefined(res)) return res;

    const completed = completeCutoffJSON(str);
    res = parseQuietly(completed);
    if (!_.isUndefined(res)) return res;

    const completedCommas = completeCutoffJSON(cleanCommas);
    res = parseQuietly(completedCommas);
    if (!_.isUndefined(res)) return res;

    return null;
  };

  let parsed = tryParseClean(trimmed);
  if (!_.isNil(parsed)) return parsed;

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (!_.isNil(match) && !_.isNil(match[1])) {
    parsed = tryParseClean(_.trim(match[1]));
    if (!_.isNil(parsed)) return parsed;
  }

  const balanced = extractBalancedJSON(trimmed);
  if (!_.isNil(balanced)) {
    parsed = tryParseClean(balanced);
    if (!_.isNil(parsed)) return parsed;
  }

  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  let startIdx = -1;
  let endIdx = -1;

  if (!_.eq(firstBrace, -1) && (_.eq(firstBracket, -1) || _.lt(firstBrace, firstBracket))) {
    startIdx = firstBrace;
    endIdx = trimmed.lastIndexOf("}");
  } else if (!_.eq(firstBracket, -1)) {
    startIdx = firstBracket;
    endIdx = trimmed.lastIndexOf("]");
  }

  if (!_.eq(startIdx, -1) && !_.eq(endIdx, -1) && _.gt(endIdx, startIdx)) {
    const candidate = trimmed.substring(startIdx, _.add(endIdx, 1));
    parsed = tryParseClean(candidate);
    if (!_.isNil(parsed)) return parsed;
  }

  if (logFailure) appLog("JSON_PARSE_WARNING", text.substring(0, 150) + "...");
  return defaultVal;
};

export const safeParseJSON = (text: string, defaultVal: any): any => parseJSON(text, defaultVal, true);

export const tryParseJSON = (text: string): unknown => parseJSON(text, undefined, false);

export const formatTime = (secs: number): string => {
  const totalSecs = _.round(secs);
  const minutes = _.floor(totalSecs / 60);
  const remainingSecs = totalSecs % 60;
  return `${_.padStart(_.toString(minutes), 2, "0")}:${_.padStart(_.toString(remainingSecs), 2, "0")}`;
};

export const extractCharacterListFromParsedJSON = (parsed: unknown, maxCount: number = 3): any[] => {
  let rawList: any[] = [];
  if (_.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, any>;
    if (_.isArray(obj.characters)) {
      rawList = obj.characters;
    } else if (_.isArray(obj.cast)) {
      rawList = obj.cast;
    } else if (_.isArray(obj.data)) {
      rawList = obj.data;
    } else if (_.isArray(obj.items)) {
      rawList = obj.items;
    } else if (obj.name && (obj.description || obj.prompt)) {
      rawList = [obj];
    }
  }
  return _.take(
    _.filter(rawList, (c) => Boolean(c && (c.name || c.description || c.prompt))),
    maxCount,
  );
};
