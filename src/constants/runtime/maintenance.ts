import {
  SOURCE_TEXT_SYMBOL_22,
  SOURCE_TEXT_SYMBOL_3,
  SOURCE_TEXT_SYMBOL_52,
  SOURCE_TEXT_SYMBOL_42,
  SOURCE_TEXT_SYMBOL_43,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_SYMBOL_44,
  SOURCE_TEXT_SYMBOL_45,
  SOURCE_TEXT_NFD,
  SOURCE_TEXT_SYMBOL_25,
  SOURCE_TEXT_SYMBOL_54,
  SOURCE_TEXT_CENTER,
  SOURCE_TEXT_LEFT,
  SOURCE_TEXT_RIGHT,
  SOURCE_TEXT_TOP,
  SOURCE_TEXT_BOTTOM,
  SOURCE_TEXT_SCROLL,
  SOURCE_TEXT_SPEED,
  SOURCE_TEXT_START,
  SOURCE_TEXT_END,
  SOURCE_TEXT_FROM,
  SOURCE_TEXT_TO,
  SOURCE_TEXT_SYMBOL_16,
  SOURCE_TEXT_MEDIUM,
  SOURCE_TEXT_SYMBOL_12,
  SOURCE_TEXT_FLOW,
  SOURCE_TEXT_REVEAL,
  SOURCE_TEXT_1,
  SOURCE_TEXT_SYMBOL_53,
  SOURCE_TEXT_SYMBOL_10,
  SOURCE_TEXT_SYMBOL_6,
  SOURCE_TEXT_ACTION,
  SOURCE_TEXT_VI,
  SOURCE_TEXT_EN,
  SOURCE_TEXT_STYLE,
  SOURCE_BROWSER_TEXT_SOURCE,
  SOURCE_TEXT_LABEL,
  SOURCE_TEXT_SYMBOL_56,
  SOURCE_TEXT_FIXED,
  SOURCE_TEXT_OFF,
  SOURCE_TEXT_1_4,
  SOURCE_TEXT_SYMBOL_9,
  SOURCE_TEXT_PLANNING,
  SOURCE_TEXT_I_2,
  SOURCE_TEXT_LIBRARY,
  SOURCE_TEXT_16_9,
  SOURCE_TEXT_READY,
  SOURCE_TEXT_SHA256,
  SOURCE_TEXT_HEX,
  SOURCE_TEXT_TITLE,
  SOURCE_TEXT_LOGLINE,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_X,
  SOURCE_TEXT_REQUIRED,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_U_2,
  SOURCE_TEXT_SVG,
  SOURCE_TEXT_HREF,
  SOURCE_TEXT_ARIA_DESCRIBEDBY_2,
  SOURCE_TEXT_SYMBOL_33,
  SOURCE_TEXT_LENGTH,
  SOURCE_TEXT_SYMBOL_21,
  SOURCE_TEXT_0,
  SOURCE_TEXT_A_2,
  SOURCE_TEXT_IMAGE,
  SOURCE_TEXT_USE,
  SOURCE_TEXT_R,
  SOURCE_TEXT_PATH,
  SOURCE_TEXT_D,
  SOURCE_TEXT_GI,
  SOURCE_TEXT_UNAVAILABLE,
  SOURCE_TEXT_AND,
  SOURCE_TEXT_SYMBOL_8,
  SOURCE_TEXT_DOMCONTENTLOADED,
  SOURCE_TEXT_DIALOG,
  SOURCE_TEXT_HEADING,
  SOURCE_TEXT_DELETE_2,
  SOURCE_TEXT_POST,
  SOURCE_TEXT_VISIBLE,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_HIDDEN,
  SOURCE_TEXT_MENUITEM,
  SOURCE_TEXT_TRUE,
  SOURCE_TEXT_ABOUT_BLANK,
  SOURCE_TEXT_SCENES,
  SOURCE_TEXT_ABORT,
  SOURCE_TEXT_SELECTED,
  SOURCE_BROWSER_TEXT_ARIA_CHECKED,
  SOURCE_TEXT_ARIA_SELECTED,
  SOURCE_BROWSER_TEXT_SYMBOL,
  SOURCE_TEXT_MESSAGE,
  SOURCE_TEXT_RELATIVE,
  SOURCE_TEXT_SYMBOL,
  SOURCE_TEXT_WHITE,
  SOURCE_TEXT_NONE,
  SOURCE_TEXT_RANGE,
  SOURCE_TEXT_SYMBOL_2,
  SOURCE_TEXT_ALERT,
  SOURCE_TEXT_STATUS,
  SOURCE_TEXT_SYMBOL_7,
  SOURCE_TEXT_M,
  SOURCE_TEXT_W_4_H_4,
  SOURCE_TEXT_W_4_H_4_TEXT_ROSE_500,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W,
  SOURCE_TEXT_TEXT_BLUE_400,
  SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400_2,
  SOURCE_TEXT_TEXT_EMERALD_400,
  SOURCE_TEXT_TEXT_AMBER_400,
  SOURCE_TEXT_W_3_5_H_3_5,
  SOURCE_TEXT_W_3_H_3,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_3,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2,
  SOURCE_TEXT_SPACE_Y_4,
  SOURCE_TEXT_REJECTED,
  SOURCE_TEXT_CODE,
  SOURCE_TEXT_BASE64,
  SOURCE_TEXT_SYMBOL_15,
  SOURCE_TEXT_SYMBOL_23,
  SOURCE_TEXT_PNG_2,
  SOURCE_TEXT_SYMBOL_11,
  SOURCE_TEXT_9_16,
  SOURCE_TEXT_1_1,
  SOURCE_TEXT_UTF8,
  SOURCE_TEXT_HIDE_BANNER,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_Y,
  SOURCE_TEXT_F,
  SOURCE_TEXT_PNG,
  SOURCE_TEXT_I,
  SOURCE_TEXT_AN,
  SOURCE_TEXT_C_V,
  SOURCE_TEXT_CRF,
  SOURCE_TEXT_2,
  SOURCE_TEXT_MP4,
  SOURCE_TEXT_PIPE,
  SOURCE_TEXT_IGNORE,
  SOURCE_TEXT_DATA_2,
  SOURCE_TEXT_MP4_2,
  SOURCE_TEXT_SYMBOL_36,
  SOURCE_TEXT_LOAD,
  SOURCE_TEXT_CANVAS,
  SOURCE_BROWSER_TEXT_2D,
  SOURCE_TEXT_BACKGROUND,
  SOURCE_TEXT_FAILED,
} from "../sourceText.js";
import {
  MOTION_TEXT_SYMBOL_42,
  MOTION_TEXT_FOLLOW,
  MOTION_TEXT_SLOW,
  MOTION_TEXT_SYMBOL_46,
  MOTION_TEXT_U003C,
  MOTION_TEXT_WIDE,
  MOTION_TEXT_SCALE,
  MOTION_TEXT_RAIN,
  MOTION_TEXT_FOG,
  MOTION_TEXT_HEIGHT,
  MOTION_TEXT_STORYTELLING,
  MOTION_TEXT_LINE,
  MOTION_TEXT_NARRATION,
  MOTION_TEXT_DIAGNOSTICS,
  MOTION_TEXT_SYMBOL_11,
  MOTION_TEXT_S,
  MOTION_TEXT_SYMBOL_10,
  MOTION_TEXT_PHUT,
  MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2_5_PT_3_BORDER_T_BORDER_SLATE_,
  MOTION_TEXT_LIGHT,
  MOTION_TEXT_MOTION_STORY_EDIT,
  MOTION_TEXT_SYMBOL_37,
  MOTION_TEXT_4_5,
  MOTION_TEXT_LOGLEVEL,
  MOTION_TEXT_IMAGE2PIPE,
  MOTION_TEXT_FRAMERATE,
  MOTION_TEXT_LIBX264,
  MOTION_TEXT_PIX_FMT,
  MOTION_TEXT_YUV420P,
  MOTION_TEXT_DRAIN,
  MOTION_TEXT_CONCAT,
  MOTION_TEXT_SAFE,
  MOTION_TEXT_C,
  MOTION_TEXT_COPY,
  MOTION_TEXT_IMAGE_PNG,
  MOTION_TEXT_MAP,
  MOTION_TEXT_TIMELINE,
} from "../motionRuntime.js";
export const BACKSLASH = SOURCE_TEXT_SYMBOL_22;
export const INVALID_FILE_NAME_PATTERN = '[<>:"/\\\\|?*\\x00-\\x1f]' as const;
export const SINGLE_QUOTE = MOTION_TEXT_SYMBOL_42;
export const DOUBLE_QUOTE = SOURCE_TEXT_SYMBOL_3;
export const SPACE = SOURCE_TEXT_SYMBOL_52;
export const AI_COMPLETE = "ai-complete" as const;
export const OPEN_BRACE = SOURCE_TEXT_SYMBOL_42;
export const OPEN_BRACKET = SOURCE_TEXT_SYMBOL_43;
export const COMMA = SOURCE_TEXT_SYMBOL_4;
export const CLOSE_BRACE = SOURCE_TEXT_SYMBOL_44;
export const CLOSE_BRACKET = SOURCE_TEXT_SYMBOL_45;
export const NFD = SOURCE_TEXT_NFD;
export const UNDERSCORE = SOURCE_TEXT_SYMBOL_25;
export const REGEXP_ESCAPE_REPLACEMENT = SOURCE_TEXT_SYMBOL_54;
export const CENTER = SOURCE_TEXT_CENTER;
export const LEFT = SOURCE_TEXT_LEFT;
export const RIGHT = SOURCE_TEXT_RIGHT;
export const TOP = SOURCE_TEXT_TOP;
export const BOTTOM = SOURCE_TEXT_BOTTOM;
export const SVG_GROUP_ID_PREFIX = "<g\\b[^>]*\\sid=[\"']" as const;
export const SVG_ID_ATTRIBUTE_SUFFIX = "[\"'][^>]*>" as const;
export const SCROLL = SOURCE_TEXT_SCROLL;
export const EMIT = "emit" as const;
export const AMOUNT = "amount" as const;
export const DENSITY = "density" as const;
export const SPEED = SOURCE_TEXT_SPEED;
export const PARTICLE = "particle" as const;
export const DIR = "dir" as const;
export const JOINT = "joint" as const;
export const FACING = "facing" as const;
export const LEAN = "lean" as const;
export const FORWARD = "forward" as const;
export const BACK = "back" as const;
export const CYCLE = "cycle" as const;
export const LAG = "lag" as const;
export const DEPTH = "depth" as const;
export const START = SOURCE_TEXT_START;
export const END = SOURCE_TEXT_END;
export const PHASE = "phase" as const;
export const FROM = SOURCE_TEXT_FROM;
export const TO = SOURCE_TEXT_TO;
export const TRAVEL = "travel" as const;
export const FOLLOW = MOTION_TEXT_FOLLOW;
export const SCROLL_BACKGROUND = "scroll_background" as const;
export const COLON = SOURCE_TEXT_SYMBOL_16;
export const LIVELY = "lively" as const;
export const MEDIUM = SOURCE_TEXT_MEDIUM;
export const SWING = "swing" as const;
export const ROTATE = "rotate(" as const;
export const CLOSE_PAREN = SOURCE_TEXT_SYMBOL_12;
export const BOB = "bob" as const;
export const CLOSE_PAREN_SPACE = ") " as const;
export const TRANSLATE_0 = "translate(0 " as const;
export const SPIN = "spin" as const;
export const CCW = "ccw" as const;
export const TRANSLATE = "translate(" as const;
export const SLOW = MOTION_TEXT_SLOW;
export const VALUE_0 = " 0)" as const;
export const SHAKE = "shake" as const;
export const SMALL = "small" as const;
export const PULSE = "pulse" as const;
export const SCALE = ") scale(" as const;
export const TRANSLATE_2 = ") translate(" as const;
export const FLOW = SOURCE_TEXT_FLOW;
export const PATH_D_M = '<path d="M' as const;
export const H = " h" as const;
export const STROKE_FFFFFF_STROKE_WIDTH = '" stroke="#ffffff" stroke-width="' as const;
export const STROKE_LINECAP_ROUND_FILL_NONE_OPACITY = '" stroke-linecap="round" fill="none" opacity="' as const;
export const SVG_SELF_CLOSING_SUFFIX = '"/>' as const;
export const MOTION_FLOW = "_motion_flow_" as const;
export const CLIPPATH_ID = '<clipPath id="' as const;
export const RECT_X = '"><rect x="' as const;
export const Y = '" y="' as const;
export const WIDTH = '" width="' as const;
export const HEIGHT = '" height="' as const;
export const CLIPPATH_G_CLIP_PATH_URL = '"/></clipPath><g clip-path="url(#' as const;
export const SVG_TRANSFORM_SUFFIX = ')">' as const;
export const SVG_GROUP_END = "</g>" as const;
export const DUST = "dust" as const;
export const CIRCLE_CX = '<circle cx="' as const;
export const CY = '" cy="' as const;
export const R = '" r="' as const;
export const FILL = '" fill="' as const;
export const OPACITY = '" opacity="' as const;
export const SVG_GROUP_START = "<g>" as const;
export const REVEAL = SOURCE_TEXT_REVEAL;
export const VALUE_1 = SOURCE_TEXT_1;
export const TRANSFORM = " transform=" as const;
export const TRANSFORM_2 = ' transform="' as const;
export const CLOSE_TAG = MOTION_TEXT_SYMBOL_46;
export const S = "\\s" as const;
export const S_S_1 = "\\s*=\\s*([\"']).*?\\1" as const;
export const ATTRIBUTE_EQUALS_QUOTE = '="' as const;
export const SVG = "</svg>" as const;
export const PIPE_SEPARATOR = SOURCE_TEXT_SYMBOL_53;
export const COMMA_SPACE = SOURCE_TEXT_SYMBOL_10;
export const SEMICOLON_SPACE = SOURCE_TEXT_SYMBOL_6;
export const ACTION = SOURCE_TEXT_ACTION;
export const SCENEPLAN = "scenePlan" as const;
export const MOTIONINTENT = "motionIntent" as const;
export const VI = SOURCE_TEXT_VI;
export const EN = SOURCE_TEXT_EN;
export const REGEXP_PAD_MATCH = " $& " as const;
export const RETELL = "retell" as const;
export const STYLE = SOURCE_TEXT_STYLE;
export const HANDOFF = "handoff" as const;
export const VERDICT = "verdict" as const;
export const SPEECH = "speech" as const;
export const SOURCE = SOURCE_BROWSER_TEXT_SOURCE;
export const LABEL = SOURCE_TEXT_LABEL;
export const LOOK = "look" as const;
export const APPEARANCE = "appearance" as const;
export const NOTES = "notes" as const;
export const SELECTED_VIDEO_LANGUAGE = "\nSELECTED VIDEO LANGUAGE: " as const;
export const PRODUCTION_INSTRUCTIONS_ARE_ENGLISH_THIS_DOES_NOT_CHANGE_THE_SELECTED = ". Production instructions are English; this does not change the selected video language.\n" as const;
export const AS_SPECIFIED_BY_THE_SUPPLIED_NARRATION_AND_EXACT_DISPLAY_STRINGS = "as specified by the supplied narration and exact display strings" as const;
export const PICTURE_PACING = "PICTURE PACING: " as const;
export const AIM_FOR_ROUGHLY = "; aim for roughly " as const;
export const SECONDS_PER_SCENE_APPROXIMATELY = " seconds per scene, approximately " as const;
export const SCENES_ALLOWED_WINDOW = " scenes (allowed window " as const;
export const EN_DASH = "–" as const;
export const SCENES_ACROSS_THIS = " scenes) across this " as const;
export const S_REQUEST_COVER_CONSECUTIVE_SPEECH_LINES_ONCE_ALLOWING_SEVERAL_BEATS = "s request. Cover consecutive speech lines once, allowing several beats/sentences in one Canvas so each scene holds on screen for roughly " as const;
export const MOTIONHTMLPACINGDIRECTION_TEMPLATE_PART_8 =
  " seconds. Gestures, expression changes, object focus and camera movement belong inside the current scene; they do not automatically require a new picture. Change scenes when the source needs a new setting or a distinct visual demonstration, balancing the selected hold duration. Explain essential timing exceptions in purpose. This is an authoring target, never a score or acceptance gate." as const;
