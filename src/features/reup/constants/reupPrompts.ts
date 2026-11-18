import type { ReupJobSettings, ReupMediaItem, ReupOutputKind, ReupSceneMap, ReupTranscript } from "../types/reup.js";
const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const REUP_ARTIFACT = { SCENES: "reup-scene-map", SCRIPT: "reup-script", PACKAGE: "reup-package" } as const;
const LANG_NAME = { en: "English", vi: "Vietnamese", ja: "Japanese", ko: "Korean" } as const;
/** Word targets are English words; other languages aim at the same spoken length. */
const lengthNote = (lang: keyof typeof LANG_NAME): string => (lang === "en" ? "" : ` (in ${LANG_NAME[lang]}, about the same spoken length)`);
const itemsLine = (items: ReupMediaItem[]): string => items.map((it) => `${it.id} ${it.type} "${it.name}" ${Math.round(it.start)}-${Math.round(it.end)}s`).join("; ");
const TRUTH = "Describe only what is visible. Never invent numbers, days, catches, animals, names or results that the images do not show. Missing is fine, wrong is not.";
export const REUP_PROMPT = {
  SCENES: (input: { sheets: { index: number; start: number; interval: number; count: number; cols: number }[]; duration: number; part: number; parts: number; bad: string; items?: ReupMediaItem[]; photoSeconds?: number }): string =>
    [
      input.items ? `You are a video editor reviewing contact sheets of a folder of real photos and short clips laid end to end as one ${mmss(input.duration)} timeline (each photo held ${input.photoSeconds} s). Items in this batch: ${itemsLine(input.items)}. Make exactly one segment per item, with its span. This is batch ${input.part} of ${input.parts}.` : `You are a video editor reviewing contact sheets of ONE real, wordless source video (${mmss(input.duration)} long). This is batch ${input.part} of ${input.parts}.`,
      "Each attached image is a grid of frames read left to right, top to bottom. Tile n of a sheet shows the moment start + n * interval seconds (n starts at 0). A timestamp is printed on each tile when available.",
      ...input.sheets.map((s, i) => `Image ${i + 1}: tiles 0..${s.count - 1}, start ${s.start}s, interval ${s.interval}s, ${s.cols} tiles per row (covers ${mmss(s.start)}–${mmss(s.start + s.interval * s.count)}).`),
      input.bad ? `Skip these dark or blurry ranges: ${input.bad}.` : "",
      TRUTH,
      "Return JSON: {\"summary\": string (2-3 sentences, what happens in this batch), \"segments\": [{\"id\": string, \"start\": seconds, \"end\": seconds, \"what\": string (one short factual line), \"tags\": string[] (from: result, before, after, animal, face, action, build, catch, cook, danger, landscape, tool, water, fire), \"value\": 1-5 (how strong the moment is on screen), \"focusX\": 0-1 (where the main subject sits across the frame), \"caption\": string (max 8 words, factual, for an on-screen caption)}], \"hook\": [segment ids good for a fast opening], \"ending\": segment id of the clearest finished result, \"thumbnails\": [seconds of frames that would make a strong thumbnail]}.",
      "Segments cover the batch in time order without overlaps; one segment per distinct activity, usually 20–120 seconds.",
    ]
      .filter(Boolean)
      .join("\n"),
  SCRIPT: (input: { map: ReupSceneMap; settings: ReupJobSettings; rules: string; kind: ReupOutputKind; count: number; duration: number; bilingual?: boolean; folder?: boolean }): string => {
    const s = input.settings;
    const lang = LANG_NAME[s.language];
    const alt = LANG_NAME[s.languageAlt];
    const scenes = input.map.segments.map((g) => `${g.id} [${mmss(g.start)}-${mmss(g.end)}] v${g.value} ${g.tags.join(",")}: ${g.what}`).join("\n");
    const long = input.kind === "long";
    const shape = input.folder
      ? `{"outputs": [{"title": [line1, line2], "sections": [{"role": "body"|"ending", "chapter": short chapter title or "" (only when a new chapter starts), "cues": [{"scene": segment id, "text": the words spoken while this picture is on screen (1-2 sentences)}]}]}]}`
      : `{"outputs": [{"title": [line1, line2] (on-screen title, max 28 characters per line)${input.bilingual ? `, "titleAlt": [the same in ${alt}]` : ""}, "sections": [{"role": "hook"|"body"|"teaser"|"ending", "text": narration${input.bilingual ? `, "textAlt": the same narration in ${alt}` : ""}, "scenes": [segment ids shown under this text, in order]}]}]}`;
    return [
      long ? `Write the voice-over for ONE ${input.folder ? "photo report" : "video"} (${s.targetSeconds >= 120 ? `${Math.round(s.targetSeconds / 60)}+ minutes` : `${s.targetSeconds} seconds`} on screen) built from real ${input.folder ? "photos and clips" : "footage"}.` : `Write ${input.count} separate vertical shorts (${s.targetSeconds} seconds each) cut from a real source video. Each short uses different scenes.`,
      `Narration language: ${lang}${input.bilingual ? ` and, for every line, a natural ${alt} version` : ""}. Target ${s.wordsMin}-${s.wordsMax} words ${long ? "in total" : "per short"}${lengthNote(s.language)}. ${input.folder ? "Warm, clear, formal register." : "Energetic, fast, spoken style; short sentences."}`,
      input.rules,
      s.hook || input.folder ? "" : "No separate hook section.",
      s.teasers ? "" : "No teaser lines.",
      s.endQuestion ? "" : "Do not end with a question.",
      `Scene map (timeline ${mmss(input.duration)}). Summary: ${input.map.summary}`,
      scenes,
      input.folder ? "" : `Suggested hook scenes: ${input.map.hook.join(", ")}. Clearest result: ${input.map.ending}.`,
      TRUTH + " Every sentence must match the scenes listed for its section.",
      `Return JSON: ${shape}.`,
      long ? `Exactly one output. Sections in story order${input.folder ? "; every scene used at most once, in a sensible order" : "; the hook may reuse the strongest moments"}.` : `Exactly ${input.count} outputs; each has 1-3 sections.`,
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
  PACKAGE: (input: { map: ReupSceneMap; script: string; settings: ReupJobSettings; frames: number[]; options: number; thumbnail: boolean }): string =>
    [
      `Prepare YouTube SEO for a narrated video made from real footage. Write everything in ${LANG_NAME[input.settings.language]}.`,
      input.thumbnail ? `Attached images are candidate frames, in this order (seconds): ${input.frames.join(", ")}.` : "",
      `Story: ${input.map.summary}`,
      `Narration: ${input.script}`,
      TRUTH + " Titles, descriptions and thumbnail text may not promise anything the video does not show.",
      `Write ${input.options} clearly different options (different angle or hook each), best first.`,
      `Return JSON: {"options": [{"title": string (max 70 characters, the strongest keyword early), "description": string (first 2 lines carry the hook and main keywords; then 2-4 short lines about what happens; mention the narration uses an AI voice${input.settings.sourceLink ? `; credit the original footage: ${input.settings.sourceLink}` : ""}), "hashtags": [3-5 hashtags starting with #], "tags": [10-15 search tags], "seoScore": 0-100 (honest estimate of search and click strength)${input.thumbnail ? `, "thumb": {"layout": "hero"|"split"|"circle", "frames": [frame seconds from the list; 2 for split/circle], "lines": [white line, yellow line] (max 18 characters each, matching this option's title)}` : ""}}], "pinned": string (one question that invites comments), "aiDisclosure": boolean (true only if the video would show realistic scenes that were generated or altered by AI)}.`,
    ]
      .filter(Boolean)
      .join("\n"),
} as const;
