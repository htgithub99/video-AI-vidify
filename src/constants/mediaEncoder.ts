export type MediaEncoderPreference = "auto" | "gpu" | "cpu";
export type MediaCodec = "h264" | "hevc";
export const MEDIA_ENCODER = {
  GPU: { h264: ["h264_nvenc", "h264_qsv", "h264_amf"], hevc: ["hevc_nvenc", "hevc_qsv", "hevc_amf"] } as Record<MediaCodec, string[]>,
  CPU: { h264: "libx264", hevc: "libx265" } as Record<MediaCodec, string>,
  PROBE: ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=0.2", "-frames:v", "3"],
  NVENC_PRESET: "p5",
  X265_CRF_OFFSET: 4,
  HEVC_TAG: "hvc1",
  GOP_SECONDS: 2,
  GPU_SESSIONS: 3,
  DEFAULT_FPS: 30,
  SHORTS_LANES: { GPU: 3, CPU: 2 },
  FORCED_IDR: ["libx264", "libx265", "h264_nvenc", "hevc_nvenc"] as string[],
} as const;
export const VOICE_LANES = { AI33: 3, VIENEU: 8, SEGMENTS: 3 } as const;
export const HEAVY_JOB = { RENDER: "render", VOICE: "voice", SLOTS: { render: 1, voice: 1 } as Record<string, number> } as const;
export const HEAVY_JOB_TEXT = {
  WAIT: (kind: string, holder: string): string => (kind === "voice" ? `Đang chờ việc tạo giọng khác xong: ${holder}` : `Đang chờ việc xuất video khác xong (${holder}) để không tranh CPU/GPU`),
  START: (label: string, waitedSeconds: number): string => `Bắt đầu ${label}${waitedSeconds >= 1 ? ` (đã chờ ${Math.round(waitedSeconds)} giây)` : ""}`,
  SCREEN: { REUP: "Reup", EXPORT: "Xuất Video", SHORTS: "Tạo Shorts", VIDEO: "Tạo video", MOTION: "Video Motion" },
  LABEL: (screen: string, name: string): string => `${screen} · ${name}`,
  ENCODER: (encoder: string): string => `Bộ mã hoá video: ${encoder}`,
  GPU_FALLBACK: (encoder: string): string => `GPU (${encoder}) lỗi, dựng lại bằng CPU`,
  STEP: (label: string, seconds: number, mediaSeconds?: number): string => `${label}: ${seconds.toFixed(1)} giây${mediaSeconds ? ` · ${(mediaSeconds / Math.max(seconds, 0.1)).toFixed(1)}× thời gian thực` : ""}`,
} as const;
