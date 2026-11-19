import { reupMoments } from "../lib/reupSceneMap.js";
import { REUP_COMMENTARY } from "./reupCommentary.js";
import type { ReupJobSettings, ReupMediaItem, ReupOutputKind, ReupSceneMap, ReupStyle, ReupTranscript } from "../types/reup.js";
const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const REUP_ARTIFACT = { SCENES: "reup-scene-map", SCRIPT: "reup-script", PACKAGE: "reup-package" } as const;
const LANG_NAME = { en: "English", vi: "Vietnamese", ja: "Japanese", ko: "Korean" } as const;
const LANG_UNIT = { en: { factor: 1, unit: "words" }, vi: { factor: 1.65, unit: "words (Vietnamese syllables)" }, ja: { factor: 3.2, unit: "Japanese characters" }, ko: { factor: 1, unit: "words" } } as const;
const itemsLine = (items: ReupMediaItem[]): string => items.map((it) => `${it.id} ${it.type} "${it.name}" ${Math.round(it.start)}-${Math.round(it.end)}s`).join("; ");
const TRUTH = "Describe only what is visible. Never invent numbers, days, catches, animals, names or results that the images do not show. Missing is fine, wrong is not.";
const VALUE = [
  "Add value beyond what is seen: every body section carries at least one line of explanation the footage alone does not give — why it is done this way, how the technique works, a practical tip, a comparison or a risk.",
  'Say such lines as general know-how ("usually", "a common way is", "the reason is"), never as facts about this person, place, time or result. Do not just describe the picture line by line.',
].join(" ");
const VALUE_MARK = 'Set "value" on the cues that carry that extra value (why / tip / compare / view); leave it "" on lines that only follow the picture.';
const MARKS = (n: number, lang: string, folder?: boolean): string =>
  `On-screen highlights: give a "mark" to at most ${n} ${folder ? "chapters" : "body or ending sections"}, spread across the video, at a new part, day or step or a striking result. "label" is a short tag like "DAY 2", "STEP 3", "BEFORE", "AFTER" or a chapter number; "title" names what happens; "sub" is the place and time of day or one thing visible on screen. Write them in ${lang}. Only what the footage shows: no invented numbers, names or results. Use null for every other section.`;
