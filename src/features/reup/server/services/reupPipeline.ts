import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import _ from "lodash";
import { logger } from "../../../../lib/logger.js";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import { REUP_DIR, REUP_LIMITS, REUP_STEPS, REUP_THUMBS } from "../../constants/reupConfig.js";
import { REUP_ERROR, REUP_LOG, REUP_REPORT_ITEM, REUP_REPORT_LEVEL_NAME, REUP_STEP_NAME, REUP_STYLE_NAME } from "../../constants/reupServerText.js";
import { reupJobSettings, reupLegacyPreset, reupPreset } from "../../constants/reupPresets.js";
import { MOTION_TEXT_SYMBOL_4 } from "../../../../constants/motionRuntime.js";
import { MOTION_SEO } from "../../../../constants/motionSeo.js";
import { MOTION_SEO_TEXTS } from "../../../../constants/motionVideoTexts.js";
import { renderSeoOptionText } from "../../../../lib/motionSeo.js";
import { REUP_COMMENTARY } from "../../constants/reupCommentary.js";
import { pickReupStyle, reupPickTrack } from "../../lib/reupCommentary.js";
import { reupMusicDir, reupTracks } from "./reupMusicService.js";
import { reupReport } from "../../lib/reupCompliance.js";
import { reupLengthAdvice, reupSameSource, reupSourceReuses, reupUsableSeconds } from "../../lib/reupAdvice.js";
import { mergeSpans, spanLength } from "../../lib/reupTimeline.js";
import { reupTalkPhrases } from "../../lib/reupTalk.js";
import { reupStrayWords, reupUnbackedClaims, reupUsedEvidence } from "../../lib/reupFacts.js";
import { reupSeoChapters } from "../../lib/reupSeo.js";
import { cleanReupSettings } from "../../lib/reupSettings.js";
import type { ReupJob, ReupPackage, ReupPresetId, ReupRights, ReupScript, ReupShot, ReupStepId } from "../../types/reup.js";
import { buildReupSceneMap, reupCandidateTimes, withReupAi, writeReupPackage, writeReupScript } from "./reupAiService.js";
import { reupClearAiThumbs, reupDrawAiThumb, reupDrawAiThumbs } from "./reupThumbAiService.js";
import { reupNextLook } from "../../lib/reupThumbPlan.js";
import { retainGlobalBrowser } from "../../../../server/services/imageGeneratorService.js";
import { buildReupJob } from "./reupBuildService.js";
import { REUP_ABORTED, isReupAbort } from "./reupFfmpeg.js";
import { HEAVY_RENDER, HEAVY_VOICE, runHeavyJob } from "../../../../server/utils/heavyJobQueue.js";
import { HEAVY_JOB_TEXT } from "../../../../constants/mediaEncoder.js";
import { getReupJob, listReupJobs, reupController, reupEmptySteps, reupFileUrl, reupJobDir, reupLog, reupStep, saveReupJob, setReupController } from "./reupJobStore.js";
import { inspectReupSource, makeReupProxy, reupFingerprint, makeReupSheets, measureReupQuality, reupFrame, transcribeReupSource } from "./reupMediaService.js";
import { voiceReupJob } from "./reupVoiceService.js";
import { closeMotionStandaloneBrowser } from "../../../motion/server/services/motionStoryService.js";
const clearFrom = (job: ReupJob, step: ReupStepId): void => {
  const at = REUP_STEPS.indexOf(step);
  const before = (id: ReupStepId) => at <= REUP_STEPS.indexOf(id);
  if (before("package")) reupClearAiThumbs(job);
  if (step === "package") {
    job.package = undefined;
    job.packageDir = undefined;
    job.steps.package = { status: "idle", progress: 0, message: "" };
    return;
  }
  if (before("source")) {
    job.sheets = [];
    job.bad = [];
    job.dim = [];
    job.transcript = undefined;
  }
  if (before("scenes")) job.sceneMap = undefined;
  if (before("script")) job.script = undefined;
  if (before("package")) {
    job.package = undefined;
    job.packageDir = undefined;
  }
  if (before("build")) job.outputs = [];
  job.report = undefined;
  job.warnings = [];
  for (const id of REUP_STEPS.slice(at)) job.steps[id] = { status: "idle", progress: 0, message: "" };
};
const stepClock = (): (() => number) => {
  const started = Date.now();
  return () => (Date.now() - started) / 1000;
};
const heavy = <T>(job: ReupJob, kind: string, step: string, signal: AbortSignal, run: () => Promise<T>): Promise<T> =>
  runHeavyJob(kind, HEAVY_JOB_TEXT.LABEL(HEAVY_JOB_TEXT.SCREEN.REUP, `${job.source.name} · ${step}`), run, { signal, onWait: (holder) => reupLog(job, HEAVY_JOB_TEXT.WAIT(kind, holder)), onStart: (waited) => waited >= 1 && reupLog(job, HEAVY_JOB_TEXT.START(step, waited)) }).catch((error) => {
    throw signal.aborted ? new Error(REUP_ABORTED) : error;
  });
