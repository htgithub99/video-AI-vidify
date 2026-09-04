import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../types";

export const CINEMATIC_POLICY_CONFIG = {
  MIN_SCRIPT_QA_SCORE: 75,
  HARD_MIN_SCRIPT_QA_SCORE: 65,
  MIN_BEAT_COUNT: 3,
  MAX_BEAT_COUNT: 5,
  CLIP_DURATION_SECONDS: 10,
  MIN_CLIP_DURATION_SECONDS: 3,
  MAX_CLIP_DURATION_SECONDS: 15,
  PLANNING_CHUNK_SIZE: 1,
  PLANNING_WORKER_COUNT: 3,
  PREFLIGHT_REVIEW_WORKER_COUNT: 3,
  PREFLIGHT_REVIEW_ATTEMPTS: 1,
  CLIENT_PLANNING_ATTEMPTS: 2,
  EPSILON_TOLERANCE: 0.25,
  MIN_DIALOGUE_SCENE_RATIO: 0.6,
  MIN_DIALOGUE_COVERAGE_SCORE: 70,
} as const;

export const CINEMATIC_DIALOGUE_CONFIG = {
  MODES: ["on_screen_dialogue", "off_screen_dialogue", "silent_action"],
  VIETNAMESE_CHARACTER_PATTERN: /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i,
  VIETNAMESE_WORD_PATTERN: /\b(?:anh|chị|em|ông|bà|tôi|ta|ngươi|chúng ta|không|được|phải|đang|sẽ|đã|này|đó|với|của|cho|hãy|đừng)\b/i,
  ENGLISH_WORD_PATTERN: /\b(?:the|you|your|we|our|they|this|that|is|are|will|must|can|cannot|do|not|please|come|go|stop|wait)\b/i,
  NARRATION_PATTERN: /^(?:narrator|voice[- ]?over|lời dẫn|người kể|chúng ta thấy|khán giả thấy|câu chuyện|the audience|we see)\s*[:：-]/i,
} as const;

export const getCinematicDialogueRetryDirective = (language: string, dialogue: string, speakerId: string): string =>
  `Mandatory dialogue correction: ${speakerId} must audibly speak exactly "${dialogue}" in ${language === "vi" ? "Vietnamese" : "English"}. Preserve the named speaker, natural performance and accurate lip synchronization. No narrator, voice-over, third-person commentary, translated duplicate, or additional spoken line.`;

