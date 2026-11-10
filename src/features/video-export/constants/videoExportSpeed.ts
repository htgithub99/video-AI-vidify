export const VIDEO_EXPORT_SPEED = {
  THREADS: "-threads",
  FORCE_KEY_FRAMES: "-force_key_frames",
  FORCED_IDR: "-forced-idr",
  FLAG_ON: "1",
  SEEK: "-ss",
  FRAMES_V: "-frames:v",
  FILTER_OUTPUT: "[v]",
  BODY_PREFIX: "body_",
  TRANSITION_PREFIX: "trans_",
  PIECES_FILE_NAME: "pieces.txt",
  BASE_PIXELS: 1920 * 1080,
  SEEK_BACK_FRAMES: 0.5,
  KEYFRAMES: (first: number, second: number) => `expr:eq(n,${first})+eq(n,${second})`,
  TRANSITION_FILTER: (frames: number, fps: number, pixelFormat: string, transition: string, seconds: string) =>
    `[0:v]trim=end_frame=${frames},setpts=PTS-STARTPTS,settb=AVTB,fps=${fps},format=${pixelFormat}[a];[1:v]trim=end_frame=${frames},setpts=PTS-STARTPTS,settb=AVTB,fps=${fps},format=${pixelFormat}[b];[a][b]xfade=transition=${transition}:duration=${seconds}:offset=0,trim=end_frame=${frames}[v]`,
  LANES_LOG: (lanes: number, threads: number, segments: number) => `[VIDEO_EXPORT] ${segments} segments on ${lanes} parallel lanes x ${threads} threads`,
  MSG_TRANSITIONS: (current: number, total: number) => `Đang dựng chuyển cảnh ${current}/${total}...`,
} as const;
