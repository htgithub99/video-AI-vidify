export const MOTION_REMOTION_RENDER = {
  /** Scene-aligned segment length for cached, parallel rendering. */
  SEGMENT_SECONDS: 20,
  SEGMENT_VERSION: 1,
  SEGMENT_FOLDER: "remotion-segments",
  SEGMENT_FILE: (key: string) => `${key}.mp4`,
  SEGMENT_MAX_AGE_MS: 14 * 24 * 60 * 60 * 1000,
  /**
   * Measured: one 7-thread render ran ~3.5 fps while one 1-thread render ran ~5.2 fps on the same scene, so
   * several independent lanes with few threads each beat one wide render. Lane count still respects CPU/RAM.
   */
  WORKERS_PER_LANE: 2,
  MAX_LANES: 4,
  /** Threads for the background pre-render that runs while Chrome rooms are still drawing. */
  PRERENDER_THREADS: 2,
  PRERENDERED: (_id: string) => "Xuất video: đã render sẵn thêm một đoạn trong lúc dựng cảnh.",
  PRERENDER_SKIPPED: (reason: string) => `Xuất video: bỏ qua render sẵn (${reason}); sẽ render khi xuất.`,
  SEGMENTS: (total: number, cached: number, lanes: number, perLane: number) => `Remotion: ${total} đoạn theo cảnh · dùng lại ${cached} đoạn đã render · ${lanes} tiến trình × ${perLane} luồng.`,
  MAX_WORKERS: 8, RESERVED_CPUS: 1, BYTES_PER_WORKER: 805306368, GL: "angle", PROGRESS_STEP: 10, START: (workers: number, frames: number) => `Remotion: ${workers} luồng render thực tế · ${frames} frame · mã hóa CPU libx264.`, GL_FALLBACK: "Remotion: không mở được Chrome với GPU (angle), chuyển sang render phần mềm.", PROGRESS: (percent: number, fps: number) => `Remotion: ${percent}% · ${fps.toFixed(1)} fps render.`, COMPLETE: (seconds: number) => `Remotion đã dựng hình trong ${seconds.toFixed(1)} giây; đang kiểm video và ghép âm thanh.` } as const;
