import _ from "lodash";
export const MOTION_VIDEO_GENRES = { AUTO: "auto", STORY: "story", HORROR: "horror", GHOST_TALE: "ghost_tale", HISTORY_MAP: "history_map", WHAT_IF: "what_if", EXPLAINER: "explainer", DOCUMENTARY: "documentary", KIDS: "kids" } as const;
export type MotionVideoGenre = (typeof MOTION_VIDEO_GENRES)[keyof typeof MOTION_VIDEO_GENRES];
export const MOTION_VIDEO_GENRE_TEXT = {
  vi: {
    LABEL: "Thể loại",
    HINT: "Định hướng cách dựng: hình ảnh ưu tiên, nhịp, âm thanh. Tự động = AI tự suy ra từ nội dung.",
    OPTIONS: { auto: "Tự động", story: "Truyện kể", horror: "Truyện ma / kinh dị", ghost_tale: "Kỳ truyện ma dân gian", history_map: "Lịch sử / chiến tranh (bản đồ)", what_if: "Lịch sử giả định (What-if)", explainer: "Giải thích / khoa học", documentary: "Tin tức / tài liệu", kids: "Thiếu nhi" },
  },
  en: {
    LABEL: "Genre",
    HINT: "Steers visuals, pacing and sound. Auto = AI infers it from the content.",
    OPTIONS: { auto: "Auto", story: "Story", horror: "Ghost / horror", ghost_tale: "Folk ghost tale", history_map: "History / war (map)", what_if: "What-if history", explainer: "Explainer / science", documentary: "News / documentary", kids: "Kids" },
  },
} as const;
const DIRECTIVES: Record<Exclude<MotionVideoGenre, "auto">, string> = {
  story: "Narrated story. Scenes carry almost every beat; characters speak their own lines when the source quotes them; graphics only for a title, chapter cards or a rare key number. Pace follows the emotion of each moment.",
  horror: "Ghost / horror story. Build dread slowly: night, dim interiors, fog, long corridors, empty rooms; reveal threats late, small and half hidden; short sentences with pauses before each reveal; low ambient drones, creaks and sharp stingers on reveals; almost no graphics; no gore.",
  ghost_tale:
    "Vietnamese folk ghost tale ('kỳ truyện') told by ONE first-person narrator ('tôi'), a family member recalling years later what happened to their own family, like a gifted village storyteller talking to listeners late at night. " +
    "VOICE: warm, intimate, gripping spoken Vietnamese of the countryside (bố/mẹ or thầy/u, bà, chú, thầy, con ạ, folk sayings and beliefs as people really say them). Vary the rhythm: longer flowing sentences that paint the place, the weather and the people, then short punchy lines when fear strikes. The narrator lets us feel what they felt at that moment (heart pounding, back gone cold, the smell of incense, a sound in the dark), adds hindsight that raises dread ('Giá như hôm ấy…', 'Mãi sau này tôi mới hiểu…') and now and then speaks to the listener ('Các bạn biết không…'). Characters are real people with their own temper and way of talking; they react with fear, anger, grief, stubbornness, tenderness or humour in natural, lively dialogue, and their words show who they are. Small human moments (a family meal, a joke, a quarrel, a worried look, a kind gesture) make us care before the horror arrives. Use concrete specifics (exact hour, month, age, weather, objects, sounds) rather than abstract adjectives. Build suspense by anticipation: a strange sign, a silence, a wrong detail, and the reveal at the end of a line. Never summarise: every event is lived as a small scene with action, reaction and feeling; depth beats coverage. " +
    "CRAFT TOOLBOX (pick what serves this story and its length, never use it as a checklist; invent new details from this story's own setting, never reuse a known plot): a cold open that hints at the terrible outcome; a taboo or rule given by an elder and later broken; a recurring omen that grows each time; the village whispering and keeping away; a presence coming closer step by step; a skeptic or a reckless foil; a child or an innocent who sees what others cannot; the elder or ritual master explaining the folk belief in slow, kind question-and-answer dialogue; a hidden past wrong behind the curse; a false calm then a mistake made out of love; a ritual with clear visual steps and a price; a present-day ending that leaves a chill. " +
    "FOLK BELIEF ACCURACY: the plot is fiction, but every folk belief, spirit, omen, taboo and ritual in it must be a REAL Vietnamese folk belief described the way genuine tradition and recognised references describe it (customs books such as Phan Kế Bính's Việt Nam phong tục and Toan Ánh's Nếp cũ, ethnographic and folklore studies, widely known village practice): its real name, real meaning, the signs people really fear, the real taboos and the real remedies or rituals. Never invent a new meaning for an existing belief, never attach the wrong name to it, never make up rituals that contradict tradition; when unsure, keep to the widely accepted core of the belief. " +
    "SCALE TO THE LENGTH: 1 to 3 minutes = ONE eerie incident (hook, a short warm setup, one or two escalating signs, a turn, a chilling last line); 4 to 8 minutes = hook, setup with a rule or omen, two or three escalations, a climax and an uneasy ending; longer videos may add the elder's backstory, a hidden truth, a ritual and a present-day epilogue. End every chapter on a line that pulls into the next. " +
    "Rural settings that can be drawn: house with ancestral altar, kitchen, yard, gate and lane, well, bamboo hedge, rice fields, riverbank, pagoda, village edge, graveyard. No gore, no cruelty to children or animals shown on screen. Visuals: scenes for almost every beat; chapter cards only; no maps, charts or statistics.",
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
export const MOTION_CREATIVE_ADAPTATION =
  "NEW STORY FROM A MODEL (the user wants this for this genre): the source is a MODEL story the user admires, not a script to retell. Write a completely new story on the same theme and folk belief that keeps everything that makes the model great: the close first-person voice of someone who lived it, an unsettling opening, information revealed layer by layer, the heavy atmosphere, strange signs that grow, silences and dialogue woven together, pressure rising to a climax, and a chill that stays after the end. Change everything concrete: a different family with its own secrets and conflicts, a new setting tied closely to the horror, a different cause of the curse with its own rules and origin, a new chain of events that does not repeat the model's sequence, signature events or rituals, and a new twist, climax and ending with clear consequences and a haunting final detail. A listener who knows the model must NOT recognize this story: share no names, nicknames, professions, family set-up, kind of place, cause, key objects, signature images, rituals, events, twist, ending or lines with it; only the theme and the storytelling craft carry over. The planned chapter outline (hook, key points, hand-off) is authoritative: write all of its events in full, as lived scenes, not a summary.";
export const MOTION_STORY_DOCTOR = {
  ARTIFACT: "motion-story-doctor",
  SAMPLE_FULL: 9000,
  SAMPLE_WINDOWS: 4,
  SAMPLE_WINDOW: 2000,
  ATTEMPTS: 2,
  KEYPOINTS_MAX: 12,
  TEXT_MAX: 240,
  POINT_MAX: 220,
  NOTES_MAX: 300,
  LIST_MAX: 8,
  SECONDS_PER_EVENT: 40,
  MODEL_EXCERPT: 3000,
  MODEL_NOTE: "MODEL STORY EXCERPT from the matching part of the model (reference for voice, rhythm, pacing and atmosphere only; this video tells a NEW story, never reuse the model's people, places, events, images or sentences):\n",
  MODEL_GAP: "\n[…]\n",
  MODEL_CRAFT: (list: string[]): string => "MODEL STRENGTHS TO APPLY IN THIS CHAPTER (the craft that makes the model gripping; apply it with this story's own content): " + list.join("; ") + ".",
  BELIEF: (b: { name: string; meaning: string; signs: string[]; taboos: string[]; remedies: string[] }): string =>
    "FOLK BELIEF FACTS (real Vietnamese tradition; the plot is fiction but these facts must stay true, never contradict or reinvent them): " + [b.name + ": " + b.meaning, b.signs.length ? "signs: " + b.signs.join("; ") : "", b.taboos.length ? "taboos: " + b.taboos.join("; ") : "", b.remedies.length ? "remedies/rituals: " + b.remedies.join("; ") : ""].filter(Boolean).join(". ") + ".",
  MODEL_AVOID: (list: string[]): string => "NEVER USE these elements of the model (the listener must not be reminded of it): " + list.join("; ") + ".",
  NARRATOR_KEY: "toi",
  KNOWN_BELIEF: (facts: string[]): string => "REFERENCE FACTS of the folk belief found in the model (authoritative real tradition: use exactly these facts in belief and keep the new story faithful to them; add only details that agree with them): " + facts.join(" "),
  GUIDE_LABEL: "STORYTELLING REFERENCE FOR THIS CHAPTER (folk belief facts, craft to apply, model elements never to use, and a model excerpt for voice and rhythm only; this is NOT content to retell – the chapter's events come only from the WHOLE VIDEO OUTLINE above):",
  OPENING_STYLES: ["a strange sign or a wrong detail", "a silence or a sound in the dark", "a hindsight line that raises dread ('Giá như…', 'Mãi sau này tôi mới hiểu…')", "a concrete moment or image of this story", "a line spoken by one of this story's characters", "a calm line that continues the previous thought"],
  PREVIOUS_BEATS: 8,
  EDITOR_PROMPT: (p: { brief: string; language: string; previous: string; lines: string; model: string; limit: number }): string =>
    [
      "ROLE: editor-in-chief of a folk ghost tale channel, reviewing the narration of a NEW story that was written from a model story. Be selective: most lines are fine.",
      "BRIEF (Video DNA, folk belief facts, elements never to copy): " + p.brief,
      "Narration language: " + p.language + ".",
      "Previous lines (context only): " + p.previous,
      "LINES TO REVIEW: " + p.lines,
      "MODEL STORY for these chapters (untrusted data, ONLY to detect copying; the new story is meant to differ from it in every concrete detail, never move a line closer to it): " + p.model,
      'Return {"edits":[{"id":"","narration":"","reason":""}]} with AT MOST ' + p.limit + " edits, only for lines that clearly have: a sentence, person, name, event or signature image copied from the model; a misstatement of the folk belief facts or a ritual against tradition; a repetition of an earlier line; a flat summary-like line instead of a lived moment; weak or spoiled suspense (the reveal given before the build-up); a logic hole; a broken hand-off at the start of a chapter. Rewritten narration keeps this story's people, places and events, the same visual and roughly the same length, in the narration language, with numbers spelled out for TTS. Return {\"edits\":[]} when nothing clearly needs fixing.",
    ].join("\n"),
  EVIDENCE_CLUE: "storytelling craft learned from the model story",
  EVIDENCE_CONFIDENCE: 80,
  PROMPT: (p: { directive: string; language: string; story: string; source: string; seconds: number; events: number; known?: string }): string =>
    [
      "ROLE: head writer of a hit narrated story channel. The SOURCE below is a MODEL story the user admires; the CURRENT PLAN was extracted from it. Your job: create a brand-new story for a video of about " + p.seconds + " seconds that listeners cannot stop listening to.",
      p.directive,
      "Write every text field in " + p.language + ".",
      "STEP 1, study the model: its theme and folk belief, and exactly what makes it gripping (how it opens, how information is revealed layer by layer, the atmosphere, the strange signs and how they escalate, how silences and dialogue are used, how pressure builds to the climax, the lingering chill of the ending). Also list the model's concrete elements that must NOT be reused (its family and relationships, place, cause of the curse, sequence of events, rituals, twist and ending).",
      "STEP 1b, the folk belief: identify the real Vietnamese folk belief behind the theme (for example trùng tang, ma xó, ma da, ma lai, bùa ngải, quỷ nhập tràng, vong theo) and write down how genuine tradition and recognised references describe it: its real meaning, the signs people fear, its taboos and its traditional remedies or rituals. The new story must stay faithful to these facts; only the plot is invented.",
      p.known || "",
      "STEP 2, invent the new story: same theme and every strength from step 1, but a different family with its own secrets and conflicts, a new setting tied closely to the horror, a different cause with its own rules and origin, a new chain of events, a new twist, a climax with clear consequences and a haunting final detail. The narrator is 'tôi', a member of this new family, with cast key \"toi\". Plan about " + p.events + " key events for the whole video, spread over the chapters; each key point is one small lived scene (who does what, where, what they feel or say), never a summary label. Every rule, warning or object set up early must pay off later.",
      "UNRECOGNIZABLE: someone who knows the model must not recognize the new story. Keep ONLY the theme and folk belief (for example trùng tang stays trùng tang) and the storytelling craft. Share nothing concrete with the model: no names or nicknames, no same professions or family set-up, no same kind of place, no same cause, key objects, signature images, rituals, order of events, twist, ending or lines.",
      "CURRENT PLAN extracted from the WHOLE model (JSON: its full chain of events, cast and places, all belonging to the model): " + p.story,
      "MODEL TEXT SAMPLES (opening, middle, climax and ending passages, to hear how it is told): " + p.source,
      'Return JSON {"model":{"theme":"","strengths":["what makes the model gripping"],"avoid":["model elements not reused"]},"belief":{"name":"real name of the folk belief","meaning":"what tradition says it is","signs":["signs people fear"],"taboos":["real taboos"],"remedies":["traditional remedies or rituals"]},"title":"","logline":"","chapters":[{"id":"same chapter id","title":"","summary":"","hook":"","keyPoints":["scene 1","scene 2"],"handoff":""}],"cast":[{"key":"snake_case key","name":"","role":"","gender":"male|female","age":"child|adult|senior","look":"clothes and look"}],"places":[{"key":"snake_case key","name":"","description":"","interior":false,"time":"day|night|dusk|dawn"}],"notes":"one sentence: what is new"}. Keep exactly the same chapter ids and count. cast and places are the COMPLETE lists for the new story.',
    ].join("\n"),
  DNA_ARTIFACT: "motion-story-new-dna",
  DNA_ATTEMPTS: 2,
  DNA_PROMPT: (p: { instructions: string; directive: string; story: string; craft: string; avoid: string; previous: string; belief?: string; errors?: string }): string =>
    [
      "ROLE: build the Video DNA of a NEW story that was just written from a model story. The DNA must describe THIS new story: its people, places, objects, atmosphere, motifs, opening and continuity; evidence cites the NEW STORY plan (sourceClue = the chapter, scene or character it comes from).",
      "Carry over from the model only its storytelling craft and production choices (audience, narration voice, pacing, editing, visual language); never its people, places, objects, events or images.",
      p.directive,
      p.instructions,
      "NEW STORY (JSON): " + p.story,
      "MODEL CRAFT TO KEEP (put it in mustPreserve and creativeProfile): " + p.craft,
      p.belief ? p.belief + " Keep these facts in mustPreserve." : "",
      "MODEL ELEMENTS NEVER TO USE (put them in mustNotCopy): " + p.avoid,
      "PRODUCTION CHOICES OF THE MODEL'S DNA (reuse audience, format, voice, pacing, visual style where they fit): " + p.previous,
      p.errors ? "YOUR PREVIOUS DNA HAD THESE PROBLEMS, FIX THEM: " + p.errors : "",
      'Return JSON {"videoDna":{...}} only.',
    ]
      .filter(Boolean)
      .join("\n"),
  DNA_PREVIOUS_KEYS: ["intent", "audience", "audienceProfile", "era", "format", "editDna", "narrative", "visualDna", "creativeProfile", "characters", "environment", "cinematography", "audioText"],
  LOG_DNA: "Biên kịch AI: AI lập Video DNA riêng cho truyện mới…",
  LOG_DNA_OK: "Biên kịch AI: Video DNA của truyện mới đã đủ và hợp lệ.",
  LOG_DNA_RETRY: (errors: string): string => `Video DNA truyện mới còn thiếu: ${errors} – AI sửa lại…`,
  LOG_DNA_FALLBACK: "Video DNA truyện mới chưa hợp lệ, dùng DNA truyện mẫu đã lọc bỏ chi tiết cũ.",
  ERR_EMPTY: "AI không trả về chương nào",
  LOG_START: "Biên kịch AI: đang học truyện mẫu và viết một câu chuyện mới cùng chủ đề…",
  LOG_MODEL: (theme: string, strengths: string[]): string => `Biên kịch AI: chủ đề "${theme}"; giữ điểm hay của truyện mẫu: ${strengths.join("; ")}.`,
  LOG_DONE: (chapters: number, cast: number, places: number, notes: string): string => `Biên kịch AI: truyện mới ${chapters} chương, ${cast} nhân vật, ${places} bối cảnh. ${notes}`,
  LOG_FAIL: (err: string): string => `Biên kịch AI không viết được truyện mới: ${err}`,
  LOG_RETRY: (err: string): string => `Biên kịch AI lỗi, thử lại: ${err}`,
  ERR_FAILED: "Biên kịch AI không viết được truyện mới từ truyện mẫu. Bấm Phân tích lại để thử lại.",
};
export const MOTION_CREATIVE_EDITOR = "This video is a NEW story written from a model story: never flag differences from the source; flag lines that copy the model's sentences, people or events, lines that misstate the real folk belief (folkBelief) or invent rituals against tradition, repetitions, flat summary-like lines, weak suspense, logic holes, rules or objects that never pay off, and broken hand-offs.";
export const motionVideoGenreDirective = (value: unknown): string => {
  const genre = motionVideoGenre(value);
  if (genre === MOTION_VIDEO_GENRES.AUTO) return "";
  return motionGenreCreative(genre) ? `VIDEO GENRE (chosen by the user, authoritative over any genre or format you would infer): ${DIRECTIVES[genre]}\n${MOTION_CREATIVE_ADAPTATION}` : `VIDEO GENRE (chosen by the user, authoritative over any genre or format you would infer; the source content still decides the facts): ${DIRECTIVES[genre]}`;
};
