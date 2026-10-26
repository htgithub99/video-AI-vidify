export const MOTION_EFFECTS = {
  VERSION: 1,
  HUMAN_GHOST_VERSION: 1,
  SMOKE: "smoke",
  STEAM: "steam",
  ODOR: "odor",
  KINDS: ["smoke", "steam", "odor"] as string[],
  SMOKE_RE: /(^|_)(incense|joss|censer|candle|torch|fire|stove|hearth|cigarette|cigar|pipe|bonfire|brazier)(_|$)/i,
  STEAM_RE: /(^|_)(pot|kettle|teapot|tea|cup|bowl|rice|soup|porridge)(_|$)/i,
  READ: "effectSource: the exact visible object key or cast key from which smoke, steam or a specifically illustrated odor rises. Use odor only when the sentence explicitly describes visible vapor from a named source; a smell alone does not need drawn wisps. A smell must never become incense smoke. Use null if the source is not shown. Never attach an effect to an unrelated altar or light.",
  PROP: "For a prop that can emit smoke or steam, include emitter:[x,y] in the SVG coordinate system at the actual incense/cigarette tip, flame, kettle spout or opening of the pot. Do not put it at the generic bounding box edge. Keep it on the visible drawn source.",
  GHOST: "An apparition uses an ordinary complete human character matching that person, with normal face, hair, clothes, colors and feet. No sheet costume, monster face, tapered body, aura or painted smoke. The renderer adds gentle transparency. If the same person also has a living cast entry, set appearanceOf to that cast key so the exact same asset is reused.",
} as const;
