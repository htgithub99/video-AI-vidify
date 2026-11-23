import { reupMoments } from "../lib/reupSceneMap.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { REUP_COMMENTARY } from "./reupCommentary.js";
import { REUP_HIGHLIGHT, REUP_PACE } from "./reupConfig.js";
import { THUMB_CONCEPT_BRIEF, THUMB_GOLDEN_RULES, type ThumbConcept } from "../../../constants/thumbConcepts.js";
import { reupHoldWords, type ReupPastText, type ReupWordBudget } from "../lib/reupScriptReview.js";
import { reupTalkQuote } from "../lib/reupTalk.js";
import type { ReupJobSettings, ReupMediaItem, ReupSceneMap, ReupShot, ReupStyle, ReupTranscript } from "../types/reup.js";
const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const REUP_ARTIFACT = { SCENES: "reup-scene-map", SCRIPT: "reup-script", PACKAGE: "reup-package" } as const;
const LANG_NAME = { en: "English", vi: "Vietnamese", ja: "Japanese", ko: "Korean" } as const;
const itemsLine = (items: ReupMediaItem[]): string => items.map((it) => `${it.id} ${it.type} "${it.name}" ${Math.round(it.start)}-${Math.round(it.end)}s`).join("; ");
const TRUTH = "Describe only what is visible. Never invent numbers, days, catches, animals, names or results that the images do not show. Missing is fine, wrong is not.";
const VALUE = [
  "Add value beyond what is seen: every body section carries at least one line of explanation the footage alone does not give — why it is done this way, how the technique works, a practical tip, a comparison or a risk.",
  'Say such lines as general know-how ("usually", "a common way is", "the reason is"), never as facts about this person, place, time or result. Do not just describe the picture line by line.',
].join(" ");
const VALUE_MARK = 'Set "value" on the cues that carry that extra value (why / tip / compare / view); leave it "" on lines that only follow the picture.';
const VALUE_FOLDER = "Add meaning beyond what is seen: every chapter carries at least one line of context — what the moment meant to the people in it, why it mattered, or the channel's view — said with care and never beyond what the photos support.";
const VALUE_MARK_FOLDER = 'Set "value" to "why" or "view" on the cues that carry that context; leave it "" on lines that only describe the picture.';
const quoted = (items: string[]): string => items.map((t) => `"${t}"`).join("; ");
const TALK_MARK = "🗣";
const USED_MARK = "⟲";
const TALK = `Moments marked ${TALK_MARK} have the builder explaining on camera in their own words; that sound stays in the video. Do not talk over them: close a section on the moment just before one, with a short line, so the builder's words play in the pause after it. Never translate or repeat what the builder says.`;
const usedLine = (used?: ReupShot[]): string => (used?.length ? `Earlier videos from this same source already used these stretches: ${used.map((u) => `${mmss(u.start)}-${mmss(u.end)}`).join(", ")}. Prefer other moments; never build a section mainly from them.` : "");
const pastLine = (past?: ReupPastText): string =>
  past && past.openings.length + past.closings.length + past.phrases.length
    ? ["This channel's recent videos must not sound alike. Do not reuse these lines, phrases or their sentence patterns; say the same kind of thing in fresh words.", past.openings.length ? `Recent openings: ${quoted(past.openings)}.` : "", past.closings.length ? `Recent closings: ${quoted(past.closings)}.` : "", past.phrases.length ? `Phrases used again and again: ${quoted(past.phrases)}.` : ""]
        .filter(Boolean)
        .join(" ")
    : "";
const MARKS = (n: number, lang: string, folder?: boolean): string =>
  `On-screen highlights: give a "mark" to at most ${n} ${folder ? "chapters" : "body or ending sections"}, spread across the video, at a new part, day or step or a striking result. "label" is a short tag like "DAY 2", "STEP 3", "BEFORE", "AFTER" or a chapter number; "title" names what happens; "sub" is the place and time of day or one thing visible on screen. Write them in ${lang}. Only what the footage shows: no invented numbers, names or results. Use null for every other section.`;
