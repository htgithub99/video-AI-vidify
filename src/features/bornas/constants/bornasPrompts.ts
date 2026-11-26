import { BORNAS_LIMITS, BORNAS_REVIEW_CONTEXT, BORNAS_SAME_PERSON, BORNAS_STYLE_LINE } from "./bornasConfig.js";
import type { BornasAnalysis, BornasBackground, BornasLine, BornasScript, BornasSprite, BornasTopic } from "../types/bornas.js";
export const BORNAS_ARTIFACT = { ANALYZE: "bornas-analyze", SCRIPTS: "bornas-scripts", STYLE: "bornas-style", TRIM: "bornas-trim", MATCH: "bornas-match", ASSETS: "bornas-assets", SPRITE_REVIEW: "bornas-sprite-review", SNAP_REVIEW: "bornas-snap-review", BG_MEASURE: "bornas-bg-measure", SHOTS: "bornas-shots" } as const;
const LANG = { vi: "Vietnamese", en: "English" } as const;
const TOPIC: Record<BornasTopic, string> = {
  world: "world history (any era or country: ancient, medieval, Asian dynasties, world wars, modern history)",
  ww: "World War I and World War II",
  ancient: "the ancient world (Rome, Greece, Egypt, Persia, Celts, Han–Qin China)",
  medieval: "medieval Europe, Vikings, Crusades and the Mongols",
  eastasia: "East Asian history (Japan, Chinese dynasties, Korea, Mongolia)",
  vietnam: "Vietnamese history from Văn Lang to the Nguyễn dynasty, the French colonial era and 1945–1975",
  modern: "the modern world today (jobs, armies, cities, technology)",
  game: "fantasy and science-fiction game worlds (original settings, no real game characters)",
  wildwest: "the American Wild West 1850–1900 (outlaws, sheriffs, settlers, frontier towns)",
};
const JSON_ONLY = "Return only one JSON object, no markdown, no explanation.";
export const BORNAS_PROMPT = {
  ANALYZE: (a: { name: string; duration: number; transcript: string; wpm: number; shotMedian: number; shotCount: number; sheets: number }) =>
    [
      `You are studying a sample YouTube video "${a.name}" (${Math.round(a.duration)} s) so that new videos can be made in the same style with different stories.`,
      `Attached are ${a.sheets} contact sheets of frames in time order (left to right, top to bottom). Measured: ${a.shotCount} cuts, median shot ${a.shotMedian.toFixed(1)} s, narration ${Math.round(a.wpm)} words per minute.`,
      `Transcript:\n${a.transcript.slice(0, 9000)}`,
      "Describe the craft, never copy sentences. Write each field as short concrete rules a scriptwriter and an editor can follow.",
      'JSON: {"formula": string (the topic formula and promise, e.g. "If you were born as X: your life from birth to death in second person"), "narration": string (narration card: point of view, tense, sentence length, hook pattern with its beats, the turn line, how life stages open, recurring devices ranked by use, planted details and callbacks, recap and closing question), "shots": string (shot grammar: shot length, cut timing on words, camera push/pull habits, transitions, special shots like rewind, documents, photo montage), "texts": string (on-screen text types: age/time tags, place plates, name labels with arrows, speech bubbles, stamps; when each appears), "art": string (art style of the drawings and backgrounds, palette, framing; no character names)}',
      JSON_ONLY,
    ].join("\n\n"),
  SCRIPTS: (a: { count: number; topic: BornasTopic; language: "vi" | "en"; seconds: number; rate: number; rhythm: string; analysis: BornasAnalysis; avoid: string[]; channel: string }) =>
    [
      `Write ${a.count} new video scripts for the YouTube channel "${a.channel}" in ${LANG[a.language]}. Topic of the channel: ${TOPIC[a.topic]}.`,
      `Each script is one video of about ${a.seconds} seconds of narration (the voice reads about ${a.rate.toFixed(1)} words per second, so at most ${Math.round(a.seconds * a.rate * 0.9)} words in all lines together; cut chapters rather than go over).`,
      `Formula of the sample: ${a.analysis.formula}`,
      `Narration card (follow it closely): ${a.analysis.narration}`,
      `On-screen text habits: ${a.analysis.texts}`,
      a.avoid.length ? `Already made on this channel, do not repeat these subjects: ${a.avoid.join("; ")}.` : "",
      "Every script: a different real person or a clearly typical person of the topic, facts checked and dated (say when sources disagree), second person, present tense, a hook with 3 shocking beats, then the turn, then life in order with each stage opened by a time or place, 2–3 planted details each called back once, a one-line verdict, a recap, a closing question for the comments. Show actions, never name feelings. Violence only as falls or silhouettes, never gore. Never invent quotes, vows, plans, motives, numbers or comparisons: only events, words and numbers that sources record.",
      `${a.rhythm} Write numbers and years in words in "text" so the voice reads them; put digits only in "screen".`,
      'For each line: "screen" = the on-screen text for that moment (an age like "16 TUỔI", a place and year, a name, a number) or "" when none; "sub" = an optional small second line; "kind" = "tag" (age/time, corner), "plate" (place, title, fact), "label" (a person\'s name with an arrow) or "none"; "idea" = what the picture shows (who, doing what, where), concrete; "pause" = true on the last line of the hook and of each chapter.',
      `JSON: {"scripts": [{"title": string (YouTube title in the channel language), "hook": string (one line summary), "hero": string (who the main character is, with ages shown), "series": string (short corner tag in capitals, at most ${BORNAS_LIMITS.SERIES_MAX} characters, e.g. "BILLY THE KID · MIỀN TÂY"), "lines": [{"text": string, "screen": string, "sub": string, "kind": "tag"|"plate"|"label"|"none", "idea": string, "pause": boolean}]}]}`,
      JSON_ONLY,
    ]
      .filter(Boolean)
      .join("\n\n"),
  STYLE: (script: BornasScript, issues: string[], rhythm: string) =>
    [
      `This script does not match the sample's narration rhythm. Measured problems: ${issues.join("; ")}.`,
      `${rhythm} Rewrite the lines to fix every problem: split long sentences into short ones and fragments, turn some statements into a question answered by the next line, keep every fact, planted detail and callback, add no new facts, quotes or numbers, keep the total length about the same and keep every line's fields.`,
      `Script:\n${JSON.stringify(script)}`,
      'JSON: {"title": string, "hook": string, "hero": string, "series": string, "lines": [same shape as the input lines]}',
      JSON_ONLY,
    ].join("\n\n"),
  TRIM: (script: BornasScript, have: number, max: number) =>
    [
      `This script has ${have} words but the video length allows at most ${max}. Shorten it to at most ${max} words: drop or merge the least important life stages and side details, keep the hook, the turn, the planted details with their callbacks, the verdict, the recap and the closing question. Keep the same line fields and style.`,
      `Script:\n${JSON.stringify(script)}`,
      'JSON: {"title": string, "hook": string, "hero": string, "series": string, "lines": [same shape as the input lines]}',
      JSON_ONLY,
    ].join("\n\n"),
  ASSETS: (a: { script: BornasScript; items: string; backgrounds: string; analysis: BornasAnalysis }) =>
    [
      "Plan the pictures for this video. Pictures come from a shared cartoon library first; only what is missing gets drawn.",
      `Art style of the sample: ${a.analysis.art}`,
      `Script:\n${a.script.lines.map((l, i) => `${i + 1}. ${l.text} [picture: ${l.idea}]`).join("\n")}`,
      `Library sprites (name | kind | height m):\n${a.items}`,
      `Library backgrounds (name: description):\n${a.backgrounds}`,
      `Rules: main characters (the hero at each age, family, the main rival) are always new "cast" entries, never library sprites; give each cast entry 2–${BORNAS_LIMITS.POSES_MAX} poses the script needs (walk, run, sit, kneel, ride, aim, lying wounded…), side view. The hero's main adult age also gets a pose named "bust": head and shoulders only, three-quarter view facing the viewer, calm mouth, hands out of frame. A held item appears once (one gun, one flag), never doubled, with no letters on it. At most ${BORNAS_LIMITS.CAST_MAX} cast entries. Pick every library sprite and background that fits the era and place; list new items only when nothing in the library fits (max ${BORNAS_LIMITS.NEW_ITEMS_MAX}) and new backgrounds only for places the library lacks (max ${BORNAS_LIMITS.NEW_BG_MAX}). A planted object that is called back (a scarf, a ring, a letter) must exist as a drawn sprite. Never list as items things the code makes: text, speech bubbles, signs with words, labels, arrows, maps, muzzle flashes, explosions, smoke, dust, fire glow, light beams or other effects.`,
      'JSON: {"cast": [{"id": string (short snake_case, e.g. "hero_14"), "desc": string (age, face, hair, clothes, era; full body), "heightM": number, "poses": [{"name": string (snake_case), "desc": string}]}], "items": [library sprite names], "backgrounds": [library background names], "newItems": [{"name": string (snake_case), "desc": string, "kind": "person"|"animal"|"vehicle"|"prop"|"structure"|"nature"|"weapon", "heightM": number (real height in metres of the object as drawn in side view: standing adult 1.75, horse with rider 2.4, revolver 0.15, glass 0.1, house 6)}], "newBackgrounds": [{"name": string (snake_case starting with bg_), "desc": string}]}',
      JSON_ONLY,
    ].join("\n\n"),
  MATCH_CROPS: (wanted: { name: string; desc: string }[], count: number) =>
    [
      `Attached is a contact sheet of ${count} numbered crops (number under each) cut from one generated sheet. The sheet was asked to contain these items:`,
      wanted.map((w) => `${w.name}: ${w.desc}`).join("\n"),
      "For each wanted item give the number of the crop that shows it whole. Use each crop at most once. Skip an item when no crop shows it, or when it is cut in pieces or merged with another item.",
      'JSON: {"items": [{"name": string, "crop": number}]}',
      JSON_ONLY,
    ].join("\n\n"),
  SPRITE_REVIEW: (sheets: { start: number; count: number }[]) =>
    [
      `Attached are ${sheets.length} contact sheets of cut-out cartoon pictures. Every tile has a red number; tiles are numbered ${sheets.map((x) => `${x.start}–${x.start + x.count - 1}`).join(", ")}. On people a red box marks where code thinks the face is. ${BORNAS_REVIEW_CONTEXT}`,
      'For EVERY number return: place = how the thing is used in a scene: "ground" (stands, sits or lies on the floor: people, animals, vehicles, furniture, crates, buildings, trees), "wall" (hangs on a wall: poster, picture, sign, map, rifle rack), "table" (small object that sits on a table or shelf: lamp, book, bottle, box), "hand" (small object normally held: gun, knife, letter, coin), "icon" (a symbol, badge, emblem or game-like icon that is not a real object in the world); facing = "l" or "r": the way a person or animal looks or a vehicle points ("r" for objects without a front); text = true when letters or numbers are drawn on it; double = true when the same item appears twice or two separate items are stuck together; cut = true when part of it is cut off by the picture edge; for people only: face_ok = true when the red box covers the face (forehead to chin), and head = [x, y] the centre of the head in percent of the picture (0–100, from the top-left of the picture, not the tile).',
      'JSON: {"items": [{"n": number, "place": string, "facing": "l"|"r", "text": boolean, "double": boolean, "cut": boolean, "face_ok": boolean, "head": [number, number]}]}',
      JSON_ONLY,
    ].join("\n\n"),
  SNAP_REVIEW: (sheets: { start: number; count: number }[]) =>
    [
      `Attached are ${sheets.length} sheets of frames from a cartoon explainer video, one frame per shot, numbered ${sheets.map((x) => `${x.start}–${x.start + x.count - 1}`).join(", ")} (yellow number below each frame). ${BORNAS_REVIEW_CONTEXT} Check every frame against this list and report only real problems:`,
      "1) a text, arrow or tail sits on a face or points at the wrong thing (a place name or a title pointing at a person, a name pointing at the wrong person, a tail running into a body); 2) text that does not fit the picture (a chapter title shown as a person's name, a quote shown as a sign); 3) a person or object floating above or sunk into the floor, or standing inside a wall or building; 4) wrong size: a person bigger than a door or house, an object as big as a person when it should be small, a child bigger than an adult; 5) the same object or person twice, or a cut-off person filling the frame with no face visible; 6) an empty or almost black frame; 7) white holes inside a figure; 8) someone walking or riding backwards.",
      'For each problem give the fix: "tag" (move the text to a corner card), "drop_text" (remove the text), "wide" (show the whole scene instead of the close-up). Frames without problems are not listed.',
      'JSON: {"issues": [{"n": number, "problem": string, "fix": "tag"|"drop_text"|"wide"}]}',
      JSON_ONLY,
    ].join("\n\n"),
  BG_MEASURE: (names: string[]) =>
    [
      `Attached are ${names.length} background images numbered #1–#${names.length} (${names.join(", ")}). Each is drawn on a 1920×1080 grid: red x labels on top, blue y labels on the left, lines every 100 px (y every 50 px). ${BORNAS_REVIEW_CONTEXT}`,
      'For each background measure in grid pixels: ground = [y at x=320, y at x=960, y at x=1600] where a standing adult\'s feet touch the walkable floor nearest the viewer (null where there is no floor); person = [height in px of a 1.75 m adult standing at each of those three points] judged from doors, windows, fences, furniture, horses; spots = up to 6 good standing points [x, y, personHeightPx] on the floor (feet position), spread left to right, never inside a wall, building, water or furniture; walls = [[x0, x1, y]] wall areas where a picture or poster can hang (y = its bottom edge); table = [x0, x1, y] the top surface of a table, bar or shelf, or null; water = y of the water line, or null; seats = beds, benches, sofas and chairs drawn in the picture, each {k: "bed"|"bench"|"sofa"|"chair", x0, x1, y} with y = the top of the mattress or seat.',
      'JSON: {"bgs": [{"n": number, "ground": [number|null, number|null, number|null], "person": [number, number, number], "spots": [[number, number, number]], "walls": [[number, number, number]], "table": [number, number, number] | null, "water": number | null, "seats": [{"k": string, "x0": number, "x1": number, "y": number}]}]}',
      JSON_ONLY,
    ].join("\n\n"),
  SHOTS: (a: { lines: { index: number; text: string; idea: string; screen: string; sub: string; kind: BornasLine["kind"]; words: string[]; start: number; end: number }[]; sprites: BornasSprite[]; backgrounds: BornasBackground[]; analysis: BornasAnalysis; first: boolean; last: boolean }) =>
    [
      "You are the director of a cartoon explainer video in the style of the sample. Plan BEATS (what the picture shows) for these narration lines. Code does all positions, camera numbers, shot cuts, light and text placement from your beats, following the sample's grammar; you only choose content.",
      `Shot grammar of the sample: ${a.analysis.shots}`,
      `Text habits of the sample: ${a.analysis.texts}`,
      `Lines (index. text | picture | on-screen | words with index):\n${a.lines.map((l) => `${l.index}. ${l.text} | ${l.idea} | ${l.kind !== "none" && l.screen ? `${l.kind}: ${l.screen}${l.sub ? ` / ${l.sub}` : ""}` : "-"} | ${l.words.map((w, k) => `${k}:${w}`).join(" ")} (${(l.end - l.start).toFixed(1)} s)`).join("\n")}`,
      `Sprites (name | kind | height m | place | what):\n${a.sprites.map((s) => `${s.name} | ${s.kind} | ${s.heightM} | ${s.ann?.place || "ground"} | ${s.desc.slice(0, 140)}`).join("\n")}`,
      `Backgrounds (name | what | standing spots, wall, table, furniture already drawn in it):\n${a.backgrounds.map((b) => `${b.name} | ${b.desc} | ${b.ann ? `${b.ann.spots.length} spots${b.ann.walls.length ? ", wall" : ""}${b.ann.table ? ", table" : ""}${b.ann.seats?.length ? `, has ${b.ann.seats.map((x) => x.k).join(", ")}` : ""}` : "-"}`).join("\n")}`,
      "Furniture already drawn in a background is used as it is: never add a sprite of the same furniture to that background; a person lying or sitting on it is placed there by code.",
      [
        "A beat starts on a word {line, word}: the first word of a line or the key noun/verb inside it. Usually one beat per line; a new beat whenever the place, the people or the action changes; hook lines get 2–3 beats each, every beat a different picture (another place, subject or action, never the same subject in the same place twice in a row). Beats in time order, covering every line. Code cuts long beats into several camera angles, so do not split a beat only to move the camera.",
        'cast: who/what is in the picture, max 5: {sprite, slot "l"|"cl"|"c"|"cr"|"r", place "ground"|"wall"|"table"|"near" (near = dropped beside the subject), dir "l"|"r" (who looks where; people talking face each other), move "l"|"r" only for walking/riding/running across, crowd n (2–6 copies for a group of extras), swap [{sprite, line, word}] to change the same person\'s pose exactly on that word}. Never the same sprite twice. Every beat needs a person or the one object the line is about; never an empty background unless the line names only the place.',
        'subject: index in cast of who the line is about. frame: "wide" when a place or a group is introduced, "medium" for two people interacting, "close" on the person or object named. cam: "push" (default), "glide" (start wide and glide in to the subject when it is named), "pull" (pull back on loss, death, emptiness).',
        'kind "bust": head-and-shoulders talking portrait of the hero over a blurred background — use a sprite whose name ends in "_bust" as cast[0]; use it for the hero\'s thoughts, the turn line and emotional peaks (about one beat in six, more in the hook).',
        'Text, only from the line\'s on-screen text, at most one per beat: tag {text, sub, corner "tl"|"tr", line, word} for ages and dates; plate {text, sub, at (cast index it points at, or null for a scene-wide name), line, word} for places and facts; label {text, sub, cast, line, word} for a person\'s name. Spoken words in quotes become bubble {text (max 6 words), cast, line, word}.',
        "Light: focus {line, word} when the subject is named (spotlight that then fades), dark 0–0.45 for night or sad beats, warm (fire, home), cool (night, cold), smoke, flash {line, word} on gunshots and impacts, shake {line, word} on hits, bar {label, from, to, line, word} for a survival or odds meter.",
        'Special beats: kind "rew" just before the turn line (code replays the hook places with a rewind effect); kind "paper" {lines: [{text, size "h"|"n"|"l", line, word}], stamp {text, line, word}} for a document or a big number; kind "montage" {bgs, caps} for the recap; kind "black" with an optional plate.',
        "Effects are code: never use a sprite of a muzzle flash, explosion, smoke, speech bubble or sign with words as cast. Never use a glow to stand in for an object or blood; a planted object at its callback is the drawn sprite, close on it.",
        a.first ? "These are the first lines: open with the strongest, most shocking picture." : "",
        a.last ? "These are the last lines: the final beat gets endCard {text, sub, line, word} with the closing question." : "",
      ]
        .filter(Boolean)
        .join("\n"),
      'JSON: {"beats": [{"line": number, "word": number, "kind": "scene"|"bust"|"rew"|"paper"|"montage"|"black", "bg": string, "cast": [{"sprite": string, "slot": string, "place": string, "dir": "l"|"r", "move": "l"|"r", "crowd": number, "swap": [{"sprite": string, "line": number, "word": number}]}], "subject": number, "frame": "wide"|"medium"|"close", "cam": "push"|"glide"|"pull", "tag": {...}, "plate": {...}, "label": {...}, "bubble": {...}, "focus": {...}, "dark": number, "warm": boolean, "cool": boolean, "smoke": boolean, "flash": {...}, "shake": {...}, "bar": {...}, "paper": {...}, "montage": {...}, "endCard": {...}}]}',
      JSON_ONLY,
    ].join("\n\n"),
  CAST_SHEET: (desc: string, poses: { name: string; desc: string }[], same = false) =>
    `${BORNAS_STYLE_LINE}. A character pose sheet on a plain pure white background: the same character in ${poses.length} poses side by side in one row (or two rows), each pose clearly separated with empty white space, full body, side view facing right, same scale, feet visible (a pose described as a bust is head and shoulders facing the viewer instead). Character: ${desc}. Poses in order: ${poses.map((p, i) => `${i + 1}) ${p.desc}`).join("; ")}. Exactly ${poses.length} figures. Each held item appears once, never doubled. No text, no captions, no labels, no ground shadows, no background scenery.${same ? BORNAS_SAME_PERSON : ""}`,
  ITEM_SHEET: (items: { desc: string }[], cols: number, rows: number) =>
    `${BORNAS_STYLE_LINE}. A sprite sheet on a plain pure white background with exactly ${items.length} separate items in a ${cols}×${rows} grid, read left to right, top to bottom, each item whole and not cut off, empty white space between items, side view facing right, consistent scale within kinds. Items in order: ${items.map((it, i) => `${i + 1}) ${it.desc}`).join("; ")}. No text, no captions, no labels, no ground shadows.`,
  FIX_SHEET: (items: { desc: string }[], cols: number, rows: number, same: boolean) =>
    `${BORNAS_STYLE_LINE}. A sprite sheet on a plain pure white background with exactly ${items.length} separate figures in a ${cols}×${rows} grid, read left to right, top to bottom. Each one drawn once, whole, never cut off by the edge, never doubled, with nothing held twice, empty white space between them, side view facing right. Items in order: ${items.map((it, i) => `${i + 1}) ${it.desc}`).join("; ")}. No text, no captions, no labels, no icons, no ground shadows.${same ? BORNAS_SAME_PERSON : ""}`,
  BACKGROUND: (desc: string) => `${BORNAS_STYLE_LINE}. A 16:9 background scene at eye level: ${desc}. No people, no animals, no vehicles, no text. Keep the lower third open flat ground where characters can stand.`,
} as const;
