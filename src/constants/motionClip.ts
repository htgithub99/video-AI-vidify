export const MOTION_CLIP = {
  OPS: ["swing", "bob", "spin", "travel", "scroll", "flow", "emit", "pulse", "shake", "reveal", "follow"] as const,
  RIGGED_OPS: ["swing", "spin", "pulse", "travel", "scroll", "flow"] as readonly string[],
  EFFECT_OPS: ["flow", "emit"] as readonly string[],
  SIDES: ["top", "bottom", "left", "right", "center"] as const,
  LEVELS: ["small", "medium", "large"] as const,
  SPEEDS: ["slow", "medium", "fast"] as const,
  PARTICLES: ["dust", "splash", "spark", "leaf", "smoke"] as const,
  DIRS: ["left", "right", "up", "down", "back", "cw", "ccw"] as const,
  TEMPERAMENTS: ["calm", "lively", "tense"] as const,
  MAX_CLIPS: 24,
  MAX_CYCLE: 10,
  TRAVEL_SECONDS: 5,
  /** Allowed travel endpoints, as canvas fractions (off-screen entries allowed). */
  PATH_RANGE: [-0.6, 1.6] as const,
  /** Degrees for swing amounts. */
  SWING: { small: 6, medium: 14, large: 26 },
  /** Fraction of canvas height. */
  BOB: { small: 0.005, medium: 0.011, large: 0.02 },
  /** Fraction of canvas width per second. */
  SPEED: { slow: 0.06, medium: 0.16, fast: 0.34 },
  /** Degrees per second. */
  SPIN: { slow: 40, medium: 110, fast: 260 },
  SHAKE: { small: 0.002, medium: 0.005, large: 0.01 },
  PULSE: { small: 0.03, medium: 0.07, large: 0.14 },
  DENSITY: { small: 10, medium: 22, large: 40 },
  TEMPERAMENT: { calm: 0.7, lively: 1, tense: 0.85 },
  CYCLE: 1,
  RAMP: 0.6,
  /** Sampling step for clip frames (seconds); every 30/60 fps frame lands exactly on it. */
  FRAME_STEP: 1 / 60,
  FRAME_CACHE: 96,
  /** A scroll layer holds two identical copies one canvas width apart, so it spans at least this many canvas widths. */
  SCROLL_MIN_WIDTH: 1.9,
  PARTICLE: {
    dust: { color: "#d9c69c", life: 1, from: 0.006, to: 0.034, rise: 0.04, drift: 0.05, gravity: 0, opacity: 0.55 },
    splash: { color: "#e8f7ff", life: 0.6, from: 0.003, to: 0.008, rise: 0.16, drift: 0.04, gravity: 0.5, opacity: 0.85 },
    spark: { color: "#ffd25a", life: 0.5, from: 0.002, to: 0.004, rise: 0.12, drift: 0.08, gravity: 0.3, opacity: 1 },
    leaf: { color: "#7fae3c", life: 2.4, from: 0.004, to: 0.006, rise: -0.03, drift: 0.08, gravity: 0, opacity: 0.9 },
    smoke: { color: "#9a9a9a", life: 2, from: 0.008, to: 0.05, rise: 0.06, drift: 0.02, gravity: 0, opacity: 0.4 },
  },
  ISSUE: {
    OP: (index: number, op: string) => `clip ${index}: thao tác "${op}" không được hỗ trợ.`,
    TARGET: (index: number, id: string) => `clip ${index}: không có nhóm SVG "${id}".`,
    RIG: (index: number, id: string) => `clip ${index}: "${id}" chưa có trong rig (cần khung/khớp để xoay hoặc neo).`,
    COUPLE: (index: number, id: string) => `clip ${index}: couple "${id}" không trỏ tới clip travel nào.`,
    PHASE: (index: number) => `clip ${index}: số phase phải bằng số phần tử trong group.`,
    SCROLL: (index: number, id: string) => `clip ${index}: "${id}" không phải lớp cuộn được (cần hai bản giống nhau cách đúng một bề rộng khung); dùng travel path cho chủ thể thay vì cuộn nền.`,
    COUNT: (count: number, max: number) => `có ${count} clip; tối đa ${max} clip mỗi cảnh, giữ chuyển động chính và bỏ phụ.`,
    RANGE: (index: number, field: string) => `clip ${index}: giá trị "${field}" nằm ngoài phạm vi cho phép.`,
    ENUM: (index: number, field: string) => `clip ${index}: "${field}" không thuộc danh sách cho phép.`,
    PARENT: (index: number, id: string) => `clip ${index}: follow thiếu parent hợp lệ "${id}".`,
    ANCHOR: (index: number, at: string) => `clip ${index}: điểm neo emit "${at}" không hợp lệ.`,
    PATH: (index: number) => `clip ${index}: travel path cần from/to.`,
  },
} as const;
