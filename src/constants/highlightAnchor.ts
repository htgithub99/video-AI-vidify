export type HighlightAnchor = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";
export const HIGHLIGHT_ANCHORS: HighlightAnchor[] = ["bl", "br", "tl", "tr", "ml", "mr", "bc", "tc", "mc"];
export const HIGHLIGHT_ANCHOR_WEIGHT: Record<HighlightAnchor, number> = { bl: 4, br: 4, tl: 4, tr: 4, ml: 3, mr: 3, bc: 2, tc: 2, mc: 1 };
export const HIGHLIGHT_ANCHOR_ASS: Record<HighlightAnchor, number> = { bl: 1, bc: 2, br: 3, ml: 4, mc: 5, mr: 6, tl: 7, tc: 8, tr: 9 };
export const HIGHLIGHT_SIDE = { LEFT: 0.42, RIGHT: 0.58 } as const;