const POP_MARKS = (n: number, lang: string): string =>
  `On-screen pop words: about ${n} in total, spread from the first seconds to the end, one every ${REUP_HIGHLIGHT.SHORT.EVERY} seconds or so. Each "title" is 1-4 punchy words in ${lang} that the viewer must not miss at that moment: the key word of the line, a number the footage shows, the twist or the result, and always something the viewer SEES in that cue's moment or the result of that very line (never a word about warmth over a plate of food). Each also has a "label": 1-2 words in ${lang} that frame it, like TIP, STEP 2, WHY, RESULT, NIGHT 1 (vary them). Never a whole sentence, never invented numbers.`;
const STORY = [
  'Storytelling may add what the pictures cannot show: the person\'s motivation and feelings, their plan and goals, general context (season, weather, the kind of place) and rough sizes or distances said as estimates ("about 20 metres"). Call the person by a simple first name or a role and keep it the same all video; never a full name, nationality, age or family story.',
  "Never contradict the pictures. Never invent results or counts the viewer can check on screen (fish caught, days, buildings, animals), accidents, injuries, rescues or other dramatic events the footage does not show, or advice that would be unsafe if wrong. Describe only what can be seen or reasoned: no smells or tastes.",
].join(" ");
const THUMB_RULES =
  'Frame thumbnails lead each with a different frame: a large, sharp subject (the person or animal big in frame, best the person with the animal or the shelter), warm or strong light, or a clear before/after; skip dark, blurred or empty frames; never use the same frame in two thumbnails. For several frames, the first is the strongest and the text matches it. Text lines are max 18 characters; a tag is max 12 characters and is a number, a time or a subject the video shows (like 1 NIGHT, + DOG, DAY 2), never an adjective. Never promise what the video does not show: text names what the video really shows or its result, never a mistake, danger or loss that does not happen on screen. For AI pictures, "refs" are the frames that show the person, the shelter or build, and the animal or result most clearly, and "scene" says in plain English who (face, hair, clothes), the animal, the shelter or build (shape, materials, what is inside), the place, the weather type and the time of day as the frames show them, plus the highlight of the video this concept is about (the best result, the peak action or the shelter) and how the person appears with it — every AI picture shows the face of the person together with that highlight; describe the people, places and moment only, never camera words like close-up, framing or angle (the app sets those); no weather, season or event the frames do not show.';
