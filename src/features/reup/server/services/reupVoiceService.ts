import fs from "fs";
import _ from "lodash";
import path from "path";
import { createHash } from "crypto";
import { synthesizeMotionSpeech } from "../../../motion/server/services/motionVoiceSourceService.js";
import { findVoiceChannel } from "../../../motion/server/services/motionVoiceLibraryService.js";
import { REUP_DIR, REUP_OVERLAY, REUP_VOICE } from "../../constants/reupConfig.js";
import { REUP_ERROR, REUP_LOG } from "../../constants/reupServerText.js";
import { isAi33Voice } from "../../../../lib/motionVoice.js";
import { vieneuRoot } from "../../../../server/services/vieneuTtsService.js";
import { reupClipSubtitles, reupSentences } from "../../lib/reupSpeech.js";
import type { ReupJob, ReupVoice } from "../../types/reup.js";
import { reupJobDir } from "./reupJobStore.js";
import { REUP_ABORTED, reupFfmpeg } from "./reupFfmpeg.js";
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
/** One piece through motion's voice router (ai33 or VieNeu); a full queue is retried every ~17 s. */
const speakPiece = async (text: string, voiceId: string, file: string, log: Log, signal?: AbortSignal): Promise<number> => {
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
/**
 * A section's narration as one WAV, read sentence by sentence like Video Motion (each sentence its own clip, joined in
 * order): the clips' lengths are the exact timing of subtitles and picture changes. VieNeu writes only inside its own
 * folder, so clips are spoken into a work folder there and joined into the run's voice folder.
 */
const speak = async (jobId: string, sentences: string[], voiceId: string, file: string, log: Log, signal?: AbortSignal): Promise<number[]> => {
  const work = path.join(vieneuRoot(), REUP_VOICE.WORK_DIR, jobId);
  fs.mkdirSync(work, { recursive: true });
  const stem = path.basename(file, ".wav");
  const files = sentences.map((_s, i) => path.join(work, `${stem}_${i}.wav`));
  const list = path.join(work, `${stem}.txt`);
  try {
    const seconds: number[] = [];
    for (const [i, sentence] of sentences.entries()) seconds.push(await speakPiece(sentence, voiceId, files[i], log, signal));
    if (files.length === 1) fs.copyFileSync(files[0], file);
    else {
      fs.writeFileSync(list, files.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"), "utf8");
      await reupFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", file], { signal });
    }
    return seconds;
  } finally {
    for (const f of [...files, list]) fs.rmSync(f, { force: true });
  }
};
/** Narrator of the output's voice channel (the Voices tab, shared with Video Motion); the second channel for the other language of a bilingual test. */
export const reupVoiceFor = (job: ReupJob, lang?: string): string => findVoiceChannel(lang && lang !== job.settings.language ? job.settings.voiceChannelAlt : job.settings.voiceChannel)?.narratorVoiceId || "";
/**
 * Step 4 — a WAV per section, read sentence by sentence; unchanged text with the same voice is reused. Subtitle lines
 * and photo-report picture changes take the sentence clips' own timing (no listening back needed).
 */
export const voiceReupJob = async (job: ReupJob, log: Log, progress: (p: number) => void, signal?: AbortSignal): Promise<{ voices: Record<string, ReupVoice>; credits: number }> => {
  const items = (job.script?.outputs || []).flatMap((o) => o.sections.map((section) => ({ section, voice: reupVoiceFor(job, o.lang) })));
  if (items.some((x) => !x.voice)) throw new Error(REUP_ERROR.NO_VOICE);
  const dir = reupJobDir(job.id, REUP_DIR.VOICE);
  const out: Record<string, ReupVoice> = {};
  let credits = 0;
  for (const [i, { section, voice }] of items.entries()) {
    const key = createHash("sha1").update(`${voice}\n${section.text}`).digest("hex").slice(0, 16);
    const file = path.join(dir, `${section.id}_${key}.wav`);
    const old = job.voices?.[section.id];
    if (old && old.file === file && fs.existsSync(file)) out[section.id] = old;
    else {
      log(REUP_LOG.VOICE_LINE(i + 1, items.length));
      // Photo reports: each picture's words are their own group, so the picture changes as its first sentence starts.
      const groups = (section.cues?.length ? section.cues.map((c) => c.text) : [section.text]).map((text) => reupSentences(text, REUP_VOICE.SENTENCE_MAX));
      const sentences = groups.flat();
      const seconds = await speak(job.id, sentences, voice, file, log, signal);
      let at = 0;
      const clips = sentences.map((text, k) => ({ text, start: at, end: (at += seconds[k]) }));
      const firsts = groups.reduce<number[]>((acc, _g, k) => [...acc, k ? acc[k - 1] + groups[k - 1].length : 0], []);
      out[section.id] = {
        file,
        voice,
        seconds: _.round(at, 3),
        subs: reupClipSubtitles(clips, REUP_OVERLAY.SUB_WORDS, REUP_OVERLAY.SUB_CHARS),
        ...(section.cues && section.cues.length > 1 ? { cues: firsts.map((f) => _.round(clips[f]?.start ?? 0, 2)) } : {}),
      };
      if (isAi33Voice(voice)) credits += section.text.length;
    }
    progress((i + 1) / items.length);
  }
  return { voices: out, credits };
};
