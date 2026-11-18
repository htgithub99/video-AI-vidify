import fs from "fs";
import _ from "lodash";
import { runInMotionAiSession, runMotionAi, type MotionAiImage } from "../../../motion/server/services/motionStoryService.js";
import { isChatAttachmentError } from "../../../../server/services/chatSubmissionRecovery.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../../../../constants/cinematicConstants.js";
import type { MotionAiExecution } from "../../../../types/motionVideo.js";
import { REUP_FOLDER, REUP_MOMENT, REUP_OVERLAY, REUP_UPLOAD } from "../../constants/reupConfig.js";
import { REUP_ARTIFACT, REUP_PROMPT } from "../../constants/reupPrompts.js";
import { REUP_ERROR, REUP_LOG } from "../../constants/reupServerText.js";
import { reupPreset } from "../../constants/reupPresets.js";
import { reupStripToolNotes } from "../../lib/reupSeo.js";
import { reupPacing } from "../../lib/reupTimeline.js";
import { cleanScenePart, mergeSceneParts, reupMoments, reupSheetBatches, reupSheetSpan, reupUploadLimit, type ReupScenePart } from "../../lib/reupSceneMap.js";
import type { MotionSeoOption } from "../../../../types/motionVideo.js";
import type { ReupAiChoice, ReupCue, ReupFrame, ReupJob, ReupMoment, ReupOutputScript, ReupPackage, ReupSceneMap, ReupScript, ReupSection, ReupSectionRole, ReupSegment, ReupSheet, ReupThumbIdea, ReupTranscript } from "../../types/reup.js";
import { learnReupUploadLimit, readReupUploadLimits } from "./reupJobStore.js";
import { cropReupSheet } from "./reupMediaService.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
const SECTION_ROLES = ["hook", "body", "teaser", "ending"] as const;
/** Motion's AI runner with the user's choice for this step; strict when a batch must stay on one provider. */
export const reupExec = (choice: ReupAiChoice, strict = false): MotionAiExecution => ({
  provider: choice.provider,
  model: choice.model,
  mode: choice.mode,
  chromeHeadless: choice.chromeHeadless,
  multiRoom: choice.multiRoom,
  allowFallback: strict ? false : choice.allowFallback,
  ...(strict || !choice.allowFallback ? { strictProvider: true } : {}),
});
const aiLog =
  (log: Log) =>
  (line: string): void => {
    if (line && line.trim()) log(line.trim());
  };
const image = (sheet: Pick<ReupSheet, "file" | "index">): MotionAiImage => ({ name: `sheet_${String(sheet.index + 1).padStart(3, "0")}.jpg`, mimeType: "image/jpeg", path: sheet.file });
/** Run several AI requests of one job inside one motion AI session, so they share (and spread over) the room pool. */
export const withReupAi = <T>(job: ReupJob, fn: () => Promise<T>, log: Log, signal?: AbortSignal): Promise<T> => runInMotionAiSession(job.id, fn, aiLog(log), false, signal);
/**
 * Step 2 — scene map. Sheets go out in the biggest batches the chosen AI accepts per message; batches run in
 * parallel on the room pool. A refused upload halves the batch (remembered for next time). When the AI declines to
 * look at the pictures even after the turn's Retry (a content refusal, e.g. Gemini's "can't help with that image"), the
 * batch is re-sent one sheet at a time, then a refused sheet is cut into smaller row strips down to one row. The map must
 * cover the whole source: a strip still refused stops the step with the time range, never a map with a gap.
 */