export const MOTIONHTMLANALYSISPROMPT = "Analyze the supplied source into one coherent production plan. Return JSON with title, logline, factual, era, look, accent, sfxMood, videoDna, chapters, cast, groups, places and writingPlan. Follow the selected genre/storytelling contract and selected visual style supplied alongside this task." as const;
export const TITLE = "Title=" as const;
export const LANGUAGE = "; language=" as const;
export const TOTAL_BUDGET = "; TOTAL budget=" as const;
export const S_AIM_FOR_ABOUT = "s. Aim for about " as const;
export const MEANINGFUL_CHAPTERS_SCALING_TO_SOURCE_AND_BUDGET_SO_CHAPTER_TARGETSECONDS = " meaningful chapters, scaling to source and budget so chapter targetSeconds sum to " as const;
export const MOTIONHTMLANALYSISPROMPT_TEMPLATE_PART_6 =
  "s. Each chapter: {id,title,summary,from,to,weight,mustKeep,hook,keyPoints,handoff,writing}. from/to refer to actual source seconds when available. Keep source order where the selected genre needs it. Assign each essential event once and keep chapter source ranges from overlapping, so no chapter retells the previous one's ending. For POV and witness choose one source-supported vantage (role, unit or place) for the viewer or narrator and state it in videoDna.narrative.voice. Design a strong opening hook for chapter 1 and purposeful momentum handoffs between chapters that serve the chosen genre and storytelling mode; omit unhelpful ones rather than filling quotas. No mandatory stage/shot/candidate counts." as const;
export const FEW = "few" as const;
export const MOTIONHTMLANALYSISPROMPT_2 =
  "cast lists only needed identities: {key,name,role,description,look,marks,skin,carries,origin,gender,age,narrator?}. Describe visible clothing, hair and equipment in words appropriate to the source; no body construction templates, drawing code, rig or coordinates. groups optionally describes unnamed participants {key,name,look,origin,skin,outfit,gear,faction}; places describes needed environments {key,name,description,interior,time}. Empty cast/groups is valid for a map or process. Do not invent people, props or events to populate the schema. Use the supplied videoDna data contract, without allowing visual style to override the selected narrative voice or genre. Preserve source uncertainty and factual versus fictional intent." as const;
export const SOURCE_2 = "SOURCE:\n" as const;
export const NEWLINE = SOURCE_TEXT_SYMBOL_56;
export const POV =
  "GENRE VOICE (POV — Second-Person Immersive 'You'): Write in second person, present tense ('you' / 'bạn') so the viewer lives the source-supported situation directly through immediate actions, sensory details, urgent decisions and physical consequences. Drop the viewer right into the critical moment from the opening line, escalate the immediate pressure beat by beat, and let unseen background facts arrive naturally as news or a brief realization. Give 'you' one consistent, source-supported vantage for the whole video (a role, unit or place the source names, such as a crossbowman of the town militia or a rider of the advance guard) and stay inside what that person can see, hear and do at each moment: distant events reach you through someone or something arriving where you are (a survivor, a messenger, smoke on the horizon), never through omniscient summary. Prefer what you do and decide over what you hear or watch; do not open consecutive beats with 'you hear', 'you watch', 'you feel' or 'word spreads'. Do not invent losses, companions or a later life to fill a preset spine." as const;
export const WITNESS =
  "GENRE VOICE (WITNESS — First-Person Eyewitness 'I'): Write as one first-person eyewitness ('I' / 'tôi') recollecting the events in natural, grounded spoken language through concrete sensory perceptions, human tension, and direct cause/consequence. Contrast what was expected on the ground with what actually unfolded, preserve honest eyewitness uncertainty where the source is uncertain, keep one consistent source-supported vantage (where the witness stood and what they could know), let hindsight create tension ('I did not yet know that…') only with facts the source gives, do not invent events or speeches of real people, and close on the source's actual outcome and lasting impression." as const;
export const CHRONICLE =
  "GENRE VOICE (CHRONICLE — High-Stakes Causal Arc): Tell the source's historical or factual arc in compelling chronological order, driving forward through its real turning points. Open with the pivotal catalyst or pressure point, link each chapter and beat by clear cause-and-effect momentum ('because of this, the next crisis erupted'; every beat answers 'but' or 'therefore', never just 'and then') rather than a flat list of dates, give each turning point its moment of doubt before the outcome, build to the decisive turning point, and land the real aftermath. A short flash-forward hook is optional when useful; dates and numbers come strictly from the source." as const;
export const VERDICT_2 =
  "GENRE VOICE (VERDICT — Investigative Question & Hypothesis Showdown): Investigate one compelling source-grounded central question using a clear, concrete evaluation criterion. Open by framing the central mystery/question and why the stakes matter (or use a brief cold open that immediately raises that question). Select only hypotheses/candidates supported by the source and suited to this duration (typically 2 sharp contenders for short videos, or 2–3 when longer). Put each candidate to the test against the criterion—showing its strongest supporting evidence, then exposing its critical flaw or turning-point counter-evidence—before delivering a definitive, reasoned final verdict. Let the strongest-looking candidate face its sharpest counter-evidence, and keep the answer genuinely open until the final test. For a short video, opening, criterion, candidates and conclusion may share one chapter; state the criterion once, reuse it naturally, and avoid robotic label stamping." as const;
export const PLAIN = "STORYTELLING MODE (PLAIN — Faithful & Gripping): Tell only what the source states, yet tell it like a thriller: open on its most striking fact, reveal facts in the order that builds the most tension and curiosity, make causes and stakes vivid with active verbs and the source's own concrete details, vary rhythm between punchy and flowing lines, and let every chapter end on a real unresolved fact that pulls into the next. No slow-telling, added lived texture or outside background; the drama comes from selection, order and phrasing of source facts." as const;
export const LIVELY_2 =
  "STORYTELLING MODE (LIVELY — Vivid & Engaging): Open with an immediate concrete detail or hook from the source, make the human or causal stakes tangible, use active verbs and vivid sensory grounding, vary sentence rhythm between brisk punchy lines and smooth narrative flow, and connect beats with purposeful momentum transitions that open a natural curiosity and pay it off cleanly." as const;
export const GRIPPING =
  "STORYTELLING MODE (GRIPPING — Maximum Retention & Dramatic Pull): Hook the viewer in the very first sentence with a high-stakes paradox, urgent conflict or decisive turning point from the source. Build relentless forward pull through sharp contrasts, escalating cause-and-consequence, strategic information release, and an open curiosity loop that stays alive until the evidence resolves it. Use punchy, high-impact spoken cadence and land a memorable callback/payoff without inventing facts or breaking the duration budget." as const;
