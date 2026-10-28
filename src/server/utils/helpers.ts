import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { parseJson } from "../../lib/jsonStringify.js";
import {
  SOURCE_TEMPLATE_SYMBOL_8,
  SOURCE_TEXT_0,
  SOURCE_TEXT_1_4,
  SOURCE_TEXT_DESC,
  SOURCE_TEXT_JSON_PARSE_WARNING,
  SOURCE_TEXT_LENGTH,
  SOURCE_TEXT_N,
  SOURCE_TEXT_NULL,
  SOURCE_TEXT_R_2,
  SOURCE_TEXT_SYMBOL_22,
  SOURCE_TEXT_SYMBOL_3,
  SOURCE_TEXT_SYMBOL_42,
  SOURCE_TEXT_SYMBOL_43,
  SOURCE_TEXT_SYMBOL_44,
  SOURCE_TEXT_SYMBOL_45,
  SOURCE_TEXT_SYMBOL_46,
  SOURCE_TEXT_T_3,
  SOURCE_TEXT_UNDEFINED,
} from "../../constants/sourceText";
import { appLog } from "../../lib/logger.js";
import _ from "lodash";
import { BACKEND_MESSAGES } from "../../constants/messages.js";
const repairJsonStringControls = (value: string): string => {
  let insideString = false;
  let escaped = false;
  let repaired = "";
  for (const character of value) {
    if (escaped) {
      repaired += character;
      escaped = false;
    } else if (character === SOURCE_TEXT_SYMBOL_22 && insideString) {
      repaired += character;
      escaped = true;
    } else if (character === SOURCE_TEXT_SYMBOL_3) {
      insideString = !insideString;
      repaired += character;
    } else if (insideString && character === RT_SHARED.SYMBOL_01BA47) repaired += SOURCE_TEXT_N;
    else if (insideString && character === RT_SERVER.SYMBOL_9D1E0E) repaired += SOURCE_TEXT_R_2;
    else if (insideString && character === RT_SERVER.SYMBOL_2B4C34) repaired += SOURCE_TEXT_T_3;
    else repaired += character;
  }
  return repaired;
};
const repairJsonCandidate = (value: string): string =>
  repairJsonStringControls(value)
    .replace(/,\s*([}\]])/g, SOURCE_TEXT_1_4)
    .replace(/^\uFEFF/, "");
const extractBalancedJsonCandidates = (value: string): string[] => {
  const candidates: string[] = [];
  for (let start = 0; start < value.length; start += 1) {
    const opening = value[start];
    if (opening !== SOURCE_TEXT_SYMBOL_42 && opening !== SOURCE_TEXT_SYMBOL_43) continue;
    const stack: string[] = [opening];
    let insideString = false;
    let escaped = false;
    for (let index = start + 1; index < value.length; index += 1) {
      const character = value[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === SOURCE_TEXT_SYMBOL_22 && insideString) {
        escaped = true;
        continue;
      }
      if (character === SOURCE_TEXT_SYMBOL_3) {
        insideString = !insideString;
        continue;
      }
      if (insideString) continue;
      if (character === SOURCE_TEXT_SYMBOL_42 || character === SOURCE_TEXT_SYMBOL_43) stack.push(character);
      else if (character === SOURCE_TEXT_SYMBOL_44 || character === SOURCE_TEXT_SYMBOL_45) {
        const expectedOpening = character === SOURCE_TEXT_SYMBOL_44 ? SOURCE_TEXT_SYMBOL_42 : SOURCE_TEXT_SYMBOL_43;
        if (stack[stack.length - 1] !== expectedOpening) break;
        stack.pop();
        if (_.isEmpty(stack)) {
          candidates.push(value.slice(start, index + 1));
          break;
        }
      }
    }
  }
  return candidates;
};
const parseJSON = (text: string, logFailure: boolean): unknown => {
  if (_.isEmpty(text)) return undefined;
  const trimmed = _.trim(text);
  if (_.includes(["", SOURCE_TEXT_UNDEFINED, SOURCE_TEXT_NULL], trimmed)) {
    return undefined;
  }
  const fencedCandidates = Array.from(trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi), (match) => _.trim(match[1]));
  const objectStart = trimmed.indexOf(SOURCE_TEXT_SYMBOL_42);
  const objectEnd = trimmed.lastIndexOf(SOURCE_TEXT_SYMBOL_44);
  const arrayStart = trimmed.indexOf(SOURCE_TEXT_SYMBOL_43);
  const arrayEnd = trimmed.lastIndexOf(SOURCE_TEXT_SYMBOL_45);
  const candidates = _.uniq(_.compact([trimmed, ...fencedCandidates, ..._.orderBy(extractBalancedJsonCandidates(trimmed), SOURCE_TEXT_LENGTH, SOURCE_TEXT_DESC), objectStart >= 0 && objectEnd > objectStart ? trimmed.slice(objectStart, objectEnd + 1) : "", arrayStart >= 0 && arrayEnd > arrayStart ? trimmed.slice(arrayStart, arrayEnd + 1) : ""]));
  for (const candidate of candidates) {
    for (const parseCandidate of _.uniq([candidate, repairJsonCandidate(candidate)])) {
      const parsed = _.attempt(parseJson, parseCandidate);
      if (!_.isError(parsed)) return parsed;
    }
  }
  if (logFailure) appLog(SOURCE_TEXT_JSON_PARSE_WARNING, text.substring(0, 150) + SOURCE_TEXT_SYMBOL_46);
  return undefined;
};
export const safeParseJSON = (text: string, _defaultVal: any): any => {
  const parsed = parseJSON(text, true);
  if (_.isUndefined(parsed)) throw new Error(BACKEND_MESSAGES.INVALID_AI_JSON_RESPONSE);
  return parsed;
};
export const tryParseJSON = (text: string): unknown => parseJSON(text, false);
export const formatTime = (secs: number): string => {
  const totalSecs = _.round(secs);
  const minutes = _.floor(totalSecs / 60);
  const remainingSecs = totalSecs % 60;
  return SOURCE_TEMPLATE_SYMBOL_8(`${_.padStart(_.toString(minutes), 2, SOURCE_TEXT_0)}`, `${_.padStart(_.toString(remainingSecs), 2, SOURCE_TEXT_0)}`);
};