export const buildReupSceneMap = async (job: ReupJob, log: Log, signal?: AbortSignal): Promise<ReupSceneMap> => {
  const choice = job.settings.visionAi;
  if (REUP_UPLOAD.NO_VISION.includes(choice.provider) && choice.mode !== REUP_UPLOAD.API_MODE) throw new Error(REUP_ERROR.NO_VISION);
  const api = choice.mode === REUP_UPLOAD.API_MODE;
  let limit = reupUploadLimit(choice.provider, choice.mode, readReupUploadLimits());
  const sizes = job.sheets.map((s) => (fs.existsSync(s.file) ? fs.statSync(s.file).size * 1.37 : 0));
  const first = api ? reupSheetBatches(job.sheets, Number.MAX_SAFE_INTEGER, sizes, REUP_UPLOAD.API_BYTES) : reupSheetBatches(job.sheets, limit);
  log(api ? REUP_LOG.UPLOAD_API(first.length, job.sheets.length) : REUP_LOG.UPLOAD_PLAN(choice.provider, Math.min(limit, job.sheets.length), first.length, job.sheets.length));
  const badText = job.bad.map((b) => `${Math.round(b.start)}-${Math.round(b.end)}s`).join(", ");
  let done = 0;
  // Requests planned so far: grows when a batch is split, so "batch n/N" stays true.
  let planned = first.length;
  const split = <T>(chunks: T[][]): T[][] => {
    planned += chunks.length - 1;
    return chunks;
  };
  const parts: ReupScenePart[] = [];
  const ask = async (sheets: ReupSheet[], exec: MotionAiExecution, halvings: number): Promise<void> => {
    if (!api && sheets.length > limit) {
      await Promise.all(split(_.chunk(sheets, limit)).map((chunk) => ask(chunk, exec, halvings)));
      return;
    }
    const span = { start: reupSheetSpan(sheets[0], job.source.duration).start, end: reupSheetSpan(_.last(sheets)!, job.source.duration).end };
    const items = job.source.items?.filter((it) => it.end > span.start && it.start < span.end);
    const prompt = REUP_PROMPT.SCENES({ sheets: sheets.map((s) => ({ index: s.index, start: s.start, interval: s.interval, count: s.count, cols: s.cols })), duration: job.source.duration, part: parts.length + 1, parts: planned, bad: badText, language: job.settings.language, items, photoSeconds: REUP_FOLDER.PHOTO_SECONDS });
    try {
      const raw = await runMotionAi(prompt, REUP_ARTIFACT.SCENES, exec, signal, aiLog(log), sheets.map(image));
      const part = cleanScenePart(raw, span, job.bad, `b${Math.round(sheets[0].start)}_`, sheets[0].interval);
      parts.push(part);
      done += sheets.length;
      log(REUP_LOG.SCENE_BATCH(parts.length, planned, part.segments.length));
    } catch (error) {
      if (signal?.aborted) throw error;
      if ((error as Error)?.message === CINEMATIC_CHAT_PLANNING_CONFIG.REFUSAL_RESPONSE_ERROR) {
        if (sheets.length > 1) {
          log(REUP_LOG.VISION_REFUSED_SPLIT(choice.provider, sheets.length), "warn");
          for (const one of split(sheets.map((sheet) => [sheet]))) await ask(one, exec, REUP_UPLOAD.HALVINGS);
          return;
        }
        const sheet = sheets[0];
        if (sheet.rows > 1) {
          // A few tiles can trip the image filter: smaller strips isolate them so the rest is still read.
          const top = Math.ceil(sheet.rows / 2);
          const strips = _.compact(await Promise.all([cropReupSheet(job.id, sheet, 0, top, signal), cropReupSheet(job.id, sheet, top, sheet.rows - top, signal)]));
          log(REUP_LOG.VISION_REFUSED_STRIPS(choice.provider, span.start, span.end, strips.length), "warn");
          for (const strip of split(strips.map((s) => [s]))) await ask(strip, exec, REUP_UPLOAD.HALVINGS);
          return;
        }
        throw new Error(REUP_ERROR.VISION_REFUSED_PART(choice.provider, span.start, span.end));
      }
      if (!api && isChatAttachmentError(error) && sheets.length > 1 && halvings < REUP_UPLOAD.HALVINGS) {
        const next = Math.max(1, Math.floor(sheets.length / 2));
        if (next < limit) {
          log(REUP_LOG.UPLOAD_SHRINK(choice.provider, sheets.length, next), "warn");
          limit = next;
          learnReupUploadLimit(choice.provider, next);
        }
        await Promise.all(split(_.chunk(sheets, next)).map((chunk) => ask(chunk, exec, halvings + 1)));
        return;
      }
      if (choice.allowFallback && exec.strictProvider) {
        const size = Math.min(REUP_UPLOAD.FALLBACK_BATCH, sheets.length);
        log(REUP_LOG.UPLOAD_FALLBACK(size), "warn");
        await Promise.all(split(_.chunk(sheets, size)).map((chunk) => ask(chunk, reupExec(choice), REUP_UPLOAD.HALVINGS)));
        return;
      }
      throw error;
    }
  };
  await Promise.all(first.map((batch) => ask(batch, reupExec(choice, !api), 0)));
  const map = mergeSceneParts(parts);
  if (!map.segments.length) throw new Error(REUP_ERROR.NO_SCENES);
  log(REUP_LOG.SCENES(map.segments.length));
  return map;
};
const line = (value: unknown, length: number): string => _.truncate(_.trim(String(value ?? "")), { length });
const titleOf = (value: unknown): string[] => _.castArray(value || []).map((l) => line(l, 40)).filter(Boolean).slice(0, 2);
/**
 * Narrated sections: each cue's words tied to one moment of a scene (its picture starts there). A cue pointing at an
 * unknown moment goes to the nearest unused moment of the scene it names (or the previous cue's scene); with no scene
 * at all its words join the previous cue. `alt` reads the second language of the same cues.
 */
