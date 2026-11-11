export const MOTION_SOUND_DIRECTION = {
  SPACE: " ",
  SOUND_FLAG: "soundPuppet",
  SOUND_VERSION: 1,
  ABORTED: "aborted",
  HORROR_RE: /horror|ghost|kinh|ma|tâm linh|ghost_tale/i,
  PROMPT: (p: { genre: string; horror: boolean; beats: string }): string =>
    [
      "This is an illustrated narrated video. The pictures may cover multiple sentences or part of a sentence; match sound to the spoken event, not an invented new picture for every sentence. A representative picture need not animate every incidental action.",
      p.genre ? "GENRE: " + p.genre + (p.horror ? ". Horror: low ambience beds for night places, sharp accents on reveals and sudden events, creaks, wind, distant bells, knocks; leave short silences before reveals." : "") : "",
      "BEATS (lines = spoken text in order, pictures = representative visual units with shot, people, pose, object, light and overlays; a shared unit may appear in several beats): " + p.beats,
      "A visible ghost or shadow reveal may get a stinger accent at its spoken event and a low ambience bed before it. Do not repeat that accent merely because the same visual continues into the next beat. Pictures with steam, smoke, fire, rain or water get the matching sound.",
      "For each beat choose silence or up to four justified sound events: supported physical actions, weather, place ambience or a restrained accent for a reveal. Set at (0..1 of the beat) near its spoken event. Do not invent footsteps for static people or sounds for things merely mentioned, remembered or negated. No required event count; soundSilence:true explicitly confirms silence.",
      'Return JSON {"beats":[{"id":"beat id","soundEvents":[...],"soundSilence":false}]}.',
    ]
      .filter(Boolean)
      .join("\n"),
} as const;