export const CINEMATIC_CHAT_PLANNING_CONFIG = {
  ROOM_RESPONSE_ATTEMPTS: 1,
  RESPONSE_TIMEOUT_MS: 120000,
  RESPONSE_POLL_MS: 1000,
  RESPONSE_STABLE_POLLS: 3,
  MIN_RESPONSE_CHARACTERS: 20,
  MAX_CORRECTION_ATTEMPTS: 1,
  API_MAX_SOUND_DESIGN_CUES: 3,
  ROOM_MAX_SOUND_DESIGN_CUES: 5,
  PAGE_READY_TIMEOUT_MS: 45000,
  NAVIGATION_TIMEOUT_MS: 60000,
  GEMINI_RESPONSE_SELECTOR: "model-response",
  GEMINI_INPUT_SELECTOR: 'div.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]',
  GEMINI_SEND_SELECTOR: 'button[aria-label*="Gửi" i], button[aria-label*="Send" i], gem-icon-button.send-button button, div.send-button-container button',
  GEMINI_BUSY_SELECTOR: 'gem-icon-button.send-button.stop, .model-response-label-announcer[aria-busy="true"]',
  GROK_INPUT_SELECTOR: '[contenteditable="true"][role="textbox"], textarea, [contenteditable="true"]',
  GROK_RESPONSE_SELECTOR: '[data-testid="assistant-message"]',
  GROK_SEND_SELECTOR: 'button[type="submit"], button[aria-label*="Send" i], button[aria-label*="Gửi" i]',
  GROK_BUSY_SELECTOR: 'button[aria-label*="Stop" i], button[aria-label*="Dừng" i]',
  GROK_CHALLENGE_FRAME_SELECTOR:
    'iframe[src*="challenges.cloudflare.com"], iframe[src*="challenge"], iframe[title*="Cloudflare" i], input[name="cf-turnstile-response"]',
  GROK_CHALLENGE_WAIT_TIMEOUT_MS: 300000,
  GROK_CHALLENGE_POLL_MS: 1000,
  GROK_CHALLENGE_TEXT_PATTERN:
    /performing security verification|verify you are human|verifying you are human|just a moment|xác minh bạn là người|đang thực hiện xác minh bảo mật/i,
  CHATGPT_INPUT_SELECTOR: '#prompt-textarea, textarea[data-id="root"], div[contenteditable="true"][data-virtualkeyboard]',
  CHATGPT_RESPONSE_SELECTOR: '[data-message-author-role="assistant"]',
  CHATGPT_SEND_SELECTOR: 'button[data-testid="send-button"], button[aria-label*="Send" i], button[aria-label*="Gửi" i]',
  CHATGPT_BUSY_SELECTOR: 'button[data-testid="stop-button"], button[aria-label*="Stop" i], button[aria-label*="Dừng" i]',
  CHATGPT_LOGIN_SELECTOR: 'button:has-text("Log in"), a:has-text("Log in"), button:has-text("Đăng nhập"), a:has-text("Đăng nhập")',
  CHATGPT_GOOGLE_LOGIN_SELECTOR: 'button:has-text("Continue with Google"), button:has-text("Tiếp tục với Google"), a:has-text("Continue with Google")',
  CHATGPT_COOKIE_REJECT_SELECTOR: '[data-cookie-consent] button:has-text("Reject"), [data-cookie-consent] button:has-text("Từ chối")',
  CHATGPT_COOKIE_ACTION_SELECTOR: '[data-cookie-consent] button',
  GEMINI_MODEL_BUTTON_SELECTOR:
    'button[data-test-id="bard-mode-menu-button"], button[data-testid="bard-mode-menu-button"], button[aria-label*="mô hình" i], button[aria-label*="model" i], button[aria-label*="chế độ" i], button[aria-label*="mode" i], button:has-text("Flash-Lite"), button:has-text("Flash"), button:has-text("Pro")',
  GROK_MODEL_BUTTON_SELECTOR:
    'button[aria-label*="chọn mô hình" i], button[aria-label*="select model" i], button:has-text("Nhanh"), button:has-text("Fast"), button:has-text("Tự động"), button:has-text("Auto")',
  JSON_ONLY_DIRECTIVE:
    "Return only the complete raw JSON value required by the request. Do not use Markdown fences, commentary, summaries, ellipses, placeholders, or references to earlier answers.",
  WINDOWS_LINE_ENDING_PATTERN: /\r\n/g,
  EXCESS_BLANK_LINES_PATTERN: /\n[ \t]*\n(?:[ \t]*\n)+/g,
  CANCELLED_ERROR: "chat_planning_cancelled",
  CLOSE_ROOM_ON_COMPLETE: true,
  INVALID_RESPONSE_ERROR: "chat_planning_invalid_response",
  DEFAULT_PROJECT_SCOPE: "cinematic-planning",
  DEFAULT_WORKER_ID: "worker-0",
  WORKER_ID_PREFIX: "worker-",
  ROOM_KEY_SEPARATOR: "::",
  ROOM_DELETE_MAX_CONVERSATIONS: 500,
  ROOM_DELETE_ITEM_ATTEMPTS: 2,
  ROOM_DELETE_ACTION_TIMEOUT_MS: 8000,
  ROOM_DELETE_CONFIRM_TIMEOUT_MS: 5000,
  ROOM_DELETE_VERIFY_TIMEOUT_MS: 10000,
  ROOM_DELETE_VERIFY_POLL_MS: 250,
  ROOM_DELETE_SETTLE_MS: 1000,
  GEMINI_CONVERSATION_ITEM_SELECTOR: 'gem-nav-list-item[data-test-id="conversation"]',
  GEMINI_CONVERSATION_ACTION_SELECTOR: '[data-test-id="actions-menu-button"] button',
  GEMINI_SIDEBAR_OPEN_SELECTOR: 'button[aria-label*="Mở thanh bên" i], button[aria-label*="Open sidebar" i]',
  GEMINI_SIDEBAR_READY_SELECTOR:
    '[aria-label*="Điều hướng bên" i], [aria-label*="Side navigation" i], bard-sidenav, gem-sidenav, nav',
  GEMINI_ACTIVITY_DELETE_PATTERN: /^(?:Xóa|Xoá|Delete)$/i,
  GEMINI_ACTIVITY_ALL_TIME_PATTERN: /(?:Từ trước đến nay|All time)/i,
  GEMINI_ACTIVITY_CONFIRM_HEADING_PATTERN: /(?:Xác nhận bạn muốn xóa|Confirm.*delete)/i,
  GROK_CONVERSATION_ITEM_SELECTOR: 'a[href^="/c/"], a[href^="/chat/"]',
  GROK_CONVERSATION_ACTION_SELECTOR: 'button[aria-label*="option" i], button[aria-label*="more" i], button[data-testid*="menu"]',
  GROK_SIDEBAR_OPEN_SELECTOR: 'button[aria-label*="Open sidebar" i], button[aria-label*="Mở thanh bên" i], button[aria-label*="menu" i]',
  GROK_SIDEBAR_READY_SELECTOR: 'button:has-text("History"), button:has-text("Lịch sử"), a[href^="/c/"], a[href^="/chat/"]',
  CHATGPT_CONVERSATION_ITEM_SELECTOR: 'li:has(a[href^="/c/"]), [data-testid^="history-item-"]',
  CHATGPT_CONVERSATION_ACTION_SELECTOR: 'button[data-testid="conversation-options"], button[aria-label*="option" i], button[aria-label*="more" i]',
  CHATGPT_SIDEBAR_OPEN_SELECTOR: 'button[aria-label="Open sidebar"], button[aria-label="Mở thanh bên"]',
  CHATGPT_SIDEBAR_READY_SELECTOR: 'nav[aria-label="Chat history"], nav[aria-label="Lịch sử trò chuyện"]',
  CONVERSATION_DELETE_PATTERN: /^(?:Xóa|Xoá|Delete|Delete chat|Delete conversation)$/i,
  CONVERSATION_DELETE_FALLBACK_PATTERN: /(?:Xóa|Xoá|Delete)/i,
} as const;

