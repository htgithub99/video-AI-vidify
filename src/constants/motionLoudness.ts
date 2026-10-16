export const MOTION_LOUDNESS = {
  TARGET_LUFS: -14,
  TRUE_PEAK: -1,
  RANGE: 11,
  JSON_RE: /\{[^{}]*"input_i"[^{}]*\}/,
  EBUR_RE: /I:\s*(-?[\d.]+)\s*LUFS/g,
  BLACK_RE: /black_start:/g,
  SILENCE_RE: /silence_start:/g,
  BLACK_FILTER: "blackdetect=d=1:pix_th=0.1",
  SILENCE_FILTER: "silencedetect=noise=-50dB:d=4",
  EBUR_FILTER: "ebur128",
  NULL_FORMAT: "null",
  NULL_TARGET: "-",
  CHAIN: ",",
  LOG: {
    NORMALIZED: (lufs: number): string => `Đã chuẩn hoá âm lượng về ${lufs} LUFS`,
    LOUDNESS: (lufs: string): string => `Độ to video: ${lufs} LUFS`,
    BLACK: (count: number): string => `Cảnh báo: phát hiện ${count} đoạn hình đen ≥ 1 giây`,
    SILENCE: (count: number): string => `Cảnh báo: phát hiện ${count} đoạn im lặng ≥ 4 giây`,
    SKIPPED: "Bỏ qua chuẩn hoá âm lượng (không đo được)",
  },
} as const;
export const motionLoudnormFilter = (measured?: Record<string, string>): string => {
  const base = `loudnorm=I=${MOTION_LOUDNESS.TARGET_LUFS}:TP=${MOTION_LOUDNESS.TRUE_PEAK}:LRA=${MOTION_LOUDNESS.RANGE}`;
  if (!measured) return `${base}:print_format=json`;
  return `${base}:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true:print_format=summary`;
};
