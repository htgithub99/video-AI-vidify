export const MOTION_REMOTION_RENDER = {
  // Segments end at scene boundaries, at least SEGMENT_MIN_SECONDS long (short scenes are joined) and at most
  // SEGMENT_MAX_SECONDS (a long scene is split evenly), so the export lanes share the work evenly.
  SEGMENT_MIN_SECONDS: 6,
  SEGMENT_MAX_SECONDS: 10,
  SEGMENT_VERSION: 5,
  // HTML scenes: frames of exports at CRF >= JPEG_MIN_CRF (draft, standard) leave the page as JPEG (about 7x faster to
  // encode than PNG, invisible after x264); finer exports stay lossless PNG.
  JPEG_MIN_CRF: 18,
  JPEG_QUALITY: 0.95,
  MJPEG: "mjpeg",
  // A frame smaller than this many bytes per pixel is one flat colour (the page lost its canvas).
  BLANK_BYTES_PER_PIXEL: { png: 0.008, jpeg: 0.009 },
  SEGMENT_FOLDER: "remotion-segments",
  SEGMENT_FILE: (key: string) => `${key}.mp4`,
  SEGMENT_MAX_AGE_MS: 14 * 24 * 60 * 60 * 1000,
  WORKERS_PER_LANE: 2,
  MAX_LANES: 4,
  // The background render while the editor is open: a light load (two pages), stopped as soon as the export starts.
  PRERENDER_LANES: 2,
  PRERENDER_THREADS: 1,
  PRERENDERED: (_id: string) => "Xuất video: đã render sẵn thêm một đoạn trong lúc dựng cảnh.",
  PRERENDER_SKIPPED: (reason: string) => `Xuất video: bỏ qua render sẵn (${reason}); sẽ render khi xuất.`,
  SEGMENTS: (total: number, cached: number, lanes: number, perLane: number) => `Xuất video: ${total} đoạn theo cảnh · dùng lại ${cached} đoạn đã render · render ${total - cached} đoạn bằng ${lanes} luồng song song${perLane > 1 ? ` × ${perLane}` : ""}.`,
  MAX_WORKERS: 8,
  RESERVED_CPUS: 1,
  BYTES_PER_WORKER: 805306368,
  GL: "angle",
  X264_PRESET: "veryfast",
  PROGRESS_STEP: 10,
  START: (frames: number) => `Xuất video: ${frames} khung hình · mã hóa CPU libx264.`,
  TOOK_OVER: "Xuất video: dừng bản render nền để render bằng mọi luồng của máy (các đoạn nền đã xong được dùng lại).",
  GL_FALLBACK: "Remotion: không mở được Chrome với GPU (angle), chuyển sang render phần mềm.",
  SEGMENT_DONE: (index: number, frames: number, seconds: number) => `Xuất video: xong đoạn ${index} (${frames} khung) sau ${seconds.toFixed(1)} giây.`,
  PROGRESS: (percent: number, fps: number) => `Remotion: ${percent}% · ${fps.toFixed(1)} fps render.`,
  COMPLETE: (seconds: number) => `Remotion đã dựng hình trong ${seconds.toFixed(1)} giây; đang kiểm video và ghép âm thanh.`,
} as const;