export const CINEMATIC_AI_CREATIVE_REQUIRED_FIELDS = [
  "id",
  "prompt",
  "generationPrompt",
  "visualIntent",
  "visibleAction",
  "reaction",
  "storyEvidence",
  "visualHook",
  "characterIds",
  "shotPurpose",
  "dialogueMode",
  "spokenDialogue",
  "speakerCharacterId",
  "lipSyncRequired",
  "expectedSubjectCount",
  "allowBackgroundPeople",
  "layout",
  "textAllowed",
  "textOverlay",
  "shotSize",
  "cameraAngle",
  "composition",
  "locationId",
  "propIds",
  "continuityFrom",
  "continuityNotes",
  "lighting",
  "sequenceId",
  "shotId",
  "shotRole",
  "characterBlocking",
  "eyelineDirection",
  "screenDirection",
  "actionStartState",
  "actionEndState",
  "locationState",
  "wardrobeState",
  "propState",
  "soundDesignCues",
  "cinematicBeats",
  "assetStrategy",
  "archivalSearchQuery",
  "archivalRationale",
] as const;

export const CINEMATIC_AI_CREATIVE_BEAT_REQUIRED_FIELDS = [
  "sourceSceneId",
  "shotId",
  "shotRole",
  "shotSize",
  "cameraAngle",
  "visibleAction",
  "reaction",
  "transition",
  "dialogueMode",
  "spokenDialogue",
  "speakerCharacterId",
  "lipSyncRequired",
  "startSecond",
  "endSecond",
] as const;