export const THIN_SOURCE_LOG = (chapter: string, source: number, target: number, needed: number, allowed: number): string => `Chương ${chapter}: nguồn mỏng (~${source} âm tiết, mục tiêu ~${target}) cần kéo ×${needed.toFixed(1)}${needed > allowed ? `, vượt giới hạn kéo giãn ×${allowed.toFixed(1)} của thể loại/chế độ: phần còn lại bù bằng chiều sâu giải thích, không lặp` : ""}`;
export const THIN_SOURCE_FAITHFUL_LOG = (chapter: string, source: number, target: number, units: number): string => `Chương ${chapter}: Bám sát nguồn, nguồn chỉ có ~${source} âm tiết so với mục tiêu ~${target}; viết ~${units} âm tiết, không giãn, video sẽ ngắn hơn thời lượng đã chọn`;
export const RETENTION_CRAFT =
  "RETENTION CRAFT (lively): the first sentence must pull the viewer in within five seconds with the most striking source-supported moment, contrast or question, with no throat-clearing. Every beat must add something new (a fact, consequence, image or turn); never restate a fact, number, rumour or emotion already told anywhere in the script, merge it instead. Time only moves forward except one declared teaser. Show background through one concrete moment, object or action instead of summarising it; never run more than two exposition beats in a row, and compress lists (troop types, causes, names) into one vivid line or one image. Lead with the source's most surprising or counter-intuitive detail and find a fresh angle (expectation versus reality, a paradox, a hidden cause) instead of retelling the source line by line in its own order and wording. Prefer specific names, numbers, places and physical details from the source over generic phrases. When a chapter must run longer than its source, deepen instead of repeating: slowing one moment with new sensory, mechanical or consequence detail, or explaining how and why it happened, is new information; saying the same fact again in other words is not. Plant at least one real open question from the source early in each chapter and pay it off later; end every chapter on a concrete forward pull into the next. Raise the stakes as the video advances and let tension and brief release alternate." as const;
export const RETENTION_CRAFT_GRIPPING =
  "RETENTION CRAFT (gripping): the first sentence must pull the viewer in within five seconds with the most striking source-supported moment, contrast or question, with no throat-clearing. Every beat must add something new (a fact, consequence, image or turn); never restate a fact, number, rumour or emotion already told anywhere in the script, merge it instead. Time only moves forward except one declared teaser. Show background through one concrete moment, object or action instead of summarising it; never run more than two exposition beats in a row, and compress lists (troop types, causes, names) into one vivid line or one image. Lead with the source's most surprising or counter-intuitive detail and find a fresh angle (expectation versus reality, a paradox, a hidden cause) instead of retelling the source line by line in its own order and wording. Prefer specific names, numbers, places and physical details from the source over generic phrases. When a chapter must run longer than its source, deepen instead of repeating: slowing one moment with new sensory, mechanical or consequence detail, or explaining how and why it happened, is new information; saying the same fact again in other words is not. Plant at least one real open question from the source early in each chapter and pay it off later; end every chapter on a concrete forward pull into the next. Raise the stakes as the video advances and let tension and brief release alternate. Give every chapter at least one source-supported reversal, reveal or 'but then' turn; withhold the answer to the biggest question until the moment it lands hardest; keep sentences short and charged at peaks." as const;
export const RETENTION_CRAFT_PLAIN =
  "RETENTION CRAFT (plain): the first sentence must pull the viewer in within five seconds with the most striking source-supported moment, contrast or question, with no throat-clearing. Every beat must add something new (a fact, consequence, image or turn); never restate a fact, number, rumour or emotion already told anywhere in the script, merge it instead. Time only moves forward except one declared teaser. Show background through one concrete moment, object or action instead of summarising it; never run more than two exposition beats in a row, and compress lists (troop types, causes, names) into one vivid line or one image. Lead with the source's most surprising or counter-intuitive detail and find a fresh angle (expectation versus reality, a paradox, a hidden cause) instead of retelling the source line by line in its own order and wording. Prefer specific names, numbers, places and physical details from the source over generic phrases. Plant at least one real open question from the source early in each chapter and pay it off later; end every chapter on a concrete forward pull into the next. Raise the stakes as the video advances and let tension and brief release alternate. Drama comes only from which source facts you choose, the order you reveal them and how sharply you phrase them; never add events, texture or outside background." as const;
export const ONE_AUTHORING_CONTRACT_GENRE = "ONE AUTHORING CONTRACT: genre=" as const;
export const STORYTELLING = "; storytelling=" as const;
export const TOTAL_VIDEO_BUDGET_APPROXIMATELY = "; total video budget approximately " as const;
export const SECONDS = " seconds. " as const;
export const MOTIONHTMLGENREDIRECTION_TEMPLATE_PART_6 = " Scale structure to duration. No fixed stage/companion/motif/shot quotas. Facts, uncertainty and real quotations come only from the source. The selected visual style does not change person/tense or the genre. Hook metadata is optional and never replaces an actual setup/payoff." as const;
export const ROUGHLY = ", roughly " as const;
export const SECONDS_PER_ILLUSTRATION_SPOKEN_BEATS_AND_PICTURES_ARE_SEPARATE_MULTIPLE = " seconds per illustration. Spoken beats and pictures are separate: multiple sentences/beats can share one Canvas. Plan visual changes for the content, not for every sentence or gesture." as const;
export const VISUAL_STYLE_WORDS_ONLY = "VISUAL STYLE (words only): " as const;
export const CANVAS_GUARD_SCRIPT =
  "(function(){const P=CanvasRenderingContext2D.prototype,nBegin=P.beginPath,nMove=P.moveTo,nLine=P.lineTo,nQuad=P.quadraticCurveTo,nBez=P.bezierCurveTo,nClose=P.closePath,nRect=P.rect,nArc=P.arc,nEllipse=P.ellipse,nRoundRect=P.roundRect,nFill=P.fill,nStroke=P.stroke,nFillRect=P.fillRect,S=new WeakMap();const isStage=ctx=>{const t=ctx.getTransform();return Math.abs(t.b)<1e-3&&Math.abs(t.c)<1e-3&&t.a>0.15&&t.d>0.15};P.fillRect=function(x,y,w,h){if(w>=600&&h>=40&&isStage(this)){const cw=Math.max(1280,this.canvas?.width||1280),ch=Math.max(720,this.canvas?.height||720);let nx=x,ny=y,nw=w,nh=h;if(x<=2&&x+w>=Math.min(1278,cw-2)){nx=Math.min(x,-512);nw=Math.max(x+w,cw+512)-nx}if(nx!==x){if(y<=2){ny=Math.min(y,-360);nh+=y-ny}if(y+h>=Math.min(718,ch-2)){nh=Math.max(ny+nh,ch+360)-ny}}return nFillRect.call(this,nx,ny,nw,nh)}return nFillRect.call(this,x,y,w,h)};P.beginPath=function(){S.set(this,{ok:true,cmds:[]});return nBegin.call(this)};P.moveTo=function(x,y){const s=S.get(this);if(s?.ok)s.cmds.push({t:'M',x,y});return nMove.call(this,x,y)};P.lineTo=function(x,y){const s=S.get(this);if(s?.ok)s.cmds.push({t:'L',x,y});return nLine.call(this,x,y)};P.quadraticCurveTo=function(cx,cy,x,y){const s=S.get(this);if(s?.ok)s.cmds.push({t:'Q',cx,cy,x,y});return nQuad.call(this,cx,cy,x,y)};P.bezierCurveTo=function(c1x,c1y,c2x,c2y,x,y){const s=S.get(this);if(s?.ok)s.cmds.push({t:'B',c1x,c1y,c2x,c2y,x,y});return nBez.call(this,c1x,c1y,c2x,c2y,x,y)};P.closePath=function(){const s=S.get(this);if(s?.ok)s.cmds.push({t:'Z'});return nClose.call(this)};for(const [k,fn] of [['rect',nRect],['arc',nArc],['ellipse',nEllipse],['roundRect',nRoundRect]])if(fn)P[k]=function(...a){const s=S.get(this);if(s)s.ok=false;return fn.apply(this,a)};const expandPath=ctx=>{const s=S.get(ctx);if(!s?.ok||s.expanded||s.cmds.length<2||!isStage(ctx))return;const pts=s.cmds.filter(c=>c.x!==undefined);if(pts.length<2)return;let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of pts){if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;if(p.y<minY)minY=p.y;if(p.y>maxY)maxY=p.y}const cw=Math.max(1280,ctx.canvas?.width||1280),ch=Math.max(720,ctx.canvas?.height||720);if(minX>2||maxX<Math.min(1278,cw-2))return;s.expanded=true;const L=Math.min(minX,-512),R=Math.max(maxX,cw+512),T=-360,B=ch+360,isL=x=>Math.abs(x-minX)<=2,isR=x=>Math.abs(x-maxX)<=2,mapY=(x,y)=>(isL(x)||isR(x))?(y<=2&&minY<=2&&maxY-minY>=80?Math.min(y,T):y>=Math.min(718,ch-2)&&maxY>=Math.min(718,ch-2)&&maxY-minY>=35?Math.max(y,B):y):y;nBegin.call(ctx);for(let i=0;i<s.cmds.length;i++){const c=s.cmds[i],nx=s.cmds[i+1],nextCurve=nx&&(nx.t==='Q'||nx.t==='B'||(nx.t==='L'&&!isL(nx.x)&&!isR(nx.x)));if(c.t==='M'){const my=mapY(c.x,c.y);if(isL(c.x)){nMove.call(ctx,L,my);if(nextCurve)nLine.call(ctx,c.x,c.y)}else if(isR(c.x)){nMove.call(ctx,R,my);if(nextCurve)nLine.call(ctx,c.x,c.y)}else nMove.call(ctx,c.x,c.y)}else if(c.t==='L'){const my=mapY(c.x,c.y);if(isL(c.x)){nLine.call(ctx,L,my);if(nextCurve)nLine.call(ctx,c.x,c.y)}else if(isR(c.x)){nLine.call(ctx,R,my);if(nextCurve)nLine.call(ctx,c.x,c.y)}else nLine.call(ctx,c.x,c.y)}else if(c.t==='Q'){nQuad.call(ctx,c.cx,c.cy,c.x,c.y);if(isR(c.x))nLine.call(ctx,R,mapY(c.x,c.y));else if(isL(c.x))nLine.call(ctx,L,mapY(c.x,c.y))}else if(c.t==='B'){nBez.call(ctx,c.c1x,c.c1y,c.c2x,c.c2y,c.x,c.y);if(isR(c.x))nLine.call(ctx,R,mapY(c.x,c.y));else if(isL(c.x))nLine.call(ctx,L,mapY(c.x,c.y))}else if(c.t==='Z')nClose.call(ctx)}};P.fill=function(...a){if(a.length===0||typeof a[0]==='string')expandPath(this);return nFill.apply(this,a)};P.stroke=function(...a){if(a.length===0)expandPath(this);return nStroke.apply(this,a)}})();" as const;
