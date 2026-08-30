export const CINEMATIC_POLICY_CONFIG = {
  MIN_BEAT_COUNT: 3,
  MAX_BEAT_COUNT: 5,
  CLIP_DURATION_SECONDS: 10,
  MIN_CLIP_DURATION_SECONDS: 3,
  MAX_CLIP_DURATION_SECONDS: 15,
  PLANNING_CHUNK_SIZE: 2,
  CLIENT_PLANNING_ATTEMPTS: 3,
  EPSILON_TOLERANCE: 0.25,
  MIN_DIALOGUE_SCENE_RATIO: 0.3,
} as const;

export const CINEMATIC_PLANNING_MESSAGES = {
  VI_RETRY: "[Đạo diễn phim] Kế hoạch chưa đủ shot, continuity hoặc thoại; AI đang viết lại toàn bộ.",
  EN_RETRY: "[Film direction] The plan is missing shots, continuity, or dialogue; AI is rewriting the complete plan.",
  VI_REQUIRED: "AI chưa trả đủ kế hoạch phim có shot, continuity và thoại nhân vật. Đã dừng trước khi tạo clip để tránh xuất một bộ phim sai nội dung.",
  EN_REQUIRED: "AI did not return a complete film plan with shots, continuity, and character dialogue. Production stopped before clip generation to prevent an incoherent film.",
  VI_PREFLIGHT_START: "[Kiểm tra trước khi tạo] Đang duyệt toàn bộ prompt, 3–5 shot, thoại, continuity và an toàn nội dung.",
  EN_PREFLIGHT_START: "[Preflight] Reviewing every prompt, 3–5 shots, dialogue, continuity, and content safety.",
  VI_PREFLIGHT_PASSED: "[Kiểm tra trước khi tạo] Toàn bộ clip đã đạt yêu cầu; mỗi clip chỉ được gửi tạo đúng một lần.",
  EN_PREFLIGHT_PASSED: "[Preflight] Every clip passed; each clip will be submitted for generation exactly once.",
  VI_PREFLIGHT_FAILED: "Kế hoạch phim chưa vượt qua kiểm tra bắt buộc trước khi tạo. Không clip nào được gửi đi nên chưa sử dụng credit video.",
  EN_PREFLIGHT_FAILED: "The film plan did not pass the mandatory preflight. No clip was submitted, so no video credit was used.",
  VI_CHARACTER_PACK_START: "[Character Pack] Đang tạo ảnh nhận diện chuẩn cho từng nhân vật trước khi dùng credit video.",
  EN_CHARACTER_PACK_START: "[Character Pack] Creating canonical identity references before any video credit is used.",
  VI_CHARACTER_PACK_READY: "[Character Pack] Ảnh nhân vật đã được lưu; mỗi cảnh sẽ chỉ tải lên các nhân vật thực sự xuất hiện.",
  EN_CHARACTER_PACK_READY: "[Character Pack] Character references are saved; each scene will upload only its visible characters.",
  VI_CHARACTER_PACK_FAILED: "Không thể hoàn thành ảnh nhận diện nhân vật. Đã dừng trước khi tạo clip để tránh video sai nhân vật.",
  EN_CHARACTER_PACK_FAILED: "The character identity pack could not be completed. Production stopped before clip generation to avoid inconsistent characters.",
} as const;

export const CINEMATIC_CHARACTER_PACK_CONFIG = { REFERENCE_COUNT_PER_CHARACTER: 1, MAX_CHARACTERS: 3 } as const;

export const CINEMATIC_PROMPT_PREFLIGHT_CONFIG = {
  MIN_WORDS: 180,
  MAX_WORDS: 520,
  FORBIDDEN_PATTERN: /one continuous (?:coherent )?(?:editorial )?shot|no internal cut|single[- ]take|Video motion direction:|--ar\s/i,
} as const;

