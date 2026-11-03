export interface MotionLanguageProfile {
  code: string;
  label: { vi: string; en: string };
  promptName: string;
  unit: { promptName: string };
  rate: { narration: number; dialogue: number };
  numbers: "spoken" | "keep";
  markers: { viewer: RegExp; perception: RegExp; outfit: RegExp };
  styleGuide: readonly string[];
  reviewGuide: string;
  subtitle: { maxChars: number; fontFamily: string };
  genreMaxUnits: Record<string, number>;
  asrCode: string;
  aliases: readonly string[];
  partTitle: (title: string, index: number, count: number) => string;
}