export const CINEMATIC_ADVISORY_ISSUE_PATTERNS = [
  /:neighbor_visual_repetition$/,
  /:scene_meaning:too_similar_to:/,
  /:editorial_rhythm:/,
  /:editorial_role:/,
  /:prompt:incomplete_or_outside_global_length_contract$/,
  /:prompt:incomplete_sentence$/,
  /:(?:visualIntent|visibleAction|reaction|storyEvidence|visualHook|composition):must_be_english$/,
  /:visibleAction:no_observable_physical_verb$/,
  /:actionChoreography:/,
  /:actionStartState:must_match_previous_(?:clip_)?end_state$/,
  /:screenDirection:continuity_break$/,
  /:cinematicBeats:final_shot_must_show_consequence$/,
  /:generationPrompt:length_outside_recommended_range$/,
  /:generationPrompt:cinematic_capture_missing$/,
  /:generationPrompt:physical_rendering_missing$/,
  /:generationPrompt:text_policy_missing$/,
  /^(?:chunk|storyboard):dialogue_coverage:/,
] as const;

export const CINEMATIC_CHAT_MODEL_OPTIONS: Record<AiPlanningFallbackProvider, ReadonlyArray<{ value: AiPlanningChatModel; label: string }>> = {
  [AiPlanningFallbackProvider.GeminiChat]: [
    { value: AiPlanningChatModel.GeminiFlashLite, label: "Flash-Lite" },
    { value: AiPlanningChatModel.GeminiFlash, label: "Flash" },
    { value: AiPlanningChatModel.GeminiPro, label: "Pro" },
    { value: AiPlanningChatModel.GeminiThinking, label: "Pro · Tư duy mở rộng" },
    { value: AiPlanningChatModel.GeminiDeepThink, label: "Pro · Deep Think" },
  ],
  [AiPlanningFallbackProvider.GrokChat]: [
    { value: AiPlanningChatModel.GrokFast, label: "Nhanh" },
    { value: AiPlanningChatModel.GrokBuild, label: "Build" },
    { value: AiPlanningChatModel.GrokAuto, label: "Tự động" },
    { value: AiPlanningChatModel.GrokExpert, label: "Chuyên gia" },
    { value: AiPlanningChatModel.GrokHeavy, label: "Nặng" },
  ],
  [AiPlanningFallbackProvider.ChatGptUi]: [{ value: AiPlanningChatModel.ChatGptAuto, label: "Mặc định" }],
  [AiPlanningFallbackProvider.Disabled]: [],
};

export const CINEMATIC_CHAT_MODEL_LABELS: Record<AiPlanningChatModel, RegExp> = {
  [AiPlanningChatModel.GeminiFlashLite]: /(?:Gemini\s*)?(?:\d+(?:\.\d+)?\s*)?Flash[-\s]?Lite/i,
  [AiPlanningChatModel.GeminiFlash]: /(?:Gemini\s*)?(?:\d+(?:\.\d+)?\s*)?Flash(?![-\s]?Lite)/i,
  [AiPlanningChatModel.GeminiPro]: /(?:Gemini\s*)?(?:\d+(?:\.\d+)?\s*)?Pro/i,
  [AiPlanningChatModel.GeminiThinking]: /Tư duy mở rộng|Extended thinking|Extended/i,
  [AiPlanningChatModel.GeminiDeepThink]: /Deep Think/i,
  [AiPlanningChatModel.GrokFast]: /Nhanh|Fast/i,
  [AiPlanningChatModel.GrokBuild]: /Build/i,
  [AiPlanningChatModel.GrokAuto]: /Tự động|Auto/i,
  [AiPlanningChatModel.GrokExpert]: /Chuyên gia|Expert/i,
  [AiPlanningChatModel.GrokHeavy]: /Nặng|Heavy/i,
  [AiPlanningChatModel.ChatGptAuto]: /Auto|Mặc định|Default/i,
};

export const GEMINI_CHAT_BASE_MODEL_LABELS: Partial<Record<AiPlanningChatModel, RegExp>> = {
  [AiPlanningChatModel.GeminiFlashLite]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlashLite],
  [AiPlanningChatModel.GeminiFlash]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlash],
  [AiPlanningChatModel.GeminiPro]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro],
  [AiPlanningChatModel.GeminiThinking]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro],
  [AiPlanningChatModel.GeminiDeepThink]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro],
};

export const GEMINI_CHAT_THINKING_LEVEL_LABELS: Partial<Record<AiPlanningChatModel, RegExp>> = {
  [AiPlanningChatModel.GeminiThinking]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiThinking],
  [AiPlanningChatModel.GeminiDeepThink]: CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiDeepThink],
};