export const resolveCinematicClipDuration = (value?: string | number): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value || ""));
  if (!Number.isFinite(parsed)) return CINEMATIC_POLICY_CONFIG.CLIP_DURATION_SECONDS;
  return Math.min(CINEMATIC_POLICY_CONFIG.MAX_CLIP_DURATION_SECONDS, Math.max(CINEMATIC_POLICY_CONFIG.MIN_CLIP_DURATION_SECONDS, parsed));
};

export const CINEMATIC_POLICY_REQUIRED_FIELDS = [
  "sequenceId",
  "shotId",
  "shotRole",
  "dialogueMode",
  "characterBlocking",
  "eyelineDirection",
  "screenDirection",
  "actionStartState",
  "actionEndState",
  "locationState",
  "wardrobeState",
  "propState",
] as const;

export const CINEMATIC_TECHNICAL_FOUNDATION =
  "Cinematic live-action photorealism, natural human skin texture, physically plausible environment, realistic materials, motivated practical lighting, restrained filmic contrast, subtle atmospheric depth, grounded production design. Shot on 35mm anamorphic lens, 24fps, cinematic depth of field, natural motion blur.";

export const CINEMATIC_DEFAULT_SCENE_CONTEXT = "The scene takes place in a grounded cinematic environment with realistic atmospheric depth.";

export const CINEMATIC_DEFAULT_DIEGETIC_SFX = "natural footsteps, physical movement, and atmospheric room tone";

export const CINEMATIC_DEFAULT_SOUND_CUES = ["diegetic room tone ambience", "subtle footsteps and environmental movement", "cinematic atmosphere soundscape"] as const;

export const CINEMATIC_TEXT_FREE_POLICY =
  "Completely text-free. No captions, subtitles, signs, labels, letters, numbers, logos or watermarks. Full-bleed cinematic frame with no borders, margins, letterboxing or pillarboxing.";

export const CINEMATIC_DEFAULTS = {
  CHARACTER_BLOCKING: "Subject positions into the scene",
  EYELINE_DIRECTION: "Looking forward",
  SCREEN_DIRECTION: "Left to right",
  ACTION_START_STATE: "Opening scene position",
  ACTION_END_STATE: "Completed action aftermath",
  LOCATION_STATE: "Established cinematic environment",
  WARDROBE_STATE: "Established character costume and gear",
  PROP_STATE: "Established character props",
  VISIBLE_ACTION: "Action unfolds",
  REACTION: "Visible reaction",
  LOCATION_LOCK: "unchanged set geography",
  WARDROBE_LOCK: "unchanged wardrobe and wear state",
  PROP_LOCK: "unchanged prop ownership, hand and condition",
  LIGHTING_LOCK: "unchanged motivated light direction and time",
  STATIC_AXIS: "static_axis",
  ESTABLISHED_EYELINE: "established eyeline",
  PREVIOUS_FINAL_POSE: "the exact final pose of the previous clip",
} as const;

