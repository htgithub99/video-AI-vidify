import _ from "lodash";
export const MOTION_VIDEO_GENRES = { AUTO: "auto", STORY: "story", HORROR: "horror", HISTORY_MAP: "history_map", WHAT_IF: "what_if", EXPLAINER: "explainer", DOCUMENTARY: "documentary", KIDS: "kids" } as const;
export type MotionVideoGenre = (typeof MOTION_VIDEO_GENRES)[keyof typeof MOTION_VIDEO_GENRES];
export const MOTION_VIDEO_GENRE_TEXT = {
  vi: {
    LABEL: "Thể loại",
    HINT: "Định hướng cách dựng: hình ảnh ưu tiên, nhịp, âm thanh. Tự động = AI tự suy ra từ nội dung.",
    OPTIONS: { auto: "Tự động", story: "Truyện kể", horror: "Truyện ma / kinh dị", history_map: "Lịch sử / chiến tranh (bản đồ)", what_if: "Lịch sử giả định (What-if)", explainer: "Giải thích / khoa học", documentary: "Tin tức / tài liệu", kids: "Thiếu nhi" },
  },
  en: {
    LABEL: "Genre",
    HINT: "Steers visuals, pacing and sound. Auto = AI infers it from the content.",
    OPTIONS: { auto: "Auto", story: "Story", horror: "Ghost / horror", history_map: "History / war (map)", what_if: "What-if history", explainer: "Explainer / science", documentary: "News / documentary", kids: "Kids" },
  },
} as const;
const DIRECTIVES: Record<Exclude<MotionVideoGenre, "auto">, string> = {
  story: "Narrated story. Scenes carry almost every beat; characters speak their own lines when the source quotes them; graphics only for a title, chapter cards or a rare key number. Pace follows the emotion of each moment.",
  horror: "Ghost / horror story. Build dread slowly: night, dim interiors, fog, long corridors, empty rooms; reveal threats late, small and half hidden; short sentences with pauses before each reveal; low ambient drones, creaks and sharp stingers on reveals; almost no graphics; no gore.",
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
export const motionVideoGenreDirective = (value: unknown): string => {
  const genre = motionVideoGenre(value);
  return genre === MOTION_VIDEO_GENRES.AUTO ? "" : `VIDEO GENRE (chosen by the user, authoritative over any genre or format you would infer; the source content still decides the facts): ${DIRECTIVES[genre]}`;
};
