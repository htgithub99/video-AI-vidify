import { BORNAS_CHAPTER, BORNAS_LIMITS, BORNAS_SEO, BORNAS_REVIEW_CONTEXT, BORNAS_SAME_PERSON } from "./bornasConfig.js";
import { motionLanguage } from "../../../lib/motionLanguage.js";
import type { BornasAnalysis, BornasBackground, BornasGenre, BornasLanguage, BornasLine, BornasScript, BornasSprite, BornasTopic } from "../types/bornas.js";
export const BORNAS_ARTIFACT = {
  ANALYZE: "bornas-analyze",
  SCRIPTS: "bornas-scripts",
  STYLE: "bornas-style",
  TRIM: "bornas-trim",
  MATCH: "bornas-match",
  ASSETS: "bornas-assets",
  SPRITE_REVIEW: "bornas-sprite-review",
  SNAP_REVIEW: "bornas-snap-review",
  SEO: "bornas-seo",
  BG_MEASURE: "bornas-bg-measure",
  BG_SCALE: "bornas-bg-scale",
  SHOTS: "bornas-shots",
  FACTS: "bornas-facts",
  REPLACE: "bornas-replace",
} as const;
const SUBJECT: Record<BornasTopic, string> = {
  world: "each script follows a different person from any country and era",
  ww: "each script follows a different person of WW1 or WW2: commanders and leaders, but also ordinary soldiers, medics, pilots, tank crews, snipers, spies, nurses, children and civilians; several scripts may share one battle or campaign (Verdun, the Somme, Gallipoli, Stalingrad, Midway, Normandy…) when each tells a different person's side of it",
  ancient: "each script follows a different person of the ancient world (rulers, generals, legionaries, gladiators, slaves, priests, merchants); scripts may share one war or city when the people differ",
  medieval: "each script follows a different person of the Middle Ages (kings, knights, archers, peasants, monks, Vikings, Mongol riders); scripts may share one campaign when the people differ",
  eastasia: "each script follows a different person of East Asian history (emperors, generals, samurai, ninja, farmers, scholars, concubines); scripts may share one war when the people differ",
  vietnam: "each script follows a different person of Vietnamese history (kings, generals, soldiers, farmers, scholars, women warriors); scripts may share one dynasty or war when the people differ",
  modern: "each script follows a different person or job of the modern world (soldiers, rescuers, pilots, athletes, workers, famous people)",
  game: "each script follows a different main or memorable character of a different real, well-known video game (a different franchise each time; RPG, shooter, action, horror, survival, fighting, strategy…), told with that game's own story facts",
  wildwest: "each script follows a different person of the American frontier (outlaws, lawmen, scouts, pioneers, cowboys, Native Americans, gamblers, railroad workers); scripts may share one town or event when the people differ",
  anime: "each script follows a different famous character from public-domain stories, legends or history, told as an anime life story (for example Sherlock Holmes, Miyamoto Musashi, Robin Hood, Hua Mulan, Sun Wukong, King Arthur, Dracula, the Count of Monte Cristo); never a copyrighted character from modern manga, anime, films or games",
};
const PICK = 'Pick the most gripping life for this channel, not only famous or controversial people: a lesser-known side character, an ordinary soldier, a child or a medic can make the strongest video. Every script is about a clearly different person; the "hero" field names that person.';
const TOPIC: Record<BornasTopic, string> = {
  world: "world history (any era or country: ancient, medieval, Asian dynasties, world wars, modern history)",
  ww: "World War I and World War II",
  ancient: "the ancient world (Rome, Greece, Egypt, Persia, Celts, Han–Qin China)",
  medieval: "medieval Europe, Vikings, Crusades and the Mongols",
  eastasia: "the history of Japan, China and Korea (samurai and shoguns, Chinese dynasties, Korean kingdoms, Mongolia)",
  vietnam: "Vietnamese history from Văn Lang to the Nguyễn dynasty, the French colonial era and 1945–1975",
  modern: "the modern world today (jobs, armies, cities, technology)",
  game: "the stories of characters from real video games",
  wildwest: "the American Wild West 1850–1900 (outlaws, sheriffs, settlers, frontier towns)",
  anime: "famous characters of public-domain literature, legend and history, retold in anime style",
};
const GENRE: Record<BornasGenre, string> = {
  bornas: 'Genre "If you were born as…": the hero\'s whole life from birth to death in second person ("you"), each life stage opened by an age, a place and a year.',
  survive: "Genre \"Why you wouldn't survive…\": put the listener into one dangerous place and time through the hero's eyes; step by step the dangers that kill most people there, with the real odds or death tolls when sources give them, and how the hero did or did not get through.",
  worst: 'Genre "The worst time / job in history": through the hero, rank the most miserable conditions of that time, place or job from bad to worst, each step a concrete scene of daily life backed by sources.',
  day: 'Genre "24 hours as…": one real or typical day of the hero, hour by hour from waking to sleep, each line opened by the clock time, ending on the event that made that day famous or deadly.',
  whatif: 'Genre "What if…": first tell what really happened at one turning point of the hero\'s life, then clearly mark the switch ("but what if…") and follow the most likely other outcome step by step; keep real facts and the speculation clearly apart.',
};
const ORIGINAL_DESIGN = 'The characters come from real games, but every picture is an original design of the same role, era and genre: never copy a game character\'s signature face, hairstyle, costume, colour scheme, emblem, logo or weapon design, and never put game titles or logos in any picture. In every "desc" describe the original look, never name the game or the character.';
const SCRIPT_SHAPE =
  "Every script: facts checked and dated (say when sources disagree), second person, present tense, a hook with 3 shocking beats, then the turn, then the story in order with each stage opened by a time or place, 2–3 planted details each called back once, a one-line verdict, a recap, a closing question for the comments. Show actions, never name feelings. Violence only as falls or silhouettes, never gore. Never invent quotes, vows, plans, motives, numbers or comparisons: only events, words and numbers that sources record.";
