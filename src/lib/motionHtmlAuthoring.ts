import { MOTION_HTML, MOTION_HTML_STYLES } from "../constants/motionHtmlTemplate.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import { motionStorytelling } from "./motionStorytelling.js";
import { motionStorytellingSilent } from "./motionStorytelling.js";
import { MOTION_SCENE_PACING } from "../constants/motionScenePacing.js";
import type { MotionChapter, MotionStoryAnalysis } from "../types/motionVideo.js";
import type { MotionVisualSettings } from "../types/motionVisual.js";
export const motionHtmlLanguageDirection = (language?: string) => `${MOTION_HTML.LANGUAGE_POLICY}\nSELECTED VIDEO LANGUAGE: ${language || "as specified by the supplied narration and exact display strings"}. Production instructions are English; this does not change the selected video language.\n${MOTION_HTML.GRAPHICS}`;
export const motionHtmlChapterBudget = (analysis: MotionStoryAnalysis, chapter: MotionChapter, speechRate: number, first = false, last = false) => {
  const silent = motionStorytellingSilent(analysis.storytelling);
  const pause = (silent ? last ? silent.videoEnd : silent.chapterCard + silent.chapterEnd : 0) + (first ? .3 : 0);
  const seconds = Math.max(1, (chapter.targetSeconds || 0) - pause);
  return { pause, seconds, units: Math.round(seconds * speechRate) };
};
export const motionHtmlPacingDirection = (settings: MotionVisualSettings, seconds: number) => {
  const pacing = settings.pacing || MOTION_SCENE_PACING.DEFAULT;
  const target = MOTION_SCENE_PACING.SECONDS[pacing];
  const targetScenes = Math.max(1, Math.round(seconds / target));
  const minScenes = Math.max(1, Math.floor(targetScenes * 0.75));
  const maxScenes = Math.max(minScenes, Math.ceil(targetScenes * 1.25));
  return `PICTURE PACING: ${pacing}; aim for roughly ${target} seconds per scene, approximately ${targetScenes} scenes (allowed window ${minScenes}–${maxScenes} scenes) across this ${seconds.toFixed(1)}s request. Cover consecutive speech lines once, allowing several beats/sentences in one Canvas so each scene holds on screen for roughly ${target} seconds. Gestures, expression changes, object focus and camera movement belong inside the current scene; they do not automatically require a new picture. Change scenes when the source needs a new setting or a distinct visual demonstration, balancing the selected hold duration. Explain essential timing exceptions in purpose. This is an authoring target, never a score or acceptance gate.`;
};
export const motionHtmlAnalysisPrompt = (input: { title: string; seconds: number; language: string; chapters: number; transcript: string; pacing?: string }) => [
  "Analyze the supplied source into one coherent production plan. Return JSON with title, logline, factual, era, look, accent, sfxMood, videoDna, chapters, cast, groups, places and writingPlan. Follow the selected genre/storytelling contract and selected visual style supplied alongside this task.",
  motionHtmlLanguageDirection(input.language),
  `Title=${input.title}; language=${input.language}; TOTAL budget=${input.seconds}s. Aim for about ${input.chapters} meaningful chapters, scaling to source and budget so chapter targetSeconds sum to ${input.seconds}s. Each chapter: {id,title,summary,from,to,weight,mustKeep,hook,keyPoints,handoff,writing}. from/to refer to actual source seconds when available. Keep source order where the selected genre needs it. Assign each essential event once. Design a strong opening hook for chapter 1 and purposeful momentum handoffs between chapters that serve the chosen genre and storytelling mode; omit unhelpful ones rather than filling quotas. No mandatory stage/shot/candidate counts.`,
  motionHtmlPacingDirection({ pacing: input.pacing || "few" } as MotionVisualSettings, input.seconds),
  "cast lists only needed identities: {key,name,role,description,look,marks,skin,carries,origin,gender,age,narrator?}. Describe visible clothing, hair and equipment in words appropriate to the source; no body construction templates, drawing code, rig or coordinates. groups optionally describes unnamed participants {key,name,look,origin,skin,outfit,gear,faction}; places describes needed environments {key,name,description,interior,time}. Empty cast/groups is valid for a map or process. Do not invent people, props or events to populate the schema. Use the supplied videoDna data contract, without allowing visual style to override the selected narrative voice or genre. Preserve source uncertainty and factual versus fictional intent.",
  "SOURCE:\n" + input.transcript,
].join("\n");
export const motionHtmlGenreDirection = (genre: unknown, seconds: number, mode: unknown): string => {
  const selected = motionVideoGenre(genre);
  const storytelling = motionStorytelling(mode);
  const voices = {
    pov: "GENRE VOICE (POV — Second-Person Immersive 'You'): Write in second person, present tense ('you' / 'bạn') so the viewer lives the source-supported situation directly through immediate actions, sensory details, urgent decisions and physical consequences. Drop the viewer right into the critical moment from the opening line, escalate the immediate pressure beat by beat, and let unseen background facts arrive naturally as news or a brief realization. Do not invent losses, companions or a later life to fill a preset spine.",
    witness: "GENRE VOICE (WITNESS — First-Person Eyewitness 'I'): Write as one first-person eyewitness ('I' / 'tôi') recollecting the events in natural, grounded spoken language through concrete sensory perceptions, human tension, and direct cause/consequence. Contrast what was expected on the ground with what actually unfolded, preserve honest eyewitness uncertainty where the source is uncertain, do not invent events or speeches of real people, and close on the source's actual outcome and lasting impression.",
    chronicle: "GENRE VOICE (CHRONICLE — High-Stakes Causal Arc): Tell the source's historical or factual arc in compelling chronological order, driving forward through its real turning points. Open with the pivotal catalyst or pressure point, link each chapter and beat by clear cause-and-effect momentum ('because of this, the next crisis erupted') rather than a flat list of dates, build to the decisive turning point, and land the real aftermath. A short flash-forward hook is optional when useful; dates and numbers come strictly from the source.",
    verdict: "GENRE VOICE (VERDICT — Investigative Question & Hypothesis Showdown): Investigate one compelling source-grounded central question using a clear, concrete evaluation criterion. Open by framing the central mystery/question and why the stakes matter (or use a brief cold open that immediately raises that question). Select only hypotheses/candidates supported by the source and suited to this duration (typically 2 sharp contenders for short videos, or 2–3 when longer). Put each candidate to the test against the criterion—showing its strongest supporting evidence, then exposing its critical flaw or turning-point counter-evidence—before delivering a definitive, reasoned final verdict. For a short video, opening, criterion, candidates and conclusion may share one chapter; state the criterion once, reuse it naturally, and avoid robotic label stamping.",
  };
  const telling = {
    plain: "STORYTELLING MODE (PLAIN — Faithful & Direct): Deliver a crisp, objective, matter-of-fact narrative in the chosen genre voice. Follow the source's factual sequence directly, keep causal connections transparent and natural, and rely on the intrinsic weight of the facts without artificial cliffhangers, rhetorical embellishments or theatrical detours.",
    lively: "STORYTELLING MODE (LIVELY — Vivid & Engaging): Open with an immediate concrete detail or hook from the source, make the human or causal stakes tangible, use active verbs and vivid sensory grounding, vary sentence rhythm between brisk punchy lines and smooth narrative flow, and connect beats with purposeful momentum transitions that open a natural curiosity and pay it off cleanly.",
    gripping: "STORYTELLING MODE (GRIPPING — Maximum Retention & Dramatic Pull): Hook the viewer in the very first sentence with a high-stakes paradox, urgent conflict or decisive turning point from the source. Build relentless forward pull through sharp contrasts, escalating cause-and-consequence, strategic information release, and an open curiosity loop that stays alive until the evidence resolves it. Use punchy, high-impact spoken cadence and land a memorable callback/payoff without inventing facts or breaking the duration budget.",
  };
  return `ONE AUTHORING CONTRACT: genre=${selected}; storytelling=${storytelling}; total video budget approximately ${Math.round(seconds)} seconds. ${voices[selected]} ${telling[storytelling]} Scale structure to duration. No fixed stage/companion/motif/shot quotas. Facts, uncertainty and real quotations come only from the source. The selected visual style does not change person/tense or the genre. Hook metadata is optional and never replaces an actual setup/payoff.`;
};
export const motionHtmlWritingDirection = (analysis: MotionStoryAnalysis, language = analysis.authoringSettings?.language): string => {
  const a = analysis.authoringSettings!;
  const target = analysis.chapters.reduce((sum, chapter) => sum + (chapter.targetSeconds || 0), 0) || a.selectedTargetSeconds;
  return [motionHtmlLanguageDirection(language), motionHtmlGenreDirection(a.videoGenre, target, a.storytelling), `PICTURE PACING: ${a.picturePacing}, roughly ${a.targetPictureSeconds} seconds per illustration. Spoken beats and pictures are separate: multiple sentences/beats can share one Canvas. Plan visual changes for the content, not for every sentence or gesture.`, `VISUAL STYLE (words only): ${MOTION_HTML_STYLES[a.visualProfile]}`, MOTION_HTML.TEMPLATE].join("\n");
};
export const motionHtmlAuthoringSnapshot = (input: { videoGenre?: unknown; storytelling?: unknown; length: string; target: number; language: string; profile: string; pacing?: string; parts?: number }) => ({
  version: 1 as const,
  videoGenre: motionVideoGenre(input.videoGenre), storytelling: motionStorytelling(input.storytelling),
  selectedLength: input.length, selectedTargetSeconds: input.target, language: input.language, visualProfile: input.profile,
  picturePacing: input.pacing || MOTION_SCENE_PACING.GENRE_DEFAULT[motionVideoGenre(input.videoGenre)] || MOTION_SCENE_PACING.DEFAULT,
  targetPictureSeconds: MOTION_SCENE_PACING.SECONDS[(input.pacing || MOTION_SCENE_PACING.GENRE_DEFAULT[motionVideoGenre(input.videoGenre)] || MOTION_SCENE_PACING.DEFAULT) as keyof typeof MOTION_SCENE_PACING.SECONDS],
  requestedParts: Math.max(1, input.parts || 1),
});