export const cleanMomentSections = (raw: any, map: ReupSceneMap, outputIndex: number, alt = false): ReupSection[] => {
  const moments = new Map(map.segments.flatMap((g) => reupMoments(g).map((m) => [m.id, { m, g }] as const)));
  const scenes = new Map(map.segments.map((g) => [g.id, g]));
  // Moments taken so far; hook and teaser lines are "featured": the body keeps away from them (and they from the body),
  // or the same view would play twice.
  const used: { id: string; scene: string; t: number; featured: boolean }[] = [];
  const free = (g: ReupSegment, m: ReupMoment, featured: boolean): boolean => !used.some((u) => u.id === m.id || (u.scene === g.id && u.featured !== featured && Math.abs(u.t - m.t) < REUP_MOMENT.APART));
  const freeIn = (g: ReupSegment, near: number, featured: boolean): ReupMoment | undefined => _.minBy(reupMoments(g).filter((m) => free(g, m, featured)), (m) => Math.abs(m.t - near));
  return _.castArray(raw?.sections || []).flatMap((section: any, i: number) => {
    const role: ReupSectionRole = SECTION_ROLES.includes(section?.role) ? section.role : "body";
    const featured = role === "hook" || role === "teaser";
    // An answer in the old shape (text over scenes) becomes one cue at the first scene's first moment.
    const rawCues = _.castArray(section?.cues || []).length ? _.castArray(section.cues) : section?.text ? [{ moment: `${_.castArray(section?.scenes || [])[0] ?? ""}`, text: section.text, textAlt: section.textAlt }] : [];
    const cues: ReupCue[] = [];
    for (const item of rawCues) {
      const text = line(alt ? item?.textAlt : item?.text, 600);
      if (!text) continue;
      const id = String(item?.moment ?? item?.scene ?? "").trim();
      const prev = _.last(cues);
      let hit = moments.get(id);
      if (!hit || !free(hit.g, hit.m, featured)) {
        const g = hit?.g || scenes.get(id.replace(/m\d+$/, "")) || (prev && scenes.get(prev.segment));
        const near = hit?.m.t ?? (prev ? moments.get(prev.moment || "")?.m.t ?? g?.start : g?.start) ?? 0;
        const m = g && freeIn(g, near, featured);
        hit = m && g ? { m, g } : undefined;
      }
      // No free moment to show: the words stay over the previous line's picture (never a view shown already).
      if (!hit) {
        if (prev) prev.text = `${prev.text} ${text}`;
        continue;
      }
      used.push({ id: hit.m.id, scene: hit.g.id, t: hit.m.t, featured });
      cues.push({ segment: hit.g.id, moment: hit.m.id, text });
    }
    if (!cues.length) return [];
    return [{ id: `o${outputIndex + 1}_p${i + 1}${alt ? "_alt" : ""}`, role, text: cues.map((c) => c.text).join(" "), shots: _.uniqBy(cues, "segment").map((c) => _.pick(scenes.get(c.segment)!, ["start", "end"])), cues }];
  });
};
/** Photo-report sections: narration split by the picture it plays over, with chapter cards. */
const cleanCueSections = (raw: any, map: ReupSceneMap, outputIndex: number): ReupSection[] => {
  const byId = new Map(map.segments.map((s) => [s.id, s]));
  const used = new Set<string>();
  return _.castArray(raw?.sections || []).flatMap((section: any, i: number) => {
    const cues = _.castArray(section?.cues || []).flatMap((cue: any) => {
      const segment = byId.get(String(cue?.scene ?? ""));
      const text = line(cue?.text, 600);
      if (!segment || !text || used.has(segment.id)) return [];
      used.add(segment.id);
      return [{ segment: segment.id, text }];
    });
    if (!cues.length) return [];
    const chapter = line(section?.chapter, 60);
    return [{ id: `o${outputIndex + 1}_p${i + 1}`, role: section?.role === "ending" ? "ending" : "body", text: cues.map((c) => c.text).join(" "), shots: cues.map((c) => _.pick(byId.get(c.segment)!, ["start", "end"])), cues, ...(chapter ? { chapter } : {}) } as ReupSection];
  });
};
/** Real-talk sections: one per kept phrase, cut a hair outside its first and last word. */
const cleanSpeechSections = (raw: any, transcript: ReupTranscript, outputIndex: number, duration: number): ReupSection[] => {
  const byId = new Map(transcript.phrases.map((p) => [p.id, p]));
  const calls = new Map(_.castArray(raw?.callouts || []).map((c: any) => [String(c?.phrase ?? ""), line(c?.text, 40)]));
  return _.uniq(_.castArray(raw?.phrases || []).map(String))
    .flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []))
    .map((p, i) => ({ id: `o${outputIndex + 1}_${p.id}`, role: (i ? "body" : "hook") as ReupSection["role"], text: p.text, shots: [{ start: _.round(Math.max(0, p.start - REUP_OVERLAY.CUT_PAD), 2), end: _.round(Math.min(duration, p.end + REUP_OVERLAY.CUT_PAD), 2) }], ...(calls.get(p.id) ? { callout: calls.get(p.id) } : {}) }));
};
/** Step 3 — one request, shaped by the preset: narration (one or two languages), a photo report, or cuts of real talk. */
export const writeReupScript = async (job: ReupJob, log: Log, signal?: AbortSignal): Promise<ReupScript> => {
  const preset = reupPreset(job.preset);
  const map = job.sceneMap!;
  const s = job.settings;
  const count = preset.kind === "short" ? s.shortsCount : 1;
  const exec = reupExec(s.scriptAi);
  if (preset.speech) {
    if (!job.transcript?.phrases.length) throw new Error(REUP_ERROR.NO_SPEECH);
    const raw = await runMotionAi(REUP_PROMPT.SPEECH({ transcript: job.transcript, map, settings: s, rules: preset.rules, count }), REUP_ARTIFACT.SCRIPT, exec, signal, aiLog(log));
    const outputs: ReupOutputScript[] = _.castArray(raw?.outputs || [])
      .slice(0, count)
      .map((o: any, i: number) => ({ id: `o${i + 1}`, kind: preset.kind, speech: true, lang: s.language, title: titleOf(o?.title), cta: line(o?.cta || s.cta, 80), sections: cleanSpeechSections(o, job.transcript!, i, job.source.duration) }))
      .filter((o: ReupOutputScript) => o.sections.length);
    if (!outputs.length) throw new Error(REUP_ERROR.NO_SCRIPT);
    return { outputs };
  }
  const folder = preset.source === "folder";
  const share = folder ? undefined : reupPacing(s.natural, job.source.hasAudio).share;
  const raw = await runMotionAi(REUP_PROMPT.SCRIPT({ map, settings: s, rules: preset.rules, kind: preset.kind, count, duration: job.source.duration, style: job.style!, bilingual: preset.bilingual, folder, share }), REUP_ARTIFACT.SCRIPT, exec, signal, aiLog(log));
  const alt = s.languageAlt;
  const outputs: ReupOutputScript[] = _.castArray(raw?.outputs || [])
    .slice(0, count)
    .flatMap((output: any, i: number) => {
      const main: ReupOutputScript = { id: `o${i + 1}`, kind: preset.kind, lang: s.language, title: titleOf(output?.title), sections: folder ? cleanCueSections(output, map, i) : cleanMomentSections(output, map, i) };
      if (!preset.bilingual) return [main];
      const second: ReupOutputScript = { id: `o${i + 1}_${alt}`, kind: preset.kind, lang: alt, title: titleOf(output?.titleAlt), sections: cleanMomentSections(output, map, i, true) };
      return [main, second];
    })
    .filter((output: ReupOutputScript) => output.sections.length);
  if (!outputs.length) throw new Error(REUP_ERROR.NO_SCRIPT);
  return { outputs };
};
/** Frames worth showing the AI for thumbnails: its own picks first, then the strongest scenes. */
export const reupCandidateTimes = (map: ReupSceneMap, limit: number): number[] => {
  const strong = _.orderBy(map.segments, ["value"], ["desc"]).map((s) => _.round((s.start + s.end) / 2, 1));
  const out: number[] = [];
  for (const t of [...map.thumbnails, ...strong]) if (out.length < limit && out.every((o) => Math.abs(o - t) > 5)) out.push(t);
  return out;
};
const clip = (value: unknown, length: number): string => _.truncate(_.trim(String(value ?? "")), { length });
/** Step 6 — SEO options (title, description, hashtags, tags, score) with a thumbnail idea each, drawn from real frames. */
export const writeReupPackage = async (job: ReupJob, frames: (ReupFrame & { file: string })[], past: { titles: string[]; layouts: string[] }, log: Log, signal?: AbortSignal): Promise<ReupPackage> => {
  const s = job.settings;
  const choice = REUP_UPLOAD.NO_VISION.includes(s.scriptAi.provider) && s.scriptAi.mode !== REUP_UPLOAD.API_MODE ? s.visionAi : s.scriptAi;
  const room = s.thumbnail ? Math.min(frames.length, reupUploadLimit(choice.provider, choice.mode, readReupUploadLimits())) : 0;
  const sent = frames.slice(0, room);
  const narration = _.truncate((job.script?.outputs || []).flatMap((o) => o.sections.map((x) => x.text)).join(" "), { length: 2500 });
  const raw = await runMotionAi(REUP_PROMPT.PACKAGE({ map: job.sceneMap!, script: narration, settings: s, frames: sent.map((f) => f.time), options: s.seoOptions, thumbnail: s.thumbnail, pastTitles: past.titles, pastLayouts: past.layouts }), REUP_ARTIFACT.PACKAGE, reupExec(choice), signal, aiLog(log), sent.map((f, i) => ({ name: `frame_${i + 1}.jpg`, mimeType: "image/jpeg", path: f.file })));
  const nearest = (t: unknown): number | undefined => {
    const n = Number(t);
    if (!Number.isFinite(n) || !frames.length) return undefined;
    return _.minBy(frames, (f) => Math.abs(f.time - n))!.time;
  };
  const items = _.castArray(raw?.options || []).filter((o: any) => _.trim(String(o?.title || ""))).slice(0, s.seoOptions);
  const options: MotionSeoOption[] = items.map((o: any) => ({
    title: clip(o.title, 100),
    description: reupStripToolNotes(clip(o.description, 4500)),
    hashtags: _.uniq(_.castArray(o.hashtags || []).map((t: unknown) => `#${_.trim(String(t)).replace(/^#+/, "").replace(/\s+/g, "")}`).filter((t) => t.length > 1)).slice(0, 5),
    tags: _.uniq(_.castArray(o.tags || []).map((t: unknown) => _.trim(String(t)).replace(/^#/, "")).filter(Boolean)).slice(0, 20),
    seoScore: _.clamp(Math.round(Number(o.seoScore) || 0), 0, 100),
  }));
  // Each option's thumbnail; frames fall back to the strongest ones, spread across options.
  const thumbs: ReupThumbIdea[] = !s.thumbnail || !frames.length
    ? []
    : items.map((o: any, i) => {
        const t = o?.thumb || {};
        const layout = (["hero", "split", "circle"].includes(t.layout) ? t.layout : "hero") as ReupThumbIdea["layout"];
        const picked = _.compact(_.castArray(t.frames || []).map(nearest)).slice(0, 2) as number[];
        const lines = _.castArray(t.lines || []).map((l: unknown) => clip(l, 24)).filter(Boolean).slice(0, 2);
        return { layout, frames: picked.length ? picked : [frames[i % frames.length].time], lines: lines.length ? lines : [clip(options[i].title, 24)] };
      });
  return { options, thumbs, frames: frames.map(({ time, url }) => ({ time, url })), pinned: clip(raw?.pinned, 300), aiDisclosure: raw?.aiDisclosure === true };
};