export const CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE = (language: string, targetDuration: string): string => `
[DEDICATED AI FILM SCREENPLAY CONTRACT]
You are the head screenwriter and story editor for a ${targetDuration} original film, not a narrator-led YouTube video.
- Write playable screen events in ${language === "vi" ? "natural contemporary Vietnamese" : "natural contemporary English"}. Characters must have distinct vocabulary, rhythm, status and subtext appropriate to their world.
- Build a concrete protagonist objective, opposing force, escalating choices, an irreversible midpoint/turn, climax caused by the protagonist's decision, and an earned visual aftermath.
- Open inside a playable situation rather than explaining the world. Reveal lore through what characters attempt, fear, joke about, conceal, discover or pay for. Establish one concrete object, destination, threat or promise early and keep returning to its changing condition until the payoff.
- Build ensemble chemistry through contrast: each recurring character has a recognizable conversational tactic, such as blunt challenge, dry humor, caution, deflection, command or curiosity. Dialogue must change the relationship, plan or available information; never let several characters paraphrase the same fact.
- Alternate pressure and release. After danger, allow a short human reaction, joke, disagreement or practical task; after calm, introduce a visible warning or decision. Humor must emerge from character and circumstance without cancelling real stakes.
- A silent stretch is still dramatic action. Use listening, preparation, spatial exploration, exchanged looks, prop handling and environmental response to create anticipation instead of filling every second with speech.
- Use an A/B story only when the secondary line changes how the main line is understood: for example, heroes discover an objective while an opposing group reveals why it matters. Enter the secondary line on a shared prop, threat, destination or decision and return with new dramatic pressure; never intercut unrelated exposition.
- Every approximately ten-second clip unit contains at least three (and up to five in dense action/dramatic tension sequences) chronological, editable camera setups from one continuous event: setup/objective, action/obstacle, consequence/payoff. Each setup changes the visible information; never fill runtime with a person merely walking, looking, standing, holding an object or explaining the plot.
- Select the 3-to-5 setup coverage by scene function: dialogue uses spatial master -> speaker/prop coverage -> listener reaction or changed decision; discovery uses approach/context -> evidence insert/reveal -> consequence reaction; action uses geography/threat -> decisive contact/evasion -> physical result and new position. Do not force all characters to move simultaneously and do not cut merely because a timer elapsed.
- VEO-SAFE DIRECTORIAL ACTION DESIGN: Clarity outranks spectacle. Generate footage using 35mm anamorphic cinematic framing at 24fps with realistic physics. Never ask one generated clip to simulate an incoherent crowd collision, impossible vehicle acrobatics or chaotic multi-character melee. Decompose action into 3 to 5 low-complexity, high-impact chronological shots: (1) readable geography plus threat/intent, (2) one short decisive movement by one foreground subject, (3) physical impact/reaction, and (4) stable aftermath or changed decision. Use inserts, silhouettes, off-screen impact, dust/light/environmental response and production sound to imply Hollywood scale.
- Keep no more than two clearly articulated foreground performers in physical conflict. Other forces remain distant, soft-focus, occluded, silhouetted or represented by their effect on the environment. Use one movement direction and one action axis; keep feet grounded, hand/weapon ownership explicit and the camera stable enough to read anatomy.
- Prefer concise speakable dialogue, interruptions, silence and reactions. No exposition speeches, generic motivational lines, trailer narration, omniscient summary or repeated statement of facts already visible.
- Dialogue must be short enough for natural lip-sync inside its planned shot. Preserve the exact chosen output language and never mix languages unless the story explicitly requires it.
- The finished film must use character dialogue and production sound, never narration or voice-over. Convey exposition through playable conversation, behavior, props and consequences. A beat without dialogue is silent_action with diegetic ambience; off_screen_dialogue is allowed only when the named speaker is physically present in the same location.
- SCREENPLAY OUTPUT LOCK: Write the actual playable screenplay, not prose describing what the film would show. Every chapter must contain concrete scene action plus natural character dialogue. Attribute every spoken line to a named character. Do not write a narrator, narration paragraphs, voice-over, explanatory commentary, YouTube hook, synopsis, recap or phrases such as "we see", "the audience learns", "câu hỏi là", or "liệu rằng". Important story information must be discovered through a character's decision, conversation, physical evidence or visible consequence.
- DIALOGUE COVERAGE: Unless a sequence is deliberately silent for suspense or action clarity, include at least one short speakable exchange that changes the plan, relationship, danger or available information. A film may contain silent shots, but it may not become a narrator-led slideshow. Preserve pauses and reactions around dialogue so speech remains naturally performable inside generated clips.
- Establish geography before action, preserve prop ownership and wardrobe/damage progression, and design entrances/exits that the next clip can continue.
- Design production sound as narrative information: establish stable room tone, give recurring locations/forces a restrained sonic motif, let footsteps, mechanisms, breath, cloth, weather or distant threats anticipate visible events, and carry ambience across connected clips. Avoid constant trailer music, generic impacts and a whoosh at every cut.
- End each sequence on a changed objective, new danger, discovery, sacrifice or consequence. The ending must pay off the opening dramatic question.
- Format all image and video prompt outputs directly with rich directorial prose optimized for Google Veo 3 without robotic string concatenation.
Return the existing required JSON contract only.`;
