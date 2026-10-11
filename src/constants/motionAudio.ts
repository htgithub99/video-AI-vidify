export interface MotionSfxMood { root: number; chord: number[]; gain: number; swell: number; noise: number; pulse: number; pulseFreq: number; shimmer: number; sparkle: number; hitFreq: number; endChime: number; }
export const MOTION_SFX_MOODS: Record<string, MotionSfxMood> = {
  dark: { root: 55, chord: [1, 1.189, 1.498], gain: 1, swell: 23, noise: 0, pulse: 0, pulseFreq: 0, shimmer: 0, sparkle: 0, hitFreq: 46, endChime: 392 },
  warm: { root: 65.41, chord: [1, 1.25, 1.5], gain: 1, swell: 23, noise: 0, pulse: 0, pulseFreq: 0, shimmer: 0, sparkle: 0, hitFreq: 46, endChime: 392 },
  history: { root: 55, chord: [1, 1.189, 1.498], gain: 1, swell: 19, noise: 0, pulse: 0, pulseFreq: 0, shimmer: 0.002, sparkle: 0, hitFreq: 44, endChime: 392 },
  true_crime: { root: 51.91, chord: [1, 1.189, 1.414], gain: 0.9, swell: 17, noise: 0.002, pulse: 0.05, pulseFreq: 0.75, shimmer: 0, sparkle: 0, hitFreq: 42, endChime: 349.23 },
  mystery: { root: 49, chord: [1, 1.189, 1.682], gain: 0.9, swell: 29, noise: 0.003, pulse: 0, pulseFreq: 0, shimmer: 0.004, sparkle: 0, hitFreq: 40, endChime: 329.63 },
  disaster: { root: 43.65, chord: [1, 1.189, 1.498], gain: 1.1, swell: 13, noise: 0.006, pulse: 0.03, pulseFreq: 1.1, shimmer: 0, sparkle: 0, hitFreq: 38, endChime: 392 },
  biography: { root: 65.41, chord: [1, 1.25, 1.5], gain: 0.9, swell: 21, noise: 0, pulse: 0, pulseFreq: 0, shimmer: 0.002, sparkle: 0, hitFreq: 48, endChime: 523.25 },
  explainer: { root: 87.31, chord: [1, 1.25, 1.5], gain: 0.6, swell: 11, noise: 0, pulse: 0.025, pulseFreq: 2, shimmer: 0, sparkle: 0.012, hitFreq: 60, endChime: 659.25 },
  horror: { root: 41.2, chord: [1, 1.059, 1.414], gain: 1.1, swell: 31, noise: 0.008, pulse: 0.04, pulseFreq: 0.55, shimmer: 0.005, sparkle: 0, hitFreq: 36, endChime: 277.18 },
  folk_tale: { root: 65.41, chord: [1, 1.25, 1.5], gain: 0.8, swell: 17, noise: 0, pulse: 0, pulseFreq: 0, shimmer: 0.003, sparkle: 0.018, hitFreq: 52, endChime: 523.25 },
  drama: { root: 58.27, chord: [1, 1.26, 1.498], gain: 0.85, swell: 25, noise: 0, pulse: 0, pulseFreq: 0, shimmer: 0.002, sparkle: 0, hitFreq: 46, endChime: 440 },
};
export const MOTION_SFX_SPARKLE_NOTES = [523.25, 587.33, 659.25, 783.99, 880];