const STORY = [
  'Storytelling may add what the pictures cannot show: the person\'s motivation and feelings, their plan and goals, general context (season, weather, the kind of place) and rough sizes or distances said as estimates ("about 20 metres"). Call the person by a simple first name or a role and keep it the same all video; never a full name, nationality, age or family story.',
  "Never contradict the pictures. Never invent results or counts the viewer can check on screen (fish caught, days, buildings, animals), accidents, injuries, rescues or other dramatic events the footage does not show, or advice that would be unsafe if wrong. Describe only what can be seen or reasoned: no smells or tastes.",
].join(" ");
const CRAFT = [
  "Write like a top documentary-style YouTube narrator:",
  "- The hook promises the whole journey: 3-4 concrete payoffs the viewer will see later (from the scene map) and one stake — what could go wrong.",
  "- Introduce the person and their goal early, and what they will need to build or do to reach it.",
  '- Each body section runs problem → why it matters → the solution on screen → why it works → the result. Link sections with "But…", "So…", "That means…" so a new question is always open.',
  '- Active voice with the person as the subject (in Vietnamese avoid chains of "được" passives).',
  '- Mostly short sentences (6-14 words); a 2-5 word line at each payoff ("And it works.").',
  "- Plain words. No filler adjectives or clichés (peaceful, perfect, amazing, well-deserved, every worry melts away; thật bình yên, trọn vẹn, tuyệt vời, xứng đáng, nghi ngút).",
  "- If the scene map shows a setback (damage, storm, failure, repair), build a section around it. End with a callback to the opening promise.",
].join("\n");
const angleLine = (angle: string): string => (angle.trim() ? `The channel's own knowledge and viewpoint (from the creator; weave it in naturally in at least two places, in your own words): ${angle.trim()}` : "");
const styleLines = (style: ReupStyle): string[] => [REUP_COMMENTARY.VOICES[style.voice], style.hook ? REUP_COMMENTARY.HOOKS[style.hook] : "", REUP_COMMENTARY.ENDINGS[style.ending]];
const wordRange = (s: Pick<ReupJobSettings, "targetSeconds" | "wordsPerSecond" | "language">, share: [number, number] = [1, 1]): [number, number] => [Math.round(s.targetSeconds * share[0] * s.wordsPerSecond[0] * LANG_UNIT[s.language].factor), Math.round(s.targetSeconds * share[1] * s.wordsPerSecond[1] * LANG_UNIT[s.language].factor)];
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
  SCRIPT: (input: { map: ReupSceneMap; settings: ReupJobSettings; rules: string; kind: ReupOutputKind; count: number; duration: number; style: ReupStyle; bilingual?: boolean; folder?: boolean; share?: [number, number]; marks: number }): string => {
    const s = input.settings;
    const share = input.folder ? undefined : input.share;
    const [wordsMin, wordsMax] = wordRange(s, share);
    const lang = LANG_NAME[s.language];
    const alt = LANG_NAME[s.languageAlt];
    const long = input.kind === "long";
    const rate = ((s.wordsPerSecond[0] + s.wordsPerSecond[1]) / 2) * LANG_UNIT[s.language].factor * (share?.[1] ?? 1);
    const scenes = input.folder
      ? input.map.segments.map((g) => `${g.id} [${mmss(g.start)}-${mmss(g.end)}] v${g.value} ${g.tags.join(",")}: ${g.what}`).join("\n")
      : input.map.segments
          .map((g) => {
            const moments = reupMoments(g);
            const lines = moments.map((m, k) => {
              const seen = (moments[k + 1]?.t ?? g.end) - m.t;
              return `  ${m.id} ${mmss(m.t)} p${m.pull} ~${Math.max(1, Math.round(seen))}s ≤${Math.max(3, Math.round(seen * rate))}: ${m.what}`;
            });
            return [`${g.id} [${mmss(g.start)}-${mmss(g.end)}] ${g.tags.join(",")}: ${g.what}`, ...lines].join("\n");
          })
          .join("\n");
    const cue = `{"moment": moment id, "text": the words spoken while this moment is on screen (1-2 sentences)${input.bilingual ? `, "textAlt": the same in ${alt}` : ""}, "value": "why"|"tip"|"compare"|"view"|"" (what this line adds beyond the picture)}`;
    const mark = input.marks ? `, "mark": {"cue": index of the cue it opens on, "label": 1-3 words, "title": max 8 words, "sub": max 6 words${input.bilingual ? `, "labelAlt", "titleAlt", "subAlt": the same in ${alt}` : ""}} or null` : "";
    const shape = input.folder
      ? `{"outputs": [{"title": [line1, line2], "sections": [{"role": "body"|"ending", "chapter": short chapter title or "" (only when a new chapter starts)${mark}, "cues": [{"scene": segment id, "text": the words spoken while this picture is on screen (1-2 sentences)}]}]}]}`
      : `{"outputs": [{"title": [line1, line2] (on-screen title, max 28 characters per line)${input.bilingual ? `, "titleAlt": [the same in ${alt}]` : ""}, "sections": [{"role": "hook"|"body"|"teaser"|"ending"${mark}, "cues": [${cue}]}]}]}`;
    return [
      long
        ? `Write the voice-over for ONE ${input.folder ? "photo report" : "video"} (${s.targetSeconds >= 120 ? `${Math.round(s.targetSeconds / 60)}+ minutes` : `${s.targetSeconds} seconds`} on screen) built from real ${input.folder ? "photos and clips" : "footage"}.`
        : `Write ${input.count} separate vertical shorts (${s.targetSeconds} seconds each) cut from a real source video. Each short uses different scenes.`,
      `Narration language: ${lang}${input.bilingual ? ` and, for every line, a natural ${alt} version` : ""}. Target ${wordsMin}-${wordsMax} ${LANG_UNIT[s.language].unit} ${long ? "in total" : "per short"}, aim for about ${Math.round((wordsMin + wordsMax) / 2)} — the narration must fit the length, not run over it. ${input.folder ? "Warm, clear, formal register." : "Natural spoken style; short sentences."}`,
      share ? `Words cover about ${Math.round(share[0] * 100)}-${Math.round(share[1] * 100)}% of the time; between lines the footage and its own sound carry the story. Do not talk over every second.` : "",
      input.rules,
      ...styleLines(input.style),
      s.hook || input.folder ? "" : "No separate hook section.",
      s.teasers ? "" : "No teaser lines.",
      VALUE,
      input.folder ? "" : VALUE_MARK,
      input.marks ? MARKS(input.marks, lang, input.folder) : "",
      angleLine(s.angle),
      `Scene map (timeline ${mmss(input.duration)}). Summary: ${input.map.summary}`,
      input.folder ? "" : "Scenes with their moments: moment id, time, pull (how strong on screen, 5 = best), ~seconds its picture lasts, ≤ words that fit, what is seen.",
      scenes,
      input.folder
        ? ""
        : [
            `Suggested hook scenes: ${input.map.hook.join(", ")}. Clearest result: ${input.map.ending}.`,
            "Every cue points at one moment id from the list and talks about what is seen at that moment (or explains it, as above). The picture starts at that moment, so a line about anything else is wrong.",
            "Keep each cue within its moment's word limit; if a cue needs more, its picture runs on into the same scene — then do not use the next moment of that scene. Each moment at most once in the whole video. Skip weak moments (low pull) freely.",
            "Body cues follow the timeline. The hook is one short line over each of 3-6 of the strongest moments from anywhere; a teaser is one line over a strong later moment that no other cue uses.",
          ].join(" "),
      input.folder ? `${TRUTH} Every sentence must match the scenes listed for its section.` : `${STORY}\n${CRAFT}`,
      `Return JSON: ${shape}.`,
      long ? `Exactly one output. Sections in story order${input.folder ? "; every scene used at most once, in a sensible order" : ""}.` : `Exactly ${input.count} outputs; each has 1-3 sections.`,
    ]
      .filter(Boolean)
      .join("\n");
  },
  SPEECH: (input: { transcript: ReupTranscript; map: ReupSceneMap; settings: ReupJobSettings; rules: string; count: number }): string => {
    const s = input.settings;
    return [
      `Cut ${input.count} vertical promo clip${input.count > 1 ? "s" : ""} (${s.targetSeconds} seconds each, never above 60) from a real video where a person talks. Keep the speaker's own words: pick phrases by id, in the order they should play.`,
      input.rules,
      s.brandName ? `Brand: ${s.brandName}.` : "",
      s.cta || s.hotline ? `Call to action must include: ${[s.cta, s.hotline].filter(Boolean).join(" · ")}.` : "",
      `What is on screen: ${input.map.summary}`,
      "Phrases (id [start-end] text):",
      input.transcript.phrases.map((p) => `${p.id} [${p.start.toFixed(1)}-${p.end.toFixed(1)}] ${p.text}`).join("\n"),
      `Language of hook, callouts and CTA: ${LANG_NAME[s.language]}. ${TRUTH} Do not change the speaker's words.`,
      `Return JSON: {"outputs": [{"title": [POV hook line 1, line 2] (max 24 characters each), "phrases": [phrase ids in play order, total ≈ ${s.targetSeconds} s], "callouts": [{"phrase": phrase id, "text": max 5 words}] (0-4), "cta": short call to action}]}.`,
    ]
      .filter(Boolean)
      .join("\n");
  },
  PACKAGE: (input: { map: ReupSceneMap; script: string; settings: ReupJobSettings; frames: number[]; options: number; thumbnail: boolean; pastTitles: string[]; pastLayouts: string[] }): string =>
    [
      `Prepare YouTube SEO for a narrated video made from real footage. Write everything in ${LANG_NAME[input.settings.language]}.`,
      input.thumbnail ? `Attached images are candidate frames, in this order (seconds): ${input.frames.join(", ")}.` : "",
      `Story: ${input.map.summary}`,
      `Narration: ${input.script}`,
      TRUTH + " Titles, descriptions and thumbnail text may not promise anything the video does not show.",
      "Never mention AI, text-to-speech, voice generators or any tool used to make the video in titles, descriptions, tags or hashtags.",
      `Write ${input.options} clearly different options (different angle or hook each), best first.`,
      input.pastTitles.length ? `This channel's recent titles — do not reuse their wording or their pattern: ${input.pastTitles.map((t) => `"${t}"`).join("; ")}.` : "",
      input.thumbnail ? `Use a different thumbnail layout for each option${input.pastLayouts.length ? `; the last videos used ${input.pastLayouts.join(", ")}, so lead with another one` : ""}.` : "",
      `Return JSON: {"options": [{"title": string (max 70 characters, the strongest keyword early), "description": string (first 2 lines carry the hook and main keywords; then 2-4 short lines about what happens${input.settings.sourceLink ? `; credit the original footage: ${input.settings.sourceLink}` : ""}), "hashtags": [3-5 hashtags starting with #], "tags": [10-15 search tags], "seoScore": 0-100 (honest estimate of search and click strength)${input.thumbnail ? `, "thumb": {"layout": "hero"|"split"|"circle", "frames": [frame seconds from the list; 2 for split/circle], "lines": [white line, yellow line] (max 18 characters each, matching this option's title)}` : ""}}], "pinned": string (one question that invites comments), "aiDisclosure": boolean (true only if the video would show realistic scenes that were generated or altered by AI)}.`,
    ]
      .filter(Boolean)
      .join("\n"),
} as const;
