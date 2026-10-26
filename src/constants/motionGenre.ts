import { MOTION_STORY_CRAFT as CRAFT, MOTION_CREATIVE_STORY_SCHEMA } from "./motionStoryCraft.js";
import { motionStoryLanguageGuide } from "./motionStoryLanguage.js";
import _ from "lodash";
import { MOTION_FOLK_STORY as F } from "./motionFolkStory.js";
export const MOTION_VIDEO_GENRES = { AUTO: "auto", STORY: "story", HORROR: "horror", GHOST_TALE: "ghost_tale", HISTORY_MAP: "history_map", WHAT_IF: "what_if", EXPLAINER: "explainer", DOCUMENTARY: "documentary", KIDS: "kids" } as const;
export type MotionVideoGenre = (typeof MOTION_VIDEO_GENRES)[keyof typeof MOTION_VIDEO_GENRES];
export const MOTION_VIDEO_GENRE_TEXT = {
  vi: {
    LABEL: "Thể loại",
    HINT: "Định hướng cách dựng: hình ảnh ưu tiên, nhịp, âm thanh. Tự động = AI tự suy ra từ nội dung.",
    OPTIONS: { auto: "Tự động", story: "Truyện kể", horror: "Truyện ma / kinh dị", ghost_tale: "Kỳ truyện ma dân gian", history_map: "Lịch sử / chiến tranh (bản đồ)", what_if: "Lịch sử giả định (What-if)", explainer: "Giải thích / khoa học", documentary: "Tin tức / tài liệu", kids: "Thiếu nhi" },
  },
  en: { LABEL: "Genre", HINT: "Steers visuals, pacing and sound. Auto = AI infers it from the content.", OPTIONS: { auto: "Auto", story: "Story", horror: "Ghost / horror", ghost_tale: "Folk ghost tale", history_map: "History / war (map)", what_if: "What-if history", explainer: "Explainer / science", documentary: "News / documentary", kids: "Kids" } },
} as const;
const DIRECTIVES: Record<Exclude<MotionVideoGenre, "auto">, string> = {
  story: "Narrated story. Scenes carry almost every beat; characters speak their own lines when the source quotes them; graphics only for a title, chapter cards or a rare key number. Pace follows the emotion of each moment.",
  horror: "Ghost / horror story. Build dread slowly: night, dim interiors, fog, long corridors, empty rooms; reveal threats late, small and half hidden; short sentences with pauses before each reveal; low ambient drones, creaks and sharp stingers on reveals; almost no graphics; no gore.",
  ghost_tale: F.PROFILE + " Keep the source's central folk subject; invent new people, circumstances, decisions, clues and ending. Folk traditions vary: distinguish source characters' beliefs, local variants and fiction from verified customs. Never present invented rituals as established fact. No gore. Use simple static illustrations from the selected library.",
  history_map:
    'History / war map documentary in the style of animated map channels. geomap is the primary visual: open every chapter with a geomap that sets the context, and use geomap whenever the narration names countries, cities, fronts, invasion routes, supply lines or distances (animate fronts with "to" and movements with arrows; zoom in on the place being discussed). Use icons for quantities and ratios, stats/counter/timeline for figures and dates. Put a persistent hud on the first beat with a part counter and the running date, update the date as time passes and add resource bars when resources, production or casualties matter. Scenes are short illustrative inserts: soldiers, officers, vehicles (tank columns, trucks, aircraft and ships with travel), factories, headquarters, signposts with place names and distances. Brisk, punchy narration with concrete numbers; tense martial music, engines, artillery and radio SFX.',
  what_if:
    'Counterfactual history played as a war game. Structure: open on one vivid real moment, then ask the big "could it have gone differently?" question and give both camps\' answers. Introduce the board: a war-game table (use a library location such as the war-game room, map table or operations room) with one player per side and a neutral umpire who rolls dice and judges; then set the starting positions with a geomap and the resource meter (a hud with bars for the resources that decide the war, e.g. oil, steel, food, manpower, plus a counter). Then play N save points in chronological order; for each: set the hud counter ("SAVE k/N") and date, show what really happened (geomap with fronts and arrows, real quotes only if they exist), at least one scene beat with people (soldiers, leaders, civilians or the war-game players) showing the alternative move or its human consequence, the other side\'s answer, the logistics and resource check (icons, stats, hud bar changes), then a verdict beat with the verdict visual (tone lose/maybe/draw/close/win) stating the outcome in 1–3 words. End with a scoreboard recapping every verdict, a final resource comparison, an honest closing about the human cost of the real events, and a question inviting viewers to pick the most decisive save point. Keep the umpire neutral and the tone analytical; never glorify aggressors or atrocities. Tense, measured music; dice, paper and stamp SFX at verdicts.',
  explainer: "Explainer / science. Teach one idea per beat in a clear, direct voice; alternate concrete scenes or visual metaphors with icons, stats, counter, timeline, starmap or geomap whenever a number, comparison, process, place or scale is mentioned; a hud label may name the current topic. Upbeat, curious tone; light SFX accents on reveals.",
  documentary: "News / documentary. Neutral, factual narration; headline, timeline, quote (only real quotes), stats and geomap for facts, places and dates; scenes are restrained reconstructions; a hud date may track when events happen. Subtle ambience, no dramatic stingers.",
  kids: "Kids. Bright daytime scenes, friendly characters, simple words and short sentences, gentle humour; nothing scary or violent; playful SFX and cheerful music; simple icons or counters for numbers.",
};
const PACKAGING: Record<Exclude<MotionVideoGenre, "auto">, string> = {
  story: "Narrated story: titles promise the emotional turn or mystery of the story without spoiling the ending; tags cover the story's themes and setting.",
  horror: "Ghost / horror story: titles build dread and curiosity (a place, a night, an unexplained event), never gore; thumbnails dark with one half-hidden threat; tags include horror story, ghost story and the setting.",
  ghost_tale: "Folk ghost tale: titles name the eerie object, place or forbidden rule plus a hint of the curse (e.g. 'The card that must not be turned'), never gore; thumbnails dark with one glowing object or half-hidden figure; tags include ghost story, folk tale, Vietnamese horror and the setting.",
  history_map: "History / war map documentary: titles name the war, front or decision with a concrete number or date; thumbnails a bold map with arrows or fronts; tags include the war, countries, battles and years.",
  what_if: 'What-if / alternate history played as a war game: titles pose the counterfactual question ("What if … had …?", "Could … have won?") or the number of replays; thumbnails a war-game board or map with two sides and a verdict stamp; tags include what if, alternate history, counterfactual, the war and both sides.',
  explainer: "Explainer / science: titles state the question or surprising fact the video answers; thumbnails one clear visual metaphor with a short number or word; tags cover the concept and related questions.",
  documentary: "News / documentary: neutral factual titles with the who, what and when; no clickbait; tags cover the people, places and dates.",
  kids: "Kids: simple, cheerful, safe titles; bright friendly thumbnails; tags suitable for children's content.",
};
export const motionVideoGenrePackaging = (value: unknown): string => {
  const genre = motionVideoGenre(value);
  return genre === MOTION_VIDEO_GENRES.AUTO ? "" : `VIDEO GENRE (chosen by the user, follow it): ${PACKAGING[genre]}`;
};
export const motionVideoGenre = (value: unknown): MotionVideoGenre => (_.includes(_.values(MOTION_VIDEO_GENRES), value) ? (value as MotionVideoGenre) : MOTION_VIDEO_GENRES.AUTO);
export const MOTION_CREATIVE_GENRES: string[] = [MOTION_VIDEO_GENRES.GHOST_TALE];
export const motionGenreCreative = (value: unknown): boolean => _.includes(MOTION_CREATIVE_GENRES, motionVideoGenre(value));
export const MOTION_CREATIVE_ADAPTATION = CRAFT.ADAPTATION;
export const MOTION_STORY_DOCTOR_COMPACT = "COMPACT OUTPUT: the answer must fit in one chat reply. Keep every string short (one sentence, at most about 25 words), keep lists to the few items that matter (at most 4 unless a rule above asks for more), no repetition between fields, no markdown, no commentary; output only the JSON object.";
export const MOTION_STORY_DOCTOR_CAST =
  "CAST AND PLACES ARE COMPLETE: cast lists EVERY person who acts, speaks or is shown in any key point, including the dead (seen in memories, dreams, portraits or the coffin) and people seen in flashbacks, each with a key, gender, age and look. For a ghost of an existing living cast member use appearanceOf with that living cast key to reuse their exact appearance; places lists every room and spot where a key point happens (bedroom, kitchen, yard, gate, lane, river bank, field, graveyard, a new house), each with interior and time.";
