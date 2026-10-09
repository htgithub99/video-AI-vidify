import type { MotionStoryDna } from "../types/motionVideo.js";
export interface MotionGenre {
  id: string;
  motion: "still" | "light" | "active";
  label: { vi: string; en: string };
  factual: boolean;
  signals: string;
  role: string;
  voice: string;
  arc: string[];
  hook: string;
  ending: string;
  infographics: string;
  visuals: string;
  camera: string;
  look: string;
  rules: string;
}
export const MOTION_GENRES: MotionGenre[] = [
  {
    id: "history",
    motion: "still",
    label: { vi: "Lịch sử", en: "History" },
    factual: true,
    signals: "real past events, eras, empires, wars, revolutions, inventions, famous turning points told as a story",
    role: "history documentary scriptwriter",
    voice: "calm, authoritative storyteller; vivid but precise; place every event in its year and country; explain why it mattered",
    arc: ["Context: the world before the event – place, year, what was normal", "Spark: the person or decision that starts it", "Rising events in time order, each with a concrete image", "Turning point: the decisive moment", "Consequences: what changed and what it led to", "Legacy: why it still matters today"],
    hook: "open on the most dramatic moment or a surprising fact, then step back to the beginning",
    ending: "close with the legacy and one memorable fact or date",
    infographics: "use map for routes and borders, timeline for sequences of dates, stats for numbers, headline for how the press reported it",
    visuals: "era-correct architecture, costumes and props; natural daylight, warm lamp or candle light for older eras; dust or haze in large halls; slightly desaturated, film-like",
    camera: "stately wide establishing shots of each place, slow dolly-ins on decisions, low angles for powerful figures",
    look: "vintage",
    rules: "never invent dates, names or numbers; flag uncertain points neutrally; no glorifying war or violence",
  },
  {
    id: "true_crime",
    motion: "light",
    label: { vi: "Vụ án có thật", en: "True crime" },
    factual: true,
    signals: "a real crime, heist, scam, fraud, kidnapping, escape or investigation with perpetrators, police or court",
    role: "true-crime documentary scriptwriter",
    voice: "tense, measured, matter-of-fact; build suspense with details and timestamps; never sensational; respect victims",
    arc: ["Cold open: the moment the crime is discovered", "Who: the people involved and their situation", "The plan or the motive", "The crime itself, step by step, with times", "Discovery and investigation: clues, mistakes, suspects", "Capture, trial or escape", "Aftermath: sentences, open questions, what it changed"],
    hook: "open on the discovery of the crime or the single most unbelievable detail",
    ending: "close with the outcome and an open question or the lesson investigators drew",
    infographics: "counter for nights, minutes or money; timeline for the investigation; stats for the loot or sentences; headline for press coverage; map for escape routes",
    visuals: "night and interior_dark scenes, cold fluorescent offices and police rooms, street lamps, torches and flashlights, rain on the night of the crime",
    camera: "over_shoulder and insert shots on hands, tools and evidence; slow push-ins; high angles on suspects in interrogation",
    look: "cold_thriller",
    rules: "no gore, blood or bodies; never show a killing – cut to light, a door or an empty room; do not name minor victims; present suspects as suspects until convicted",
  },
  {
    id: "mystery",
    motion: "still",
    label: { vi: "Bí ẩn", en: "Mystery" },
    factual: true,
    signals: "an unsolved or strange case: disappearances, unexplained events, lost ships or planes, codes, conspiracies, places nobody can explain",
    role: "mystery documentary scriptwriter",
    voice: "quiet, curious, slightly ominous; ask questions; reveal facts one at a time; separate what is known from theories",
    arc: ["The question: the strange fact stated plainly", "The setting: where, when, who was there", "The last normal moment", "The event and its strange details", "The search: clues and evidence found", "Theories, from the most likely to the wildest, each weighed", "What remains unexplained"],
    hook: "open with the question nobody can answer, in one sentence",
    ending: "close on the unanswered question and the one clue that still puzzles people",
    infographics: "timeline for the last known hours, map for where things were found, quote for witness statements; keep numbers few",
    visuals: "fog, dusk, overcast and night; empty places; one small warm light in a dark set; long corridors and open landscapes that feel lonely; dark but always readable – the actors and the clue must be lit",
    camera: "slow dolly-in on empty places and objects, wide shots with a lonely figure, insert shots on clues",
    look: "noir",
    rules: "clearly label theories as theories; do not present speculation as fact; no gore",
  },
  {
    id: "disaster",
    motion: "active",
    label: { vi: "Thảm hoạ & sinh tồn", en: "Disaster & survival" },
    factual: true,
    signals: "a real accident or catastrophe: plane crash, shipwreck, fire, earthquake, flood, mine or mountain survival, rescue",
    role: "disaster documentary scriptwriter",
    voice: "urgent but respectful; precise times and technical details; focus on human decisions and courage",
    arc: ["Normal day: the people and the vehicle or place", "Warning signs that were missed", "The moment it goes wrong, minute by minute", "Struggle to survive and first decisions", "Rescue", "Investigation: the real cause", "What changed so it never happens again"],
    hook: "open seconds before or after the disaster, then rewind",
    ending: "close with the lives saved or lost (numbers only, no images of victims) and the safety change it caused",
    infographics: "counter for minutes, altitude or water level; timeline for the sequence; stats for survivors and causes; map for routes",
    visuals: "smoke, fog, rain, snow, flickering or failing lights, emergency red and orange light, dusk and night",
    camera: "handheld-feeling close shots in the crisis, high and aerial shots for scale, low angles on rescuers",
    look: "teal_orange",
    rules: "never show dead or injured bodies; suggest danger with light, smoke and sound; respect real victims and families",
  },
  {
    id: "biography",
    motion: "still",
    label: { vi: "Tiểu sử nhân vật", en: "Biography" },
    factual: true,
    signals: "the life of one real person: rise and fall, career, inventor, artist, leader, athlete, entrepreneur",
    role: "biography documentary scriptwriter",
    voice: "warm, personal, admiring but honest; show character through choices; use their words when known",
    arc: ["Who they became: the famous moment", "Childhood and origins", "The struggle or first failure", "The breakthrough", "Peak and price of success", "Fall, change or late years", "Legacy"],
    hook: "open on the defining moment of their life, then go back to their childhood",
    ending: "close with their legacy and a famous quote or a final image of them",
    infographics: "timeline for the life, quote for their own words, stats for achievements",
    visuals: "the person's home, workplace and stage across the years; warm interiors; costumes changing with age and era",
    camera: "close and medium shots on the main person, slow push-ins on key choices, wide shots for big public moments",
    look: "warm_story",
    rules: "do not invent quotes; keep private matters respectful",
  },
  {
    id: "explainer",
    motion: "light",
    label: { vi: "Giải thích – kiến thức", en: "Explainer" },
    factual: true,
    signals: "the source explains how or why something works: science, technology, economics, a phenomenon, a process, a comparison, facts and figures",
    role: "explainer video scriptwriter",
    voice: "clear, friendly, curious teacher; one idea per beat; simple words; everyday comparisons and concrete examples",
    arc: ["The question: a surprising everyday fact or problem", "Why it matters to the viewer", "The basics, one simple idea at a time", "How it works, step by step", "A real example or case", "Common misconception corrected", "Summary in one sentence"],
    hook: "open with a surprising question or number that the viewer has never thought about",
    ending: "close with a one-sentence summary and one fact to remember",
    infographics: "use stats, counter, timeline, map and quote often for numbers, steps and comparisons; still show people doing the thing in scenes, with arrows and floating labels pointing at the parts being explained",
    visuals: "clean, bright, simple sets: classroom, lab, workshop, factory, street; daylight and clear interior light; real objects the explanation is about",
    camera: "clear medium and insert shots on the object being explained; high angles to show a process; few dramatic angles; annotate with glowing arrows and billboard text labels",
    look: "clean",
    rules: "be accurate; simplify without being wrong; no fake numbers",
  },
  {
    id: "horror",
    motion: "still",
    label: { vi: "Truyện ma – kinh dị", en: "Ghost & horror story" },
    factual: false,
    signals: "a ghost story, haunted place, urban legend, creepy experience, supernatural or horror tale",
    role: "ghost-story narrator and horror scriptwriter",
    voice: "slow, low and intimate, like telling a story at night; short sentences; build dread with sounds and small wrong details; let silence work",
    arc: ["Calm: an ordinary place and an ordinary person", "First sign: something small and wrong", "Unease grows: the signs repeat and get closer", "Investigation: the character looks for the cause or learns the legend", "Peak: the encounter", "Escape or aftermath", "Final twist or lingering unease"],
    hook: "open on one eerie detail or sound, then show the ordinary beginning",
    ending: "close on a quiet, unsettling final image or line that leaves a doubt",
    infographics: "almost none; at most a quote of the legend or a date on a headline",
    visuals:
      'night, interior_dark, fog and rain; one weak light source; flickering lamps, candles and torches; long dark corridors, empty rooms, old houses, forests; cold blue moonlight against warm small lights; ghosts and spirits are actors with "ghost":true (translucent, floating), seen far away or half hidden; dark but always readable – a lantern, moonlight or window light must light the actors and the key action',
    camera: "slow dolly-ins, low angles, over_shoulder looking into darkness, wide shots with a small figure in a big dark space, sudden close shots at the peak",
    look: "noir",
    rules: "suggest, do not show: no gore, blood or bodies; scare with darkness, light, sound and empty spaces; tell it as a story, not as proven fact",
  },
  {
    id: "folk_tale",
    motion: "light",
    label: { vi: "Cổ tích – truyền thuyết", en: "Folk tale & legend" },
    factual: false,
    signals: "a fairy tale, folk tale, fable, myth, legend or religious/folk story with a moral",
    role: "storyteller of folk tales and legends",
    voice: "warm, rhythmic storyteller voice like a grandparent; simple vivid images; gentle repetition; clear good and bad characters",
    arc: ["Once upon a time: the place and the hero", "The wish, problem or injustice", "The journey or trial", "Help or magic appears", "The hardest test", "Reward and punishment", "The moral"],
    hook: "open with the classic once-upon-a-time framing and the hero's situation",
    ending: "close with the moral of the story in one sentence",
    infographics: "none except a quote of the moral at the end",
    visuals: "villages, rice fields, forests, rivers, palaces and temples of the story's culture; golden dusk and dawn light; soft fog; warm saturated colours",
    camera: "wide, painterly establishing shots, gentle orbits, medium shots for dialogue",
    look: "warm_story",
    rules: "keep it family-friendly; respect the culture the tale comes from",
  },
  {
    id: "drama",
    motion: "still",
    label: { vi: "Chuyện đời – cảm động", en: "Human story" },
    factual: true,
    signals: "a real-life personal story: family, love, kindness, overcoming hardship, friendship, an unusual life",
    role: "human-interest documentary scriptwriter",
    voice: "gentle, warm and emotional without being sentimental; small concrete details; let the people's actions speak",
    arc: ["The person and their everyday life", "The problem or loss", "The struggle", "The help or decision that changes things", "The emotional peak", "Where they are now"],
    hook: "open on an emotional image or the moment everything changed",
    ending: "close on a hopeful image and a short reflection",
    infographics: "few: a quote of the person, a counter or stat only when the number is the point",
    visuals: "homes, streets, hospitals, schools, workplaces; soft warm light, dawn and dusk; rain for sad moments",
    camera: "close and medium shots on people, slow push-ins at emotional moments, wide shots of the person alone",
    look: "warm_story",
    rules: "respect privacy and dignity; do not exaggerate suffering",
  },
];
export const MOTION_GENRE_DEFAULT = "history";
export const MOTION_GENRE_MOVEMENT: Record<MotionGenre["motion"], string> = {
  still: "MOVEMENT BUDGET: almost none. Actors hold poses; at most one short straight walk (≤ 3 m on free floor) in a beat, and only when the narration says someone goes somewhere. The camera creates the motion (slow dolly, orbit, crane, truck) and 2–3 cuts per beat.",
  light: "MOVEMENT BUDGET: low. Mostly poses; short straight walks (≤ 4 m on free floor) when the story needs them; no chases. The camera creates most of the motion.",
  active: "MOVEMENT BUDGET: moderate. Short straight walks and runs (≤ 8 m on free floor) are allowed for escapes and rescues, but prefer poses + camera moves; never route a walk around or through objects.",
};
export const MOTION_GENRE_PART = { STORY: "story", VISUAL: "visual", NONE: "none" } as const;
export const MOTION_GENRE_SEP = " · ";
export const MOTION_GENRE_PREAMBLE_BASE = "IMPORTANT – TEXT-ONLY TASK: you only write structured JSON data. You are NOT asked to create, render or edit any image, video or audio. A separate 3D program on the user's computer reads your JSON (a list of simple shapes, materials, lights and camera numbers) and renders faceless white mannequin figures in simple 3D sets for a storytelling video.";
export const MOTION_GENRE_TEXT = {
  NEUTRAL: " Retell the source faithfully.",
  FACTUAL: (label: string) => ` GENRE: ${label}. These are real events: retell them factually; never invent facts.`,
  FICTION: (label: string) => ` GENRE: ${label}. This is a traditional or fictional story told for entertainment: retell it faithfully as a story, suitable for a general audience.`,
  VISUAL: (g: MotionGenre) => `\nGENRE MOOD (follow it in sets, light, weather and camera): ${g.visuals}. Camera: ${g.camera}. Rules: ${g.rules}.\n${MOTION_GENRE_MOVEMENT[g.motion]}`,
  STORY: (g: MotionGenre) => `\nGENRE STYLE: ${g.label.en}. Rules: ${g.rules}.`,
  DNA: (d: MotionStoryDna) => [d.tone ? `\nSTORY TONE: ${d.tone}.` : "", d.motifs?.length ? `\nVISUAL MOTIFS to repeat and pay off: ${d.motifs.join("; ")}.` : "", d.avoid?.length ? `\nAVOID in this story: ${d.avoid.join("; ")}.` : "", d.keep ? `\nKEEP CONSISTENT: ${d.keep}` : ""].join(""),
  ANALYSIS_LIST: () => MOTION_GENRES.map((g) => `  - ${g.id}: ${g.signals}`).join("\n"),
  ROLE: (g: MotionGenre) => `${g.role}`,
  SECOND_STORY: (g: MotionGenre) => `\nThe story also has elements of ${g.label.en}: borrow its voice where it fits (${g.voice}).`,
  SECOND_VISUAL: (g: MotionGenre) => ` Secondary mood (${g.label.en}): ${g.visuals}.`,
  VOICE: (g: MotionGenre, language: string) => `Natural, fluent ${language} narration. Voice: ${g.voice}`,
  ARC: (g: MotionGenre, chapter: number, chapters: number) =>
    `GENRE STRUCTURE (${g.label.en}) – the whole video follows this arc:\n${g.arc.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}\nThis is chapter ${chapter} of ${chapters}: cover the arc steps that belong to this part of the story, in order, without skipping what the source tells.\n- Opening of the video: ${g.hook}.\n- End of the video: ${g.ending}.\n- Infographics for this genre: ${g.infographics}.`,
} as const;
export interface MotionSfxMood {
  root: number;
  chord: number[];
  gain: number;
  swell: number;
  noise: number;
  pulse: number;
  pulseFreq: number;
  shimmer: number;
  sparkle: number;
  hitFreq: number;
  endChime: number;
}
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