export const CINEMATIC_PLANNING_MESSAGES = {
  VI_SCENE_RETRY: "[Đạo diễn phim] Cảnh chưa đủ dữ liệu; AI chỉ viết lại cảnh còn thiếu.",
  EN_SCENE_RETRY: "[Film direction] A scene is incomplete; AI is rewriting only the missing scene.",
  VI_BATCH_LOCKED: "[Đạo diễn phim] Đã khóa {0} cảnh đạt chuẩn ({1}/{2}).",
  EN_BATCH_LOCKED: "[Film direction] Locked {0} valid scenes ({1}/{2}).",
  VI_REQUIRED: "AI chưa trả đủ kế hoạch phim có shot, continuity và thoại nhân vật. Đã dừng trước khi tạo clip để tránh xuất một bộ phim sai nội dung.",
  EN_REQUIRED: "AI did not return a complete film plan with shots, continuity, and character dialogue. Production stopped before clip generation to prevent an incoherent film.",
  VI_REQUIRED_DETAIL: "Chi tiết chưa đạt: {0}.",
  EN_REQUIRED_DETAIL: "Incomplete fields: {0}.",
  ISSUE_DISPLAY_LIMIT: 8,
  VI_ADVISORY: "[Đạo diễn phim] Kế hoạch đã đủ dữ liệu tạo clip; một số ghi chú dàn cảnh phụ sẽ được rà soát ở bước dựng.",
  EN_ADVISORY: "[Film direction] The clip plan is complete; optional staging notes will be reviewed during editing.",
  VI_START_NEW: "🎬 BẮT ĐẦU SẢN XUẤT PHIM MỚI",
  EN_START_NEW: "🎬 STARTING A NEW FILM PRODUCTION",
  VI_CONTINUE: "🎬 TIẾP TỤC SẢN XUẤT PHIM",
  EN_CONTINUE: "🎬 CONTINUING FILM PRODUCTION",
  VI_PREFLIGHT_START: "[Kiểm tra trước khi tạo] Đang duyệt toàn bộ prompt, 3–5 shot, thoại, continuity và an toàn nội dung.",
  EN_PREFLIGHT_START: "[Preflight] Reviewing every prompt, 3–5 shots, dialogue, continuity, and content safety.",
  VI_PREFLIGHT_PASSED: "[Kiểm tra trước khi tạo] Toàn bộ clip đã đạt yêu cầu; mỗi clip chỉ được gửi tạo đúng một lần.",
  EN_PREFLIGHT_PASSED: "[Preflight] Every clip passed; each clip will be submitted for generation exactly once.",
  VI_PREFLIGHT_FAILED: "Kế hoạch phim chưa vượt qua kiểm tra bắt buộc trước khi tạo. Không clip nào được gửi đi nên chưa sử dụng credit video.",
  EN_PREFLIGHT_FAILED: "The film plan did not pass the mandatory preflight. No clip was submitted, so no video credit was used.",
  VI_PREFLIGHT_FAILED_SCENES: "Cảnh cần sửa: {0}.",
  EN_PREFLIGHT_FAILED_SCENES: "Scenes requiring repair: {0}.",
  PREFLIGHT_LOG_PREFIX: "[Cinematic preflight]",
  PROJECT_SAFETY_APPROVED_RATIONALE: "project_content_safety_approved",
  VI_CHARACTER_PACK_START: "[Character Pack] Đang tạo ảnh nhận diện chuẩn cho từng nhân vật trước khi dùng credit video.",
  EN_CHARACTER_PACK_START: "[Character Pack] Creating canonical identity references before any video credit is used.",
  VI_CHARACTER_PACK_READY: "[Character Pack] Ảnh nhân vật đã được lưu; mỗi cảnh sẽ chỉ tải lên các nhân vật thực sự xuất hiện.",
  EN_CHARACTER_PACK_READY: "[Character Pack] Character references are saved; each scene will upload only its visible characters.",
  VI_CHARACTER_PACK_FAILED: "Không thể hoàn thành ảnh nhận diện nhân vật. Đã dừng trước khi tạo clip để tránh video sai nhân vật.",
  EN_CHARACTER_PACK_FAILED: "The character identity pack could not be completed. Production stopped before clip generation to avoid inconsistent characters.",
  VI_SCRIPT_GATE_FAILED: "Kịch bản phim chưa đạt Bots kiểm tra bắt buộc. Đã dừng trước khi tạo clip nên chưa sử dụng credit video.",
  EN_SCRIPT_GATE_FAILED: "The film script did not pass the mandatory quality gate. Production stopped before clip generation, so no video credit was used.",
  VI_STORYBOARD_GATE_FAILED: "Storyboard chưa đủ cảnh, chưa phủ đúng kịch bản hoặc chưa đạt nhịp dựng. Đã dừng trước khi tạo clip nên chưa sử dụng credit video.",
  EN_STORYBOARD_GATE_FAILED: "The storyboard is incomplete, does not fully cover the script, or fails pacing requirements. Production stopped before clip generation, so no video credit was used.",
  VI_PLAN_GATE_FAILED: "Kế hoạch quay còn thiếu prompt, shot, thoại hoặc continuity. Đã dừng trước khi tạo clip nên chưa sử dụng credit video.",
  EN_PLAN_GATE_FAILED: "The shooting plan is missing prompts, shots, dialogue, or continuity. Production stopped before clip generation, so no video credit was used.",
  VI_TAKE_GATE_FAILED: "Một hoặc nhiều clip bị thiếu hoặc không khớp nội dung. Đã dừng trước bước dựng để không xuất phim sai.",
  EN_TAKE_GATE_FAILED: "One or more clips are missing or do not match the story. Editing stopped to prevent an incorrect film export.",
} as const;

