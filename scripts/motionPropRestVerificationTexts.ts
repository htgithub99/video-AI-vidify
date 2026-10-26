export const PROP_REST_QA = {
  HOOK: "ME.PUPPET2D = { init,",
  EXPOSE: "ME.testDrawProp = drawProp; ME.PUPPET2D = { init,",
  HTML: '<html><body style="background:#ddd;font:18px sans-serif;display:grid;grid-template-columns:repeat(3,420px);gap:12px"></body></html>',
  SCREENSHOT: "scratch/motion-prop-rest-20261026.png",
  PASSED: "Prop orientation passed: both live packs, exact saved failed object, existing artwork, preserved identity, 90/180 degree ground contact, unchanged held props and rejection of unsupported traits.\n",
  WIDTH: 420,
  HEIGHT: 340,
  X: 210,
  BASE: 300,
  SIZE: 256,
} as const;