const pastRuns = (job: ReupJob): ReupJob[] => listReupJobs(REUP_COMMENTARY.HISTORY * 6).filter((p) => p.id !== job.id && p.createdAt < job.createdAt);
const finishedRuns = (job: ReupJob): ReupJob[] => pastRuns(job).filter((p) => p.outputs.length > 0);
const usedSpans = (job: ReupJob): ReupShot[] => {
  const same = finishedRuns(job).filter((p) => reupSameSource(job, p));
  const spans = mergeSpans(same.flatMap((p) => p.outputs.flatMap((o) => (o.spans || []).map(([start, end]) => ({ start, end })))));
  return spans;
};
const checkPolicy = (job: ReupJob): void => {
  job.report = reupReport(job, finishedRuns(job));
  const flagged = job.report.notes.filter((n) => n.level !== "ok" && REUP_REPORT_ITEM[n.code]).map((n) => REUP_REPORT_ITEM[n.code]!(n.value || ""));
  reupLog(job, REUP_LOG.REPORT(REUP_REPORT_LEVEL_NAME[job.report.level], flagged.length ? flagged : [REUP_REPORT_ITEM.narration!(String(Math.round(job.report.narrated * 100)))]), job.report.level === "ok" ? "info" : "warn");
};
const scriptWords = (script: ReupScript): number => _.sumBy(script.outputs, (o) => _.sumBy(o.sections, (s) => s.text.split(/\s+/).filter(Boolean).length));
const checkClaims = (job: ReupJob, text: string, shown = text): void => {
  const claims = reupUnbackedClaims(text, job.sceneMap!, `${job.source.name} ${job.settings.angle}`);
  const stray = reupStrayWords(
    shown,
    reupUsedEvidence(
      job.sceneMap!,
      (job.script?.outputs || []).flatMap((o) => o.sections.flatMap((x) => x.cues || [])),
    ),
  );
  if (stray.length) reupLog(job, REUP_LOG.STRAY(stray), "warn");
  if (claims.length) reupLog(job, REUP_LOG.CLAIM(claims.join(", ")), "warn");
};
const scriptShownText = (script: ReupScript): string => script.outputs.flatMap((o) => [...o.title, ...o.sections.flatMap((x) => [...(x.marks || []), ...(x.mark ? [x.mark] : [])].flatMap((m) => [m.label, m.title, m.sub || ""]))]).join("\n");
const scriptClaimText = (script: ReupScript): string => script.outputs.flatMap((o) => [...o.title, ...o.sections.map((s) => s.text)]).join("\n");
const closeReupBrowser = async (job: ReupJob, signal: AbortSignal, quiet = false): Promise<void> => {
  for (let attempt = 0; attempt < REUP_LIMITS.BROWSER_CLOSE_TRIES; attempt++) {
    if (signal.aborted) return;
    if (await closeMotionStandaloneBrowser().catch(() => false)) return quiet ? undefined : reupLog(job, REUP_LOG.BROWSER_CLOSED);
    await new Promise((resolve) => setTimeout(resolve, REUP_LIMITS.BROWSER_CLOSE_WAIT_MS));
  }
  if (!quiet) reupLog(job, REUP_LOG.BROWSER_KEPT);
};
const STEP_RUN: Record<ReupStepId, (job: ReupJob, signal: AbortSignal) => Promise<"next" | "stop">> = {
  source: async (job, signal) => {
    const preset = reupPreset(job.preset);
    job.source = await inspectReupSource(job.source.path);
    if (preset.source === "folder" && job.source.kind !== "folder") throw new Error(REUP_ERROR.NEED_FOLDER);
    if (preset.source === "video" && job.source.kind === "folder") throw new Error(REUP_ERROR.NEED_VIDEO);
    if (job.source.kind === "folder") {
      const items = job.source.items || [];
      reupLog(job, REUP_LOG.FOLDER(items.filter((i) => i.type === "photo").length, items.filter((i) => i.type === "clip").length, job.source.duration));
      job.source.proxy = await makeReupProxy(job.id, job.source, signal);
      reupLog(job, REUP_LOG.PROXY);
    } else reupLog(job, REUP_LOG.SOURCE(job.source.duration, job.source.width, job.source.height, job.source.hasAudio));
    job.fingerprint = await reupFingerprint(job.source);
    const reused = reupSourceReuses(job, finishedRuns(job));
    if (reused) reupLog(job, REUP_LOG.SOURCE_REUSED(reused), "warn");
    const talk =
      job.settings.keepTalk && job.source.hasAudio && job.settings.natural !== "off"
        ? transcribeReupSource(job.id, job.source, "", signal, (line) => line && reupLog(job, line))
            .then((t) => {
              job.transcript = { ...t, phrases: reupTalkPhrases(t.phrases) };
              reupLog(
                job,
                REUP_LOG.TALK(
                  job.transcript.phrases.length,
                  _.sumBy(job.transcript.phrases, (p) => p.end - p.start),
                ),
              );
            })
            .catch((error) => {
              if (signal.aborted) throw error;
              reupLog(job, REUP_LOG.TALK_FAILED(String((error as Error)?.message || error)), "warn");
            })
        : Promise.resolve();
    const [{ sheets, watermark }, quality] = await Promise.all([makeReupSheets(job.id, job.source, job.settings.sheetInterval, signal, () => reupLog(job, REUP_LOG.FONT_MISSING, "warn")), measureReupQuality(job.source, job.settings.darkLevel, job.settings.blurLevel, signal)]);
    job.sheets = sheets;
    job.watermark = watermark;
    if (watermark) reupLog(job, REUP_LOG.WATERMARK(watermark, job.settings.logo === "off" ? "auto" : job.settings.logo === "crop" || job.settings.logoCorner === watermark ? "hidden" : "other"), "warn");
    job.bad = quality.bad;
    job.dim = quality.dim;
    if (quality.dim.length)
      reupLog(
        job,
        REUP_LOG.DIM(
          quality.dim.length,
          _.sumBy(quality.dim, (d) => d.end - d.start),
        ),
      );
    reupLog(job, REUP_LOG.SHEETS(sheets.length, sheets[0]?.interval || job.settings.sheetInterval));
    if (!quality.blurMeasured && job.settings.blurLevel > 0) reupLog(job, REUP_LOG.QUALITY_NO_BLUR);
    reupLog(
      job,
      REUP_LOG.QUALITY(
        quality.bad.length,
        _.sumBy(quality.bad, (b) => b.end - b.start),
      ),
    );
    await talk;
    const advice = reupLengthAdvice(preset, job.settings, reupUsableSeconds(job.source, job.bad));
    if (advice) reupLog(job, REUP_LOG.LENGTH_ADVICE(advice.need, advice.usable, advice.suggest), "warn");
    return "next";
  },
  scenes: async (job, signal) => {
    job.sceneMap = await withReupAi(
      job,
      () => buildReupSceneMap(job, (t, l) => reupLog(job, t, l), signal),
      (t) => reupLog(job, t),
      signal,
    );
    return "next";
  },
  script: async (job, signal) => {
    if (!job.style) {
      job.style = pickReupStyle(job.settings, _.compact(pastRuns(job).map((p) => p.style)).slice(0, REUP_COMMENTARY.HISTORY), job.id);
      reupLog(job, REUP_LOG.STYLE(REUP_STYLE_NAME[job.style.voice], job.style.hook ? REUP_STYLE_NAME[job.style.hook] : "", REUP_STYLE_NAME[job.style.ending], job.style.shape ? REUP_STYLE_NAME[job.style.shape] : ""));
    }
    job.script = await withReupAi(
      job,
      () => {
        const used = usedSpans(job);
        if (used.length) reupLog(job, REUP_LOG.USED_SPANS(finishedRuns(job).filter((p) => reupSameSource(job, p)).length, spanLength(used)));
        return writeReupScript(job, { scripts: _.compact(finishedRuns(job).map((p) => p.script)), used }, (t, l) => reupLog(job, t, l), signal);
      },
      (t) => reupLog(job, t),
      signal,
    );
    reupLog(job, REUP_LOG.SCRIPT(job.script.outputs.length, scriptWords(job.script)));
    checkClaims(job, scriptClaimText(job.script), scriptShownText(job.script));
    if (!job.settings.stopScript) return "next";
    reupLog(job, REUP_LOG.WAIT_SCRIPT);
    return "stop";
  },
  voice: async (job, signal) => {
    const voiced = stepClock();
    const { voices, credits } = await heavy(job, HEAVY_VOICE, REUP_STEP_NAME.voice, signal, () =>
      voiceReupJob(
        job,
        (t, l) => reupLog(job, t, l),
        (p) => reupStep(job, "voice", { progress: p }),
        signal,
        (id, voice) => {
          job.voices = { ...job.voices, [id]: voice };
          saveReupJob(job);
        },
      ),
    );
    reupLog(job, HEAVY_JOB_TEXT.STEP(REUP_STEP_NAME.voice, voiced(), _.sumBy(Object.values(voices), "seconds")));
    job.voices = voices;
    job.credits = (job.credits || 0) + credits;
    reupLog(job, REUP_LOG.VOICE_DONE(_.sumBy(Object.values(voices), "seconds")));
    if (credits) reupLog(job, REUP_LOG.CREDITS(job.credits));
    return "next";
  },
  build: async (job, signal) => {
    if (job.settings.music === "library") {
      const tracks = reupTracks(job.preset);
      const track = tracks.some((t) => t.name === job.style?.track)
        ? job.style!.track
        : reupPickTrack(
            tracks.map((t) => t.name),
            _.compact(pastRuns(job).map((p) => p.style)).slice(0, REUP_COMMENTARY.HISTORY),
            job.id,
          );
      job.style = { ...job.style!, track };
      reupLog(job, track ? REUP_LOG.MUSIC_TRACK(track) : REUP_LOG.MUSIC_EMPTY(job.preset, reupMusicDir()), track ? "info" : "warn");
    }
    const built = stepClock();
    job.outputs = await heavy(job, HEAVY_RENDER, REUP_STEP_NAME.build, signal, () =>
      buildReupJob(
        job,
        usedSpans(job),
        (t, l) => reupLog(job, t, l),
        (p) => reupStep(job, "build", { progress: p }),
        signal,
      ),
    );
    reupLog(job, HEAVY_JOB_TEXT.STEP(REUP_STEP_NAME.build, built(), _.sumBy(job.outputs, "duration")));
    checkPolicy(job);
    if (job.package) writePackage(job, job.package);
    return "next";
  },
  package: async (job, signal) => {
    const moments = new Map(job.sceneMap!.segments.flatMap((g) => (g.moments || []).map((m) => [m.id, m.t] as const)));
    const shown = (job.script?.outputs || []).flatMap((o) => o.sections.flatMap((x) => (x.cues || []).flatMap((c) => (c.moment && moments.has(c.moment) ? [moments.get(c.moment)!] : []))));
    const avoid = finishedRuns(job)
      .filter((p) => reupSameSource(job, p))
      .flatMap((p) => (p.package?.thumbs || []).flatMap((t) => t.frames));
    const times = job.settings.thumbnail ? reupCandidateTimes(job.sceneMap!, REUP_LIMITS.FRAMES, { dim: job.dim, bad: job.bad, avoid, shown }) : [];
    const frames = await Promise.all(
      times.map(async (time) => {
        const file = await reupFrame(job.id, job.source, time, 1280, signal, job.watermark);
        return { time, file, url: reupFileUrl(file) };
      }),
    );
    const past = pastRuns(job);
    const recent = { titles: past.flatMap((p) => (p.package?.options || []).map((o) => o.title)).slice(0, 20), ...reupThumbHistory(past) };
    job.package = await withReupAi(
      job,
      () => writeReupPackage(job, frames, recent, (t, l) => reupLog(job, t, l), signal),
      (t) => reupLog(job, t),
      signal,
    );
    await reupDrawAiThumbs(job, (t, l) => reupLog(job, t, l), signal);
    reupLog(job, REUP_LOG.PACKAGE(job.package.options.length, job.package.thumbs.length));
    checkClaims(job, [...job.package.options.map((o) => o.title), ...job.package.thumbs.flatMap((t) => t.lines)].join("\n"));
    if (job.outputs.length) {
      checkPolicy(job);
      writePackage(job, job.package);
    }
    await closeReupBrowser(job, signal);
    return "next";
  },
};
const run = async (job: ReupJob, from: ReupStepId, until?: ReupStepId): Promise<void> => {
  const controller = new AbortController();
  setReupController(job.id, controller);
  job.status = "running";
  job.error = undefined;
  saveReupJob(job, true);
  let current: ReupStepId = from;
  try {
    for (const step of REUP_STEPS.slice(REUP_STEPS.indexOf(from), until ? REUP_STEPS.indexOf(until) + 1 : undefined)) {
      if (step !== from && job.steps[step]?.status === "done") continue;
      current = step;
      reupStep(job, step, { status: "running", progress: 0, message: "" });
      const next = await STEP_RUN[step](job, controller.signal);
      if (controller.signal.aborted) throw new Error(REUP_ABORTED);
      if (next === "stop") {
        reupStep(job, step, { status: "waiting", progress: 1 });
        job.status = "waiting-script";
        return;
      }
      reupStep(job, step, { status: "done", progress: 1 });
    }
    job.status = "done";
  } catch (error) {
    if (reupController(job.id) !== controller) return;
    if (isReupAbort(error) || controller.signal.aborted) {
      const logged = (job.status as string) === "cancelled";
      job.status = "cancelled";
      reupStep(job, current, { status: "idle", message: REUP_LOG.CANCELLED });
      if (!logged) reupLog(job, REUP_LOG.CANCELLED);
    } else {
      const message = String((error as Error)?.message || error);
      job.status = "error";
      job.error = message;
      reupStep(job, current, { status: "error", message });
      reupLog(job, REUP_LOG.STEP_FAILED(REUP_STEP_NAME[current], message), "error");
      logger.warn(message);
    }
  } finally {
    if (reupController(job.id) === controller) setReupController(job.id, undefined);
    saveReupJob(job, true);
  }
};
const launch = (job: ReupJob, from: ReupStepId, until?: ReupStepId): void => {
  void run(job, from, until);
};
const busy = (job: ReupJob): void => {
  if (reupLegacyPreset(job.preset)) throw new Error(REUP_ERROR.LEGACY);
  if (job.status === "running" && reupController(job.id)) throw new Error(REUP_ERROR.BUSY);
};
export const startReup = async (input: { path: string; preset: ReupPresetId; settings: unknown; rights: unknown }): Promise<ReupJob> => {
  if (input.rights !== "own" && input.rights !== "licensed") throw new Error(REUP_ERROR.LICENSE);
  const rights: ReupRights = input.rights;
  const preset = reupPreset(input.preset);
  if (preset.stage === "later") throw new Error(REUP_ERROR.PRESET_LATER);
  const source = await inspectReupSource(input.path);
  const now = Date.now();
  const settings = reupJobSettings(preset.id, cleanReupSettings(input.settings, preset.id));
  if (rights === "licensed" && !settings.sourceLink.trim()) throw new Error(REUP_ERROR.LICENSE_LINK);
  if (settings.angle.trim().length < REUP_LIMITS.ANGLE_MIN) throw new Error(REUP_ERROR.NO_ANGLE);
  const job: ReupJob = { id: randomUUID(), createdAt: now, updatedAt: now, preset: preset.id, settings, rights, source, status: "running", steps: reupEmptySteps(), logs: [], sheets: [], bad: [], warnings: [], outputs: [] };
  saveReupJob(job, true);
  reupLog(job, REUP_LOG.START(source.name, preset.id));
  launch(job, "source");
  return job;
};
export const rerunReup = (id: string, step: ReupStepId, settings?: unknown): ReupJob => {
  const job = getReupJob(id);
  if (!job) throw new Error(REUP_ERROR.NO_JOB);
  if (!REUP_STEPS.includes(step)) throw new Error(REUP_ERROR.BAD_STEP);
  busy(job);
  const at = REUP_STEPS.indexOf(step);
  if (at > 0 && job.steps[REUP_STEPS[at - 1]].status !== "done" && job.steps[REUP_STEPS[at - 1]].status !== "waiting") throw new Error(REUP_ERROR.NEED_STEP);
  if (settings) job.settings = reupJobSettings(reupPreset(job.preset).id, cleanReupSettings(settings, job.preset));
  clearFrom(job, step);
  launch(job, step, step === "package" && job.steps.build.status === "done" ? "package" : undefined);
  return job;
};
const EXPORT_KEYS = ["aspect", "quality", "fps", "subtitles", "music", "natural", "logo", "logoCorner", "encoder", "highlights"] as const;
export const exportReup = (id: string, settings: unknown): ReupJob => {
  const job = getReupJob(id);
  if (!job) throw new Error(REUP_ERROR.NO_JOB);
  busy(job);
  if (job.steps.voice.status !== "done") throw new Error(REUP_ERROR.NEED_VOICE);
  const screen = cleanReupSettings(settings, job.preset);
  job.settings = { ...job.settings, ..._.pick(screen, EXPORT_KEYS) };
  job.outputs = [];
  job.report = undefined;
  job.steps.build = { status: "idle", progress: 0, message: "" };
  reupLog(job, REUP_LOG.EXPORT_AGAIN);
  launch(job, "build", "build");
  return job;
};
export const approveReupScript = (id: string, edited: unknown): ReupJob => {
  const job = getReupJob(id);
  if (!job?.script) throw new Error(REUP_ERROR.NO_JOB);
  busy(job);
  if (job.status !== "waiting-script") throw new Error(REUP_ERROR.NOT_WAITING);
  const outs = new Map<string, any>(_.castArray((edited as ReupScript)?.outputs || []).map((o: any) => [String(o?.id), o]));
  const clip = (v: unknown, n: number) => _.truncate(_.trim(String(v ?? "")), { length: n });
  const scenes = new Map((job.sceneMap?.segments || []).map((g) => [g.id, g]));
  job.script = {
    ...job.script,
    outputs: job.script.outputs.map((o) => {
      const e = outs.get(o.id);
      const secs = new Map<string, any>(_.castArray(e?.sections || []).map((x: any) => [String(x?.id), x]));
      return {
        ...o,
        title: _.castArray(e?.title ?? o.title)
          .map((l) => clip(l, 40))
          .filter(Boolean)
          .slice(0, 2),
        sections: o.sections
          .map((sec) => {
            const x = secs.get(sec.id);
            if (sec.cues) {
              const cues = sec.cues.map((c, k) => ({ ...c, text: clip(_.castArray(x?.cues || [])[k]?.text ?? c.text, 600) })).filter((c) => c.text);
              const shots = _.uniqBy(cues, "segment").flatMap((c) => (scenes.has(c.segment) ? [_.pick(scenes.get(c.segment)!, ["start", "end"])] : []));
              return { ...sec, cues, text: cues.map((c) => c.text).join(" "), shots };
            }
            return { ...sec, text: clip(x?.text ?? sec.text, REUP_LIMITS.TEXT) };
          })
          .filter((sec) => sec.text),
      };
    }),
  };
  if (!job.script.outputs.some((o) => o.sections.length)) throw new Error(REUP_ERROR.EMPTY_SCRIPT);
  job.warnings = [];
  checkClaims(job, scriptClaimText(job.script), scriptShownText(job.script));
  reupStep(job, "script", { status: "done", progress: 1 });
  launch(job, "package");
  return job;
};
const reupThumbHistory = (past: ReupJob[]) => {
  const thumbs = past.slice(0, REUP_THUMBS.HISTORY).flatMap((p) => p.package?.thumbs || []);
  return { layouts: thumbs.map((t) => t.layout), kinds: _.compact(thumbs.map((t) => (t.kind === "signature" ? undefined : t.kind))), looks: _.compact(thumbs.map((t) => t.ai?.look)), spots: _.compact(thumbs.map((t) => t.spot)) };
};
const rerolling = new Set<string>();
export const rerollReupThumb = async (id: string, index: number): Promise<ReupJob> => {
  const job = getReupJob(id);
  if (!job) throw new Error(REUP_ERROR.NO_JOB);
  busy(job);
  const idea = job.package?.thumbs[index];
  if (!idea?.ai || !idea.kind) throw new Error(REUP_ERROR.NO_AI_THUMB);
  if (rerolling.has(id)) throw new Error(REUP_ERROR.BUSY);
  rerolling.add(id);
  const controller = new AbortController();
  try {
    if (idea.kind === "signature") idea.ai = { ...idea.ai, look: reupNextLook(idea.ai.look, reupThumbHistory(pastRuns(job)).looks) };
    const release = retainGlobalBrowser();
    try {
      await reupDrawAiThumb(job, index, (t, l) => reupLog(job, t, l), controller.signal);
    } finally {
      release();
    }
    await closeReupBrowser(job, controller.signal, true);
    saveReupJob(job, true);
    return job;
  } finally {
    rerolling.delete(id);
  }
};
const writePackage = (job: ReupJob, pack: ReupPackage): void => {
  const dir = reupJobDir(job.id, REUP_DIR.PACKAGE);
  const seo = { chapters: reupSeoChapters(job.outputs[0]) };
  const t = MOTION_SEO_TEXTS.vi;
  const text = (name: string, value: string) => fs.writeFileSync(path.join(dir, name), value, "utf8");
  text("seo.txt", MOTION_SEO.EXPORT_TEXT(t.exportTitle, pack.options.map((option, i) => renderSeoOptionText(option, seo, i, t)).join(MOTION_TEXT_SYMBOL_4)));
  text("pinned_comment.txt", pack.pinned);
  text("package.json", stringifyJson({ options: pack.options, pinned: pack.pinned, videos: job.outputs.map((o) => path.basename(o.file)), aiDisclosure: pack.aiDisclosure, source: job.source.name, sourceLink: job.settings.sourceLink, rights: job.rights, preset: job.preset, style: job.style, report: job.report }, null, 2));
  job.packageDir = dir;
  reupLog(job, REUP_LOG.SAVED(dir));
};
export const cancelReup = (id: string): ReupJob | undefined => {
  const job = getReupJob(id);
  reupController(id)?.abort();
  if (job?.status === "waiting-script" || job?.status === "running") {
    job.status = "cancelled";
    REUP_STEPS.filter((step) => job.steps[step]?.status === "running").forEach((step) => reupStep(job, step, { status: "idle", message: REUP_LOG.CANCELLED }));
    reupLog(job, REUP_LOG.CANCELLED);
    saveReupJob(job, true);
  }
  return job;
};