export const CINEMATIC_CHARACTER_PACK_CONFIG = { REFERENCE_COUNT_PER_CHARACTER: 1, MAX_CHARACTERS: 3 } as const;

export const CINEMATIC_PROMPT_PREFLIGHT_CONFIG = {
  MIN_WORDS: 60,
  MAX_WORDS: 600,
  RECOMMENDED_MIN_WORDS: 100,
  RECOMMENDED_MAX_WORDS: 320,
  FORBIDDEN_PATTERN: /one continuous (?:coherent )?(?:editorial )?shot|no internal cut|single[- ]take|Video motion direction:|--ar\s/i,
} as const;

export const resolveCinematicClipDuration = (value?: string | number): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value || ""));
  if (!Number.isFinite(parsed)) return CINEMATIC_POLICY_CONFIG.CLIP_DURATION_SECONDS;
  return Math.min(CINEMATIC_POLICY_CONFIG.MAX_CLIP_DURATION_SECONDS, Math.max(CINEMATIC_POLICY_CONFIG.MIN_CLIP_DURATION_SECONDS, parsed));
};

export const CINEMATIC_POLICY_REQUIRED_FIELDS = [
  "prompt",
  "generationPrompt",
  "visualIntent",
  "visibleAction",
  "reaction",
  "storyEvidence",
  "visualHook",
  "shotPurpose",
  "shotSize",
  "cameraAngle",
  "composition",
  "continuityNotes",
  "lighting",
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
  "assetStrategy",
] as const;

