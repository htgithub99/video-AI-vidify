export const MOTION_GENRE_GRAMMAR = {
  SAMPLE: " PICTURE SAMPLE (self-made, shows only the fields and their relation to the sentence; never reuse its content): ",
  OPENING: (kinds: string, maxBeats: number): string => ` OPENING OF THE VIDEO: the first beats are ${kinds}; the opening takes at most about ${maxBeats} beats before the first event.`,
  CLOSING: (kinds: string, maxBeats: number): string => ` CLOSING OF THE VIDEO: the last beats are ${kinds}, within about ${maxBeats} beats.`,
  HOOKS: ' Beats that open or close a chapter\'s loop carry hook: "open" or "close".',
  FRAMES: (frames: readonly string[]): string => ` Every beat carries frame, one of ${frames.map((frame) => `"${frame}"`).join(", ")}.`,
  SHOTS: (shots: readonly string[], visuals: readonly string[]): string =>
    ` shot is one of ${shots.map((shot) => `"${shot}"`).join(", ")} (close: one face down to the belt; medium_close: one or two people almost whole with face, hands and gesture readable; medium: one to three people whole in their setting); visual is one of ${visuals.map((visual) => `"${visual}"`).join(", ")} ("scene" by default).`,
} as const;
