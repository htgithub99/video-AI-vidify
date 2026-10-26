export const STAGE_QA = {
  SCREENSHOT: "scratch/motion-stage-constraints-20261026.png",
  HTML: '<html><body style="margin:8px;background:#222;color:white;font:16px sans-serif;display:grid;grid-template-columns:repeat(2,960px);gap:12px"></body></html>',
  HOOK: "ME.PUPPET2D = { init,",
  EXPOSE: "ME.testDrawStage = drawStage; ME.PUPPET2D = { init,",
  UNKNOWN: "missing_fixture_not_in_library",
  PASSED: "Stage constraints passed: saved failed courtyard scenes, two packs, actual gate/door/table assembly, spatial feasibility before selection, floor/support distinction, rejected nonexistent anchors, immutable library and local image previews. No AI, TTS or video.\n",
} as const;
