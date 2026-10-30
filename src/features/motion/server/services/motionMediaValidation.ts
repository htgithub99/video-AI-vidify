import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import { parseJson } from "../../../../lib/jsonStringify.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getFfprobePath, getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import { MOTION_RENDER_VALIDATION as V } from "../../../../constants/motionRenderValidation.js";
import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
const execute = promisify(execFile);
export const probeMotionMedia = async (file: string, signal?: AbortSignal) => {
  signal?.throwIfAborted();
  const { stdout } = await execute(getFfprobePath(), [...V.PROBE, file], { windowsHide: true, signal, maxBuffer: V.MAX_BUFFER });
  const value = parseJson(stdout);
  return { duration: Number(value.format?.duration), streams: (value.streams || []) as { codec_type: string; codec_name: string; width?: number; height?: number; nb_frames?: string; duration?: string; avg_frame_rate?: string }[] };
};
export const validateMotionMedia = async (file: string, expected: { seconds: number; width?: number; height?: number; fps?: number; frames?: number; audio?: boolean; decode?: boolean }, signal?: AbortSignal): Promise<number> => {
  const probe = await probeMotionMedia(file, signal);
  const video = probe.streams.find((stream) => stream.codec_type === V.VIDEO);
  const audio = probe.streams.find((stream) => stream.codec_type === V.AUDIO);
  const tolerance = Math.max(V.TOLERANCE, 2 / (expected.fps || 30));
  const ratio = video?.avg_frame_rate?.split(RT_SHARED.SYMBOL_8A5EDA).map(Number);
  const fps = ratio?.[1] ? ratio[0] / ratio[1] : 0;
  if (
    !video ||
    !video.codec_name ||
    !Number.isFinite(probe.duration) ||
    probe.duration <= 0 ||
    Math.abs(probe.duration - expected.seconds) > tolerance ||
    (expected.width && expected.width !== video.width) ||
    (expected.height && expected.height !== video.height) ||
    (expected.fps && Math.abs(fps - expected.fps) > 0.01) ||
    (expected.frames && Number(video.nb_frames) !== expected.frames) ||
    (expected.audio && (!audio || !audio.codec_name || !Number.isFinite(Number(audio.duration)) || Number(audio.duration) < expected.seconds - V.AUDIO_TOLERANCE))
  )
    throw new Error(P.OUTPUT_INVALID);
  if (expected.decode !== false) await execute(getFfmpegPath(), [...V.DECODE, file, ...V.NULL], { windowsHide: true, signal, maxBuffer: V.MAX_BUFFER });
  return probe.duration;
};
export const checkMotionMediaTools = async (signal?: AbortSignal): Promise<void> => {
  for (const binary of [getFfmpegPath(), getFfprobePath()]) await execute(binary, [V.VERSION], { windowsHide: true, signal, maxBuffer: V.MAX_BUFFER });
};
export const assertMotionSpeechAudio = async (file: string, seconds: number, signal?: AbortSignal): Promise<void> => {
  const probe = await probeMotionMedia(file, signal);
  if (!probe.streams.some((stream) => stream.codec_type === V.AUDIO) || !Number.isFinite(probe.duration) || probe.duration < seconds - V.AUDIO_TOLERANCE) throw new Error(P.AUDIO_TOO_SHORT);
};
