export const MOTION_AUDIO_DIRECTION = {
  MODES: ["film", "storytelling", "documentary", "explainer", "mixed"] as const,
  ARTIFACT: "motion-audio-casting",
  MAX_CONTEXT: 24000,
  SFX_VOLUME: 0.5,
  SOUND_OFFSETS: { film: { ambience: 0, action: 0, character: 0, accent: 0 }, storytelling: { ambience: -5, action: -3, character: -2, accent: -5 }, documentary: { ambience: -6, action: -5, character: -3, accent: -8 }, explainer: { ambience: -6, action: -4, character: -3, accent: -5 }, mixed: { ambience: -3, action: -2, character: -1, accent: -3 } },
  NARRATION: {
    film: "Character dialogue drives scenes; narrator only for existing narration. Preserve speaker identity and motivated reactions.",
    storytelling: "An expressive narrator carries the story; quoted dialogue uses the attributed character voice. Never read scene descriptions as character dialogue.",
    documentary: "Clear restrained narration; only verified attributed quotes use other voices. Never invent dialogue.",
    explainer: "Clear concise explanatory narrator; other speakers only when the script explicitly assigns them.",
    mixed: "Follow the speaker and purpose of each scene, retaining stable character voices across segments.",
  },
  SOUND: {
    film: "Diegetic ambience and foley follow visible actions or justified offscreen sources; reserve accents for motivated events.",
    storytelling: "Keep narration foremost; restrained ambience and details support scenes without illustrating every noun in narration.",
    documentary: "Quiet real ambience and supported action sounds; avoid fictional vocal reactions and automatic impact/whoosh on cuts.",
    explainer: "Sparse purposeful sounds for demonstrated actions or meaningful graphic changes; prioritize intelligibility.",
    mixed: "Adapt ambience and action sounds to each scene; do not automatically put whooshes on camera cuts.",
  },
  CONTEXT: "AUTOMATIC AUDIO DIRECTION: ",
} as const;
export const MOTION_AUDIO_CAST_PROMPT = `Read the complete script and source-derived video analysis to direct audio automatically. Distinguish film, storytelling, documentary, explainer or mixed from the actual content, not the number of visible characters. Respect an explicit source-derived format and factual flag. Return JSON {audioDirection:{mode,narrationStyle,soundStyle},roles:[{speaker:"narrator or exact cast key",voiceId:"exact supplied catalogue id",gender:"male|female only when supported by character evidence",age:"child|adult|senior only when supported",reason:"source clue and catalogue suitability"}]}. Select appropriate available voices using catalogue gender, description, accent and reading character; use the narrator style and script audience. Keep character gender from analysis authoritative. Distinguish elderly, child, female and male where matching available profiles exist, without inventing age metadata for a preset. One character keeps one voice throughout; use distinct voices when possible. Only select catalogue ids. Never use a voice with a known incompatible gender. Narration is not spoken by whoever happens to be onscreen. Do not invent speech, audio references or unavailable voices. This is an audio plan, not QA scoring or a request for manual input.`;