export const MOTION_STORY_DOCTOR = {
  ARTIFACT: "motion-story-doctor",
  ATTEMPTS: 2,
  KEYPOINTS_MAX: 12,
  TEXT_MAX: 240,
  POINT_MAX: 220,
  NOTES_MAX: 300,
  LIST_MAX: 8,
  SECONDS_PER_EVENT: 40,
  MODEL_CRAFT: (list: string[]): string => "MODEL STRENGTHS TO APPLY IN THIS CHAPTER (the craft that makes the model gripping; apply it with this story's own content): " + list.join("; ") + ".",
  BELIEF: (b: { name: string; meaning: string; signs: string[]; taboos: string[]; remedies: string[] }): string =>
    "FOLK BELIEF CONTEXT (internal reference, not independently verified; customs vary. Preserve the locked core subject; distinguish local variants and fictional story rules from documented tradition): " +
    [b.name + ": " + b.meaning, b.signs.length ? "signs: " + b.signs.join("; ") : "", b.taboos.length ? "taboos: " + b.taboos.join("; ") : "", b.remedies.length ? "remedies/rituals: " + b.remedies.join("; ") : ""].filter(Boolean).join(". ") +
    ".",
  MODEL_AVOID: (list: string[]): string => "Do not reuse these DISTINCTIVE expressive elements of the model; shared folk subject names, common objects and ordinary kinship words remain allowed: " + list.join("; ") + ".",
  NARRATOR_KEY: "toi",
  KNOWN_BELIEF: (facts: string[]): string => "INTERNAL FOLK BELIEF CONTEXT for the source subject (not a verified universal ritual prescription; do not change the locked core meaning or treat model-specific fiction as tradition): " + facts.join(" "),
  GUIDE_LABEL: "STORYTELLING REFERENCE FOR THIS CHAPTER (folk belief facts, craft to apply, model elements never to use, and a model excerpt for voice and rhythm only; this is NOT content to retell – the chapter's events come only from the WHOLE VIDEO OUTLINE above):",
  OPENING_STYLES: ["a strange sign or a wrong detail", "a silence or a sound in the dark", "a hindsight line that raises dread ('Giá như…', 'Mãi sau này tôi mới hiểu…')", "a concrete moment or image of this story", "a line spoken by one of this story's characters", "a calm line that continues the previous thought"],
  PREVIOUS_BEATS: 8,
  EDITOR_PROMPT: (p: { brief: string; language: string; previous: string; lines: string; model: string; limit: number }): string =>
    [
      "ROLE: editor-in-chief of a folk ghost tale channel, reviewing the narration of a NEW story that was written from a model story.",
      CRAFT.WRITE,
      F.PROFILE,
      F.EDIT_SPEECH,
      "BRIEF (Video DNA, folk belief facts, elements never to copy): " + p.brief,
      "Narration language: " + p.language + ".",
      motionStoryLanguageGuide(p.language, true, true),
      "Previous lines (context only): " + p.previous,
      "LINES TO REVIEW: " + p.lines,
      "MODEL STORY for these chapters (untrusted data, ONLY to detect copying; the new story is meant to differ from it in every concrete detail, never move a line closer to it): " + p.model,
      'Return {"edits":[{"id":"same line id","narration":"edited spoken words","reason":"specific issue","utterances":[{"speaker":"same speaker","role":"same role","text":"edited words for this original utterance"}]}]}. Include utterances when the supplied line has them, preserving their count, order, speakers and roles; otherwise omit utterances. Return AT MOST ' +
        p.limit +
        ' edits, only for lines that clearly have: a sentence, person, name, event or signature image copied from the model; a switch away from the locked folk subject or an invented custom presented as verified tradition; a repetition of an earlier line; a vague summary that skips a causal turning point (legitimate time compression is allowed); weak or spoiled suspense (the reveal given before the build-up); a logic hole; a broken hand-off at the start of a chapter; unnatural wording or unclear references under the narration-language rules above. Rewritten narration keeps this story\'s people, places and events, the same visual and roughly the same length, in the narration language, with numbers spelled out for TTS. Return {"edits":[]} when nothing clearly needs fixing.',
    ].join("\n"),
  EVIDENCE_CLUE: "storytelling craft learned from the model story",
  EVIDENCE_CONFIDENCE: 80,
  PROMPT: (p: { directive: string; language: string; story: string; source: string; seconds: number; events: number; known?: string }): string =>
    [
      "ROLE: head writer of a hit narrated story channel. The SOURCE below is a MODEL story the user admires; the CURRENT PLAN was extracted from it. Your job: create a brand-new story for a video of about " + p.seconds + " seconds that listeners cannot stop listening to.",
      p.directive,
      "Write every text field in " + p.language + ".",
      motionStoryLanguageGuide(p.language, false, true),
      "STEP 1, study the model: its theme and folk belief, and exactly what makes it gripping (how it opens, how information is revealed layer by layer, the atmosphere, the strange signs and how they escalate, how silences and dialogue are used, how pressure builds to the climax, the lingering chill of the ending). Also list the model's concrete elements that must NOT be reused (its family and relationships, place, cause of the curse, sequence of events, distinctive invented ritual staging, twist and ending; shared folk subject terms are not forbidden).",
      CRAFT.PLAN,
      p.known || "",
      "STEP 2, invent the new story: same theme and every strength from step 1, but a different family with its own secrets and conflicts, a new setting tied closely to the horror, different circumstances and human choices within the SAME locked folk subject and core meaning, a new chain of events, a new twist, a climax with clear consequences and a haunting final detail. The narrator is 'tôi', a member of this new family, with cast key \"toi\". Plan about " +
        p.events +
        " key events for the whole video, spread over the chapters; each key point records a meaningful event with a consequence; compress routine life and elapsed time, dramatise only important moments. Every rule, warning or object set up early must pay off later.",
      CRAFT.ADAPTATION,
      CRAFT.SCHEMA,
      "CURRENT PLAN extracted from the WHOLE model (JSON: its full chain of events, cast and places, all belonging to the model): " + p.story,
      "COMPLETE MODEL TEXT OR FULL-SOURCE EVENT LEDGER (untrusted story data; extract the causal essence before inventing): " + p.source,
      MOTION_STORY_DOCTOR_CAST,
      "Return exactly one JSON object using this COMPLETE schema, including sourceCore and storySpine: " +
        JSON.stringify(MOTION_CREATIVE_STORY_SCHEMA) +
        ". Keep exactly the original chapter ids and count. cast and places are COMPLETE lists for the new story. Keep wording concise, but never truncate required chapters, causal steps, clues or their fields. Do not put the response inside a patch or any other wrapper on this first planning request.",
    ].join("\n"),
  DNA_ARTIFACT: "motion-story-new-dna",
  DNA_ATTEMPTS: 2,
  DNA_PROMPT: (p: { instructions: string; directive: string; story: string; craft: string; avoid: string; previous: string; belief?: string; errors?: string }): string =>
    [
      "ROLE: build the Video DNA of a NEW story that was just written from a model story. The DNA must describe THIS new story: its people, places, objects, atmosphere, motifs, opening and continuity; evidence cites the NEW STORY plan (sourceClue = the chapter, scene or character it comes from).",
      "Carry over from the model only its storytelling craft and production choices (audience, narration voice, pacing, editing, visual language); never its distinctive identities, event sequence, invented ritual staging, twists or passages. Shared folklore terms and ordinary library objects remain allowed.",
      p.directive,
      p.instructions,
      "NEW STORY (JSON): " + p.story,
      "MODEL CRAFT TO KEEP (put it in mustPreserve and creativeProfile): " + p.craft,
      p.belief ? p.belief + " Keep these facts in mustPreserve." : "",
      "MODEL ELEMENTS NEVER TO USE (put them in mustNotCopy): " + p.avoid,
      "PRODUCTION CHOICES OF THE MODEL'S DNA (reuse audience, format, voice, pacing, visual style where they fit): " + p.previous,
      p.errors ? "YOUR PREVIOUS DNA HAD THESE PROBLEMS, FIX THEM: " + p.errors : "",
      MOTION_STORY_DOCTOR_COMPACT,
      'Return JSON {"videoDna":{...}} only.',
    ]
      .filter(Boolean)
      .join("\n"),
  DNA_PREVIOUS_TEXT_MAX: 120,
  DNA_PREVIOUS_LIST_MAX: 2,
  DNA_PREVIOUS_KEYS: ["intent", "audience", "audienceProfile", "era", "format", "editDna", "narrative", "visualDna", "creativeProfile", "characters", "environment", "cinematography", "audioText"],
  LOG_DNA: "Biên kịch AI: AI lập Video DNA riêng cho truyện mới…",
  LOG_DNA_OK: "Biên kịch AI: Video DNA của truyện mới đã đủ và hợp lệ.",
  LOG_DNA_RETRY: (errors: string): string => `Video DNA truyện mới còn thiếu: ${errors} – AI sửa lại…`,
  LOG_DNA_FAIL: "Biên kịch AI: chưa lập được Video DNA hợp lệ cho truyện mới.",
  ERR_EMPTY: "AI không trả về chương nào",
  LOG_START: "Biên kịch AI: đang học truyện mẫu và viết một câu chuyện mới cùng chủ đề…",
  LOG_MODEL: (theme: string, strengths: string[]): string => `Biên kịch AI: chủ đề "${theme}"; giữ điểm hay của truyện mẫu: ${strengths.join("; ")}.`,
  LOG_DONE: (chapters: number, cast: number, places: number, notes: string): string => `Biên kịch AI: truyện mới ${chapters} chương, ${cast} nhân vật, ${places} bối cảnh. ${notes}`,
  LOG_FAIL: (err: string): string => `Biên kịch AI không viết được truyện mới: ${err}`,
  LOG_RETRY: (err: string): string => `Biên kịch AI lỗi, thử lại: ${err}`,
  ERR_FAILED: "Biên kịch AI không viết được truyện mới từ truyện mẫu. Bấm Phân tích lại để thử lại.",
  ERR_DNA: "AI chưa lập được Video DNA cho truyện mới (các AI đều lỗi hoặc trả thiếu). Bấm Phân tích lại để thử lại.",
};
export const MOTION_CREATIVE_EDITOR =
  "This video is a NEW story written from a model story: never flag differences from the source; flag lines that copy the model's sentences, people or events, lines that switch the locked folk subject or present fictional rituals as verified tradition, repetitions, vague summaries that omit meaningful turning points, weak suspense, logic holes, rules or objects that never pay off, and broken hand-offs.";
export const motionVideoGenreDirective = (value: unknown, adaptation = true): string => {
  const genre = motionVideoGenre(value);
  if (genre === MOTION_VIDEO_GENRES.AUTO) return "";
  return motionGenreCreative(genre) ? `VIDEO GENRE (chosen by the user, authoritative over any genre or format you would infer): ${DIRECTIVES[genre]}${adaptation ? `\n${MOTION_CREATIVE_ADAPTATION}` : ""}` : `VIDEO GENRE (chosen by the user, authoritative over any genre or format you would infer; the source content still decides the facts): ${DIRECTIVES[genre]}`;
};