const thumbAsk = (t: { frames: number; lines: number; kind?: string; ai?: boolean }): string => {
  const text = t.lines ? (t.lines > 1 ? "two text lines, 2-4 words in all" : "one short tag") : "no text";
  if (t.ai && t.kind === "signature") return "an AI picture in the channel's signature look (the main person full-body beside the glowing main place or build of the video), refs + scene, no text";
  if (t.ai) return `an AI picture for the concept ${THUMB_CONCEPT_BRIEF[t.kind as ThumbConcept]} refs + scene, ${text}`;
  const concept = t.kind && t.kind !== "signature" ? ` built as the concept ${THUMB_CONCEPT_BRIEF[t.kind as ThumbConcept]}` : "";
  return `${t.frames} frame${t.frames > 1 ? "s" : ""}${concept}, ${text}`;
};
const LOOK_SIDE: Record<string, string> = { left: "left", right: "right" };
const LOOK_POSE: Record<string, string> = {
  door: "one hand resting high on the door frame or the shelter, the other relaxed, chest open, a confident half smile",
  back: "turned three-quarters away toward the glowing shelter, looking back over the shoulder straight into the lens",
  tool: "holding the main item of the video (axe, lantern, pot or tool) up near the chest, looking straight into the lens",
};
const CONCEPT_PICTURE: Record<ThumbConcept, string> = {
  trophy:
    "Concept TROPHY: two heroes in one frame — (1) the finished result of the video (the cooked meal, the catch, the finished build) huge and tack-sharp in the foreground, as wide as half of the subject area, glistening, steaming or glowing; (2) the person right behind or beside it, sharp and recognisable from the chest up, face fully in frame, proud or delighted, looking at the lens or at the result (the animal next to them if the video has one). Background soft.",
  split: "Concept SPLIT: the frame is cut in two by one clean vertical line. Left half: the cold or bare side (blue snow or rain outside, the empty site, the problem). Right half: the warm or finished side (glowing amber interior, fire, the finished build, the solution). The person appears large and recognisable in the warm half (face fully in frame), the animal too if the video has one.",
  action:
    "Concept MID-ACTION: the single peak moment of the video frozen at 1/4000 s from a low dynamic angle — the person seen from the waist up with the face fully in frame and tense with effort while doing the main action (the axe biting into the log with chips flying, flames bursting from the stove, snow or water spraying), the tool and the effect sharp, sparks or particles in the air. Never only hands.",
  curiosity: "Concept CURIOSITY: the person's face large on one side (face fully in frame), reacting with surprise or intense focus, eyes toward the video's most striking detail on the other side (the result, an odd object, the glowing shelter) lit brighter than everything else; the rest falls into shadow.",
  mood: "Concept CINEMATIC MOOD: the person and the animal sitting close by the fire or stove, both faces lit warm orange and clearly visible, the cosy interior around them, a window or doorway showing the cold blue outside.",
};
const IMAGE_LOOK = [
  "Create ONE finished YouTube thumbnail photo (16:9 landscape) that makes people click: the polished, hyper-real look of top outdoor and camping channels.",
  "Exposure: BRIGHT and vivid, well exposed like a sunny commercial photo — never dark, murky or underexposed; faces and the main subject clearly lit; shadows rich but open.",
  "Grade: high dynamic range, punchy saturated colour (lush greens, clean blues, glowing warm amber), crisp micro-detail, clean skin, strong warm-cold contrast between the glowing warm light and the cool surroundings, a touch of volumetric light and haze.",
  "Lighting: soft bright daylight or early dusk (the sky still light) by default, night only if the scene says night; every interior light switched on and glowing; a warm rim light on the person; wet or snowy surfaces catching reflections.",
  "Camera: full-frame look, 24-35 mm, slightly low angle, subject tack-sharp, background gently soft; nothing small or far away — the main subject fills the frame and whole heads are never cut off.",
  "No text, letters, numbers, logos, watermarks, borders or YouTube interface anywhere.",
];
const CAPTION_SIDE = "Caption space: group the person (face fully in frame), the animal and the highlight together in the RIGHT 58% of the frame; the LEFT 42% is calm, darker, out-of-focus background (wall, sky, trees or shadow) with nothing important in it, for a caption added later.";
const CAPTION_SPLIT = "Caption space: keep the top 22% of both halves calm and darker (sky, wall or shadow) for a caption added later; faces and the highlight sit below it.";
const IMAGE_SUBJECT = "Every picture shows BOTH the person of the video (large, face fully visible and recognisable, never cropped, never only hands or a back) AND the highlight of the video named in the scene (the result, the peak action or the shelter); a picture without the person's face is wrong.";
const IMAGE_TRUTH = [
  "The first attached pictures are frames of the real video: keep the SAME person (face, hair, beard, clothes), the SAME animal (breed, colours, size) and the SAME shelter, vehicle or build (shape, materials). Add no other people or animals. Clothing stays natural and modest as in the frames.",
  "Weather: use the type of weather the scene names and push it to its most dramatic version (snow → thick falling snowflakes and snow haze; rain → heavy downpour, splashes and wet shine; clear → golden hour with mist). Never add a type of weather it does not name (no lightning, storm or rain unless named).",
];
const IMAGE_STYLE = "The LAST attached picture is a STYLE reference only: match its lighting, colour grade, camera angle, framing, subject size and mood as closely as possible, but never copy its people, faces, bodies, clothes, animals, vehicles, buildings, logos or text — those come only from the video frames.";
type Pace = "quick" | "mid" | "full";
const paceOf = (seconds: number): Pace => (seconds < REUP_PACE.QUICK ? "quick" : seconds < REUP_PACE.MID ? "mid" : "full");
const SHAPE: Record<Pace, string> = {
  quick: [
    "A short watch: the hook is one sentence over the single strongest moment, said in the first seconds.",
    "One main idea: 2 to 4 body sections in time order, each a run of moments from neighbouring scenes.",
    "No teasers and no chapter cards.",
    "End on the result or one sharp closing line, over a moment that shows the person or the animal (a face, the two together), not only an object.",
    "Moments in a row come from clearly different shots: never two cues on the same action a few seconds apart.",
  ].join("\n"),
  mid: ["A hook of about 10-15 seconds over 2-3 of the strongest moments, opened the way the opening line below says.", "4 to 7 body sections in time order, each a run of moments from neighbouring scenes.", "At most two teasers: one line over a strong later moment that makes the viewer want the next part.", "No chapter cards."].join("\n"),
  full: ["A hook of about 20-30 seconds over the strongest moments, opened the way the opening line below says.", "8 to 12 body sections in time order, each a run of moments from neighbouring scenes.", "A teaser roughly every 2 minutes: one line over a strong later moment that makes the viewer want the next part.", "No chapter cards."].join("\n"),
};
const TITLE_TRUTH = "The on-screen title and every pop word or highlight describe only what the moments you pick show: no weather, temperature, danger, survival or season words unless those moments show it.";
const QUICK_HOOK: Record<string, string> = {
  result: 'Short-video opening: say the end result in the first line ("By the end, this tiny stove cooks a full dinner.").',
  question: 'Short-video opening: one question the next seconds answer ("Can one small stove heat this whole cabin?").',
  contrast: 'Short-video opening: before vs after in one line ("Cold bare boards now. Warm bed in a minute.").',
  stakes: 'Short-video opening: what could go wrong right now, in one line ("If this fire dies, the night gets long.").',
  tease: 'Short-video opening: hint at the payoff at the end without saying it ("Watch what this pan turns into.").',
};
const HOOK_MOMENTS: Record<Pace, string> = { quick: "1-2", mid: "2-4", full: "3-6" };
const HOOK_CRAFT: Record<Pace, string> = {
  quick: "- The hook is one punchy line: the single payoff the viewer will see by the end, or what is at stake.",
  mid: "- The hook promises the journey: 2-3 concrete payoffs the viewer will see later (from the scene map) and one stake — what could go wrong.",
  full: "- The hook promises the whole journey: 3-4 concrete payoffs the viewer will see later (from the scene map) and one stake — what could go wrong.",
};
const CRAFT = (pace: Pace): string =>
  [
    "Write like a top documentary-style YouTube narrator:",
    HOOK_CRAFT[pace],
    "- Introduce the person and their goal early, and what they will need to build or do to reach it.",
    '- Each body section runs problem → why it matters → the solution on screen → why it works → the result. Link sections with "But…", "So…", "That means…" so a new question is always open.',
    '- Active voice with the person as the subject (in Vietnamese avoid chains of "được" passives).',
    '- Mostly short sentences (6-14 words); a 2-5 word line at each payoff ("And it works.").',
    "- Plain words. No filler adjectives or clichés (peaceful, perfect, amazing, well-deserved, every worry melts away; thật bình yên, trọn vẹn, tuyệt vời, xứng đáng, nghi ngút).",
    "- If the scene map shows a setback (damage, storm, failure, repair), build a section around it. End with a callback to the opening promise.",
  ].join("\n");
