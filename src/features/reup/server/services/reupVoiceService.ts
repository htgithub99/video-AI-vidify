import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { synthesizeMotionSpeech } from "../../../motion/server/services/motionVoiceSourceService.js";
import { findVoiceChannel } from "../../../motion/server/services/motionVoiceLibraryService.js";
import { REUP_DIR, REUP_OVERLAY, REUP_VOICE } from "../../constants/reupConfig.js";
import { REUP_ERROR, REUP_LOG } from "../../constants/reupServerText.js";
import { isAi33Voice } from "../../../../lib/motionVoice.js";
import { transcribeVieneuAudio } from "../../../../server/services/vieneuTtsService.js";
import { reupAlignCues, reupSubtitleLines, reupSubtitleTimes } from "../../lib/reupSpeech.js";
import type { ReupJob, ReupVoice, ReupWord } from "../../types/reup.js";
import { reupJobDir } from "./reupJobStore.js";
import { REUP_ABORTED } from "./reupFfmpeg.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
const wait = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error(REUP_ABORTED));
      },
      { once: true },
    );
  });
/** One line through motion's voice router (ai33 or VieNeu); a full queue is retried every ~17 s. */
const speak = async (text: string, voiceId: string, file: string, log: Log, signal?: AbortSignal): Promise<number> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return (await synthesizeMotionSpeech(text, voiceId, file, signal, (line) => line && log(line))).seconds;
    } catch (error) {
      if (signal?.aborted) throw new Error(REUP_ABORTED);
      if (attempt >= REUP_VOICE.RETRIES || !REUP_VOICE.BUSY.test(String((error as Error)?.message))) throw error;
      log(REUP_LOG.VOICE_BUSY(Math.round(REUP_VOICE.RETRY_MS / 1000)), "warn");
      await wait(REUP_VOICE.RETRY_MS, signal);
    }
  }
};
/** Narrator of the output's voice channel (the Voices tab, shared with Video Motion); the second channel for the other language of a bilingual test. */
export const reupVoiceFor = (job: ReupJob, lang?: string): string => findVoiceChannel(lang && lang !== job.settings.language ? job.settings.voiceChannelAlt : job.settings.voiceChannel)?.narratorVoiceId || "";
/**
 * Step 4 — a WAV per section; unchanged text with the same voice is reused. Photo-report sections (and every section
 * when subtitles are on) are listened back with the local recogniser so pictures and subtitle lines change on their own words.
 */
export const voiceReupJob = async (job: ReupJob, log: Log, progress: (p: number) => void, signal?: AbortSignal): Promise<{ voices: Record<string, ReupVoice>; credits: number }> => {
  const items = (job.script?.outputs || []).flatMap((o) => o.sections.map((section) => ({ section, voice: reupVoiceFor(job, o.lang), lang: o.lang || job.settings.language })));
  if (items.some((x) => !x.voice)) throw new Error(REUP_ERROR.NO_VOICE);
  const dir = reupJobDir(job.id, REUP_DIR.VOICE);
  const out: Record<string, ReupVoice> = {};
  let credits = 0;
  for (const [i, { section, voice, lang }] of items.entries()) {
    const key = createHash("sha1").update(`${voice}\n${section.text}`).digest("hex").slice(0, 16);
    const file = path.join(dir, `${section.id}_${key}.wav`);
    const old = job.voices?.[section.id];
    if (old && old.file === file && fs.existsSync(file)) out[section.id] = old;
    else {
      log(REUP_LOG.VOICE_LINE(i + 1, items.length));
      out[section.id] = { file, voice, seconds: await speak(section.text, voice, file, log, signal) };
      if (isAi33Voice(voice)) credits += section.text.length;
    }
    const voiced = out[section.id];
    const needCues = !!section.cues && section.cues.length > 1 && !voiced.cues;
    const needSubs = job.settings.subtitles && !voiced.subs;
    if (needCues || needSubs) {
      // The recogniser listens back once; picture changes and subtitle lines are both timed by the spoken words.
      let words: ReupWord[] = [];
      try {
        words = (await transcribeVieneuAudio(file, lang, signal)).words || [];
      } catch (error) {
        if (signal?.aborted) throw new Error(REUP_ABORTED);
        log(REUP_LOG.ASR_FAIL(String((error as Error)?.message || error)), "warn");
      }
      if (needCues) voiced.cues = reupAlignCues(section.cues!.map((c) => c.text), words, voiced.seconds);
      if (needSubs) voiced.subs = reupSubtitleTimes(reupSubtitleLines(section.text, REUP_OVERLAY.SUB_WORDS, REUP_OVERLAY.SUB_CHARS), words, voiced.seconds);
    }
    progress((i + 1) / items.length);
  }
  return { voices: out, credits };
};
