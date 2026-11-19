import { spawn } from "child_process";
import _ from "lodash";
import { getFfmpegPath } from "../services/shortsPreprocessService.js";
import { MEDIA_ENCODER, type MediaCodec, type MediaEncoderPreference } from "../../constants/mediaEncoder.js";
let detected: Promise<string[]> | undefined;
const probe = (encoder: string): Promise<boolean> =>
  new Promise((resolve) => {
    const child = spawn(getFfmpegPath(), [...MEDIA_ENCODER.PROBE, "-c:v", encoder, "-f", "null", "-"], { windowsHide: true });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
export const detectMediaEncoders = (): Promise<string[]> => {
  detected ||= (async () => {
    const found: string[] = [];
    for (const encoder of [...MEDIA_ENCODER.GPU.h264, ...MEDIA_ENCODER.GPU.hevc, MEDIA_ENCODER.CPU.h264, MEDIA_ENCODER.CPU.hevc]) if (await probe(encoder)) found.push(encoder);
    return found;
  })();
  return detected;
};
export const isGpuEncoder = (encoder: string): boolean => encoder !== MEDIA_ENCODER.CPU.h264 && encoder !== MEDIA_ENCODER.CPU.hevc;
export const pickMediaEncoder = async (preference: MediaEncoderPreference = "auto", codec: MediaCodec = "h264"): Promise<string> => {
  const cpu = MEDIA_ENCODER.CPU[codec];
  if (preference === "cpu") return cpu;
  const available = await detectMediaEncoders();
  return _.find(MEDIA_ENCODER.GPU[codec], (encoder) => available.includes(encoder)) || (available.includes(cpu) ? cpu : MEDIA_ENCODER.CPU.h264);
};
export const cpuEncoderOf = (encoder: string): string => (encoder.startsWith("hevc") || encoder === MEDIA_ENCODER.CPU.hevc ? MEDIA_ENCODER.CPU.hevc : MEDIA_ENCODER.CPU.h264);
export const mediaEncodeArgs = (encoder: string, opts: { crf: number; fps: number; preset?: string; bitrate?: string }): string[] => {
  if (opts.bitrate) return bitrateArgs(encoder, opts.bitrate, opts.fps, opts.preset);
  const gop = ["-g", String(Math.round(opts.fps * MEDIA_ENCODER.GOP_SECONDS))];
  const hevcTag = encoder.startsWith("hevc") || encoder === MEDIA_ENCODER.CPU.hevc ? ["-tag:v", MEDIA_ENCODER.HEVC_TAG] : [];
  if (encoder.endsWith("_nvenc")) return ["-c:v", encoder, "-preset", MEDIA_ENCODER.NVENC_PRESET, "-tune", "hq", "-rc", "vbr", "-cq", String(opts.crf), "-b:v", "0", ...gop, "-pix_fmt", "yuv420p", ...hevcTag];
  if (encoder.endsWith("_qsv")) return ["-c:v", encoder, "-global_quality", String(opts.crf), "-preset", "medium", ...gop, "-pix_fmt", "nv12", ...hevcTag];
  if (encoder.endsWith("_amf")) return ["-c:v", encoder, "-rc", "cqp", "-qp_i", String(opts.crf), "-qp_p", String(opts.crf + 2), "-quality", "balanced", ...gop, "-pix_fmt", "yuv420p", ...hevcTag];
  if (encoder === MEDIA_ENCODER.CPU.hevc) return ["-c:v", encoder, "-preset", opts.preset || "fast", "-crf", String(opts.crf + MEDIA_ENCODER.X265_CRF_OFFSET), ...gop, "-pix_fmt", "yuv420p", ...hevcTag];
  return ["-c:v", MEDIA_ENCODER.CPU.h264, "-preset", opts.preset || "veryfast", "-crf", String(opts.crf), ...gop, "-pix_fmt", "yuv420p"];
};
const bitrateArgs = (encoder: string, bitrate: string, fps: number, preset?: string): string[] => {
  const tail = ["-g", String(Math.round(fps * MEDIA_ENCODER.GOP_SECONDS)), "-pix_fmt", encoder.endsWith("_qsv") ? "nv12" : "yuv420p", ...(encoder.startsWith("hevc") || encoder === MEDIA_ENCODER.CPU.hevc ? ["-tag:v", MEDIA_ENCODER.HEVC_TAG] : [])];
  if (encoder.endsWith("_nvenc")) return ["-c:v", encoder, "-preset", MEDIA_ENCODER.NVENC_PRESET, "-tune", "hq", "-rc", "vbr", "-b:v", bitrate, ...tail];
  if (encoder.endsWith("_qsv")) return ["-c:v", encoder, "-preset", "medium", "-b:v", bitrate, ...tail];
  if (encoder.endsWith("_amf")) return ["-c:v", encoder, "-rc", "vbr_peak", "-quality", "balanced", "-b:v", bitrate, ...tail];
  if (encoder === MEDIA_ENCODER.CPU.hevc) return ["-c:v", encoder, "-preset", preset || "fast", "-b:v", bitrate, ...tail];
  return ["-c:v", MEDIA_ENCODER.CPU.h264, "-b:v", bitrate, "-preset", preset || "veryfast", "-profile:v", "high", "-level", "4.1", ...tail];
};
export const withEncoderFallback = async <T>(encoder: string, run: (encoder: string) => Promise<T>, onFallback?: (encoder: string) => void, signal?: AbortSignal): Promise<T> => {
  try {
    return await run(encoder);
  } catch (error) {
    if (!isGpuEncoder(encoder) || signal?.aborted) throw error;
    onFallback?.(encoder);
    return run(cpuEncoderOf(encoder));
  }
};
