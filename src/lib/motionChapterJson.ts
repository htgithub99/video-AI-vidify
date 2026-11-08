import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_WRITING as W } from "../constants/motionWriting.js";
import { parseJson } from "./jsonStringify.js";
export const parseMotionChapterReply = (text: string): unknown => {
  const stack: { type: string; key?: string }[] = [];
  const insertions: number[] = [];
  let key: string | undefined;
  let previous = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/u.test(ch)) continue;
    if (ch === RT_MAINTENANCE.DOUBLE_QUOTE) {
      const start = i;
      let escaped = false;
      for (i++; i < text.length; i++) {
        if (escaped) escaped = false;
        else if (text[i] === RT_MAINTENANCE.BACKSLASH) escaped = true;
        else if (text[i] === RT_MAINTENANCE.DOUBLE_QUOTE) break;
      }
      if (i >= text.length) return undefined;
      if (/^\s*:/u.test(text.slice(i + 1))) {
        try {
          key = parseJson<string>(text.slice(start, i + 1));
        } catch {
          return undefined;
        }
        if (key === W.JSON.UTTERANCES && stack.at(-1)?.key === W.JSON.SCENE_PLAN && stack.at(-1)?.type === RT_MAINTENANCE.OPEN_BRACE && stack.at(-2)?.type === RT_MAINTENANCE.OPEN_BRACE && stack.at(-3)?.key === W.JSON.BEATS && stack.at(-3)?.type === RT_MAINTENANCE.OPEN_BRACKET) {
          if (text[previous] !== RT_MAINTENANCE.COMMA) return undefined;
          insertions.push(previous);
          stack.pop();
        }
      }
    } else if (ch === RT_MAINTENANCE.OPEN_BRACE || ch === RT_MAINTENANCE.OPEN_BRACKET) {
      stack.push({ type: ch, key });
      key = undefined;
    } else if (ch === RT_MAINTENANCE.CLOSE_BRACE || ch === RT_MAINTENANCE.CLOSE_BRACKET) {
      if (stack.pop()?.type !== (ch === RT_MAINTENANCE.CLOSE_BRACE ? RT_MAINTENANCE.OPEN_BRACE : RT_MAINTENANCE.OPEN_BRACKET)) return undefined;
      key = undefined;
    }
    previous = i;
  }
  if (!insertions.length || stack.length) return undefined;
  let repaired = text;
  for (const at of insertions.reverse()) repaired = repaired.slice(0, at) + RT_MAINTENANCE.CLOSE_BRACE + repaired.slice(at);
  try {
    const value = parseJson(repaired);
    return value?.artifactType === W.JSON.ARTIFACT && Array.isArray(value.beats) && value.beats.length ? value : undefined;
  } catch {
    return undefined;
  }
};