const angleLine = (angle: string): string => (angle.trim() ? `The channel's own knowledge and viewpoint (from the creator; weave it in naturally in at least two places, in your own words): ${angle.trim()}` : "");
const styleLines = (style: ReupStyle): string[] => [REUP_COMMENTARY.VOICES[style.voice], style.hook ? REUP_COMMENTARY.HOOKS[style.hook] : "", style.shape ? REUP_COMMENTARY.SHAPES[style.shape] : "", REUP_COMMENTARY.ENDINGS[style.ending]];
export const REUP_PROMPT = {
  SCENES: (input: { sheets: { index: number; start: number; interval: number; count: number; cols: number }[]; duration: number; part: number; parts: number; bad: string; language: ReupJobSettings["language"]; items?: ReupMediaItem[]; photoSeconds?: number }): string =>
    [
      input.items
        ? `You are a video editor reviewing contact sheets of a folder of real photos and short clips laid end to end as one ${mmss(input.duration)} timeline (each photo held ${input.photoSeconds} s). Items in this batch: ${itemsLine(input.items)}. Make exactly one segment per item, with its span. This is batch ${input.part} of ${input.parts}.`
        : `You are a video editor reviewing contact sheets of ONE real, wordless source video (${mmss(input.duration)} long). This is batch ${input.part} of ${input.parts}.`,
      "Each attached image is a grid of frames read left to right, top to bottom. Tile n of a sheet shows the moment start + n * interval seconds (n starts at 0). A timestamp is printed on each tile when available.",
      ...input.sheets.map((s, i) => `Image ${i + 1}: tiles 0..${s.count - 1}, start ${s.start}s, interval ${s.interval}s, ${s.cols} tiles per row (covers ${mmss(s.start)}–${mmss(s.start + s.interval * s.count)}).`),
      input.bad ? `Skip these dark or blurry ranges: ${input.bad}.` : "",
      TRUTH,
      `Write summary, "what", captions and moment lines in ${LANG_NAME[input.language]}.`,
      'Return JSON: {"summary": string (2-3 sentences, what happens in this batch), "segments": [{"id": string, "start": seconds, "end": seconds, "what": string (one short factual line), "moments": [{"t": seconds (the time of a tile where it is visible), "what": string (the action seen on that tile, a few words), "pull": 1-5 (how strong it is on screen: 5 = striking result, danger, catch, reveal; 1 = filler)}] (1-4 per segment, in time order), "tags": string[] (from: result, before, after, animal, face, action, build, catch, cook, danger, landscape, tool, water, fire), "value": 1-5 (how strong the segment is on screen), "focusX": 0-1 (where the main subject sits across the frame), "caption": string (max 8 words, factual, for an on-screen caption)}], "hook": [segment ids good for a fast opening], "ending": segment id of the clearest finished result, "thumbnails": [seconds of frames that would make a strong thumbnail]}.',
      input.items ? "" : "Segments cover the batch in time order without gaps or overlaps; one segment per distinct action, usually 8–40 seconds (a long unchanged view may run longer). Moments are what a narrator would point at: a new step, a result, something unexpected.",
    ]
      .filter(Boolean)
      .join("\n"),
  SCRIPT: (input: { map: ReupSceneMap; settings: ReupJobSettings; rules: string; duration: number; style: ReupStyle; bilingual?: boolean; folder?: boolean; share?: [number, number]; marks: number; budget: ReupWordBudget; budgetAlt?: ReupWordBudget; past?: ReupPastText; talk?: ReupTranscript["phrases"]; used?: ReupShot[] }): string => {
    const s = input.settings;
    const share = input.folder ? undefined : input.share;
    const budget = input.budget;
    const lang = LANG_NAME[s.language];
    const alt = LANG_NAME[s.languageAlt];
    const pace = paceOf(s.targetSeconds);
    const pop = pace === "quick" && !input.folder;
    const rate = budget.rate;
    const scenes = input.folder
      ? input.map.segments.map((g) => `${g.id} [${mmss(g.start)}-${mmss(g.end)}] v${g.value} ${g.tags.join(",")} ≤${reupHoldWords(g.end - g.start, rate)}: ${g.what}`).join("\n")
      : input.map.segments
          .map((g) => {
            const moments = reupMoments(g);
            const lines = moments.map((m, k) => {
              const seen = (moments[k + 1]?.t ?? g.end) - m.t;
              const said = input.talk?.length ? reupTalkQuote(input.talk, m.t, m.t + seen) : undefined;
              const posted = input.used?.some((u) => m.t >= u.start && m.t < u.end) ? ` ${USED_MARK}` : "";
              return `  ${m.id} ${mmss(m.t)} p${m.pull} ~${Math.max(1, Math.round(seen))}s ≤${Math.max(3, Math.round(seen * rate))}: ${m.what}${said ? ` ${TALK_MARK}"${said}…"` : ""}${posted}`;
            });
            return [`${g.id} [${mmss(g.start)}-${mmss(g.end)}] ${g.tags.join(",")}: ${g.what}`, ...lines].join("\n");
          })
          .join("\n");
    const cue = `{"moment": moment id, "text": the words spoken while this moment is on screen (1-2 sentences)${input.bilingual ? `, "textAlt": the same in ${alt}` : ""}, "value": "why"|"tip"|"compare"|"view"|"" (what this line adds beyond the picture)}`;
    const mark = !input.marks
      ? ""
      : !pop
        ? `, "mark": {"cue": index of the cue it opens on, "label": 1-3 words, "title": max 8 words, "sub": max 6 words${input.bilingual ? `, "labelAlt", "titleAlt", "subAlt": the same in ${alt}` : ""}} or null`
        : `, "marks": [{"cue": index of the cue it pops on, "label": 1-2 words, "title": 1-4 punchy words${input.bilingual ? `, "labelAlt", "titleAlt": the same in ${alt}` : ""}}] (0-${REUP_HIGHLIGHT.SHORT.PER_SECTION} per section)`;
    const shape = input.folder
      ? `{"outputs": [{"title": [line1, line2], "sections": [{"role": "body"|"ending", "chapter": short chapter title or "" (only when a new chapter starts)${mark}, "cues": [{"scene": segment id, "text": the words spoken while this picture is on screen (1-2 sentences), "value": "why"|"view"|""}]}]}]}`
      : `{"outputs": [{"title": [line1, line2] (on-screen title, max 28 characters per line)${input.bilingual ? `, "titleAlt": [the same in ${alt}]` : ""}, "sections": [{"role": "hook"|"body"|"teaser"|"ending"${mark}, "cues": [${cue}]}]}]}`;
    return [
      `Write the voice-over for ONE ${input.folder ? "photo report" : "video"} (${s.targetSeconds >= 120 ? `${Math.round(s.targetSeconds / 60)}+ minutes` : `${s.targetSeconds} seconds`} on screen) built from real ${input.folder ? "photos and clips" : "footage"}.`,
      `Narration language: ${lang}${input.bilingual ? ` and, for every line, a natural ${alt} version` : ""}. Target ${budget.min}-${budget.max} ${budget.unit} in total, aim for about ${budget.aim}${input.budgetAlt ? ` (the ${alt} lines: ${input.budgetAlt.min}-${input.budgetAlt.max} ${input.budgetAlt.unit})` : ""}. Stay inside this range: below it the video ends up shorter than planned, above it the voice runs over the pictures. Reach it with lines worth hearing, never filler. ${input.folder ? "Warm, clear, formal register." : "Natural spoken style; short sentences."}`,
      share ? `Words cover about ${Math.round(share[0] * 100)}-${Math.round(share[1] * 100)}% of the time; between lines the footage and its own sound carry the story. Do not talk over every second.` : "",
      input.folder ? "" : SHAPE[pace],
      input.rules,
      ...styleLines(input.style),
      pace === "quick" && input.style.hook ? QUICK_HOOK[input.style.hook] : "",
      s.hook || input.folder ? "" : "No separate hook section.",
      s.teasers ? "" : "No teaser lines.",
      input.folder ? VALUE_FOLDER : VALUE,
      input.folder ? VALUE_MARK_FOLDER : VALUE_MARK,
      input.marks ? (pop ? POP_MARKS(input.marks, lang) : MARKS(input.marks, lang, input.folder)) : "",
      angleLine(s.angle),
      pastLine(input.past),
      `Scene map (timeline ${mmss(input.duration)}). Summary: ${input.map.summary}`,
      input.folder ? "" : "Scenes with their moments: moment id, time, pull (how strong on screen, 5 = best), ~seconds its picture lasts, ≤ words that fit, what is seen.",
      scenes,
      input.folder
        ? ""
        : [
            `Suggested hook scenes: ${input.map.hook.join(", ")}. Clearest result: ${input.map.ending}.`,
            "Every cue points at one moment id from the list and talks about what is seen at that moment (or explains it, as above). The picture starts at that moment, so a line about anything else is wrong.",
            "Keep each cue within its moment's word limit; if a cue needs more, its picture runs on into the same scene — then do not use the next moment of that scene. Each moment at most once in the whole video. Skip weak moments (low pull) freely.",
            `Body cues follow the timeline. The hook is one short line over each of ${HOOK_MOMENTS[pace]} of the strongest moments from anywhere; a teaser is one line over a strong later moment that no other cue uses.`,
          ].join(" "),
      input.folder ? `${TRUTH} Every sentence must match the scenes listed for its section. Keep the words for each scene within its ≤ limit, so no photo stays on screen too long.` : `${STORY}\n${CRAFT(pace)}`,
      input.talk?.length ? TALK : "",
      usedLine(input.used),
      input.used?.length && !input.folder ? (pace === "quick" ? `Moments marked ${USED_MARK} were already posted from this source: in a video this short use none of them unless nothing else shows the idea.` : `Moments marked ${USED_MARK} were already posted from this source; use them only as connecting shots.`) : "",
      input.folder ? "" : TITLE_TRUTH,
      `Return JSON: ${shape}.`,
      `Exactly one output. Sections in story order${input.folder ? "; every scene used at most once, in a sensible order" : ""}.`,
    ]
      .filter(Boolean)
      .join("\n");
  },
  REVISE: (input: { base: string; draft: unknown; fixes: string[]; alt?: ReupJobSettings["language"] }): string =>
    [
      input.base,
      "",
      `Your draft of this script: ${stringifyJson(input.draft)}`,
      "Revise the draft and return the WHOLE script again in exactly the same JSON shape. Keep every good line and its moment or scene id; change only what this list asks:",
      ...input.fixes.map((f) => `- ${f}`),
      input.alt ? `Keep every changed or added line's "textAlt" (${LANG_NAME[input.alt]}) in step with it.` : "",
      "Added lines must be worth hearing: a reason, how it works, a tip, a comparison or a risk tied to what is on screen — never filler and never a repeat of the picture. Respect each moment's word limit; to add words, use moments not used yet.",
    ]
      .filter(Boolean)
      .join("\n"),
  PACKAGE: (input: { map: ReupSceneMap; script: string; settings: ReupJobSettings; frames: number[]; options: number; thumbs: { layout: string; frames: number; lines: number; kind?: string; ai?: boolean }[]; pastTitles: string[]; shown: string[]; avoid?: string[] }): string =>
    [
      `Prepare YouTube SEO for a narrated video made from real footage. Write everything in ${LANG_NAME[input.settings.language]}.`,
      input.thumbs.length ? `Attached images are candidate frames, in this order (seconds): ${input.frames.join(", ")}.` : "",
      `Story: ${input.map.summary}`,
      `Narration: ${input.script}`,
      input.shown.length ? `What this video actually shows (the story above covers the whole source, which this cut may not): ${input.shown.join("; ")}. Titles, descriptions and thumbnail text are about these scenes only.` : "",
      input.avoid?.length ? `Do not use these words, the video does not show them: ${quoted(input.avoid)}.` : "",
      TRUTH + " Titles, descriptions and thumbnail text may not promise anything the video does not show.",
      "Never mention AI, text-to-speech, voice generators or any tool used to make the video in titles, descriptions, tags or hashtags.",
      `Write ${input.options} clearly different options (different angle or hook each), best first.`,
      input.pastTitles.length ? `This channel's recent titles — do not reuse their wording or their pattern: ${input.pastTitles.map((t) => `"${t}"`).join("; ")}.` : "",
      input.thumbs.length ? [`Plan ${input.thumbs.length} thumbnails, in this order: ${input.thumbs.map((t, i) => `${i + 1}) ${thumbAsk(t)}`).join("; ")}.`, THUMB_RULES, THUMB_GOLDEN_RULES].join(" ") : "",
      `Return JSON: {"options": [{"title": string (max 70 characters, the strongest keyword early), "description": string (first 2 lines carry the hook and main keywords; then 2-4 short lines about what happens${input.settings.sourceLink ? `; credit the original footage: ${input.settings.sourceLink}` : ""}), "hashtags": [3-5 hashtags starting with #], "tags": [10-15 search tags], "seoScore": 0-100 (honest estimate of search and click strength)}]${input.thumbs.length ? `, "thumbs": [{"frames": [frame seconds from the list, as many as asked], "refs": [2-3 frame seconds, only for AI pictures], "scene": "one English sentence, only for AI pictures", "lines": [text lines as asked, or [] for no text]}]` : ""}, "pinned": string (one question that invites comments), "aiDisclosure": boolean (true only if the video would show realistic scenes that were generated or altered by AI)}.`,
    ]
      .filter(Boolean)
      .join("\n"),
  THUMB_IMAGE: (kind: string, scene: string, look?: string, style = false): string => {
    const [side, pose] = (look || "right:door").split(":");
    const picture =
      kind === "signature"
        ? [
            "Composition — the channel signature shot:",
            `the main place of the video (shelter, tent, cabin, house, workshop, garage or vehicle) is big and close, filling 55-65% of the frame, seen from a slightly low angle, its door or windows wide open with the inside glowing bright warm amber and full of cosy detail (bed with blankets, fire in the stove, lanterns or string lights);`,
            `the person stands full-body on the ${LOOK_SIDE[side] || "right"} third, large in frame (head to feet 60-75% of the frame height), ${LOOK_POSE[pose] || LOOK_POSE.door};`,
            "the animal, if the frames show one, sits or stands right next to the person, looking at the lens; dark dramatic sky and tall dark trees frame the scene.",
          ].join(" ")
        : `${CONCEPT_PICTURE[kind as ThumbConcept] || CONCEPT_PICTURE.trophy} ${kind === "split" ? CAPTION_SPLIT : CAPTION_SIDE}`;
    return [...IMAGE_LOOK, IMAGE_SUBJECT, ...IMAGE_TRUTH, style ? IMAGE_STYLE : "", `Scene from the video: ${scene}`, picture].filter(Boolean).join("\n");
  },
} as const;
export const REUP_FIX = {
  LABEL: "The video",
  SHORT: (label: string, have: number, need: number, aim: number, unit: string, sections: number[]): string => `${label} has ${have} ${unit}; it needs at least ${need} (aim for about ${aim}). Add lines mainly in sections ${sections.join(", ")} (counted from 1).`,
  SHORT_ALT: (label: string, lang: string, have: number, need: number, unit: string): string => `${label}: the ${LANG_NAME[lang as keyof typeof LANG_NAME] || lang} lines have ${have} ${unit}; they need at least ${need}. Lengthen both languages together, saying the same thing.`,
  REPEAT: (label: string, sentences: string[]): string => `${label}: these sentences repeat this channel's earlier videos — keep the idea, use new wording and a different sentence pattern: ${quoted(sentences)}.`,
  LONG: (label: string, sections: { n: number; have: number; cap: number }[]): string => `${label}: ${sections.map((x) => `section ${x.n} has ${x.have} words for photos that hold about ${x.cap}`).join("; ")} — shorten those lines (or add the next photos to the section) so no photo stays on screen too long.`,
  STRAY: (label: string, words: string[]): string => `${label}: the title or on-screen words say ${quoted(words)}, which the chosen moments do not show — rephrase them around what is on screen.`,
  BARE: (label: string, sections: number[]): string => `${label}: sections ${sections.join(", ")} only describe the picture — give each one line of why, how, a tip, a comparison or the channel's view.`,
} as const;
