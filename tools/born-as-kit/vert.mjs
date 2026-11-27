export const VERT = process.env.BORN_VERT === "1";
export const VIEW = { l: 656, r: 1264, t: 0, b: 1080, k: 1920 / 1080 };
export const SAFE = VERT ? { l: 690, r: 1186, t: 190, b: 830 } : { l: 30, r: 1890, t: 30, b: 1050 };
export const TAG_AT = VERT ? { tl: [960, 250], tr: [960, 250], bl: [960, 760] } : { tl: [330, 140], tr: [1570, 140] };
export const VERT_S = 1.4;