export const SCRIPT = "<script>" as const;
export const HTML_BRIDGE_PREFIX = "window.__MOTION_HOST__=true;window.__motionErrors=[];addEventListener('error',e=>window.__motionErrors.push(e.message));addEventListener('unhandledrejection',e=>window.__motionErrors.push(String(e.reason)));addEventListener('message',async e=>{if(e.source!==parent||e.data?.token!==" as const;
export const HTML_BRIDGE_SUFFIX =
  ")return;const m=e.data;try{if(window.__motionErrors.length)throw Error(window.__motionErrors.join('\\n'));await window.motionScene.ready;await document.fonts.ready;await window.motionScene.renderAt(m.input);if(window.__motionErrors.length)throw Error(window.__motionErrors.join('\\n'));const canvas=document.getElementById('motion-canvas');if(m.input?.mode==='export'&&!m.allowBlank){const s=document.createElement('canvas');s.width=32;s.height=18;const x=s.getContext('2d');x.drawImage(canvas,0,0,32,18);const d=x.getImageData(0,0,32,18).data;let seen=false;for(let i=3;i<d.length;i+=4)if(d[i]){seen=true;break}if(!seen){parent.postMessage({token:m.token,id:m.id,blank:true},'*');return}}parent.postMessage({token:m.token,id:m.id,image:canvas.toDataURL('image/png')},'*')}catch(error){parent.postMessage({token:m.token,id:m.id,error:String(error?.message||error)},'*')}});</script>" as const;
export const U003C = MOTION_TEXT_U003C;
export const HTML_HOST_PREFIX =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; frame-src \'self\' about:; connect-src \'none\'"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#fff}iframe{border:0;width:100%;height:100%}#output{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}</style></head><body><iframe id="scene" sandbox="allow-scripts"></iframe><img id="output"><script>\nconst token=' as const;
export const F_DOCUMENT_GETELEMENTBYID_SCENE_PENDING_NEW_MAP_LET_COUNTER_0 = ",f=document.getElementById('scene'),pending=new Map();let counter=0;\nconst loaded=new Promise(r=>f.onload=r);f.srcdoc=" as const;
export const HTML_HOST_SUFFIX =
  ";\naddEventListener('message',e=>{if(e.source!==f.contentWindow||e.data?.token!==token)return;const p=pending.get(e.data.id);if(!p)return;pending.delete(e.data.id);clearTimeout(p.timer);if(e.data.blank)p.reject(Error('Canvas blank frame'));else if(e.data.error)p.reject(Object.assign(Error(e.data.error),{motionHtmlExecution:true}));else{if(!p.quiet)document.getElementById('output').src=e.data.image;p.resolve(e.data.image)}});\nwindow.renderMotionFrame=async(input,allowBlank)=>{await loaded;return new Promise((resolve,reject)=>{const id=++counter;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Canvas renderAt timed out'))},30000);pending.set(id,{resolve,reject,timer,quiet:input&&input.mode==='export'});f.contentWindow.postMessage({token,id,input,allowBlank:!!allowBlank},'*')})};\nlet busy=false,next;async function pump(){if(busy||!next)return;busy=true;const input=next;next=undefined;try{await window.renderMotionFrame(input)}catch(error){parent.postMessage({token,error:String(error.message||error)},'*')}finally{busy=false;pump()}}\naddEventListener('message',e=>{if(e.source!==parent||e.data?.token!==token)return;if(e.data.type==='motion-host-interaction'){document.getElementById('output').style.display=e.data.enabled?'none':'';return}if(e.data.type!=='motion-host-render')return;next=e.data.input;pump()});\n</script></body></html>" as const;