export const CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG = {
  CONFLICT_PATTERN:
    /\b(fights?|battles?|combat|attacks?|strike|punches?|kicks?|slashes?|shoots?|fires?|swings?|dodges?|blocks?|parries?|collides?|impact|enemy|opponent|soldier|weapon|đánh|chiến đấu|giao chiến|tấn công|ra đòn|đấm|đá|chém|bắn|vung|né|đỡ|va chạm|đối thủ|kẻ địch|binh|vũ khí)\b/i,
  INITIATOR_PATTERN: /\b(attacks?|strikes?|swings?|fires?|shoots?|punches?|kicks?|slashes?|charges?|tấn công|ra đòn|vung|bắn|đấm|đá|chém|lao vào)\b/i,
  FOOTWORK_PATTERN: /\b(plants?|braces?|steps?|lead foot|rear foot|stance|chân trụ|đặt chân|bước chân|thế đứng|trụ chân)\b/i,
  WEIGHT_TRANSFER_PATTERN: /\b(weight shifts?|weight transfers?|transfers? (?:his|her|their|the|body) weight|drives? (?:his|her|their|the|body) weight|hips? turns?|shoulders? turns?|dồn trọng lượng|chuyển trọng tâm|xoay hông|xoay vai)\b/i,
  WIND_UP_PATTERN: /\b(draws? (?:his|her|their|the)? ?(?:limb|arm|fist|weapon|staff|sword|axe|spear)? ?back|pulls? (?:his|her|their|the)? ?(?:limb|arm|fist|weapon|staff|sword|axe|spear)? ?back|cocks?|winds? up|raises? .* (?:shoulder|hip)|kéo .* về|thu .* về|lấy đà|giơ .* ngang)\b/i,
  OWNERSHIP_PATTERN: /\b(his|her|their|the attacker's|the defender's|tay phải|tay trái|cánh tay|bàn tay|vũ khí của|rìu của|gậy của|kiếm của)\b/i,
  TARGET_PATTERN: /\b(at|toward|against|into|target|enemy|opponent|defender|vào|về phía|nhắm|mục tiêu|kẻ địch|đối thủ|người đỡ)\b/i,
  CONTACT_PATTERN: /\b(hits?|impact|contact|collides?|connects?|blocks?|parries?|strikes? the|va chạm|đánh trúng|trúng|chạm|đỡ đòn|chặn|tia lửa)\b/i,
  REACTION_PATTERN: /\b(recoils?|stumbles?|falls?|slides?|is thrown|is driven|reacts?|staggers?|lùi|ngã|văng|trượt|choáng|khựng|phản ứng|bị đẩy)\b/i,
  OUTCOME_PATTERN: /\b(aftermath|ends?|remains?|lands?|new position|disarmed|broken|damaged|defeated|kết quả|sau đòn|tiếp đất|vị trí mới|mất vũ khí|vỡ|hư hại|thất thế|bị hạ)\b/i,
} as const;

export const hasCinematicCombatAction = (value: string): boolean =>
  CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.CONFLICT_PATTERN.test(value) && CINEMATIC_ACTION_CHOREOGRAPHY_CONFIG.INITIATOR_PATTERN.test(value);

