import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { stringifyJson } from "./jsonStringify.js";
import type { MotionHtmlFrameInput } from "../types/motionHtmlScene.js";
import type { MotionRemotionScene, MotionRemotionSpec } from "../types/motionVisual.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";
import type { MotionVisualSettings } from "../types/motionVisual.js";
import { motionVisualBeatGroups } from "./motionScenePacing.js";
import { motionVisualSettingsFor } from "./motionVisual.js";
import { MOTION_HTML, MOTION_HTML_REPAIR as R } from "../constants/motionHtmlTemplate.js";
export const motionHtmlIdentities = (analysis: MotionStoryAnalysis) => ({
  cast: analysis.cast.map(({ key, name, alias, role, description, look, marks, skin, carries, gender, age }) => ({ key, name, alias, role, description, look, marks, skin, carries, gender, age })),
  places: analysis.places.map(({ key, name, description, interior, time }) => ({ key, name, description, interior, time })),
  groups: analysis.groups?.map(({ key, name, look, origin, skin, outfit, gear, faction }) => ({ key, name, look, origin, skin, outfit, gear, faction })),
  renamed: analysis.renameEntities ? analysis.renameMap : undefined,
});
export const motionHtmlPlanContext = (beats: MotionBeat[], analysis: MotionStoryAnalysis, settings: MotionVisualSettings, note?: string, sfx = true) => ({
  productionLanguage: RT_MAINTENANCE.EN,
  graphics: MOTION_HTML.GRAPHICS,
  beats: beats.map(({ id, chapterId, narration, sceneTemplateDraft, utterances, visual, place, cast, time, weather }) => ({ id, chapterId, narration, sceneTemplateDraft, utterances: utterances?.map(({ id, text, speaker, role }) => ({ id, text, speaker, role })), visual, place, cast, time, weather })),
  ...motionHtmlIdentities(analysis),
  settings,
  note,
  sfx,
  genre: analysis.videoGenre,
  storytelling: analysis.storytelling,
});
export const motionHtmlPlanSource = (...args: Parameters<typeof motionHtmlPlanContext>) => stringifyJson(motionHtmlPlanContext(...args));
export const motionHtmlPlanCurrent = (script: MotionStoryScript, analysis: MotionStoryAnalysis): boolean => {
  const state = script.gen?.remotion;
  const settings = motionVisualSettingsFor({ analysis, script });
  return state?.renderer === RT_MAINTENANCE.HTML_CANVAS && script.beats.length > 0 && motionVisualBeatGroups(script, 1001).every((group) => !!state.scenes[group.id]?.length && state.htmlPlanSources?.[group.id] === motionHtmlPlanSource(group.beats, analysis, settings, state.notes?.[group.id] || undefined, state.htmlSfx !== false));
};
export const usesMotionHtml = (script: MotionStoryScript): boolean => script.gen?.remotion?.renderer === RT_MAINTENANCE.HTML_CANVAS || script.beats.some((beat) => !!beat.sceneTemplateDraft) || !Object.values(script.gen?.remotion?.scenes || {}).some((scenes) => scenes.length);
const jsSyntaxValid = (code: string): boolean => {
  try {
    new Function(code);
    return true;
  } catch {
    return false;
  }
};
const repairJsSyntax = (code: string): string => {
  const stack: string[] = [];
  let out: string = R.EMPTY;
  let quote: string = R.EMPTY;
  let lineComment = false;
  let blockComment = false;
  let escaped = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1] || R.EMPTY;
    if (lineComment) {
      out += ch;
      if (ch === R.NEWLINE) lineComment = false;
      continue;
    }
    if (blockComment) {
      out += ch;
      if (ch === R.STAR && next === R.SLASH) {
        out += R.SLASH;
        i++;
        blockComment = false;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === R.BACKSLASH) {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === quote) {
        out += ch;
        quote = R.EMPTY;
        continue;
      }
      if ((ch === R.NEWLINE || ch === R.CR) && quote !== R.BACKTICK) {
        out += quote + ch;
        quote = R.EMPTY;
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === R.SLASH && next === R.SLASH) {
      out += R.LINE_COMMENT;
      i++;
      lineComment = true;
      continue;
    }
    if (ch === R.SLASH && next === R.STAR) {
      out += R.BLOCK_OPEN;
      i++;
      blockComment = true;
      continue;
    }
    if (ch === R.SINGLE_QUOTE || ch === R.DOUBLE_QUOTE || ch === R.BACKTICK) {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === R.OPEN_PAREN) stack.push(R.CLOSE_PAREN);
    else if (ch === R.OPEN_BRACKET) stack.push(R.CLOSE_BRACKET);
    else if (ch === R.OPEN_BRACE) stack.push(R.CLOSE_BRACE);
    else if (ch === R.CLOSE_PAREN || ch === R.CLOSE_BRACKET || ch === R.CLOSE_BRACE) {
      if (stack.at(-1) === ch) {
        stack.pop();
      } else if (stack.includes(ch)) {
        while (stack.length && stack.at(-1) !== ch) out += stack.pop();
        stack.pop();
      } else {
        continue;
      }
    }
    out += ch;
  }
  if (blockComment) out += R.BLOCK_CLOSE;
  if (quote) {
    if (escaped) out += R.BACKSLASH;
    out += quote;
  }
  if (stack.length) {
    out = out.replace(/[,:\s]+$/u, R.EMPTY);
    while (stack.length) out += stack.pop();
  }
  return out;
};
export const motionHtmlSource = (raw: unknown): string => {
  const text =
    typeof raw === "string"
      ? raw
          .trim()
          .replace(/^```(?:html)?\s*\r?\n/i, R.EMPTY)
          .replace(/\r?\n```\s*$/, R.EMPTY)
      : String(raw ?? R.EMPTY);
  if (!text) return text;
  const startsClean = /^<!doctype\s+html\b|^<html\b/i.test(text);
  const endsClean = /<\/html>\s*$/i.test(text);
  const scriptMatch = text.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
  if (startsClean && endsClean && (!/<script\b/i.test(text) || (scriptMatch && jsSyntaxValid(scriptMatch[1])))) {
    return text;
  }
  let doc = text;
  const startMatch = doc.match(/<!doctype\s+html\b|<html\b/i);
  if (startMatch?.index !== undefined && startMatch.index > 0) doc = doc.slice(startMatch.index);
  const endMatch = doc.match(/<\/html>/i);
  if (endMatch?.index !== undefined) doc = doc.slice(0, endMatch.index + endMatch[0].length);
  const openScript = doc.match(/<script\b[^>]*>/i);
  if (openScript?.index !== undefined) {
    const bodyStart = openScript.index + openScript[0].length;
    const closeScript = doc.slice(bodyStart).match(/<\/script>/i);
    const rawJs = closeScript?.index !== undefined ? doc.slice(bodyStart, bodyStart + closeScript.index) : doc.slice(bodyStart);
    const fixedJs = jsSyntaxValid(rawJs) ? rawJs : repairJsSyntax(rawJs);
    const tail = closeScript?.index !== undefined ? doc.slice(bodyStart + closeScript.index) : R.SCRIPT_BODY_HTML_CLOSE;
    doc = doc.slice(0, bodyStart) + fixedJs + tail;
  }
  if (/<body\b/i.test(doc) && !/<\/body>/i.test(doc)) {
    doc = /<\/html>/i.test(doc) ? doc.replace(/<\/html>/i, R.BODY_HTML_CLOSE) : doc + R.BODY_CLOSE;
  }
  if ((/^<!doctype\s+html\b|^<html\b/i.test(doc) || /<script\b/i.test(doc)) && !/<\/html>\s*$/i.test(doc)) {
    doc = doc + R.HTML_CLOSE;
  }
  return doc;
};
export const motionHtmlFrame = (spec: MotionRemotionSpec, scene: MotionRemotionScene & { startFrame: number; endFrame: number }, frame: number, width = spec.width, height = spec.height, mode: "preview" | "export" = RT_MAINTENANCE.PREVIEW): MotionHtmlFrameInput => {
  const enabled = (spec.renderBehavior?.actors || (spec.motion ? RT_MAINTENANCE.SIMPLE : RT_MAINTENANCE.FIXED)) === RT_MAINTENANCE.SIMPLE;
  const duration = (scene.endFrame - scene.startFrame) / spec.fps;
  const local = enabled ? Math.max(0, frame - scene.startFrame) : 0;
  return {
    time: local / spec.fps,
    progress: enabled ? Math.min(1, local / Math.max(1, scene.endFrame - scene.startFrame - 1)) : 0,
    frame: local,
    fps: spec.fps,
    duration,
    width,
    height,
    mode,
    motionEnabled: enabled,
    sceneEffectsEnabled: enabled && spec.renderBehavior?.sceneEffects !== RT_MAINTENANCE.OFF,
    seed: scene.html?.seed || scene.id,
    speaking: enabled ? (scene.speaking || []).map((span) => ({ entityId: span.entityId, start: (span.startFrame - scene.startFrame) / spec.fps, end: (span.endFrame - scene.startFrame) / spec.fps })) : [],
  };
};