export const HTML_CANVAS = "html-canvas" as const;
export const PREVIEW = "preview" as const;
export const SIMPLE = "simple" as const;
export const FIXED = SOURCE_TEXT_FIXED;
export const OFF = SOURCE_TEXT_OFF;
export const CHARACTER = "character" as const;
export const ACCEPTED = "accepted" as const;
export const HORROR = "horror" as const;
export const W_B_BID_S_S = "<([\\w:-]+)\\b[^<>]*\\bid\\s*=\\s*([\"'])" as const;
export const VALUE_2 = "\\2[^<>]*?(\\/?)>" as const;
export const VALUE_1_2 = SOURCE_TEXT_1_4;
export const HASH = SOURCE_TEXT_SYMBOL_9;
export const DETAIL = "detail" as const;
export const WIDE = MOTION_TEXT_WIDE;
export const ILLUSTRATION = "illustration" as const;
export const PLANNING = SOURCE_TEXT_PLANNING;
export const DRAWING = "drawing" as const;
export const NAME_WORD_PREFIX = "(?:^|[_-])(?:" as const;
export const S_2 = ")s?(?:[_-]|$)" as const;
export const I = SOURCE_TEXT_I_2;
export const PROP = "prop" as const;
export const REMOTION = "remotion" as const;
export const LIBRARY = SOURCE_TEXT_LIBRARY;
export const VALUE_16_9 = SOURCE_TEXT_16_9;
export const READY = SOURCE_TEXT_READY;
export const RENDERED = "rendered" as const;
export const GENERATION = "generation" as const;
export const BUILD = "build" as const;
export const REQUESTKEYS = "requestKeys" as const;
export const WRITTENMOTIONKEY = "writtenMotionKey" as const;
export const ACTIONPLAN = "actionPlan" as const;
export const DRAWINGNOTE = "drawingNote" as const;
export const SOURCEKEY = "sourceKey" as const;
export const SOURCEBEATIDS = "sourceBeatIds" as const;
export const FAILSTREAK = "failStreak" as const;
export const DEFERRED = "deferred" as const;
export const QUALITYNOTE = "qualityNote" as const;
export const QUALITYREDRAWS = "qualityRedraws" as const;
export const REVIEWKEY = "reviewKey" as const;
export const CONTINUITYDRAFT = "continuityDraft" as const;
export const CONTINUITYKEY = "continuityKey" as const;
export const REMOVEDOBJECTS = "removedObjects" as const;
export const SHA256 = SOURCE_TEXT_SHA256;
export const HEX = SOURCE_TEXT_HEX;
export const ARROW_SEPARATOR = " → " as const;
export const RENAMEMAP = "renameMap[" as const;
export const RENAMED = "].renamed" as const;
export const TITLE_2 = SOURCE_TEXT_TITLE;
export const LOGLINE = SOURCE_TEXT_LOGLINE;
export const CAST = "cast[" as const;
export const NAME = "].name" as const;
export const PLACES = "places[" as const;
export const CHAPTERS = "chapters[" as const;
export const TITLE_3 = "].title" as const;
export const SUMMARY = "].summary" as const;
export const HOOK = "].hook" as const;
export const KEYPOINTS = "].keyPoints[" as const;
export const POLICY = " (policy " as const;
export const CLOSE = SOURCE_TEXT_CLOSE_2;
export const MEDIUM_CLOSE = "medium_close" as const;
export const ESTABLISHING = "establishing" as const;
export const OVER_SHOULDER = "over_shoulder" as const;
export const HANDSWITHOBJECT = "handsWithObject" as const;
export const MOUNTED = "mounted" as const;
export const HELDBY = "heldBy" as const;
export const LEGS = "legs" as const;
export const MATRIX = "matrix" as const;
export const TRANSLATE_3 = "translate" as const;
export const SCALE_2 = MOTION_TEXT_SCALE;
export const ROTATE_2 = "rotate" as const;
export const SKEWX = "skewX" as const;
export const SKEWY = "skewY" as const;
export const ACTOR = "actor" as const;
export const TRANSFORM_3 = "transform" as const;
export const HOLD = "hold" as const;
export const ANIMATIONS = "animations" as const;
export const EFFECT = "effect" as const;
export const RAIN = MOTION_TEXT_RAIN;
export const SMOKE = "smoke" as const;
export const STEAM = "steam" as const;
export const FLAME = "flame" as const;
export const FOG = MOTION_TEXT_FOG;
export const SWAY = "sway" as const;
export const HIGHLIGHT = "highlight" as const;
export const WIND = "wind" as const;
export const WATER = "water" as const;
export const VIEWBOX = ' viewBox="' as const;
export const PRESERVEASPECTRATIO = '" preserveAspectRatio="' as const;
export const X = SOURCE_TEXT_X;
export const WIDTH_2 = "width" as const;
export const Y_2 = "y" as const;
export const HEIGHT_2 = MOTION_TEXT_HEIGHT;
export const HORSE = "horse" as const;
export const REQUIRED = SOURCE_TEXT_REQUIRED;
export const BUST = "bust" as const;
export const LIE = "lie" as const;
export const FULL = "full" as const;
export const FORBIDDEN = "forbidden" as const;
export const ID = SOURCE_TEXT_ID;
export const TARGET = "target" as const;
export const SOURCEID = "sourceId" as const;
export const SUPPORTID = "supportId" as const;
export const SUBJECTID = "subjectId" as const;
export const P_L_P_N = "(?![\\p{L}\\p{N}_.-])" as const;
export const U = SOURCE_TEXT_U_2;
export const SVG_2 = SOURCE_TEXT_SVG;
export const ID_2 = "id=" as const;
export const URL = "url(" as const;
export const HREF = SOURCE_TEXT_HREF;
export const XLINK_HREF = "xlink:href" as const;
export const ARIA_LABELLEDBY = "aria-labelledby" as const;
export const ARIA_DESCRIBEDBY = SOURCE_TEXT_ARIA_DESCRIBEDBY_2;
export const EQUALS = SOURCE_TEXT_SYMBOL_33;
export const GU = "gu" as const;
export const KIND = "kind" as const;
export const VIDEOGENRE = "videoGenre" as const;
export const STORYTELLING_2 = MOTION_TEXT_STORYTELLING;
export const RENAMEENTITIES = "renameEntities" as const;
export const LENGTH = SOURCE_TEXT_LENGTH;
export const QUESTION_MARK = SOURCE_TEXT_SYMBOL_21;
export const VALUE_0_2 = SOURCE_TEXT_0;
export const PROTECTED_TEXT_START = "" as const;
export const PROTECTED_TEXT_END = "" as const;
export const UNICODE_NAME_PREFIX = "(?<![\\p{L}\\p{N}_])" as const;
export const UNICODE_NAME_SUFFIX = "(?![\\p{L}\\p{N}_])" as const;
export const GIU = "giu" as const;
export const STRICT = "strict" as const;
export const DEFS = "defs" as const;
export const CLIPPATH = "clipPath" as const;
export const MASK = "mask" as const;
export const SVG_SYMBOL_TAG = "symbol" as const;
export const PATTERN = "pattern" as const;
export const LINEARGRADIENT = "linearGradient" as const;
export const RADIALGRADIENT = "radialGradient" as const;
export const FILTER = "filter" as const;
export const MARKER = "marker" as const;
export const Z = "Z" as const;
export const H_2 = "H" as const;
export const V = "V" as const;
export const A = SOURCE_TEXT_A_2;
export const M = "M" as const;
export const S_S = "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')" as const;
export const RECT = "rect" as const;
export const IMAGE = SOURCE_TEXT_IMAGE;
export const USE = SOURCE_TEXT_USE;
export const CIRCLE = "circle" as const;
export const ELLIPSE = "ellipse" as const;
export const CX = "cx" as const;
export const CY_2 = "cy" as const;
export const R_2 = SOURCE_TEXT_R;
export const RX = "rx" as const;
export const RY = "ry" as const;
export const LINE = MOTION_TEXT_LINE;
export const X1 = "x1" as const;
export const Y1 = "y1" as const;
export const X2 = "x2" as const;
export const Y2 = "y2" as const;
export const POLYGON = "polygon" as const;
export const POLYLINE = "polyline" as const;
export const POINTS = "points" as const;
export const PATH = SOURCE_TEXT_PATH;
export const D = SOURCE_TEXT_D;
export const LEAD = "lead" as const;
export const WORD_BOUNDARY_PREFIX = "(?:^|[_-])" as const;
export const WORD_BOUNDARY_SUFFIX = "(?:[_-]|$)" as const;
export const GI = SOURCE_TEXT_GI;
export const CLOSING_TAG_PREFIX = "</" as const;
export const REGEXP_GLOBAL = "g" as const;
export const SVG_GROUP_PREFIX = "<g" as const;
export const PASSED = "passed" as const;
export const REVIEW = "review" as const;
export const UNAVAILABLE = SOURCE_TEXT_UNAVAILABLE;
export const S_3 = "'s" as const;
export const NGAN = "ngàn" as const;
export const NGHIN = "nghìn" as const;
export const LINH = "linh" as const;
export const AND = SOURCE_TEXT_AND;
export const D_D = "(?:\\d+(?:[,.]\\d+)*|" as const;
export const P_L_P_N_A_AN_HUNDRED_B_THOUSAND_B = "(?<![\\p{L}\\p{N}_])(?:(?:a|an)[ ]+(?=hundred\\b|thousand\\b|million\\b|billion\\b))?" as const;
export const NAME_HONORIFIC_PREFIX = "(?:[ -]+" as const;
export const P_L_P_N_4 = ")*(?![\\p{L}\\p{N}_])" as const;
export const PERCENT_SLASH = "%/" as const;
export const PERCENT = SOURCE_TEXT_SYMBOL_8;
export const NARRATION = MOTION_TEXT_NARRATION;
export const DOMCONTENTLOADED = SOURCE_TEXT_DOMCONTENTLOADED;
export const DIALOG = SOURCE_TEXT_DIALOG;
export const ALERTDIALOG = "alertdialog" as const;
export const HEADING = SOURCE_TEXT_HEADING;
export const DELETE = SOURCE_TEXT_DELETE_2;
export const PATCH = "PATCH" as const;
export const POST = SOURCE_TEXT_POST;
export const VISIBLE = SOURCE_TEXT_VISIBLE;
export const BUTTON = SOURCE_TEXT_BUTTON;
export const HIDDEN = SOURCE_TEXT_HIDDEN;
export const MENUITEM = SOURCE_TEXT_MENUITEM;
export const TRUE = SOURCE_TEXT_TRUE;
export const CLASS = "class" as const;
export const ID_3 = "[id=" as const;
export const MOTION_HTML_SCENE = "motion-html-scene" as const;
export const ABOUT_BLANK = SOURCE_TEXT_ABOUT_BLANK;
export const PHONG_GEMINI_DA_CHUYEN_SANG = "Phòng Gemini đã chuyển sang " as const;
export const GIU_YEU_CAU_CU_DE_DOC_LAI_KHONG_GUI_LAP = "; giữ yêu cầu cũ để đọc lại, không gửi lặp." as const;
export const MOTION_HTML_PLAN = "motion-html-plan" as const;
export const SCENES = SOURCE_TEXT_SCENES;
export const RETURN_THE_COMPLETE_HTML_DOCUMENT_IN_ONE_HTML_CODE_BLOCK = "Return the complete HTML document in one html code block, preserving the requested html root data-artifact and data-request-id. No JSON or explanation." as const;
export const DIAGNOSTICS = MOTION_TEXT_DIAGNOSTICS;
export const ABORT = SOURCE_TEXT_ABORT;
export const EMPTY = "empty" as const;
export const DELETED = "deleted" as const;
export const SELECTED = SOURCE_TEXT_SELECTED;
export const ACTIVE = "active" as const;
export const SELECTED_ACTIVE_DATA_ACTIVE_TRUE = '.selected, .active, [data-active="true"]' as const;
export const ARIA_CHECKED = SOURCE_BROWSER_TEXT_ARIA_CHECKED;
export const ARIA_SELECTED = SOURCE_TEXT_ARIA_SELECTED;
export const ACTIVE_2 = ", .active, [" as const;
export const ARIA_CHECKED_2 = '"], [aria-checked="' as const;
export const DATA_MAT_ICON_NAME_CHECK_FONTICON_CHECK_INPUT_CHECKED = '"], [data-mat-icon-name="check"], [fonticon="check"], input:checked' as const;
export const PATH_2 = "PATH" as const;
export const MOTION = "motion-" as const;
export const MOTION_HOST_INTERACTION = "motion-host-interaction" as const;
export const WILDCARD = SOURCE_BROWSER_TEXT_SYMBOL;
export const MOTION_HOST_RENDER = "motion-host-render" as const;
export const MOTION_HTML_EXECUTION_ERROR = "motion-html-execution-error" as const;
export const MESSAGE = SOURCE_TEXT_MESSAGE;
export const RELATIVE = SOURCE_TEXT_RELATIVE;
export const SLASH = SOURCE_TEXT_SYMBOL;
export const FFF = "#fff" as const;
export const CANVAS_SCENE = "Canvas scene" as const;
export const ALLOW_SCRIPTS = "allow-scripts" as const;
export const VALUE_100 = "100%" as const;
export const DANG_DUNG_CANH = "Đang dựng cảnh…" as const;
export const ABSOLUTE = "absolute" as const;
export const VALUE_7 = "7%" as const;
export const VALUE_4 = "4%" as const;
export const WHITE = SOURCE_TEXT_WHITE;
export const BOLD = "bold " as const;
export const PX = "px " as const;
export const ARIAL = "Arial" as const;
export const VALUE_0_2PX_3PX_000_1PX_0_2PX_000_1PX_0 = "0 2px 3px #000,1px 0 2px #000,-1px 0 2px #000" as const;
export const NONE = SOURCE_TEXT_NONE;
export const FLEX = "flex" as const;
export const PAUSE_ICON = "⏸" as const;
export const PLAY_ICON = MOTION_TEXT_SYMBOL_11;
export const VIDEO_TIMELINE = "Video timeline" as const;
export const RANGE = SOURCE_TEXT_RANGE;
export const SLASH_SEPARATOR = SOURCE_TEXT_SYMBOL_2;
export const S_4 = MOTION_TEXT_S;
export const VE_VIDEO = "Về video" as const;
export const THU_TUONG_TAC = "Thử tương tác" as const;
export const ALERT = SOURCE_TEXT_ALERT;
export const WAITING_EXTERNAL = "waiting_external" as const;
export const WAITING_FOR_PROVIDER_PREVIOUS_REQUEST = "Waiting for provider / previous request" as const;
export const CHO_PROVIDER_PHAN_HOI_YEU_CAU_CU = "Chờ provider / phản hồi yêu cầu cũ" as const;
export const RETRY_WAIT = "retry_wait" as const;
export const WAITING_TO_RETRY = "Waiting to retry" as const;
export const DANG_CHO_THU_LAI = "Đang chờ thử lại" as const;
export const GENERATING_HTML = "Generating HTML" as const;
export const DANG_TAO_HTML = "Đang tạo HTML" as const;
export const ATTEMPT = "Attempt" as const;
export const LUOT_TAO = "Lượt tạo" as const;
export const DOT_SEPARATOR = MOTION_TEXT_SYMBOL_10;
export const CONTAIN = "contain" as const;
export const STATUS = SOURCE_TEXT_STATUS;
export const SELECTED_TOTAL = "Selected total" as const;
export const MOC_CHON_TONG = "Mốc chọn tổng" as const;
export const COLON_SPACE = SOURCE_TEXT_SYMBOL_7;
export const THIS_PART_PLANNED = "This part planned" as const;
export const DU_KIEN_PHAN_NAY = "Dự kiến phần này" as const;
export const ACTUAL_AUDIO = "Actual audio" as const;
export const AUDIO_THUC = "Audio thực" as const;
export const SCENE_DURATIONS_ON_THIS_TIMELINE = "Scene durations on this timeline" as const;
export const THOI_LUONG_CANH_TREN_TIMELINE_NAY = "Thời lượng cảnh trên timeline này" as const;
export const GRID_GRID_COLS_1_GAP_2_PT_2 = "grid grid-cols-1 gap-2 pt-2" as const;
export const H_3 = "h" as const;
export const M_2 = SOURCE_TEXT_M;
export const GIO = " giờ" as const;
export const PHUT = MOTION_TEXT_PHUT;
export const GIAY = " giây" as const;
export const PUSH = "push" as const;
export const VISUALSETTINGS = "visualSettings" as const;
export const TRACK_MP3 = "track.mp3" as const;
export const TRACK = "Track" as const;
export const FLEX_ITEMS_CENTER_GAP_2_SELF_START_MD_SELF_AUTO = "flex items-center gap-2 self-start md:self-auto px-5 py-2.5 rounded-2xl font-bold shadow-md shadow-rose-600/20" as const;
export const W_4_H_4 = SOURCE_TEXT_W_4_H_4;
export const FLEX_FLEX_COL_SM_FLEX_ROW_GAP_4_ITEMS_START = "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between glass-card p-4 rounded-2xl" as const;
export const FLEX_FLEX_WRAP_ITEMS_CENTER_GAP_2_W_FULL_SM = "flex flex-wrap items-center gap-2 w-full sm:w-auto" as const;
export const PX_4_PY_2_H_10_TEXT_XS_FONT_BOLD = "px-4 py-2 h-10 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none border flex items-center justify-center" as const;
export const BG_SLATE_900_90_BORDER_BORDER_SLATE_800_TEXT_SLATE = "bg-slate-900/90 border border-slate-800 text-slate-300 rounded-xl px-3 h-10 text-xs font-bold outline-none hover:border-slate-700 transition-all flex items-center" as const;
export const RELATIVE_W_FULL_SM_W_72 = "relative w-full sm:w-72" as const;
export const W_4_H_4_TEXT_SLATE_400_ABSOLUTE_LEFT_3 = "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" as const;
export const W_FULL_H_10_BG_SLATE_950_80_BORDER_BORDER = "w-full h-10 bg-slate-950/80 border border-slate-800 text-xs text-slate-100 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-rose-500/80 transition-all font-sans" as const;
export const TEXT_CENTER_PY_20_GLASS_CARD_ROUNDED_3XL_BORDER_BORDER = "text-center py-20 glass-card rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 space-y-4" as const;
export const P_4_BG_SLATE_900_90_ROUNDED_2XL_BORDER_BORDER = "p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-rose-500 shadow-inner" as const;
export const W_8_H_8 = "w-8 h-8" as const;
export const TEXT_SLATE_400_TEXT_XS_FONT_SEMIBOLD_MAX_W_SM = "text-slate-400 text-xs font-semibold max-w-sm leading-relaxed" as const;
export const FLEX_ITEMS_CENTER_GAP_2_FONT_BOLD_TEXT_XS_ROUNDED = "flex items-center gap-2 font-bold text-xs rounded-xl" as const;
export const GLASS_CARD_ROUNDED_3XL_SHADOW_LG_OVERFLOW_HIDDEN_BORDER_BORDER = "glass-card rounded-3xl shadow-lg overflow-hidden border border-slate-800/80" as const;
export const OVERFLOW_X_AUTO = "overflow-x-auto" as const;
export const PROJECT_TABLE_W_FULL_BORDER_COLLAPSE_TEXT_LEFT = "project-table w-full border-collapse text-left" as const;
export const BORDER_B_BORDER_SLATE_800_TEXT_11PX_FONT_MONO_TEXT = "border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase font-black tracking-wider bg-slate-955/60" as const;
export const PY_4_PX_6_MIN_W_280PX = "py-4 px-6 min-w-[280px]" as const;
export const PY_4_PX_4_TEXT_CENTER_MIN_W_100PX = "py-4 px-4 text-center min-w-[100px]" as const;
export const PY_4_PX_4_TEXT_CENTER_MIN_W_120PX = "py-4 px-4 text-center min-w-[120px]" as const;
export const PY_4_PX_4_MIN_W_140PX = "py-4 px-4 min-w-[140px]" as const;
export const PY_4_PX_6_TEXT_RIGHT_MIN_W_150PX = "py-4 px-6 text-right min-w-[150px]" as const;
export const DIVIDE_Y_DIVIDE_SLATE_800_60 = "divide-y divide-slate-800/60" as const;
export const GROUP_HOVER_BG_SLATE_850_70_CURSOR_POINTER_TRANSITION_COLORS = "group hover:bg-slate-850/70 cursor-pointer transition-colors duration-200" as const;
export const PY_4_PX_6 = "py-4 px-6" as const;
export const FLEX_ITEMS_CENTER_GAP_4 = "flex items-center gap-4" as const;
export const W_6_SHRINK_0_FLEX_ITEMS_CENTER_JUSTIFY_CENTER = "w-6 shrink-0 flex items-center justify-center" as const;
export const P_1_5_HOVER_BG_SLATE_800_ROUNDED_XL_TRANSITION = "p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-100 shrink-0" as const;
export const W_4_H_4_TEXT_ROSE_500 = SOURCE_TEXT_W_4_H_4_TEXT_ROSE_500;
export const W_4_H_4_TEXT_SLATE_400 = "w-4 h-4 text-slate-400" as const;
export const W_14_H_14_BG_SLATE_950_90_BORDER_BORDER = "w-14 h-14 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:border-rose-500/40 transition-colors shadow-inner" as const;
export const W_6_H_6_TEXT_SLATE_500_GROUP_HOVER_TEXT = "w-6 h-6 text-slate-500 group-hover:text-rose-500 transition-colors" as const;
export const SPACE_Y_1_MIN_W_0_FLEX_1 = "space-y-1 min-w-0 flex-1" as const;
export const FLEX_ITEMS_CENTER_GAP_2_MIN_W_0 = SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W;
export const FONT_EXTRABOLD_TEXT_SLATE_100_TEXT_XS_TRACKING_TIGHT_GROUP = "font-extrabold text-slate-100 text-xs tracking-tight group-hover:text-rose-400 transition-colors truncate" as const;
export const TEXT_SLATE_400_TEXT_11PX_FONT_MEDIUM_TRUNCATE_LEADING_RELAXED = "text-slate-400 text-[11px] font-medium truncate leading-relaxed max-w-md" as const;
export const PY_4_PX_4_TEXT_CENTER_WHITESPACE_NOWRAP = "py-4 px-4 text-center whitespace-nowrap" as const;
export const INLINE_FLEX_ITEMS_CENTER_GAP_1_BG_SLATE_900_80 = "inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[10px] font-bold" as const;
export const W_3_H_3_TEXT_SKY_400 = "w-3 h-3 text-sky-400" as const;
export const PY_4_PX_4_WHITESPACE_NOWRAP = "py-4 px-4 whitespace-nowrap" as const;
export const FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_4_TEXT_XS_FONT = "flex items-center justify-center gap-4 text-xs font-mono font-bold select-none whitespace-nowrap" as const;
export const FLEX_ITEMS_CENTER_GAP_1_5_SHRINK_0 = "flex items-center gap-1.5 shrink-0" as const;
export const W_4_H_4_TEXT_BLUE_400_SHRINK_0 = "w-4 h-4 text-blue-400 shrink-0" as const;
export const TEXT_SLATE_400_WHITESPACE_NOWRAP = "text-slate-400 whitespace-nowrap" as const;
export const TEXT_BLUE_400 = SOURCE_TEXT_TEXT_BLUE_400;
export const MX_0_5_TEXT_SLATE_600 = "mx-0.5 text-slate-600" as const;
export const W_4_H_4_TEXT_EMERALD_400_SHRINK_0 = SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400_2;
export const TEXT_EMERALD_400 = SOURCE_TEXT_TEXT_EMERALD_400;
export const W_4_H_4_TEXT_AMBER_400_SHRINK_0 = "w-4 h-4 text-amber-400 shrink-0" as const;
export const TEXT_AMBER_400 = SOURCE_TEXT_TEXT_AMBER_400;
export const PY_4_PX_4_TEXT_XS_TEXT_SLATE_400_FONT = "py-4 px-4 text-xs text-slate-400 font-mono font-medium whitespace-nowrap" as const;
export const FLEX_ITEMS_CENTER_GAP_1_5_WHITESPACE_NOWRAP = "flex items-center gap-1.5 whitespace-nowrap" as const;
export const W_3_5_H_3_5_TEXT_SLATE_500_SHRINK = "w-3.5 h-3.5 text-slate-500 shrink-0" as const;
export const WHITESPACE_NOWRAP = "whitespace-nowrap" as const;
export const PY_4_PX_6_TEXT_RIGHT = "py-4 px-6 text-right" as const;
export const FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2 = "flex items-center justify-end gap-2" as const;
export const TEXT_10PX_FONT_BOLD_PY_1_5_PX_3_ROUNDED = "text-[10px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm" as const;
export const W_3_5_H_3_5 = SOURCE_TEXT_W_3_5_H_3_5;
export const W_3_H_3 = SOURCE_TEXT_W_3_H_3;
export const P_2_TEXT_SLATE_400_HOVER_TEXT_SLATE_100_HOVER = "p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl" as const;
export const P_2_TEXT_SLATE_400_HOVER_TEXT_RED_400_HOVER = "p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl" as const;
export const BG_SLATE_950_40_BORDER_B_BORDER_SLATE_800_60 = "bg-slate-950/40 border-b border-slate-800/60" as const;
export const PY_3_PX_6 = "py-3 px-6" as const;
export const SPACE_Y_2_PL_6_BORDER_L_2_BORDER_ROSE = "space-y-2 pl-6 border-l-2 border-rose-500/30 ml-4 py-1" as const;
export const TEXT_10PX_FONT_BOLD_TEXT_SLATE_500_UPPERCASE_TRACKING_WIDER = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono flex items-center gap-1 select-none" as const;
export const W_3_5_H_3_5_TEXT_ROSE_500_60 = "w-3.5 h-3.5 text-rose-500/60" as const;
export const GRID_GAP_2 = "grid gap-2" as const;
export const FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_P_3_BG_SLATE_900 = "flex items-center justify-between p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-2xl cursor-pointer transition-all duration-200 group/child shadow-sm" as const;
export const FLEX_ITEMS_CENTER_GAP_3 = SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_3;
export const W_4_H_4_TEXT_ROSE_500_70_GROUP_HOVER = "w-4 h-4 text-rose-500/70 group-hover/child:text-rose-500 transition-colors" as const;
export const FLEX_FLEX_COL_GAP_0_5 = "flex flex-col gap-0.5" as const;
export const TEXT_XS_FONT_BOLD_TEXT_SLATE_200_GROUP_HOVER_CHILD = "text-xs font-bold text-slate-200 group-hover/child:text-rose-400 transition-colors" as const;
export const TEXT_9PX_TEXT_SLATE_500_FONT_MEDIUM_FONT_MONO = "text-[9px] text-slate-500 font-medium font-mono" as const;
export const FLEX_ITEMS_CENTER_GAP_2 = SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2;
export const TEXT_9PX_FONT_BOLD_PY_1_PX_3_ROUNDED_XL = "text-[9px] font-bold py-1 px-3 rounded-xl shadow-sm" as const;
export const P_1_5_TEXT_SLATE_400_HOVER_TEXT_RED_400 = "p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl" as const;
export const FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_P_4_BORDER_T_BORDER = "flex items-center justify-between p-4 border-t border-slate-800/80 bg-slate-950/40" as const;
export const TEXT_11PX_TEXT_SLATE_400_FONT_MEDIUM_FONT_MONO = "text-[11px] text-slate-400 font-medium font-mono" as const;
export const PX_3_PY_1_5_TEXT_XS_FONT_BOLD_ROUNDED = "px-3 py-1.5 text-xs font-bold rounded-xl transition-all" as const;
export const TEXT_XS_TEXT_SLATE_300_FONT_BOLD_FONT_MONO_PX = "text-xs text-slate-300 font-bold font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800" as const;
export const FLEX_ITEMS_CENTER_GAP_2_UPPERCASE_TRACKING_WIDER_FONT_EXTRABOLD = "flex items-center gap-2 uppercase tracking-wider font-extrabold" as const;
export const UPPERCASE_FONT_EXTRABOLD_TRACKING_WIDER = "uppercase font-extrabold tracking-wider" as const;
export const SPACE_Y_4 = SOURCE_TEXT_SPACE_Y_4;
export const TEXT_SLATE_700_DARK_TEXT_SLATE_300_TEXT_XS_LEADING = "text-slate-700 dark:text-slate-300 text-xs leading-relaxed" as const;
export const FONT_BOLD_TEXT_SLATE_900_DARK_TEXT_SLATE_100_PX = "font-bold text-slate-900 dark:text-slate-100 px-1" as const;
export const P_3_ROUNDED_2XL_BG_ROSE_500_10_BORDER_BORDER = "p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold leading-relaxed" as const;
export const FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2_5_PT_4 = "flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800" as const;
export const PX_4_PY_2_TEXT_XS_FONT_BOLD_ROUNDED_XL = "px-4 py-2 text-xs font-bold rounded-xl" as const;
export const PX_5_PY_2_TEXT_XS_FONT_BOLD_ROUNDED_XL = "px-5 py-2 text-xs font-bold rounded-xl" as const;
export const SPACE_Y_1_5 = "space-y-1.5" as const;
export const TEXT_10PX_FONT_EXTRABOLD_TEXT_SLATE_700_DARK_TEXT_SLATE = "text-[10px] font-extrabold text-slate-700 dark:text-slate-300 font-mono uppercase block tracking-wider" as const;
export const PROJECTLIST = "w-full h-10 bg-white dark:bg-slate-955 border border-slate-300 dark:border-slate-800 focus:border-rose-500 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-xs focus:outline-none transition-all font-sans shadow-xs" as const;
export const PROJECTLIST_2 = "w-full bg-white dark:bg-slate-955 border border-slate-300 dark:border-slate-800 focus:border-rose-500 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none transition-all resize-none font-sans shadow-xs" as const;
export const BG_AMBER_500_10_BORDER_BORDER_AMBER_500_20_P = "bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300" as const;
export const W_4_H_4_TEXT_AMBER_500_SHRINK_0_MT = "w-4 h-4 text-amber-500 shrink-0 mt-0.5" as const;
export const LEADING_RELAXED_TEXT_11PX = "leading-relaxed text-[11px]" as const;
export const FONT_EXTRABOLD_UPPERCASE_TRACKING_WIDER_TEXT_AMBER_600_DARK_TEXT = "font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[10px] block mb-0.5" as const;
export const FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2_5_PT_3 = MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2_5_PT_3_BORDER_T_BORDER_SLATE_;
export const VALUE_1_3 = ".{1," as const;
export const MEASURED = "measured" as const;
export const LANGUAGE_DEFAULT = "language-default" as const;
export const HOAN_TAT_CHIA_PHAN_CANH_VA_PROMPT_0_4_TRUOC = "Hoàn tất chia phân cảnh và prompt 0–4 trước khi chuyển sang dựng cảnh HTML." as const;
export const KHOI_PHUC_BUOC_PHAN_CANH_TU_LOI_DAN_DA_LUU = "Khôi phục bước phân cảnh từ lời dẫn đã lưu; chia xong tất cả cảnh trước khi dựng HTML." as const;
export const NGUON_DUOC_AI_LAP_THANH = "Nguồn được AI lập thành " as const;
export const PHAN_CO_NOI_DUNG_SO_VOI = " phần có nội dung, so với " as const;
export const PHAN_DA_CHON_GIU_KE_HOACH_THUC_TE_VA_GHI = " phần đã chọn; giữ kế hoạch thực tế và ghi rõ sự khác biệt." as const;
export const THOI_LUONG_DA_CHON = "Thời lượng: đã chọn " as const;
export const S_TONG_PHAN_NAY_DU_KIEN = "s tổng; phần này dự kiến " as const;
export const S_AUDIO_THUC = "s; audio thực " as const;
export const S_5 = "s." as const;
export const REJECTED = SOURCE_TEXT_REJECTED;
export const HTML_CANVAS_CHROME = "HTML Canvas / Chrome" as const;
export const CONTENT = "content:" as const;
export const DANG_MO = "Đang mở " as const;
export const ROOM_AI_NOI_DUNG = " room AI nội dung." as const;
export const DA_SAN_SANG = "Đã sẵn sàng " as const;
export const CLOSE_BRACKET_SPACE = "] " as const;
export const HTML = "html" as const;
export const THE_HTML_ROOT_MUST_CARRY_DATA_ARTIFACT = "\nThe html root must carry data-artifact='" as const;
export const AND_DATA_REQUEST_ID = "' and data-request-id='" as const;
export const TO_IDENTIFY_THIS_RESPONSE_RETURN_THE_COMPLETE_HTML_ONLY = "' to identify this response. Return the complete HTML only." as const;
export const MOTION_HTML = "motion-html-" as const;
export const CODE = SOURCE_TEXT_CODE;
export const TEXT_PLAIN = "text/plain" as const;
export const HTML_AUTHORING_ENGLISH_V2 = "html-authoring-english-v2" as const;
export const PLAN_ABOUT = " Plan about " as const;
export const CHAPTERS_WITHIN = " chapters within " as const;
export const S_TOTAL_ALLOWING_STAGES_TO_SHARE_CHAPTERS_AT_LEAST = "s TOTAL, allowing stages to share chapters. At least " as const;
export const GENREDIRECTIVE_TEMPLATE_PART_4 = " meaningful chapter ranges are needed for the requested parts; explain if the source cannot support them. No SOLO stages or candidate quota. Choose a single opening sequence and keep it throughout writing." as const;
export const CANVAS_MOTION = "Canvas motion " as const;
export const NO_POSE_TRANSFORMS_MOVETO_COORDINATES_STOCK_FRAMES_OR_SIMPLIFIED_CONTACT = ". No pose transforms, moveTo coordinates, stock frames or simplified-contact restrictions." as const;
export const ENABLED_DESCRIBE_THE_SOURCE_SUPPORTED_ACTIONS_AND_CAMERA_IN_PROSE = "enabled: describe the source-supported actions and camera in prose; AI will draw their full movement freely" as const;
export const DISABLED_PLAN_AN_OPENING_ILLUSTRATION_THE_HOST_WILL_FREEZE_ALL = "disabled: plan an opening illustration; the host will freeze all content time" as const;
export const SELECTED_VISUAL_STYLE_IN_PROSE = "Selected visual style in prose: " as const;
export const DO_NOT_SUPPLY_SVG_RIG_BODY_FRAMES_OR_NUMERIC_PLACEMENT = ". Do not supply SVG, rig, body frames or numeric placement." as const;
export const LIGHT = MOTION_TEXT_LIGHT;
export const SELECTED_VISUAL_CONSTRUCTION_SHAPE_REFERENCE_NOT_PRESCRIBED_CHOREOGRAPHY = "\nSELECTED VISUAL CONSTRUCTION (shape reference, not prescribed choreography): " as const;
export const SCRIPTWRITER_PRESERVING_SOURCE_FACTS_SPOKEN_VOICE_AND_CONTINUITY_AUTHORING_THE = "Scriptwriter preserving source facts, spoken voice and continuity, authoring the complete intended scene action alongside narration." as const;
export const NONEMPTY_SCENE_MOVEMENT_WRITTEN_BY_THE_SCRIPT_AI = "nonempty scene movement written by the script AI" as const;
export const BASE64 = SOURCE_TEXT_BASE64;
export const DASH = SOURCE_TEXT_SYMBOL_15;
export const DOT = SOURCE_TEXT_SYMBOL_23;
export const PNG = SOURCE_TEXT_PNG_2;
export const SVG_3 = ".svg" as const;
export const MOTION_HTML_CHAPTER = "motion-html-chapter" as const;
export const HTML_MULTIPART_V1 = "html-multipart-v1" as const;
export const SCENETEMPLATEDRAFT = "sceneTemplateDraft" as const;
export const CHUONG = "Chương " as const;
export const CHIA_THANH = ": chia thành " as const;
export const PHAN_NHO = " phần nhỏ (~" as const;
export const PHAN_CANH_LUOT_DE_TOI_UU_TOC_DO_VA_TRANH = " phân cảnh/lượt) để tối ưu tốc độ và tránh quá tải token phản hồi." as const;
export const CHAPTER_PART = "CHAPTER PART " as const;
export const WRITE_ONLY_CONSECUTIVE_PART = ": Write ONLY consecutive part " as const;
export const OF = " of " as const;
export const FOR_CHAPTER = " for chapter " as const;
export const OPEN_PAREN_SPACE = SOURCE_TEXT_SYMBOL_11;
export const RETURN_ONLY = "). Return ONLY " as const;
export const BEATS_AT_MOST = " beats (AT MOST " as const;
export const BEATS_STARTING_WITH_BEAT_ID = " beats, starting with beat ID " as const;
export const B = "_b" as const;
export const COVERING_THIS_PART_S_SOURCE_SLICE = ") covering this part's SOURCE slice." as const;
export const THIS_PART_OPENS_THE_CHAPTER_ESTABLISH_THE_CHAPTER_HOOK_IMMEDIATELY = "This part opens the chapter: establish the chapter hook immediately and cover only this part's source slice." as const;
export const CONTINUE_SEAMLESSLY_FROM_THE_LAST_BEAT_IN_ALREADYWRITTEN_WITHOUT_REPEATING = "Continue seamlessly from the last beat in alreadyWritten without repeating earlier hooks, facts, or scenes." as const;
export const STOP_AT_THE_END_OF_THIS_PART_S_SOURCE_SLICE = "Stop at the end of this part's source slice; reserve the chapter's closing payoff/handoff for the final part." as const;
export const THIS_IS_THE_FINAL_PART_OF_THE_CHAPTER_DELIVER_THE = "This is the final part of the chapter: deliver the chapter's closing payoff or handoff cleanly." as const;
export const PARTPROMPT = "Write the requested chapter part in the selected spoken language. Return JSON {chapterId,beats:[{id,narration,visual,place?,cast?,sceneTemplateDraft,utterances?}]}. Stable IDs identify source events. visual is scene/map/diagram/process/timeline/comparison/card as appropriate. Do not turn a sentence into a separate picture by default." as const;
export const LANGUAGE_2 = "Language=" as const;
export const THIS_CHAPTER_PART = ". THIS CHAPTER PART (" as const;
export const HAS_APPROXIMATELY = ") has approximately " as const;
export const SECONDS_OF_SPEECH_AT = " seconds of speech at " as const;
export const SPOKEN_UNITS_SECOND_APPROXIMATELY = " spoken units/second: approximately " as const;
export const UNITS_TOTAL_ACROSS_ALL_ITS_BEATS_TARGET_WINDOW = " units TOTAL across all its beats (target window " as const;
export const SPOKEN_WORDS_SYLLABLES_ACROSS = " spoken words/syllables across " as const;
export const BEATS_OF = " beats of ~" as const;
export const UNITS_EACH_HOLDING = " units each, holding ~" as const;
export const S_PER_SCENE_FULL_CHAPTER_BUDGET_IS = "s per scene). Full chapter budget is " as const;
export const S_6 = "s (" as const;
export const UNITS_ACROSS = " units across ~" as const;
export const SCENES_FULL_VIDEO_PART_HAS = " scenes); full video part has " as const;
export const S_WITH = "s with " as const;
export const S_RESERVED_FOR_PAUSES_SUMMARIZE_THIS_PART_S_CAUSAL_ARC = "s reserved for pauses. Summarize this part's causal arc within " as const;
export const SPOKEN_UNITS_DO_NOT_NARRATE_EVERY_SOURCE_SENTENCE = " spoken units; do not narrate every source sentence." as const;
export const ONE_NARRATOR_READS_EVERYTHING_EXACTLY_ONCE_UTTERANCES_CAN_BE_OMITTED = "One narrator reads everything exactly once. utterances can be omitted. Do not invent dialogue." as const;
export const USE_NARRATOR_FOR_NARRATION_AND_THE_SUPPLIED_CAST_KEYS_FOR = "Use narrator for narration and the supplied cast keys for source-supported dialogue. Joined utterance text matches narration exactly; no duplicate spoken words." as const;
export const PARTPROMPT_2 = "Source supplies facts and uncertainty; real people's actions/quotes must be supported. Describe the mechanics of approved actions without inventing another event. Keep production prose separate from speech. Preserve the full sceneTemplateDraft through the response." as const;
export const VIET_PHAN_CANH_CHUONG = "Viết phân cảnh chương " as const;
export const PHAN = " — phần " as const;
export const APPROXIMATE_PREFIX = " (~" as const;
export const CANH = " cảnh, ~" as const;
export const AM_TIET = " âm tiết)…" as const;
export const MOTION_STORY_CHAPTER = "motion-story-chapter" as const;
export const KHONG_DOC_DUOC_DANH_SACH_LOI_CUA_CHUONG_TU_PHAN = "Không đọc được danh sách lời của chương từ phản hồi AI." as const;
export const PROMPT = "Write the requested chapter in the selected spoken language. Return JSON {chapterId,beats:[{id,narration,visual,place?,cast?,sceneTemplateDraft,utterances?}]}. Stable IDs identify source events. visual is scene/map/diagram/process/timeline/comparison/card as appropriate. Do not turn a sentence into a separate picture by default." as const;
export const THIS_CHAPTER_HAS_APPROXIMATELY = ". THIS CHAPTER has approximately " as const;
export const SPOKEN_WORDS_SYLLABLES_ACROSS_ROUGHLY = " spoken words/syllables across roughly " as const;
export const S_PER_SCENE_THIS_IS_NOT_PER_BEAT_THE_FULL = "s per scene). This is not per beat. The full part has " as const;
export const S_RESERVE = "s. Reserve " as const;
export const S_FOR_PAUSES_HERE_SUMMARIZE_THE_SOURCE_S_CAUSAL_ARC = "s for pauses here. Summarize the source's causal arc within this budget; do not narrate every source sentence. More dramatic delivery must use the same budget." as const;
export const MOTION_HTML_EDIT = "motion-html-edit" as const;
export const BATCHPROMPT =
  "Edit the supplied spoken script batch once for source fidelity, strong genre voice, engaging storytelling cadence, and exact duration budget alignment. Return JSON {edits:[{id,narration,sceneTemplateDraft,utterances?,reason}]}; omit unchanged beats. If narration/action changes return its complete updated template sections 0–4 as well. Preserve chapters that are already within their minUnits–maxUnits window; if a chapter is below minUnits or above maxUnits, adjust its beats using only source-supported details so total spoken units match the chapter budget. Also fix retention: cut or merge any beat that repeats a fact, number, rumour or emotion already told; restore forward time order; turn summarised background into one concrete moment; compress lists; make each chapter end pull forward. Do not add prescribed stages or unsupported facts. Do not return scores or request redraws." as const;
