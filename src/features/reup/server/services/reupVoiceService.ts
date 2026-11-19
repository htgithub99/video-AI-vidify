import fs from "fs";
import _ from "lodash";
import path from "path";
import { createHash } from "crypto";
import { synthesizeMotionSpeech } from "../../../motion/server/services/motionVoiceSourceService.js";
import { findVoiceChannel } from "../../../motion/server/services/motionVoiceLibraryService.js";
import { REUP_BUILD, REUP_DIR, REUP_VOICE } from "../../constants/reupConfig.js";
import { reupPacing } from "../../lib/reupTimeline.js";
import { REUP_ERROR, REUP_LOG } from "../../constants/reupServerText.js";
import { isAi33Voice } from "../../../../lib/motionVoice.js";
import { vieneuRoot } from "../../../../server/services/vieneuTtsService.js";
import { probeMediaDurationSeconds } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { reupClipSubtitles, reupSentences, reupSubChars } from "../../lib/reupSpeech.js";
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
const speak = async (jobId: string, sentences: string[], gaps: number[], voiceId: string, file: string, log: Log, signal?: AbortSignal): Promise<number[]> => {
  const work = path.join(vieneuRoot(), REUP_VOICE.WORK_DIR, jobId);
  fs.mkdirSync(work, { recursive: true });
  const stem = path.basename(file, ".wav");
  const files = sentences.map((_s, i) => path.join(work, `${stem}_${i}.wav`));
  const list = path.join(work, `${stem}.txt`);
  try {
    const seconds: number[] = [];
    for (const [i, sentence] of sentences.entries()) seconds.push(await speakPiece(sentence, voiceId, files[i], log, signal));
    if (files.length === 1) fs.copyFileSync(files[0], file);
    else if (!gaps.some((g) => g > 0)) {
      fs.writeFileSync(list, files.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"), "utf8");
      await reupFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", file], { signal });
    } else {
      const graph = files.map((_f, i) => `[${i}:a]aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=mono${gaps[i] > 0 ? `,apad=pad_dur=${gaps[i].toFixed(3)}` : ""}[c${i}]`);
      graph.push(`${files.map((_f, i) => `[c${i}]`).join("")}concat=n=${files.length}:v=0:a=1[out]`);
      await reupFfmpeg(["-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", graph.join(";"), "-map", "[out]", "-c:a", "pcm_s16le", file], { signal });
    }
    return seconds;
  } finally {
    for (const f of [...files, list]) fs.rmSync(f, { force: true });
  }
};
export const reupVoiceFor = (job: ReupJob, lang?: string): string => findVoiceChannel(lang && lang !== job.settings.language ? job.settings.voiceChannelAlt : job.settings.voiceChannel)?.narratorVoiceId || "";
export const voiceReupJob = async (job: ReupJob, log: Log, progress: (p: number) => void, signal?: AbortSignal, onVoice?: (id: string, voice: ReupVoice) => void): Promise<{ voices: Record<string, ReupVoice>; credits: number }> => {
  const items = (job.script?.outputs || []).flatMap((o) => o.sections.map((section) => ({ section, lang: o.lang || job.settings.language, voice: reupVoiceFor(job, o.lang) })));
  if (items.some((x) => !x.voice)) throw new Error(REUP_ERROR.NO_VOICE);
  const dir = reupJobDir(job.id, REUP_DIR.VOICE);
  const out: Record<string, ReupVoice> = {};
  let credits = 0;
  for (const [i, { section, lang, voice }] of items.entries()) {
    const cueGap = section.cues && section.cues.length > 1 && section.cues[0].moment ? reupPacing(job.settings.natural, job.source.hasAudio).cueGap : 0;
    const key = createHash("sha1")
      .update(`${voice}\n${section.text}${cueGap ? `\n${section.cues!.map((c) => c.text).join("\n")}\n${cueGap}` : ""}`)
      .digest("hex")
      .slice(0, 16);
    const file = path.join(dir, `${section.id}_${key}.wav`);
    const old = job.voices?.[section.id];
    if (old && old.file === file && fs.existsSync(file)) out[section.id] = old;
    else if (fs.existsSync(file)) out[section.id] = { file, voice, seconds: await probeMediaDurationSeconds(file) };
    else {
      log(REUP_LOG.VOICE_LINE(i + 1, items.length));
      const groups = (section.cues?.length ? section.cues.map((c) => c.text) : [section.text]).map((text) => reupSentences(text, REUP_VOICE.SENTENCE_MAX));
      const sentences = groups.flat();
      const firsts = groups.reduce<number[]>((acc, _g, k) => [...acc, k ? acc[k - 1] + groups[k - 1].length : 0], []);
      const gaps = sentences.map((_t, k) => (cueGap && k + 1 < sentences.length && firsts.includes(k + 1) ? cueGap : 0));
      const seconds = await speak(job.id, sentences, gaps, voice, file, log, signal);
      let at = 0;
      const clips = sentences.map((text, k) => {
        const clip = { text, start: at, end: at + seconds[k] };
        at = clip.end + gaps[k];
        return clip;
      });
      out[section.id] = { file, voice, seconds: _.round(at, 3), ...(cueGap ? { gaps: _.round(_.sum(gaps), 2) } : {}), subs: reupClipSubtitles(clips, reupSubChars(job.settings.aspect, lang)), ...(section.cues && section.cues.length > 1 ? { cues: firsts.map((f) => _.round(clips[f]?.start ?? 0, 2)) } : {}) };
      if (isAi33Voice(voice)) credits += section.text.length;
    }
    onVoice?.(section.id, out[section.id]);
    progress((i + 1) / items.length);
  }
  return { voices: out, credits };
};
