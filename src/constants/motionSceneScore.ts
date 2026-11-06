/** Local, deterministic scoring of one AI scene response. No AI call, no artwork changes. */
export const MOTION_SCENE_SCORE = {
  REVISION: 1,
  /** Content request budget per scene: first draw + at most 2 rewrites. */
  ATTEMPTS: 3,
  THRESHOLD: 80,
  WEIGHTS: { coverage: 30, parts: 25, frame: 20, duration: 10, identity: 10, stillness: 5 },
  /** Fraction of the scene that the longest moving track should span. */
  DURATION_COVER: 0.8,
  /** A box may overflow the canvas by this fraction of its own size before it counts as out of frame. */
  FRAME_TOLERANCE: 0.15,
  /** Translation (in SVG units, relative to canvas) above which a "still" subject counts as moving. */
  STILL_LIMIT: 0.04,
  STILL_WORDS: /\b(?:still|static|motionless|stands? still|remains? (?:still|seated|standing)|holds? (?:still|position)|does not move|no movement|unmoving|đứng yên|bất động|giữ yên)\b/i,
  ISSUE: {
    COVERAGE: (ids: string[]) => `actionPlan subjects without any animation track on their layer or child parts: ${ids.join(", ")}. Animate each listed subject as written.`,
    PARTS: (ids: string[]) => `subjects whose actionPlan lists moving parts but only the whole group moves: ${ids.join(", ")}. Give each described part its own animated child group (limbs, legs, wheels, weapon arm) inside the subject.`,
    FRAME: (ids: string[]) => `layers outside the ${"viewBox"} at start/middle/end: ${ids.join(", ")}. Keep the full subject inside the canvas for the whole scene.`,
    DURATION: (seconds: number, covered: number) => `motion ends at ${covered.toFixed(1)}s of a ${seconds.toFixed(1)}s scene. Spread the authored phases across the whole scene duration.`,
    IDENTITY: (ids: string[]) => `character layers missing or with wrong entityId: ${ids.join(", ")}. Each cast node needs its own character layer with the exact entityId.`,
    STILL: (ids: string[]) => `subjects the actionPlan keeps still are moving: ${ids.join(", ")}. Keep them still.`,
  },
  REWRITE: (issues: string[], score: number) =>
    `REVISION REQUEST: a previous answer for this exact scene scored ${score}/100 on the local checklist. Draw the scene above again and fix these problems; return the COMPLETE JSON object (svg, layers, animations, design, continuityNotes) — keep the brief's artwork, identities and actions:\n- ${issues.join("\n- ")}`,
  FRESH: (issues: string[]) => `A previous attempt for this scene had these problems; avoid them in this fresh drawing:\n- ${issues.join("\n- ")}`,
  CHECKLIST:
    "SELF-CHECK BEFORE ANSWERING: (1) every actionPlan subject has animation tracks on its own layer or child parts; (2) each part the plan says moves has its own animated child group — never only translate the whole subject; (3) every subject stays fully inside the viewBox at start, middle and end; (4) the authored phases span the whole scene duration; (5) each cast node is its own character layer with the exact entityId; (6) subjects the plan keeps still do not move.",
  LOG_SCORE: (index: number, total: number, attempt: number, score: number) => `Cảnh Remotion ${index}/${total}: lượt ${attempt} đạt ${score}/100 điểm kiểm tra.`,
  LOG_RETRY: (index: number, total: number, attempt: number, score: number, mode: string) => `Cảnh Remotion ${index}/${total}: lượt ${attempt} đạt ${score}/100, chưa đủ ngưỡng — ${mode}.`,
  LOG_KEEP_BEST: (index: number, total: number, score: number, attempts: number) => `Cảnh Remotion ${index}/${total}: hết ${attempts} lượt, giữ bản tốt nhất ${score}/100 (có cảnh báo).`,
  MODE_REWRITE: "AI sửa theo danh sách lỗi",
  MODE_FRESH: "AI vẽ lại sạch",
} as const;