export const HTML_SCRIPT_EDIT_BATCH = "html-script-edit-batch-" as const;
export const MOTION_STORY_EDIT = MOTION_TEXT_MOTION_STORY_EDIT;
export const PROMPT_2 =
  "Edit the supplied spoken script once for source fidelity, strong genre voice, engaging storytelling cadence, and exact duration budget alignment. Return JSON {edits:[{id,narration,sceneTemplateDraft,utterances?,reason}]}; omit unchanged beats. If narration/action changes return its complete updated template sections 0–4 as well. Preserve chapters that are already within their minUnits–maxUnits window; if a chapter is below minUnits or above maxUnits, adjust its beats using only source-supported details so total spoken units match the chapter budget. Also fix retention: cut or merge any beat that repeats a fact, number, rumour or emotion already told; restore forward time order; turn summarised background into one concrete moment; compress lists; make each chapter end pull forward. Do not add prescribed stages or unsupported facts. Do not return scores or request redraws." as const;
export const HTML_SCRIPT_EDIT = "html-script-edit" as const;
export const CHO_GHI_LAI_DU_LIEU_DA_NHAN_GIU_NGUYEN_PHAN = "Chờ ghi lại dữ liệu đã nhận, giữ nguyên phản hồi AI: " as const;
export const MANY = "many" as const;
export const ASCII_ARROW_SEPARATOR = " -> " as const;
export const HTML_PLAN_SUBMISSION = "html-plan-submission" as const;
export const RUNNING = "running" as const;
export const CHO_LUU_YEU_CAU_PHAN_CANH = "Chờ lưu yêu cầu phân cảnh: " as const;
export const MAIN = "main" as const;
export const RECEIVED = "received" as const;
export const PHAN_CANH_HTML = "Phân cảnh HTML: " as const;
export const SENTENCE_END = ")." as const;
export const PHUC_HOI_YEU_CAU_DA_GUI = "phục hồi yêu cầu đã gửi" as const;
export const THU_LAI_LOI_DU_LIEU = "thử lại lỗi dữ liệu" as const;
export const SCENE_TEMPLATE_SOURCE_DATA_EXACT_VISIBLE_TEXT_STAYS_IN_THE = "SCENE TEMPLATE (source data; exact visible text stays in the selected video language):\n" as const;
export const USER_NOTES_SOURCE_DATA = "USER NOTES (source data):\n" as const;
export const RUNTIME = "RUNTIME: " as const;
export const PARAGRAPH_SEPARATOR = MOTION_TEXT_SYMBOL_37;
export const CANH_HTML = "Cảnh HTML " as const;
export const TAO_TRON_CANH_LUOT = ": tạo trọn cảnh, lượt " as const;
export const DRAW = "draw" as const;
export const CHO_LUU_CHECKPOINT_CANH = "Chờ lưu checkpoint cảnh " as const;
export const DATA_IMAGE_PNG_BASE64 = "data:image/png;base64," as const;
export const CHO_PHUC_HOI_YEU_CAU_PROVIDER = "chờ phục hồi yêu cầu/provider" as const;
export const CHAY_LAI_PHAN_HOI_DA_LUU = "chạy lại phản hồi đã lưu" as const;
export const LOI_THUC_THI_SE_TAO_LAI_TOAN_BO = "lỗi thực thi, sẽ tạo lại toàn bộ" as const;
export const PROMPT_3 =
  "Plan the supplied consecutive speech lines into complete animated Canvas scenes. Return JSON {scenes:[{id,fromLineId,toLineId,purpose,sceneTemplate,continuityIn,continuityOut,soundEvents:[]}]}. sceneTemplate is the fully written sections 0–4 from the supplied template. Cover lines once in order; each scene can cover several beats. Use real supplied line IDs. No nodes, geometry, SVG, frame/rig references or drawing code. Keep identities and source events; exact labels come from the source. Static scenes can remain static." as const;
