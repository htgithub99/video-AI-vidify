import { STUDIO_RUNTIME as XRT } from "../constants/studioRuntime.js";
import * as SRT from "../constants/sourceText.js";
export const normalizeMotionAnalysisResponse = (value: any): any => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const dna = value.videoDna;
  if (!dna || typeof dna !== "object" || Array.isArray(dna)) return value;
  const restored: Record<string, unknown> = {};
  for (const key of [SRT.SOURCE_TEXT_CHAPTERS, XRT.CAST, XRT.PLACES, XRT.FACTS, XRT.LOOK, XRT.ACCENT, XRT.SFX_MOOD]) if (value[key] === undefined && dna[key] !== undefined) restored[key] = dna[key];
  const palette = dna.visualDna?.palette;
  const paletteText = Array.isArray(palette) && palette.length > 0 && palette.every((item: unknown) => typeof item === "string" && item.trim().length > 0) ? palette.map((item: string) => item.trim()).join(SRT.SOURCE_TEXT_SYMBOL_10) : palette;
  return { ...value, ...restored, videoDna: { ...dna, ...(dna.visualDna ? { visualDna: { ...dna.visualDna, palette: paletteText } } : {}) } };
};