const languageRules = (language: BornasLanguage): string => {
  const l = motionLanguage(language);
  return [`Write every "text", "screen", "sub", "title" and "series" in ${l.promptName}.`, ...l.styleGuide, l.numbers === "spoken" ? 'Write numbers and years in words in "text" so the voice reads them; put digits only in "screen".' : 'Write numbers and years with digits in "text"; the voice reads them.'].join(" ");
};
const noFurniture = (desc: string): string => desc.replace(/\s*\b(?:in|on|into|onto)\s+(?:a|an|the|his|her|their)?\s*(?:[a-z-]+\s+)?(?:bed|cot|chair|bench|stool|sofa|couch)\b/gi, "").trim();
const JSON_ONLY = "Return only one JSON object, no markdown, no explanation.";
export const BORNAS_BUST_LOOKS: Record<string, string> = {
  r: "three-quarter view turned to the right, calm, mouth closed",
  talk: "three-quarter view turned to the right, talking, mouth open, serious",
  l: "three-quarter view turned to the left, worried frown, mouth closed",
  fierce: "three-quarter view turned to the right, angry and determined, jaw set, eyes narrowed",
  shock: "three-quarter view turned to the left, shocked, eyes wide, mouth open",
  smile: "three-quarter view turned to the right, warm proud smile",
};
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
  SCRIPTS: (a: { count: number; topic: BornasTopic; genre: BornasGenre; language: BornasLanguage; seconds: number; rate: number; rhythm: string; analysis: BornasAnalysis; avoid: string[]; channel: string }) =>
    [
      `Write ${a.count} new video scripts for the YouTube channel "${a.channel}" in ${motionLanguage(a.language).promptName}. Topic of the channel: ${TOPIC[a.topic]}.`,
      `Each script is one video of about ${a.seconds} seconds of narration (the voice reads about ${a.rate.toFixed(1)} ${motionLanguage(a.language).unit.promptName} per second, so between ${Math.round(a.seconds * a.rate * 0.8)} and ${Math.round(a.seconds * a.rate * 0.9)} of them in all lines together; a script under the lower number makes the video too short, in about ${Math.round(a.seconds / BORNAS_LIMITS.LINE_TARGET_SECONDS)} short lines; cut chapters rather than go over).`,
      a.seconds < BORNAS_CHAPTER.MIN_SECONDS ? "A short video keeps only: the hook with 3 shocking beats, the turn, 3–4 life stages told in quick short lines, one verdict and the closing question; no recap and no planted callbacks." : "",
      `${GENRE[a.genre]} Use the sample only for its rhythm, devices and on-screen text habits, not for its formula.`,
      `Narration card (follow it closely): ${a.analysis.narration}`,
      `On-screen text habits: ${a.analysis.texts}`,
      a.avoid.length ? `Already made on this channel, do not repeat these subjects: ${a.avoid.join("; ")}. Never mention them anywhere in the new script, its title or hook.` : "",
      `Subjects: ${SUBJECT[a.topic]}. ${PICK}`,
      SCRIPT_SHAPE,
      `${a.rhythm} ${languageRules(a.language)}`,
      'Every year, age, date or count on screen belongs to that exact line: the line says it, or it is the age or year of the very moment the line describes (checked against the hero\'s birth year); never a number from another moment, and never a place or name tag on a line about something else.',
      'For each line: "screen" = the on-screen text for that moment (an age, a place and year, a name, a number) or "" when none; "sub" = an optional small second line; "kind" = "tag" (age/time, corner), "plate" (place, title, fact), "label" (a person\'s name with an arrow), "quote" (words a person really said, recorded by sources; the screen shows them in a speech bubble) or "none"; "idea" = what the picture shows (who, doing what, where), concrete; "pause" = true on the last line of the hook and of each chapter. Never spend a line reading a chapter title aloud (no "Chapter one: …" lines); open a chapter with its time or place instead.',
      a.seconds >= BORNAS_CHAPTER.MIN_SECONDS ? `"chapter" = a short chapter title (2–5 words, channel language, no number, no "Chapter") on the first line of each new life stage after the hook, shown silently on a black title card before that line; between 3 and ${BORNAS_CHAPTER.MAX} chapters, "" on every other line and always "" on the first line.` : '"chapter" = "" on every line.',
      `JSON: {"scripts": [{"title": string (YouTube title in the channel language), "hook": string (one line summary), "hero": string (who the main character is, with ages shown), "series": string (short corner tag in capitals, at most ${BORNAS_LIMITS.SERIES_MAX} characters, e.g. "BILLY THE KID · MIỀN TÂY"), "lines": [{"text": string, "screen": string, "sub": string, "kind": "tag"|"plate"|"label"|"none", "idea": string, "pause": boolean, "chapter": string}]}]}`,
      JSON_ONLY,
    ]
      .filter(Boolean)
      .join("\n\n"),
  REPLACE: (scripts: BornasScript[], replace: number[], topic: BornasTopic, avoid: string[]) =>
    [
      `These video scripts repeat subjects. Write new scripts to replace scripts ${replace.map((i) => `#${i + 1}`).join(", ")}, about people who are not in this list: ${avoid.join("; ")}.`,
      `Subjects: ${SUBJECT[topic]}. ${PICK} Keep the same language, genre, style, length and line fields as the others.`,
      `Scripts:\n${JSON.stringify(scripts.map((s, i) => ({ n: i + 1, title: s.title, hero: s.hero })))}`,
      `Example of the full shape:\n${JSON.stringify(scripts[0])}`,
      'JSON: {"scripts": [full scripts in the same shape, one per replaced number, in order]}',
      JSON_ONLY,
    ].join("\n\n"),
  STYLE: (script: BornasScript, issues: string[], rhythm: string) =>
    [
      `This script does not match the sample's narration rhythm. Measured problems: ${issues.join("; ")}.`,
      `${rhythm} Rewrite the lines to fix every problem: split long sentences into short ones and fragments, turn some statements into a question answered by the next line, keep every fact, planted detail and callback, add no new facts, quotes or numbers, keep the total length about the same and keep every line's fields.`,
      `Script:\n${JSON.stringify(script)}`,
      'JSON: {"title": string, "hook": string, "hero": string, "series": string, "lines": [same shape as the input lines]}',
      JSON_ONLY,
    ].join("\n\n"),
  FACTS: (script: BornasScript, topic: BornasTopic) =>
    [
      topic === "game" ? "This script retells a real video game's story: the sources are the game itself, its official lore and well-documented wikis; story events count as facts, but nothing may be added that the game does not show or say." : "",
      'Fact-check this video script line by line against well-documented sources (search the web if you can). Flag every line that states something wrong, unproven or invented: wrong dates, ages or numbers, events that did not happen, invented quotes, vows, holidays, motives or comparisons, people placed where sources do not put them. Rewrite each flagged line with only what sources support, keep the same language, second person and fields, and never make a line longer than it was: when a detail is unproven, drop it or move it to the next line instead of hedging inside a long sentence; say that sources disagree at most twice in the whole script, in a short line of its own ("Sources disagree." / "Nobody knows for sure."), and fix its on-screen text to match. Also check every line: the number in "screen" must equal the number said in "text", a quote shown on screen must be one that sources record, and spelling must be correct. A line of kind "quote" must be words the person is recorded saying (if sources disagree or attribute them to someone else, change kind to "plate" or "none" and say it as reported speech).',
      `Script:\n${JSON.stringify(script)}`,
      'JSON: {"title": string, "hook": string, "hero": string, "series": string, "lines": [same shape as the input lines], "fixed": [line numbers that were changed]}',
      JSON_ONLY,
    ]
      .filter(Boolean)
      .join("\n\n"),
  TRIM: (script: BornasScript, have: number, max: number) =>
    [
      `This script has ${have} words but the video length allows at most ${max}. Shorten it to at most ${max} words: drop the least important life stages, side details and whole lines; never merge lines into longer sentences, every line keeps the rhythm limit of the original, keep the hook, the turn, the planted details with their callbacks, the verdict, the recap and the closing question. Keep the same line fields and style.`,
      `Script:\n${JSON.stringify(script)}`,
      'JSON: {"title": string, "hook": string, "hero": string, "series": string, "lines": [same shape as the input lines]}',
      JSON_ONLY,
    ].join("\n\n"),
  ASSETS: (a: { script: BornasScript; items: string; backgrounds: string; analysis: BornasAnalysis; topic: BornasTopic }) =>
    [
      "Plan the pictures for this video. Pictures come from a shared cartoon library first; only what is missing gets drawn.",
      a.topic === "game" ? ORIGINAL_DESIGN : "",
      `Art style of the sample: ${a.analysis.art}`,
      `Script:\n${a.script.lines.map((l, i) => `${i + 1}. ${l.text} [picture: ${l.idea}]`).join("\n")}`,
      `Library sprites (name | kind | height m):\n${a.items}`,
      `Library backgrounds (name: description):\n${a.backgrounds}`,
      `Rules: main characters (the hero at each age, family, the main rival) are always new "cast" entries, never library sprites; give each cast entry 2–${BORNAS_LIMITS.POSES_MAX} poses the script needs (walk, run, sit, kneel, ride, aim, lying wounded…), side view; every action the script says the hero does at that age (learns to shoot, plays the piano, rides, writes, fights) gets its own pose of the hero doing it with the item, so that line can show the hero doing it. The hero's main adult age also gets a pose named "bust": head and shoulders only, three-quarter view facing the viewer, calm mouth, hands out of frame. A held item appears once (one gun, one flag), never doubled, with no letters on it. Poses never include furniture: a pose desc says "lying flat" or "sitting", never "in bed" or "on a chair"; the code puts the figure on the bed or chair of the scene. Every named person (cast or new item) must look clearly different from every other person in the video at a glance: different hat, hair or beard, coat colour and build, even brothers or comrades who dressed alike; say these differences in the desc. A pose that needs a companion is drawn together with it as one figure and its desc says so: riding includes the horse, leading a horse includes the horse and the rope, holding a baby includes the baby, driving includes the wagon or car. A pose that aims a weapon names who or what it aims at (an enemy, an animal being hunted, a target), never a family member or a friend. At most ${BORNAS_LIMITS.CAST_MAX} cast entries. Pick every library sprite and background that fits the era and place; list new items only when nothing in the library fits (max ${BORNAS_LIMITS.NEW_ITEMS_MAX}) and new backgrounds only for places the library lacks (max ${BORNAS_LIMITS.NEW_BG_MAX}). A planted object that is called back (a scarf, a ring, a letter) must exist as a drawn sprite, and so must every object a line says the hero has or lacks ("no guns, no horse": a revolver and a horse). Never list buildings or structures as items; backgrounds show them. Never list as items things the code makes: text, speech bubbles, signs with words, labels, arrows, maps, muzzle flashes, explosions, smoke, dust, fire glow, light beams or other effects.`,
      'JSON: {"cast": [{"id": string (short snake_case, e.g. "hero_14"), "desc": string (age, face, hair, clothes, era; full body), "heightM": number, "poses": [{"name": string (snake_case), "desc": string}]}], "items": [library sprite names], "backgrounds": [library background names], "newItems": [{"name": string (snake_case), "desc": string, "kind": "person"|"animal"|"vehicle"|"prop"|"structure"|"nature"|"weapon", "heightM": number (real height in metres of the object as drawn in side view: standing adult 1.75, horse with rider 2.4, revolver 0.15, glass 0.1, house 6)}], "newBackgrounds": [{"name": string (snake_case starting with bg_), "desc": string}]}',
      JSON_ONLY,
    ]
      .filter(Boolean)
      .join("\n\n"),
  MATCH_CROPS: (wanted: { name: string; desc: string }[], count: number) =>
    [
      `Attached is a contact sheet of ${count} numbered crops (number under each) cut from one generated sheet. The sheet was asked to contain these items:`,
      wanted.map((w) => `${w.name}: ${w.desc}`).join("\n"),
      "For each wanted item give the number of the crop that shows it whole. Use each crop at most once. Skip an item when no crop shows it, or when it is cut in pieces or merged with another item.",
      'JSON: {"items": [{"name": string, "crop": number}]}',
      JSON_ONLY,
    ].join("\n\n"),
  SPRITE_REVIEW: (sheets: { start: number; count: number }[], wanted: { n: number; want: string }[] = []) =>
    [
      `Attached are ${sheets.length} contact sheets of cut-out cartoon pictures. Every tile has a red number; tiles are numbered ${sheets.map((x) => `${x.start}–${x.start + x.count - 1}`).join(", ")}. On people a red box marks where code thinks the face is. ${BORNAS_REVIEW_CONTEXT}`,
      'For EVERY number return: place = how the thing is used in a scene: "ground" (stands, sits or lies on the floor: people, animals, vehicles, furniture, crates, buildings, trees), "wall" (hangs on a wall: poster, picture, sign, map, rifle rack), "table" (small object that sits on a table or shelf: lamp, book, bottle, box), "hand" (small object normally held: gun, knife, letter, coin), "icon" (a symbol, badge, emblem or game-like icon that is not a real object in the world); facing = "l" or "r": the way a person or animal looks or a vehicle points ("r" for objects without a front); text = true when letters or numbers are drawn on it; double = true when the same item appears twice or two separate items are stuck together; cut = true when part of it is cut off by the picture edge; for people only: face_ok = true when the red box covers the face (forehead to chin), and head = [x, y] the centre of the head in percent of the picture (0–100, from the top-left of the picture, not the tile); whole = true when the whole body down to the feet is drawn (false for a half body or a figure cut at the waist or knees); furniture = true when a bed, cot, chair, bench, stool or sofa is drawn together with the person; aims = true when the person points a gun, bow or spear forward.',
      'Also for EVERY number: posture (people only) = "stand", "sit" (on the ground or a seat), "kneel" (kneeling or crouching), "lie" or "ride" (on a horse or animal); flat = true for an object shown lying flat or horizontal (a rifle on the ground, a sword, a log, a lying body), false for upright things; group (people only) = who this person is in two or three words: side or nation plus role, e.g. "us cavalry soldier", "lakota warrior", "cowboy", "mexican vaquero", "townsfolk", "roman legionary", "samurai"; empty for things.',
      wanted.length
        ? `Each tile is supposed to show: ${wanted.map((w) => `#${w.n} ${w.want}`).join("; ")}. For every number also return is = what the tile really shows in a few words, and match = false when it is a different thing or a different kind of thing (a puddle instead of a wagon, a person instead of a vehicle, an object instead of a person, a missing animal the pose needs such as the horse being led); match = true when it is the item, even if the style or details differ.`
        : "",
      'JSON: {"items": [{"n": number, "place": string, "facing": "l"|"r", "text": boolean, "double": boolean, "cut": boolean, "face_ok": boolean, "head": [number, number], "whole": boolean, "furniture": boolean, "aims": boolean, "is": string, "match": boolean, "posture": "stand"|"sit"|"kneel"|"lie"|"ride", "flat": boolean, "group": string}]}',
      JSON_ONLY,
    ]
      .filter(Boolean)
      .join("\n\n"),
  SNAP_REVIEW: (sheets: { start: number; count: number }[], cast: { n: number; names: string[] }[], lines: { n: number; text: string }[]) =>
    [
      `Attached are ${sheets.length} sheets of frames from a cartoon explainer video, one frame per shot, numbered ${sheets.map((x) => `${x.start}–${x.start + x.count - 1}`).join(", ")} (yellow number below each frame). ${BORNAS_REVIEW_CONTEXT} Check every frame against this list and report only real problems:`,
      `Figures in each frame from left to right (sprite names): ${cast.map((c) => `#${c.n}: ${c.names.join(", ")}`).join("; ") || "none"}.`,
      `Narration heard during each frame: ${lines.map((l) => `#${l.n}: "${l.text}"`).join("; ") || "none"}.`,
      "1) a text, arrow, tail or object sits on a face, two texts overlap, or a text points at the wrong thing (a place name or a title pointing at a person, a name pointing at the wrong person, a tail running into a body or into the object it names instead of stopping just above it); 2) text that does not fit the picture (a chapter title shown as a person's name, a quote shown as a sign); 3) a person or object floating above or sunk into the floor, or standing inside a wall or building; 4) wrong size: a person bigger than a door or house, a person tiny next to a desk, chair, stove or door, an object as big as a person when it should be small, a child bigger than an adult, a wagon, cart or car far taller than the people beside it, a talking head-and-shoulders portrait much smaller than usual and sunk to the bottom (never judge size on a close-up of one object over a blurred background: that is an insert); 5) the same object or person twice, or a cut-off person filling the frame with no face visible; 6) an empty or almost black frame; 7) white holes or white patches left inside a figure (between hair and neck, between arms and body); 8) someone walking or riding backwards, or facing away from the person they talk to; 9) a weapon pointed at a friend, a child or a family member; 10) figures overlapping each other; 11) a pose that does not fit the moment (aiming or fighting in a calm family scene, a figure that does not belong to the place or time, a tree, bush or rock added in front of a background that already shows them); 12) a person or object the narration of that frame does not name or need (a hat when the line is about a piano and a revolver, a stranger in a scene about the hero alone), or a portrait whose face mood is the opposite of the line (smiling at a death).",
      'For each problem give the fix: "tag" (move the text to a corner card), "drop_text" (remove the text), "wide" (show the whole scene instead of the close-up), "drop:<sprite>" (remove that figure: the extra copy, the out-of-place or wrongly sized figure, the wrong pose; never the only figure or the object the shot is about), "flip:<sprite>" (turn that figure to face the other way: walking backwards, facing away, a weapon aimed at a friend), "apart" (spread overlapping figures). Use sprite names exactly as listed. Frames without problems are not listed.',
      'JSON: {"issues": [{"n": number, "problem": string, "fix": string}]}',
      JSON_ONLY,
    ].join("\n\n"),
  BG_SCALE: (names: string[]) =>
    [
      `Attached are ${names.length} background pictures numbered #1–#${names.length} (${names.join(", ")}). On each, the same adult cowboy (1.75 m tall) is pasted on every numbered standing spot (red number under his feet).`,
      "For each picture judge: scale = how many times the cowboy should be resized so he matches the real size of the doors, desks, chairs, stoves, fences, wagons and buildings around him (1 = right; 1.4 = he must be 40 % taller; 0.7 = 30 % smaller); judge from things standing near his feet, not from far away. bad = spot numbers where he stands in water, inside a wall, a building or furniture, on a roof or in mid-air.",
      'JSON: {"bgs": [{"n": number, "scale": number, "bad": [number]}]}',
      JSON_ONLY,
    ].join("\n\n"),
  BG_MEASURE: (names: string[]) =>
    [
      `Attached are ${names.length} background images numbered #1–#${names.length} (${names.join(", ")}). Each is drawn on a 1920×1080 grid: red x labels on top, blue y labels on the left, lines every 100 px (y every 50 px). ${BORNAS_REVIEW_CONTEXT}`,
      'For each background measure in grid pixels: ground = [y at x=320, y at x=960, y at x=1600] where a standing adult\'s feet touch the walkable floor nearest the viewer (null where there is no floor); person = [height in px of a 1.75 m adult standing at each of those three points] judged from doors, windows, fences, furniture, horses; spots = up to 6 good standing points [x, y, personHeightPx] on the floor (feet position), spread left to right, never inside a wall, building, water or furniture; walls = [[x0, x1, y]] wall areas where a picture or poster can hang (y = its bottom edge); table = [x0, x1, y] the top surface of a table, bar or shelf, or null; water = y of the water line, or null; rails = [x0, y0, x1, y1] two points (left and right end in the picture) on the nearest rail where train wheels touch it, or null; boats = [x0, x1, y] the open water nearest the viewer where a boat floats, clear of docks and piers (y = the waterline of that boat), or null; seats = beds, benches, sofas and chairs drawn in the picture, each {k: "bed"|"bench"|"sofa"|"chair", x0, x1, y} with y = the top of the mattress or seat; refs = up to 6 things of known real size standing on the floor or ground (doors and doorways, tables and desks, bar counters, chairs, barrels, fences, wagon wheels, wood stoves, beds), each with x = its centre, top = y of its top edge and bottom = y where it touches the floor, both measured at the same front edge; horizon = y of the eye-level line where floor lines, road edges and other parallel lines meet in the distance (null if it cannot be seen).',
      'JSON: {"bgs": [{"n": number, "ground": [number|null, number|null, number|null], "person": [number, number, number], "spots": [[number, number, number]], "walls": [[number, number, number]], "table": [number, number, number] | null, "water": number | null, "rails": [number, number, number, number] | null, "boats": [number, number, number] | null, "seats": [{"k": string, "x0": number, "x1": number, "y": number}], "refs": [{"k": "door"|"table"|"counter"|"chair"|"barrel"|"fence"|"wagon_wheel"|"stove"|"bed", "x": number, "top": number, "bottom": number}], "horizon": number}]}',
      JSON_ONLY,
    ].join("\n\n"),
  SHOTS: (a: { lines: { index: number; text: string; idea: string; screen: string; sub: string; kind: BornasLine["kind"]; words: string[]; start: number; end: number }[]; sprites: BornasSprite[]; backgrounds: BornasBackground[]; analysis: BornasAnalysis; first: boolean; last: boolean }) =>
    [
      "You are the director of a cartoon explainer video in the style of the sample. Plan BEATS (what the picture shows) for these narration lines. Code does all positions, camera numbers, shot cuts, light and text placement from your beats, following the sample's grammar; you only choose content.",
      `Shot grammar of the sample: ${a.analysis.shots}`,
      `Text habits of the sample: ${a.analysis.texts}`,
      `Lines (index. text | picture | on-screen | words with index):\n${a.lines.map((l) => `${l.index}. ${l.text} | ${l.idea} | ${l.kind !== "none" && l.screen ? `${l.kind}: ${l.screen}${l.sub ? ` / ${l.sub}` : ""}` : "-"} | ${l.words.map((w, k) => `${k}:${w}`).join(" ")} (${(l.end - l.start).toFixed(1)} s)`).join("\n")}`,
      `Sprites (name | kind | height m | place | posture | group | what):\n${a.sprites.map((s) => `${s.name} | ${s.kind} | ${s.heightM} | ${s.ann?.place || "ground"} | ${s.ann?.posture || s.posture || "-"} | ${s.ann?.group || "-"} | ${s.desc.slice(0, 140)}`).join("\n")}`,
      "Extras and crowds must belong to the group the line is about (US cavalry with cavalry, Lakota with Lakota, townsfolk in a town): never mix in a figure of another group (a cowboy, a vaquero or an outlaw among soldiers). Pick the hero's pose by posture: a seated pose only when the line says the person sits; the same pose is used at most twice in a row, then another pose or framing.",
      `Backgrounds (name | what | standing spots, wall, table, furniture already drawn in it):\n${a.backgrounds.map((b) => `${b.name} | ${b.desc} | ${b.ann ? `${b.ann.spots.length} spots${b.ann.walls.length ? ", wall" : ""}${b.ann.table ? ", table" : ""}${b.ann.seats?.length ? `, has ${b.ann.seats.map((x) => x.k).join(", ")}` : ""}` : "-"}`).join("\n")}`,
      "Trains go only on backgrounds that show rails and boats only on backgrounds with water; code puts them on the rails or the water. Furniture and structures already drawn in a background are used as they are: never add a sprite of the same furniture, building, pier, dock, fence or rails to that background; a person lying or sitting on it is placed there by code.",
      [
        "A beat starts on a word {line, word}: the first word of a line or the key noun/verb inside it. Usually one beat per line; a new beat whenever the place, the people or the action changes; hook lines get 2–3 beats each, every beat a different picture (another place, subject or action, never the same subject in the same place twice in a row). Beats in time order, covering every line. Code keeps one place with the same people as one continuous shot and moves the camera to each person or object the line names, so do not split a beat only to move the camera.",
        'cast: who/what is in the picture; each person appears once per shot (never two sprites of the same person, never a different age of the same person) and always at the age of that moment in the story (a teenage sprite is never used in a later life stage, an adult sprite never in childhood); max 4 main figures plus at most one crowd group (a 1920 px frame holds about 4 standing people side by side; riders and vehicles take twice the room): {sprite, slot "l"|"cl"|"c"|"cr"|"r", place "ground"|"wall"|"table"|"near" (near = dropped beside the subject), dir "l"|"r" (who looks where; people talking face each other), move "l"|"r" only for walking/riding/running across, crowd n (2–5 extras of that kind; code draws them from different library pictures), swap [{sprite, line, word}] to change the same person\'s pose exactly on that word}. Never the same sprite twice. Cast only the people and objects the line names or the scene needs; never cast a building, house, church, barn, tower or other structure, and never a tree, bush, rock, cactus or grass the line does not name (the background already shows the place and its nature). Every beat needs a person or the object the line is about; never an empty background unless the line names only the place. When the line says the hero (or another person) does something, cast that person at the right age in the pose doing it (aiming at the target, playing the piano), never the object alone. When the line names two or three objects ("the piano and the revolver"), cast every one of them in that beat.',
        'subject: index in cast of who the line is about. frame: "wide" when a place or a group is introduced, "medium" for two people interacting, "close" on the person or object named. cam: "push" (default), "pull" (pull back on loss, death, emptiness). Code holds, then moves once per line to what is named and back.',
        'kind "bust": head-and-shoulders talking portrait of the hero over a blurred background — use the hero\'s bust sprite as cast[0] (name ends in "_b_r", "_b_talk", "_b_l", "_b_fierce", "_b_shock", "_b_smile" or "_bust"); use it only for the hero\'s thoughts, the turn line and emotional peaks: at most one beat in six, never two bust beats in a row, and pick the bust whose mood fits the line (_b_fierce angry, _b_shock shocked, _b_smile proud or happy, _b_l worried, _b_talk speaking, _b_r calm). When the line says what the hero does, use a scene with the hero\'s action pose instead of a bust.',
        'Text, only from the line\'s on-screen text, at most one per beat: tag {text, sub, corner "tl"|"tr", line, word} for ages and dates; plate {text, sub, at (cast index it points at, or null for a scene-wide name), line, word} for places and facts; label {text, sub, cast, line, word} for a person\'s name; text is the short name people use (one or two words, at most 14 characters), the rest goes in sub. When a plate names a thing the hero does not have or loses ("NO GUNS", "NO HORSE"), word the plate as NO + that object: code shows the object crossed out instead of the words, so the object must be in the sprites. Only a line marked as a recorded quote (kind "quote") may become a bubble {text (max 6 words), cast, line, word}; never invent or shorten words into a quote. Weapons never point at a friend or a child: an archer or gunman faces the enemy or away.',
        "Light: focus {line, word} only for a person who stands still when named (spotlight that then fades), dark 0–0.45 for night or sad beats, warm (fire, home), cool (night, cold), smoke, flash {line, word} on gunshots and impacts, shake {line, word} on hits, bar {label, from, to, line, word} for a survival or odds meter.",
        'Special beats: kind "rew" just before the turn line (code replays the hook places with a rewind effect); kind "paper" {lines: [{text, size "h"|"n"|"l", line, word}], stamp {text, line, word}} for a document or a big number; kind "montage" {bgs, caps} for the recap; kind "black" with an optional plate.',
        "Effects are code: never use a sprite of a muzzle flash, explosion, smoke, speech bubble or sign with words as cast. Never use a glow to stand in for an object or blood; a planted object at its callback is the drawn sprite, close on it.",
        a.first ? "These are the first lines: open with the strongest, most shocking picture." : "",
        a.last ? "These are the last lines: the final beat gets endCard {text, sub, line, word}: a short call to comment (e.g. who should be next), never the same words as a line's on-screen text." : "",
      ]
        .filter(Boolean)
        .join("\n"),
      'JSON: {"beats": [{"line": number, "word": number, "kind": "scene"|"bust"|"rew"|"paper"|"montage"|"black", "bg": string, "cast": [{"sprite": string, "slot": string, "place": string, "dir": "l"|"r", "move": "l"|"r", "crowd": number, "swap": [{"sprite": string, "line": number, "word": number}]}], "subject": number, "frame": "wide"|"medium"|"close", "cam": "push"|"pull", "tag": {...}, "plate": {...}, "label": {...}, "bubble": {...}, "focus": {...}, "dark": number, "warm": boolean, "cool": boolean, "smoke": boolean, "flash": {...}, "shake": {...}, "bar": {...}, "paper": {...}, "montage": {...}, "endCard": {...}}]}',
      JSON_ONLY,
    ].join("\n\n"),
  CAST_SHEET: (style: string, desc: string, poses: { name: string; desc: string }[], same = false) =>
    `${style}. A character pose sheet on a plain pure white background: the same character in ${poses.length} poses side by side in one single row, each pose clearly separated with empty white space, every figure as tall as possible, from near the top edge to near the bottom edge of the image, full body, side view facing right, same scale, feet visible, every companion a pose mentions (horse, baby, wagon, rope) drawn with that pose as one connected figure (a pose described as a bust is head and shoulders facing the viewer instead). Character: ${desc}. Poses in order: ${poses.map((p, i) => `${i + 1}) ${noFurniture(p.desc)}`).join("; ")}. Exactly ${poses.length} figures. Each held item appears once, never doubled. Never draw furniture with a figure (no bed, cot, chair, bench, stool or sofa): a lying figure lies flat on nothing, a sitting figure sits on nothing; the scene already has the furniture. No text, no captions, no labels, no ground shadows, no background scenery.${same ? BORNAS_SAME_PERSON : ""}`,
  BUST_TRIPLE: (style: string, desc: string, views: readonly string[]) =>
    `${style}. A character sheet: the same character drawn ${views.length} times; each drawing is a medium shot from the top of the head down to the middle of the chest, as tall as the full image height, the head near the top edge and the chest cut off flat by the bottom edge of the image, shoulders fully inside the drawing. Character: ${desc}. Drawings in order: ${views.map((v, i) => `${i + 1}) ${BORNAS_BUST_LOOKS[v]}`).join("; ")}. Exactly ${views.length} drawings side by side in one row, clearly separated with empty white space, same scale, plain pure white background. No hands raised, no held items in front of the face. No text, no captions, no labels, no frame, no shadows, no background scenery.`,
  BUST_SINGLE: (style: string, desc: string, pose: string) => `${style}. ${desc}. ${pose}. One single large bust portrait, head and shoulders only, three-quarter view facing the viewer, centred, filling most of the image height, on a plain pure white background. No text, no letters, no frame, no other people, no shadow on the ground.`,
  ITEM_SHEET: (style: string, items: { desc: string }[], cols: number, rows: number) =>
    `${style}. A sprite sheet on a plain pure white background with exactly ${items.length} separate items in a ${cols}×${rows} grid, read left to right, top to bottom, each item whole and not cut off, empty white space between items, side view facing right, consistent scale within kinds. Items in order: ${items.map((it, i) => `${i + 1}) ${it.desc}`).join("; ")}. No text, no captions, no labels, no ground shadows.`,
  FIX_SHEET: (style: string, items: { desc: string }[], cols: number, rows: number, same: boolean) =>
    `${style}. A sprite sheet on a plain pure white background with exactly ${items.length} separate figures in a ${cols}×${rows} grid, read left to right, top to bottom. Each one drawn once, whole, never cut off by the edge, never doubled, with nothing held twice, empty white space between them, side view facing right. Never draw furniture with a figure (no bed, cot, chair, bench, stool or sofa): a lying figure lies flat on nothing, a sitting figure sits on nothing; the scene already has the furniture. Items in order: ${items.map((it, i) => `${i + 1}) ${noFurniture(it.desc)}`).join("; ")}. No text, no captions, no labels, no icons, no ground shadows.${same ? BORNAS_SAME_PERSON : ""}`,
  SEO: (a: { title: string; hero: string; lines: string[]; language: BornasLanguage; genre: BornasGenre; seconds: number; chapters: string[]; avoid: string[] }) =>
    [
      `Prepare YouTube SEO for an animated history explainer in second person ("what if you were born as…"). Write titles, descriptions, tags, hashtags, the pinned question and the thumbnail texts in ${motionLanguage(a.language).promptName}.`,
      `Working title: ${a.title}. Main character: ${a.hero}. Length: ${Math.floor(a.seconds / 60)} min ${Math.round(a.seconds % 60)} s; when a title states the length, say ${Math.max(1, Math.round(a.seconds / 60))} minute(s), never more.`,
      `Narration:\n${a.lines.join("\n")}`,
      a.chapters.length ? `Chapters, in order: ${a.chapters.join("; ")}.` : "",
      `Write ${BORNAS_SEO.OPTIONS} clearly different options, best first. ${a.genre === "bornas" ? `Option 1 follows the pattern "What If You Were Born as <name>? | <short context>" in the target language; option 2 follows "Live <name>'s Entire Life in <N> Minutes" in the target language.` : "Option 1 is a curiosity question about the character's fate; option 2 promises the whole story in a few minutes."} Titles max ${BORNAS_SEO.TITLE_MAX} characters, the name early. Descriptions: 2 hook lines with the main keywords, then 2–4 short lines about what the viewer lives through; no chapter list, no links.`,
      a.avoid.length ? `This channel's earlier titles, do not reuse their wording: ${a.avoid.map((t) => `"${t}"`).join("; ")}.` : "",
      `Thumbnail texts: "word" = 1–3 words, max ${BORNAS_SEO.WORD_MAX} characters, the strongest dramatic turn of this life that the script really tells (like "BETRAYED", "RAISED BY OUTLAWS", "GOD KILLER"); "name" = the shortest name viewers know the character by, max ${BORNAS_SEO.NAME_MAX} characters.`,
      "Everything must be true to the narration: no promise the video does not keep, no invented events. Never mention AI, voices or any tool used to make the video.",
      'JSON: {"options": [{"title": string, "description": string, "hashtags": [3-5 strings starting with #], "tags": [10-15 strings], "seoScore": number 0-100}], "pinned": string (one question that invites comments), "word": string, "name": string}',
      JSON_ONLY,
    ]
      .filter(Boolean)
      .join("\n\n"),
  BABY: (style: string, desc: string) =>
    `${style}. On a plain pure white background: this character as a newborn baby at age 0, sitting in a simple wooden crib, front view facing the viewer, a cross angry frown, arms crossed, whole crib visible and not cut off. The baby wears only simple baby clothes of the era (a plain gown or swaddle): no hat, no weapon, no belt, no adult costume. Same face features and hair colour as the reference picture of this character: ${desc}. No text, no captions, no ground shadow, no room behind.`,
  BACKGROUND: (style: string, desc: string) => `${style}. A 16:9 background scene seen from a standing adult's eye height (about 1.6 m), the horizon in the middle third of the picture, furniture and doors at real size: ${desc}. No people, no animals, no vehicles, no text. Keep the lower third open flat ground where characters can stand.`,
} as const;
