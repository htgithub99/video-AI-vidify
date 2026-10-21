import { motionStylePreset } from "./motionStylePresets.js";
export interface MotionStyleFinish {
  pixel?: number;
  palette?: string[];
  paletteMix?: number;
  dither?: "none" | "bayer" | "noise";
  ditherAmount?: number;
  posterize?: number;
  edges?: { color?: string; strength?: number; width?: number };
  paper?: { kind: "rice" | "wood" | "kraft" | "canvas" | "news" | "board" | "grid" | "film" | "plastic"; strength: number; color?: string };
  halftone?: { size?: number; strength: number; angle?: number; ink?: string; paper?: string };
  misregister?: number;
  bleed?: number;
  blurRadius?: number;
  boil?: number;
  mono?: { kind: "gray" | "sepia" | "duo"; dark?: string; light?: string };
  film?: { flicker?: number; scratches?: number };
  grain?: number;
  glow?: number;
  chroma?: number;
  scanlines?: number;
  tiltShift?: number;
  darkness?: { amount: number; torch?: number };
  lineArt?: { kind: "chalk" | "blueprint"; background?: string; color?: string; fill?: number };
  saturation?: number;
  contrast?: number;
  tint?: { color: string; amount: number };
  vignette?: number;
  levels?: [number, number];
  stepFps?: number;
  transition?: string;
  fonts?: { head?: string; serif?: string; body?: string };
  material?: "clay" | "wood" | "cardboard" | "plastic" | "lowpoly";
  music?: string;
  ambience?: string;
}
const stack = (family: string, fallback: string): string => `'${family}', ${fallback}`;
const SANS = "'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";
export const MOTION_STYLE_FONTS = {
  PIXEL: stack("VT323", SANS),
  HAND: stack("Patrick Hand", SANS),
  KIDS: stack("Pangolin", SANS),
  COMIC: stack("Bangers", SANS),
  OLD_PRINT: stack("Old Standard TT", SERIF),
  STENCIL: stack("Saira Stencil One", SANS),
  MONO: stack("Space Mono", SANS),
  BRUSH: stack("Dancing Script", SERIF),
  GOTHIC: stack("Grenze Gotisch", SERIF),
  CLASSIC: stack("Cormorant Garamond", SERIF),
  ROUND: stack("Itim", SANS),
  PLAYFUL: stack("Playpen Sans", SANS),
  CONDENSED: stack("Barlow Condensed", SANS),
  RETRO: stack("Lobster", SERIF),
  SOFT: stack("Mali", SANS),
  TECH: stack("Chakra Petch", SANS),
  BLOCK: stack("Bungee", SANS),
  DISPLAY: stack("Noto Serif Display", SERIF),
  CINEMA: SERIF,
} as const;
const FONT_WEIGHTS: Record<string, number> = { VT323: 400, "Patrick Hand": 400, Pangolin: 400, Bangers: 400, "Old Standard TT": 700, "Saira Stencil One": 400, "Space Mono": 700, "Dancing Script": 700, "Grenze Gotisch": 700, "Cormorant Garamond": 700, Itim: 400, "Playpen Sans": 700, "Barlow Condensed": 700, Lobster: 400, Mali: 700, "Chakra Petch": 700, Bungee: 400, "Noto Serif Display": 700 };
export const MOTION_STYLE_FONT_FAMILIES = Object.keys(FONT_WEIGHTS);
export const MOTION_STYLE_FONT_PROBES = MOTION_STYLE_FONT_FAMILIES.map((family) => `${FONT_WEIGHTS[family]} 24px '${family}'`);
const F = MOTION_STYLE_FONTS;
const PALETTE = true;
type Recipe = Omit<MotionStyleFinish, "palette"> & { palette?: string[] | typeof PALETTE };
const RECIPES: Record<string, Recipe> = {
  ink_wash: { paper: { kind: "rice", strength: 0.9, color: "#f1ead8" }, bleed: 0.85, blurRadius: 7, edges: { color: "#2b2620", strength: 0.65, width: 1.6 }, posterize: 3, saturation: 0.4, palette: PALETTE, paletteMix: 0.3, vignette: 0.25, transition: "ink", fonts: { head: F.BRUSH, serif: F.BRUSH }, music: "pentatonic", ambience: "paper" },
  woodblock: { posterize: 2, edges: { color: "#1a1a1a", strength: 0.9, width: 2.2 }, palette: PALETTE, paletteMix: 0.7, misregister: 3, paper: { kind: "wood", strength: 0.5, color: "#efe2c4" }, transition: "tear", fonts: { head: F.DISPLAY, serif: F.DISPLAY }, music: "pentatonic", ambience: "paper" },
  lacquer: { posterize: 3, glow: 0.5, blurRadius: 8, palette: PALETTE, paletteMix: 0.4, contrast: 1.15, saturation: 1.2, vignette: 0.6, paper: { kind: "plastic", strength: 0.4, color: "#1a0f0a" }, fonts: { head: F.CLASSIC, serif: F.CLASSIC }, music: "pentatonic" },
  paper_cut: { posterize: 3, edges: { color: "#000000", strength: 0.35, width: 3 }, paper: { kind: "rice", strength: 0.35, color: "#f4ecd8" }, palette: PALETTE, paletteMix: 0.5, stepFps: 12, transition: "push", fonts: { head: F.ROUND }, music: "musicbox", ambience: "paper" },
  watercolor_book: { bleed: 1, blurRadius: 8, edges: { color: "#3a3a3a", strength: 0.45, width: 1.2 }, paper: { kind: "canvas", strength: 0.5, color: "#fbf6ea" }, saturation: 0.9, palette: PALETTE, paletteMix: 0.2, transition: "ink", fonts: { head: F.PLAYFUL }, music: "piano" },
  gouache_poster: { posterize: 3, paper: { kind: "canvas", strength: 0.35, color: "#f3ead6" }, palette: PALETTE, paletteMix: 0.5, saturation: 1.1, edges: { color: "#222222", strength: 0.3, width: 1.5 }, transition: "wipe", fonts: { head: F.CONDENSED }, music: "strings" },
  silent_film: { mono: { kind: "gray" }, levels: [0.02, 0.8], contrast: 1.2, film: { flicker: 0.14, scratches: 0.35 }, grain: 0.09, vignette: 1, stepFps: 18, transition: "iris", fonts: { head: F.OLD_PRINT, serif: F.OLD_PRINT }, music: "ragtime", ambience: "projector" },
  noir_comic: { mono: { kind: "duo", dark: "#0b0b0b", light: "#f0ece0" }, levels: [0.03, 0.7], posterize: 2, halftone: { size: 6, strength: 0.4, ink: "#0b0b0b", paper: "#f0ece0" }, edges: { color: "#0b0b0b", strength: 1, width: 2 }, contrast: 1.3, transition: "wipe", fonts: { head: F.COMIC }, music: "jazz", ambience: "vinyl" },
  anime_80s: { posterize: 3, glow: 0.45, blurRadius: 9, chroma: 1.6, scanlines: 0.35, edges: { color: "#1b1030", strength: 0.55, width: 1.4 }, saturation: 1.15, stepFps: 12, transition: "wipe", fonts: { head: F.RETRO }, music: "synth80s" },
  flat_vector: { posterize: 4, palette: PALETTE, paletteMix: 0.45, transition: "push" },
  chalkboard: { lineArt: { kind: "chalk", background: "#23332b", color: "#f1f1e8", fill: 0.35 }, paper: { kind: "board", strength: 0.6, color: "#2c3f35" }, boil: 1.2, stepFps: 12, transition: "wipe", fonts: { head: F.HAND, serif: F.HAND }, music: "musicbox", ambience: "chalk" },
  pixel_art: { pixel: 5, palette: PALETTE, paletteMix: 1, dither: "bayer", ditherAmount: 0.12, edges: { color: "#1a1c2c", strength: 0.6, width: 1 }, stepFps: 10, transition: "pixelate", fonts: { head: F.PIXEL, serif: F.PIXEL }, music: "chiptune" },
  crayon_kids: { boil: 2, paper: { kind: "canvas", strength: 0.4, color: "#fffaf0" }, edges: { color: "#3d3d3d", strength: 0.7, width: 2 }, posterize: 4, dither: "noise", ditherAmount: 0.08, palette: PALETTE, paletteMix: 0.3, stepFps: 12, transition: "wipe", fonts: { head: F.KIDS, serif: F.KIDS }, music: "musicbox", ambience: "paper" },
  newsprint: { mono: { kind: "sepia", dark: "#2a2218", light: "#ece2c8" }, levels: [0, 0.7], halftone: { size: 5, strength: 0.5, ink: "#1d1a16", paper: "#e8dfc6" }, paper: { kind: "news", strength: 0.6, color: "#e8dfc6" }, misregister: 1.5, grain: 0.05, transition: "push", fonts: { head: F.OLD_PRINT, serif: F.OLD_PRINT }, music: "ragtime", ambience: "vinyl" },
  blueprint: { lineArt: { kind: "blueprint", background: "#1d4e89", color: "#e8f1ff", fill: 0.15 }, paper: { kind: "grid", strength: 0.35, color: "#1d4e89" }, transition: "wipe", fonts: { head: F.MONO, serif: F.MONO }, music: "ambient" },
  propaganda_poster: { levels: [0, 0.8], palette: PALETTE, paletteMix: 0.85, posterize: 2, halftone: { size: 8, strength: 0.35, ink: "#1a1a1a", paper: "#efe3c8" }, edges: { color: "#1a1a1a", strength: 0.9, width: 2.5 }, paper: { kind: "news", strength: 0.35, color: "#efe3c8" }, transition: "push", fonts: { head: F.STENCIL, serif: F.STENCIL }, music: "brass" },
  clay: { material: "clay", stepFps: 12, saturation: 1.05, vignette: 0.2, transition: "push", fonts: { head: F.SOFT }, music: "ukulele" },
  wooden_toy: { material: "wood", stepFps: 12, vignette: 0.2, transition: "push", fonts: { head: F.ROUND }, music: "musicbox" },
  low_poly: { material: "lowpoly", palette: PALETTE, paletteMix: 0.25, fonts: { head: F.TECH }, music: "ambient" },
  diorama: { tiltShift: 0.9, saturation: 1.25, contrast: 1.05, vignette: 0.3, fonts: { head: F.PLAYFUL }, music: "musicbox" },
  cardboard: { material: "cardboard", stepFps: 12, paper: { kind: "kraft", strength: 0.3, color: "#c9a77a" }, transition: "push", fonts: { head: F.HAND }, music: "ukulele", ambience: "paper" },
  toy_plastic: { material: "plastic", saturation: 1.2, stepFps: 15, transition: "push", fonts: { head: F.BLOCK }, music: "playful" },
  cinematic_3d: { grain: 0.03, vignette: 0.35, contrast: 1.05, fonts: { head: F.CINEMA }, music: "strings" },
  night_horror: { darkness: { amount: 0.55, torch: 0.45 }, grain: 0.07, saturation: 0.6, tint: { color: "#6f86a8", amount: 0.25 }, vignette: 0.9, film: { flicker: 0.05 }, transition: "dip", fonts: { head: F.GOTHIC, serif: F.GOTHIC }, music: "drone", ambience: "night" },
};
export const MOTION_STYLE_PREVIEW = {
  VERSION: 2,
  FOLDER: "style-presets",
  EXT: ".jpg",
  WIDTH: 640,
  HEIGHT: 360,
  AT: 1.4,
  LOCATION_TYPE: "house_exterior",
  LOCATION_TIME: "day",
  CAST_TYPES: ["young_man", "young_woman"],
  CAST_NAMES: ["Nam", "Lan"],
  PLACE: "sample",
  BEAT: "sample",
  ACTION: "Nam waves while Lan points",
  SHOT: "wide",
  SUBTITLE: "Phụ đề vẫn sắc nét",
  FILE: (id: string, version: number): string => `${id}-v${version}`,
} as const;
export const motionStyleFinish = (id: unknown): MotionStyleFinish | undefined => {
  const preset = motionStylePreset(id);
  const recipe = preset ? RECIPES[preset.id] : undefined;
  if (!preset || !recipe) return undefined;
  return { ...recipe, palette: recipe.palette === PALETTE ? preset.palette : recipe.palette || undefined } as MotionStyleFinish;
};