export const STYLE_2 = "STYLE: " as const;
export const SOUNDEVENTS_SFX_IS_DISABLED = "soundEvents=[]; SFX is disabled." as const;
export const PROMPT_4 = "In the same response supply source-supported soundEvents [{id,kind,layer,at,duration,description,source,actor?}]. at is scene progress 0..1; layer=ambience|action|character|accent; source=visible|offscreen. Optional utterance/edge anchors refer to supplied audio IDs. Coordinate event timing with section 3. No later sound-director call." as const;
export const HTML_PLAN_RESPONSE = "html-plan-response" as const;
export const KHONG_DOC_DUOC_DANH_SACH_PHAN_CANH_HTML = "Không đọc được danh sách phân cảnh HTML." as const;
export const KHONG_ANH_XA_DUOC_PHAN_CANH_VAO_CAC_DONG_LOI = "Không ánh xạ được phân cảnh vào các dòng lời dẫn đã gửi." as const;
export const PHAN_CANH_CHUA_PHU_HET_CAC_DONG_LOI_DAN_DA = "Phân cảnh chưa phủ hết các dòng lời dẫn đã gửi." as const;
export const HTML_2 = ":html:" as const;
export const CHUA_CHON_CACH_DUNG_CANH_AI = "Chưa chọn cách dựng cảnh AI." as const;
export const LEGACY_BEFORE_HTML = "legacy-before-html" as const;
export const DA_CHIA = "Đã chia " as const;
export const NHOM_LOI_DAN_THANH = " nhóm lời dẫn thành " as const;
export const PHAN_CANH_HTML_2 = " phân cảnh HTML." as const;
export const PHAN_CANH_CHUA_DUOC_CHIA_DAY_DU_HOAC_DA_DOI = "Phân cảnh chưa được chia đầy đủ hoặc đã đổi nội dung/cấu hình. Hoàn tất bước viết kịch bản và phân cảnh trước khi dựng cảnh." as const;
export const VALUE_9_16 = SOURCE_TEXT_9_16;
export const VALUE_1_1 = SOURCE_TEXT_1_1;
export const VALUE_4_5 = MOTION_TEXT_4_5;
export const DA_DUNG = "Đã dựng " as const;
export const HTML_SCENES = "html-scenes" as const;
export const UTF8 = SOURCE_TEXT_UTF8;
export const HIDE_BANNER = SOURCE_TEXT_HIDE_BANNER;
export const LOGLEVEL = MOTION_TEXT_LOGLEVEL;
export const ERROR = SOURCE_TEXT_ERROR;
export const Y_3 = SOURCE_TEXT_Y;
export const F = SOURCE_TEXT_F;
export const IMAGE2PIPE = MOTION_TEXT_IMAGE2PIPE;
export const VCODEC = "-vcodec" as const;
export const PNG_2 = SOURCE_TEXT_PNG;
export const FRAMERATE = MOTION_TEXT_FRAMERATE;
export const I_2 = SOURCE_TEXT_I;
export const PIPE_0 = "pipe:0" as const;
export const AN = SOURCE_TEXT_AN;
export const C_V = SOURCE_TEXT_C_V;
export const LIBX264 = MOTION_TEXT_LIBX264;
export const CRF = SOURCE_TEXT_CRF;
export const PIX_FMT = MOTION_TEXT_PIX_FMT;
export const YUV420P = MOTION_TEXT_YUV420P;
export const THREADS = "-threads" as const;
export const VALUE_2_2 = SOURCE_TEXT_2;
export const MP4 = SOURCE_TEXT_MP4;
export const STDIO_PIPE = SOURCE_TEXT_PIPE;
export const IGNORE = SOURCE_TEXT_IGNORE;
export const DATA = SOURCE_TEXT_DATA_2;
export const FFMPEG = "FFmpeg: " as const;
export const THIEU_TAI_LIEU_HTML_CUA_CANH_CAN_XUAT = "Thiếu tài liệu HTML của cảnh cần xuất." as const;
export const EXPORT = "export" as const;
export const PRESET = "-preset" as const;
export const X264_EXPORT_PRESET = "veryfast" as const;
export const DRAIN = MOTION_TEXT_DRAIN;
export const FFMPEG_DONG_INPUT_TRUOC_KHI_NHAN_DU_FRAME = "FFmpeg đóng input trước khi nhận đủ frame." as const;
export const CANH_2 = "Cảnh " as const;
export const LOI_KHI_XUAT_TAO_LAI_TRON_CANH_TU_PROMPT_DA = " lỗi khi xuất; tạo lại trọn cảnh từ prompt đã lưu." as const;
export const XUAT_CANVAS_CHAY_LAI_CUNG_HTML = "Xuất Canvas: chạy lại cùng HTML (" as const;
export const CONCAT_TXT = ".concat.txt" as const;
export const PIECE = ".piece-" as const;
export const MP4_2 = SOURCE_TEXT_MP4_2;
export const FILE = "file '" as const;
export const SHELL_SINGLE_QUOTE_ESCAPE = SOURCE_TEXT_SYMBOL_36;
export const CONCAT = MOTION_TEXT_CONCAT;
export const SAFE = MOTION_TEXT_SAFE;
export const C = MOTION_TEXT_C;
export const COPY = MOTION_TEXT_COPY;
export const ALL_REQUESTS_PATTERN = "**/*" as const;
export const LOAD = SOURCE_TEXT_LOAD;
export const CANVAS_RENDERAT_TIMED_OUT = "Canvas renderAt timed out" as const;
export const CANVAS_BLANK_FRAME_RE = /Canvas blank frame/;
export const CANVAS = SOURCE_TEXT_CANVAS;
export const VALUE_2D = SOURCE_BROWSER_TEXT_2D;
export const BLACK = "black" as const;
export const ROUND = "round" as const;
export const IMAGE_PNG = MOTION_TEXT_IMAGE_PNG;
export const LOCAL = "local" as const;
export const SCENE_JSON = "scene.json" as const;
export const ATTEMPT_2 = "attempt-" as const;
export const TXT = ".txt" as const;
export const HTML_3 = ".html" as const;
export const FOREGROUND = "foreground" as const;
export const MIDGROUND = "midground" as const;
export const BACKGROUND = SOURCE_TEXT_BACKGROUND;
export const GROUPKEY = "groupKey" as const;
export const FACTION = "faction" as const;
export const ROWS = "rows" as const;
export const COUNT = "count" as const;
export const OUTDATED = "outdated" as const;
export const PENDING = "pending" as const;
export const CARD = "card" as const;
export const DIAGRAM = "diagram" as const;
export const MAP = MOTION_TEXT_MAP;
export const TIMELINE = MOTION_TEXT_TIMELINE;
export const PROCESS = "process" as const;
export const COMPARISON = "comparison" as const;
export const DUNG_CANH = "Dựng cảnh: " as const;
export const ROOM_BAN_TRUNG_BINH = " room bận trung bình " as const;
export const THOI_GIAN = "% thời gian." as const;
export const BEST = ":best" as const;
export const SCENES_2 = "scenes[" as const;
export const ACTIONPLAN_RETURN_THE_SCENE_S_AI_AUTHORED_ACTION_PLAN_WITH = "].actionPlan: return the scene's AI-authored action plan with subjects, relative part changes and phases" as const;
export const ACTIONPLAN_SUBJECTS_NODEID = "].actionPlan.subjects: nodeId " as const;
export const MUST_REFERENCE_A_SCENE_NODE = " must reference a scene node" as const;
export const FAILED = SOURCE_TEXT_FAILED;
export const ACTION_2 = ":action-" as const;
export const VALUE_0_0 = "0 0 " as const;