export const CINEMATIC_SCREENPLAY_CONTRACT_DIRECTIVE = (language: string, targetDuration: string): string => `
[DEDICATED AI FILM SCREENPLAY CONTRACT]
You are the head screenwriter and story editor for a ${targetDuration} original film, not a narrator-led YouTube video.
- Write playable screen events in ${language === "vi" ? "natural contemporary Vietnamese" : "natural contemporary English"}. Characters must have distinct vocabulary, rhythm, status and subtext appropriate to their world.
- Build a concrete protagonist objective, opposing force, escalating choices, an irreversible midpoint/turn, climax caused by the protagonist's decision, and an earned visual aftermath.
- Open inside a playable situation rather than explaining the world. Reveal lore through what characters attempt, fear, joke about, conceal, discover or pay for. Establish one concrete object, destination, threat or promise early and keep returning to its changing condition until the payoff.
- Give the story a visible physical spine. Track the owner, location and condition of every story-critical prop across scenes; show it being received, carried, used, damaged, transferred or paid off. Never let a critical object appear, disappear, reopen or change hands without a visible causal event.
- Build transformations as an earned progression rather than a single effect shot: trigger or choice -> first physical symptom -> character reaction -> practical consequence -> irreversible new capability or cost -> final image proving the new identity. Preserve every accumulated change in body, wardrobe, damage and behavior.
- Build ensemble chemistry through contrast: each recurring character has a recognizable conversational tactic, such as blunt challenge, dry humor, caution, deflection, command or curiosity. Dialogue must change the relationship, plan or available information; never let several characters paraphrase the same fact.
- Alternate pressure and release. After danger, allow a short human reaction, joke, disagreement or practical task; after calm, introduce a visible warning or decision. Humor must emerge from character and circumstance without cancelling real stakes.
- A silent stretch is still dramatic action. Use listening, preparation, spatial exploration, exchanged looks, prop handling and environmental response to create anticipation instead of filling every second with speech.
- Use an A/B story only when the secondary line changes how the main line is understood: for example, heroes discover an objective while an opposing group reveals why it matters. Enter the secondary line on a shared prop, threat, destination or decision and return with new dramatic pressure; never intercut unrelated exposition.
- Every approximately ten-second clip unit contains at least three (and up to five in dense action/dramatic tension sequences) chronological, editable camera setups from one continuous event: setup/objective, action/obstacle, consequence/payoff. Each setup changes the visible information; never fill runtime with a person merely walking, looking, standing, holding an object or explaining the plot.
- Select the 3-to-5 setup coverage by scene function: dialogue uses spatial master -> speaker/prop coverage -> listener reaction or changed decision; discovery uses approach/context -> evidence insert/reveal -> consequence reaction; action uses geography/threat -> decisive contact/evasion -> physical result and new position. Do not force all characters to move simultaneously and do not cut merely because a timer elapsed.
- VEO-SAFE DIRECTORIAL ACTION DESIGN: Clarity outranks spectacle. Generate footage using 35mm anamorphic cinematic framing at 24fps with realistic physics. Never ask one generated clip to simulate an incoherent crowd collision, impossible vehicle acrobatics or chaotic multi-character melee. Decompose action into 3 to 5 low-complexity, high-impact chronological shots: (1) readable geography plus threat/intent, (2) planted foot, weight transfer and short wind-up by one named foreground initiator, (3) one committed strike with explicit limb or weapon ownership, (4) visible contact, block or evasion plus a caused physical reaction, and (5) stable aftermath or changed decision. Use inserts, silhouettes, off-screen impact, dust/light/environmental response and production sound to imply Hollywood scale; effects may support contact but never replace it.
- Keep no more than two clearly articulated foreground performers in physical conflict. Other forces remain distant, soft-focus, occluded, silhouetted or represented by their effect on the environment. Use one movement direction and one action axis; keep feet grounded, hand/weapon ownership explicit and the camera stable enough to read anatomy.
- Prefer concise speakable dialogue, interruptions, silence and reactions. No exposition speeches, generic motivational lines, trailer narration, omniscient summary or repeated statement of facts already visible.
- Dialogue must be short enough for natural lip-sync inside its planned shot. Preserve the exact chosen output language and never mix languages unless the story explicitly requires it.
- Use character dialogue only when it changes the immediate objective, danger, relationship or viewer understanding; generic filler and repeated catchphrases are forbidden. A dramatically intentional silent clip is valid when physical action, suspense, discovery or aftermath carries the story more strongly. Use on_screen_dialogue with synchronized lips whenever the speaker is visible. Use off_screen_dialogue only when the named speaker is physically present in the same location. Never use narration or voice-over.
- SCREENPLAY OUTPUT LOCK: Write the actual playable screenplay, not prose describing what the film would show. Every chapter must contain concrete scene action plus natural character dialogue. Attribute every spoken line to a named character. Do not write a narrator, narration paragraphs, voice-over, explanatory commentary, YouTube hook, synopsis, recap or phrases such as "we see", "the audience learns", "câu hỏi là", or "liệu rằng". Important story information must be discovered through a character's decision, conversation, physical evidence or visible consequence.
- DIALOGUE COVERAGE: Unless a sequence is deliberately silent for suspense or action clarity, include at least one short speakable exchange that changes the plan, relationship, danger or available information. A film may contain silent shots, but it may not become a narrator-led slideshow. Preserve pauses and reactions around dialogue so speech remains naturally performable inside generated clips.
- Establish geography before action, preserve prop ownership and wardrobe/damage progression, and design entrances/exits that the next clip can continue.
- Design production sound as narrative information: establish stable room tone, give recurring locations/forces a restrained sonic motif, let footsteps, mechanisms, breath, cloth, weather or distant threats anticipate visible events, and carry ambience across connected clips. Avoid constant trailer music, generic impacts and a whoosh at every cut.
- End each sequence on a changed objective, new danger, discovery, sacrifice or consequence. The ending must pay off the opening dramatic question.
- Format all image and video prompt outputs directly with rich directorial prose optimized for Google Veo 3 without robotic string concatenation.
Return the existing required JSON contract only.`;
