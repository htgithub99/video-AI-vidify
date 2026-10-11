import * as MR from "../constants/motionRuntime.js";
import _ from "lodash";
import { AlertTriangle, BookOpen, Box, Captions, Check, ChevronDown, ChevronUp, Clapperboard, Clock, Download, FileText, Film, FolderKanban, Image as Layers, Languages, Maximize2, Mic, Monitor, PlayCircle, RefreshCw, RotateCcw, ScanSearch, SlidersHorizontal, Smartphone, Sparkles, Square, Trash2, Tv, Upload, Users, Volume2, Wand2 } from "lucide-react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MOTION_TEMPLATE_BEATS,
  MOTION_TEMPLATE_JOIN_SPACE,
  MOTION_TEMPLATE_JUNK_GROUP_KEY,
  MOTION_TEMPLATE_JUNK_MORE,
  MOTION_TEMPLATE_SYMBOL,
  MOTION_TEMPLATE_SYMBOL_2,
  MOTION_TEMPLATE_SYMBOL_3,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEMPLATE_SYMBOL_57,
  MOTION_TEMPLATE_SYMBOL_6,
  MOTION_TEMPLATE_SYMBOL_7,
  MOTION_TEXT_0,
  MOTION_TEXT_01,
  MOTION_TEXT_02,
  MOTION_TEXT_03,
  MOTION_TEXT_04,
  MOTION_TEXT_05,
  MOTION_TEXT_10,
  MOTION_TEXT_16_9,
  MOTION_TEXT_1_1,
  MOTION_TEXT_4_5,
  MOTION_TEXT_9_16,
  MOTION_TEXT_AI_2,
  MOTION_TEXT_AI_VOICE,
  MOTION_TEXT_ANALYZE,
  MOTION_TEXT_AUDIO,
  MOTION_TEXT_BUTTON,
  MOTION_TEXT_BYTES,
  MOTION_TEXT_CAST,
  MOTION_TEXT_CHAPTERID,
  MOTION_TEXT_CHAPTERS,
  MOTION_TEXT_CHECKBOX,
  MOTION_TEXT_COLOR,
  MOTION_TEXT_DA_DOC_NGUON,
  MOTION_TEXT_DOAN,
  MOTION_TEXT_EN,
  MOTION_TEXT_END,
  MOTION_TEXT_ENTITIES_CAST,
  MOTION_TEXT_FACTS,
  MOTION_TEXT_FILE,
  MOTION_TEXT_FPS,
  MOTION_TEXT_FPS_2,
  MOTION_TEXT_GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P,
  MOTION_TEXT_GROUP,
  MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC,
  MOTION_TEXT_LAZY,
  MOTION_TEXT_MAX_W_MD,
  MOTION_TEXT_METADATA,
  MOTION_TEXT_MODAL_2XL,
  MOTION_TEXT_MOTION_VIDEO,
  MOTION_TEXT_MOTION_VIDEO_MP4,
  MOTION_TEXT_NHAP_NOI_DUNG_LOI_DAN_CHO_PHAN_CANH,
  MOTION_TEXT_OK,
  MOTION_TEXT_OUTPUT_MP4,
  MOTION_TEXT_PHUT,
  MOTION_TEXT_PLACES,
  MOTION_TEXT_RANGE,
  MOTION_TEXT_RENDER,
  MOTION_TEXT_RENDER_VIDEO_MP4,
  MOTION_TEXT_S,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SCENES,
  MOTION_TEXT_SCENE_2,
  MOTION_TEXT_SCRIPT,
  MOTION_TEXT_STATS,
  MOTION_TEXT_STATS_2,
  MOTION_TEXT_STOPPING,
  MOTION_TEXT_SWITCH,
  MOTION_TEXT_SYMBOL_10,
  MOTION_TEXT_SYMBOL_11,
  MOTION_TEXT_SYMBOL_12,
  MOTION_TEXT_SYMBOL_2,
  MOTION_TEXT_SYMBOL_21,
  MOTION_TEXT_SYMBOL_43,
  MOTION_TEXT_SYMBOL_44,
  MOTION_TEXT_SYMBOL_5,
  MOTION_TEXT_SYMBOL_8,
  MOTION_TEXT_SYMBOL_9,
  MOTION_TEXT_S_2,
  MOTION_TEXT_TIEN_TRINH,
  MOTION_TEXT_TIEU_DE_CAU_CHUYEN,
  MOTION_TEXT_TITLE,
  MOTION_TEXT_TITLE_2,
  MOTION_TEXT_TRANSCRIPT,
  MOTION_TEXT_TU,
  MOTION_TEXT_UNSTYLED,
  MOTION_TEXT_VI,
  MOTION_TEXT_VOICE,
  MOTION_TEXT_WRONG,
  MOTION_TEXT_W_FULL_PX_3_PY_2_ROUNDED_XL,
  MOTION_TEXT_XOA,
} from "../constants/motionRuntime.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
import { MOTION_VIDEO_TEXTS, type MotionVideoTexts } from "../constants/motionVideoTexts.js";
import { useMotionStudio, type MotionStudio } from "../hooks/useMotionStudio.js";
import { Lang } from "../lib/lang.js";
import { cn } from "../lib/utils";
import { MotionAspect, MotionEncoderPreference, MotionQuality, MotionStoryLength, MotionWorkspaceTab, type MotionBeat, type MotionResultItem } from "../types/motionVideo.js";
import type { StorageJunkReport } from "../types/storage.js";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock.js";
import { formatBytes, formatSeconds, genPreviewUrl, motionAudioUrl } from "./motion-video/motionApi";
import { ActionBtn, ChipButton, ElapsedLine, MotionAnalysisTabButton, MotionLoadingIcon, MotionProgressBar, MotionStatCard, StepHeader, StopBtn } from "./motion-video/MotionControls.js";
import { MotionSeoCard } from "./motion-video/MotionSeoCard.js";
import { MotionSpecPlayer } from "./motion-video/MotionSpecPlayer";
import { MotionVideoDnaCard } from "./motion-video/MotionVideoDnaCard.js";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Tooltip } from "./ui/Tooltip";
import { VoiceSelectionDialog } from "./VoiceSelectionDialog.js";
const cardCls = MOTION_TEXT_GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P;
const inputCls = MOTION_TEXT_W_FULL_PX_3_PY_2_ROUNDED_XL;
const MotionVideoCreator: FC<{ currentLang?: Lang; }> = ({ currentLang = MOTION_TEXT_VI as Lang }) => {
  const text = MOTION_VIDEO_TEXTS[currentLang] || MOTION_VIDEO_TEXTS.vi;
  const studio = useMotionStudio();
  const [tab, setTab] = useState<MotionWorkspaceTab>(MotionWorkspaceTab.CREATE);
  const [aiOpen, setAiOpen] = useState(false);
  const { state, patch } = studio;
  return (
    <div className={MOTION_STYLES.CREATION_WORKSPACE_W_FULL_H_FULL_MIN_H_0_FLEX_FLEX_COL_OVERFLOW_Y_AUTO}>
      <div className={MOTION_STYLES.BG_GRADIENT_TO_B_FROM_SLATE_900_90_TO_SLATE_950_95_ROUNDED_XL_SM_ROUNDED_2XL_P_4_SM_P_6}>
        <div className={MOTION_STYLES.GLASS_CARD_ROUNDED_XL_PX_3_PY_2_SM_PX_4_SM_PY_2_5_SHADOW_SM}>
          <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0}>
            <div className={MOTION_STYLES.W_8_H_8_ROUNDED_XL_BG_GRADIENT_TO_TR_FROM_PURPLE_500_VIA_FUCHSIA_500_TO_PINK_600}>
              <div className={MOTION_STYLES.W_FULL_H_FULL_BG_SLATE_950_ROUNDED_10PX_FLEX_ITEMS_CENTER_JUSTIFY_CENTER}>
                <Clapperboard className={MOTION_STYLES.W_4_H_4} />
              </div>
            </div>
            <div className={MOTION_STYLES.MIN_W_0}>
              <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP}>
                <h1 className={MOTION_STYLES.TEXT_SM_SM_TEXT_BASE_FONT_BLACK_TEXT_SLATE_100_TRACKING_TIGHT_UPPERCASE_FONT_SANS}>{text.TITLE}</h1>
                <span className={MOTION_STYLES.PX_2_PY_0_5_ROUNDED_FULL_TEXT_9PX_FONT_MONO_FONT_BOLD_UPPERCASE}>
                  <Sparkles className={MOTION_STYLES.W_2_5_H_2_5_TEXT_PURPLE_400} />
                  {text.BADGE}
                </span>
              </div>
              <p className={MOTION_STYLES.TEXT_10PX_TEXT_SLATE_400_LEADING_TIGHT_TRUNCATE_HIDDEN_MD_BLOCK}>{text.SUBTITLE}</p>
            </div>
          </div>
          <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP_SELF_START_SM_SELF_AUTO_ML_AUTO}>
            <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_1_P_0_5_ROUNDED_XL_BG_SLATE_955_80_BORDER}>
              {_.map(
                [
                  { id: MotionWorkspaceTab.CREATE, label: text.TAB_CREATE, icon: Wand2 },
                  { id: MotionWorkspaceTab.RESULTS, label: MOTION_TEMPLATE_SYMBOL(MR.MOTION_TEMPLATE_SYMBOL_8(text.TAB_RESULTS), MR.MOTION_TEMPLATE_SYMBOL_9(studio.results.length)), icon: FolderKanban },
                ],
                ({ id, label, icon: Icon }) => (
                  <Button key={id} variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setTab(id)} className={cn(MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1_5_ROUNDED_LG_TEXT_XS, tab === id ? MOTION_STYLES.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_TEXT_WHITE_SHADOW_SM_SHADOW_PURPLE_500_20 : MOTION_STYLES.TEXT_SLATE_400_HOVER_TEXT_SLATE_100_HOVER_BG_SLATE_900)}>
                    <Icon className={MOTION_STYLES.W_3_5_H_3_5} />
                    <span>{label}</span>
                  </Button>
                ),
              )}
            </div>
            <Tooltip content={text.AI_CONFIG} align={MOTION_TEXT_END}>
              <Button
                variant={MOTION_TEXT_UNSTYLED}
                type={MOTION_TEXT_BUTTON}
                onClick={() => setAiOpen(!aiOpen)}
                disabled={studio.storyBusy}
                className={cn(MOTION_STYLES.GROUP_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_1_5_PX_3_5_PY_2, aiOpen ? MOTION_STYLES.BG_PURPLE_600_15_BORDER_PURPLE_500_50_TEXT_PURPLE_300_SHADOW_PURPLE_500_10 : MOTION_STYLES.BG_SLATE_955_80_HOVER_BG_SLATE_900_BORDER_SLATE_800_TEXT_SLATE_300_HOVER_TEXT_PURPLE_300)}>
                <SlidersHorizontal className={MOTION_STYLES.W_3_5_H_3_5_TEXT_PURPLE_400_SHRINK_0_GROUP_HOVER_SCALE_105_TRANSITION_TRANSFORM} />
                <span className={MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_LEADING_NONE_TEXT_SLATE_200_GROUP_HOVER_TEXT_PURPLE_300_TRANSITION_COLORS}>{text.AI_CONFIG}</span>
                {aiOpen ? <ChevronUp className={MOTION_STYLES.W_3_5_H_3_5_TEXT_PURPLE_400_SHRINK_0} /> : <ChevronDown className={MOTION_STYLES.W_3_5_H_3_5_TEXT_SLATE_400_SHRINK_0} />}
              </Button>
            </Tooltip>
          </div>
        </div>
        {aiOpen && (
          <fieldset disabled={studio.storyBusy} className={MOTION_STYLES.GLASS_CARD_ROUNDED_2XL_P_4_BG_SLATE_900_80_BORDER_BORDER_SLATE_800_SHADOW_XL}>
            <ChatPlanningSettingsBlock
              provider={state.aiProvider}
              model={state.aiModel}
              executionMode={state.aiMode}
              chromeHeadless={state.aiHeadless}
              onProviderChange={(v) => patch({ aiProvider: v })}
              onModelChange={(v) => patch({ aiModel: v })}
              onExecutionModeChange={(v) => patch({ aiMode: v })}
              onChromeHeadlessChange={(v) => patch({ aiHeadless: v })}
              currentLang={currentLang}
              allowHybrid
              extraControl={
                <div className={MOTION_STYLES.AI_REVIEW_TOGGLE_WRAPPER} title={text.AI_REVIEW_HINT}>
                  <div className={MOTION_STYLES.AI_REVIEW_TOGGLE_INFO}>
                    <Sparkles className={MOTION_STYLES.AI_REVIEW_TOGGLE_ICON} />
                    <span className={MOTION_STYLES.AI_REVIEW_TOGGLE_LABEL}>{text.AI_REVIEW}</span>
                  </div>
                  <Button
                    variant={MR.MOTION_TEXT_UNSTYLED}
                    role={MOTION_TEXT_SWITCH}
                    aria-checked={state.aiReview !== false}
                    aria-label={text.AI_REVIEW}
                    title={text.AI_REVIEW_HINT}
                    disabled={studio.storyBusy}
                    onClick={() => patch({ aiReview: state.aiReview === false })}
                    className={cn(MOTION_STYLES.TOGGLE_SWITCH_BASE, state.aiReview !== false ? MOTION_STYLES.TOGGLE_SWITCH_ACTIVE : MOTION_STYLES.TOGGLE_SWITCH_INACTIVE)}>
                    <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(MOTION_STYLES.TOGGLE_THUMB_BASE, state.aiReview !== false ? MOTION_STYLES.TOGGLE_THUMB_ACTIVE : MOTION_STYLES.TOGGLE_THUMB_INACTIVE)} />
                  </Button>
                </div>
              }
            />
          </fieldset>
        )}
        {studio.engineError && (
          <div className={MOTION_STYLES.ROUNDED_XL_BORDER_BORDER_ROSE_500_40_BG_ROSE_500_10_PX_4_PY_3_TEXT_XS}>
            <AlertTriangle className={MOTION_STYLES.W_4_H_4_SHRINK_0_TEXT_ROSE_500} />
            <span>{studio.engineError}</span>
          </div>
        )}
        <div className={MOTION_STYLES.W_FULL}>
          {tab === MotionWorkspaceTab.CREATE && <CreateWorkspace studio={studio} text={text} currentLang={currentLang} />}
          {tab === MotionWorkspaceTab.RESULTS && <ResultsPanel studio={studio} text={text} />}
        </div>
      </div>
    </div>
  );
};
export default MotionVideoCreator;
interface MotionPreviewModalData { type: "location" | "beat"; id: string; title: string; imageUrl: string; score?: number; issues?: string[]; note?: string; narration?: string; action?: string; }
const CreateWorkspace: FC<{ studio: MotionStudio; text: MotionVideoTexts; currentLang: Lang; }> = ({ studio, text, currentLang }) => {
  const { state, patch } = studio;
  const [voiceDialog, setVoiceDialog] = useState(false);
  const [previewModal, setPreviewModal] = useState<MotionPreviewModalData | null>(null);
  const [analysisTab, setAnalysisTab] = useState<"cast" | "places" | "chapters" | "facts">(MOTION_TEXT_CAST);
  const [sceneNote, setSceneNote] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const busyKind = studio.storyBusy ? studio.storyJob?.kind : null;
  const storyStopping = studio.storyJob?.stage === MOTION_TEXT_STOPPING;
  const renderStopping = studio.renderJob?.stage === MOTION_TEXT_STOPPING;
  const stopAi = <StopBtn onClick={() => void studio.cancelStory()} label={storyStopping ? text.STOPPING : text.STOP_AI} stopping={storyStopping} />;
  const beatsByChapter = useMemo(() => _.groupBy(state.script?.beats || [], MOTION_TEXT_CHAPTERID), [state.script]);
  const missingChapterIds = useMemo( () => _.map( _.filter(state.analysis?.chapters || [], (c) => !beatsByChapter[c.id]?.length), MR.MOTION_TEXT_ID, ), [state.analysis, beatsByChapter], );
  const gen = state.script?.gen;
  const sceneBeats = useMemo(() => _.filter(state.script?.beats || [], (b) => b.visual === MOTION_TEXT_SCENE), [state.script]);
  const builtCount = _.size(_.filter(sceneBeats, (b) => !!gen?.staging?.[b.id]));
  const estimateTotal = studio.compiled?.spec.duration || 0;
  const previewSpec = useMemo(() => {
    const spec = studio.compiled?.spec;
    if (spec?.gen && (spec.gen.characterMode || MR.MOTION_TEXT_MANNEQUIN) !== (state.customCharacters ? MR.MOTION_TEXT_DRAWN : MR.MOTION_TEXT_MANNEQUIN)) return null;
    return spec ? { ...spec, gen: spec.gen ? { ...spec.gen, drawingMode: state.drawingMode } : undefined } : null;
  }, [studio.compiled, state.drawingMode, state.customCharacters]);
  const updateBeat = (id: string, patchBeat: Partial<MotionBeat>) => { if (!state.script) return; patch({ script: { ...state.script, beats: _.map(state.script.beats, (b) => (b.id === id ? { ...b, ...patchBeat } : b)) } }); };
  const removeBeat = (id: string) => state.script && patch({ script: { ...state.script, beats: _.reject(state.script.beats, { id }) } });
  const job = studio.storyJob;
  const rj = studio.renderJob;
  const currentStep = useMemo(() => { if (rj || rj?.result) return 5; if (state.voice || state.uploadedAudio) return 4; if (state.script?.beats?.length) return 3; if (state.analysis) return 2; return 1; }, [rj, state.voice, state.uploadedAudio, state.script, state.analysis]);
  const stepsList = [
    { num: 1, title: text.STEP_SOURCE || MR.MOTION_TEXT_NGUON_KICH_BAN, done: !!state.source },
    { num: 2, title: text.STEP_ANALYSIS || MR.MOTION_TEXT_PHAN_TICH, done: !!state.analysis },
    { num: 3, title: text.STEP_SCRIPT || MR.MOTION_TEXT_KICH_BAN, done: !!state.script?.beats?.length },
    { num: 4, title: text.STEP_VOICE || MR.MOTION_TEXT_GIONG_DOC_AI, done: !!state.voice || !!state.uploadedAudio },
    { num: 5, title: text.STEP_RENDER || MR.MOTION_TEXT_XUAT_VIDEO, done: !!rj?.result },
  ];
  return (
    <div className={MR.MOTION_TEXT_SPACE_Y_6_W_FULL}>
      <div className={MOTION_STYLES.STUDIO_STEPPER_WRAPPER}>
        {_.map(stepsList, (s) => {
          const isCurrent = currentStep === s.num;
          return (
            <div key={s.num} className={cn(MOTION_STYLES.STUDIO_STEPPER_ITEM, isCurrent ? MOTION_STYLES.STUDIO_STEPPER_ACTIVE : s.done ? MOTION_STYLES.STUDIO_STEPPER_DONE : MOTION_STYLES.STUDIO_STEPPER_INACTIVE)}>
              <span className={cn(MOTION_STYLES.STUDIO_STEPPER_NUM, isCurrent ? MR.MOTION_TEXT_BG_PURPLE_500_TEXT_WHITE_SHADOW_XS : s.done ? MR.MOTION_TEXT_BG_EMERALD_500_20_TEXT_EMERALD_400 : MR.MOTION_TEXT_BG_SLATE_800_TEXT_SLATE_400)}>{s.done && !isCurrent ? MR.MOTION_TEXT_SYMBOL_3 : MR.MOTION_TEMPLATE_0(s.num)}</span>
              <span className={MR.MOTION_TEXT_FONT_SEMIBOLD_TEXT_XS_TRUNCATE}>{s.title}</span>
            </div>
          );
        })}
      </div>
      <div className={MOTION_STYLES.STUDIO_GRID_LAYOUT}>
        <div className={MOTION_STYLES.STUDIO_LEFT_COLUMN}>
          <div className={cardCls}>
            <StepHeader
              n={MOTION_TEXT_01}
              icon={BookOpen}
              title={text.STEP_SOURCE}
              badge={MOTION_TEXT_TRANSCRIPT}
              right={
                <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2}>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void studio.loadDemo()} disabled={studio.storyBusy} className={MOTION_STYLES.PX_2_5_PY_1_ROUNDED_XL_TEXT_11PX_FONT_BOLD_TEXT_PURPLE_300_BG_PURPLE_500_15}>
                    {text.LOAD_DEMO}
                  </Button>
                  {state.rawText && (
                    <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => studio.parseSource("")} disabled={studio.storyBusy} className={MOTION_STYLES.P_1_ROUNDED_LG_TEXT_SLATE_400_HOVER_TEXT_ROSE_500_TRANSITION_COLORS_CURSOR_POINTER}>
                      <Trash2 className={MOTION_STYLES.W_3_5_H_3_5} />
                    </Button>
                  )}
                </div>
              }
            />
            <div className={MOTION_STYLES.SPACE_Y_3}>
              <textarea value={state.rawText} onChange={(e) => void studio.parseSource(e.target.value)} placeholder={text.SOURCE_PLACEHOLDER} rows={12} className={cn(inputCls, MOTION_STYLES.FONT_MONO_TEXT_XS_LEADING_RELAXED_RESIZE_Y_MIN_H_170PX)} disabled={studio.storyBusy} />
              {state.source ? (
                <div className={MOTION_STYLES.GRID_GRID_COLS_2_SM_GRID_COLS_4_GAP_2_PT_1_ANIMATE_IN_FADE_IN}>
                  <MotionStatCard icon={FileText} iconClassName={MOTION_STYLES.W_4_H_4_TEXT_PURPLE_400_SHRINK_0} label={text.WORDS}>
                    {state.source.words}
                    {MOTION_TEXT_TU}
                  </MotionStatCard>
                  <MotionStatCard icon={Layers} iconClassName={MOTION_STYLES.W_4_H_4_TEXT_BLUE_500_DARK_TEXT_BLUE_400_SHRINK_0} label={text.SEGMENTS}>
                    {state.source.segments.length}
                    {MOTION_TEXT_DOAN}
                  </MotionStatCard>
                  <MotionStatCard icon={Clock} iconClassName={MOTION_STYLES.W_4_H_4_TEXT_PURPLE_500_DARK_TEXT_PURPLE_400_SHRINK_0} label={text.ESTIMATED}>
                    {MOTION_TEXT_SYMBOL_2}
                    {Math.round(state.source.sourceSeconds / 60)}
                    {MOTION_TEXT_PHUT}
                  </MotionStatCard>
                  <MotionStatCard icon={Film} iconClassName={MOTION_STYLES.W_4_H_4_TEXT_PINK_500_DARK_TEXT_PINK_400_SHRINK_0} label={MOTION_TEXT_TIEN_TRINH} valueClassName={MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_EMERALD_500_DARK_TEXT_EMERALD_400_TRUNCATE}>
                    {MOTION_TEXT_DA_DOC_NGUON}
                  </MotionStatCard>
                </div>
              ) : null}
              {state.source && (state.source.fetched || state.source.cleaned || state.source.notes) ? (
                <p className={MR.MOTION_TEXT_TEXT_11PX_LEADING_RELAXED_TEXT_SLATE_400}>
                  {state.source.fetched ? MR.MOTION_TEMPLATE_SYMBOL_15(state.source.fetched.ok ? MR.MOTION_TEXT_SYMBOL_3 : MR.MOTION_TEXT_SYMBOL_55, state.source.fetched.note) : ""}
                  {state.source.cleaned
                    ? currentLang === MR.MOTION_TEXT_EN
                      ? MR.MOTION_TEMPLATE_AUTO_FIXED_SPLIT_NUMBERS_SOUND_CUES_AUDIO_ONLY_QUOTES_MARKED(state.source.cleaned.splitNumbers, state.source.cleaned.soundCues, state.source.cleaned.missingQuotes)
                      : MR.MOTION_TEMPLATE_DA_TU_SUA_SO_BI_CAT_BO_TIENG_DONG_DANH_DAU_CAU_TRICH_CHI_CO_AM_TH(state.source.cleaned.splitNumbers, state.source.cleaned.soundCues, state.source.cleaned.missingQuotes)
                    : ""}
                  {state.source.notes ? MR.MOTION_TEMPLATE_SYMBOL_17(currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_DIRECTIONS : MR.MOTION_TEXT_YEU_CAU, state.source.notes) : ""}
                </p>
              ) : null}
              <div className={MOTION_STYLES.STEP1_SETTINGS_ROW}>
                <div className={MOTION_STYLES.STEP1_TOGGLE_WRAPPER}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.LENGTH}</span>
                  <select value={state.length} onChange={(e) => patch({ length: e.target.value as MotionStoryLength })} disabled={studio.storyBusy} className={cn(inputCls, MR.MOTION_TEXT_H_42PX_CURSOR_POINTER)}>
                    {_.map(
                      [
                        [MotionStoryLength.FULL, text.LENGTH_FULL],
                        [MotionStoryLength.TEN, text.LENGTH_10],
                        [MotionStoryLength.FIVE, text.LENGTH_5],
                        [MotionStoryLength.THIRTY, text.LENGTH_30],
                        [MotionStoryLength.SIXTY, text.LENGTH_60],
                        [MotionStoryLength.SHORT, text.LENGTH_SHORT],
                        [MotionStoryLength.ONE, text.LENGTH_1],
                      ],
                      ([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className={MOTION_STYLES.STEP1_TOGGLE_WRAPPER}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.LANGUAGE}</span>
                  <Button
                    variant={MR.MOTION_TEXT_UNSTYLED}
                    role={MR.MOTION_TEXT_SWITCH}
                    aria-checked={state.language === MOTION_TEXT_VI}
                    aria-label={text.LANGUAGE}
                    title={text.LANGUAGE}
                    disabled={studio.storyBusy}
                    onClick={() => patch({ language: state.language === MOTION_TEXT_VI ? MOTION_TEXT_EN : MOTION_TEXT_VI })}
                    className={cn(MOTION_STYLES.RENDER_CONTROL_CARD, studio.storyBusy && MOTION_STYLES.SFX_TOGGLE_CONTAINER_DISABLED)}>
                    <div className={MOTION_STYLES.RENDER_CONTROL_INFO}>
                      <Languages className={cn(MOTION_STYLES.W_3_5_H_3_5_SHRINK_0, state.language === MOTION_TEXT_VI ? MOTION_STYLES.TEXT_PURPLE_400 : MOTION_STYLES.TEXT_SLATE_400)} />
                      <span className={MOTION_STYLES.RENDER_CONTROL_LABEL}>{state.language === MOTION_TEXT_VI ? text.LANG_VI : text.LANG_EN}</span>
                    </div>
                    <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(MOTION_STYLES.TOGGLE_SWITCH_BASE, state.language === MOTION_TEXT_VI ? MOTION_STYLES.TOGGLE_SWITCH_ACTIVE : MOTION_STYLES.TOGGLE_SWITCH_INACTIVE)}>
                      <span className={cn(MOTION_STYLES.TOGGLE_THUMB_BASE, state.language === MOTION_TEXT_VI ? MOTION_STYLES.TOGGLE_THUMB_ACTIVE : MOTION_STYLES.TOGGLE_THUMB_INACTIVE)} />
                    </span>
                  </Button>
                </div>
                <div className={MOTION_STYLES.STEP1_TOGGLE_WRAPPER}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.SUBTITLES_MODE}</span>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} role={MR.MOTION_TEXT_SWITCH} aria-checked={state.subtitles !== false} aria-label={text.SUBTITLES_MODE} title={text.SUBTITLES_HINT} onClick={() => patch({ subtitles: state.subtitles === false })} className={MOTION_STYLES.RENDER_CONTROL_CARD}>
                    <div className={MOTION_STYLES.RENDER_CONTROL_INFO}>
                      <Captions className={cn(MOTION_STYLES.W_3_5_H_3_5_SHRINK_0, state.subtitles !== false ? MOTION_STYLES.TEXT_PURPLE_400 : MOTION_STYLES.TEXT_SLATE_400)} />
                      <span className={MOTION_STYLES.RENDER_CONTROL_LABEL}>{state.subtitles !== false ? text.SUBTITLES_ON : text.SUBTITLES_OFF}</span>
                    </div>
                    <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(MOTION_STYLES.TOGGLE_SWITCH_BASE, state.subtitles !== false ? MOTION_STYLES.TOGGLE_SWITCH_ACTIVE : MOTION_STYLES.TOGGLE_SWITCH_INACTIVE)}>
                      <span className={cn(MOTION_STYLES.TOGGLE_THUMB_BASE, state.subtitles !== false ? MOTION_STYLES.TOGGLE_THUMB_ACTIVE : MOTION_STYLES.TOGGLE_THUMB_INACTIVE)} />
                    </span>
                  </Button>
                </div>
                <div className={MOTION_STYLES.STEP1_TOGGLE_WRAPPER}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.CUSTOM_CHARACTERS}</span>
                  <Button
                    variant={MR.MOTION_TEXT_UNSTYLED}
                    role={MR.MOTION_TEXT_SWITCH}
                    aria-checked={state.customCharacters === true}
                    aria-label={text.CUSTOM_CHARACTERS}
                    title={text.CUSTOM_CHARACTERS_HINT}
                    disabled={studio.storyBusy}
                    onClick={() => patch({ customCharacters: !state.customCharacters })}
                    className={cn(MOTION_STYLES.RENDER_CONTROL_CARD, studio.storyBusy && MOTION_STYLES.SFX_TOGGLE_CONTAINER_DISABLED)}>
                    <div className={MOTION_STYLES.RENDER_CONTROL_INFO}>
                      <Users className={cn(MOTION_STYLES.W_3_5_H_3_5_SHRINK_0, state.customCharacters ? MOTION_STYLES.TEXT_PURPLE_400 : MOTION_STYLES.TEXT_SLATE_400)} />
                      <span className={MOTION_STYLES.RENDER_CONTROL_LABEL}>{state.customCharacters ? text.CUSTOM_CHARACTERS_ON : text.CUSTOM_CHARACTERS_OFF}</span>
                    </div>
                    <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(MOTION_STYLES.TOGGLE_SWITCH_BASE, state.customCharacters ? MOTION_STYLES.TOGGLE_SWITCH_ACTIVE : MOTION_STYLES.TOGGLE_SWITCH_INACTIVE)}>
                      <span className={cn(MOTION_STYLES.TOGGLE_THUMB_BASE, state.customCharacters ? MOTION_STYLES.TOGGLE_THUMB_ACTIVE : MOTION_STYLES.TOGGLE_THUMB_INACTIVE)} />
                    </span>
                  </Button>
                </div>
                <div className={MOTION_STYLES.STEP1_TOGGLE_WRAPPER}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.DRAWING_MODE}</span>
                  <Button
                    variant={MR.MOTION_TEXT_UNSTYLED}
                    role={MR.MOTION_TEXT_SWITCH}
                    aria-checked={state.drawingMode === MR.MOTION_TEXT_2D}
                    aria-label={text.DRAWING_MODE}
                    title={text.DRAWING_MODE_HINT}
                    disabled={studio.storyBusy}
                    onClick={() => patch({ drawingMode: state.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_3D : MR.MOTION_TEXT_2D })}
                    className={cn(MOTION_STYLES.RENDER_CONTROL_CARD, studio.storyBusy && MOTION_STYLES.SFX_TOGGLE_CONTAINER_DISABLED)}>
                    <div className={MOTION_STYLES.RENDER_CONTROL_INFO}>
                      <Box className={cn(MOTION_STYLES.W_3_5_H_3_5_SHRINK_0, state.drawingMode === MR.MOTION_TEXT_2D ? MOTION_STYLES.TEXT_PURPLE_400 : MOTION_STYLES.TEXT_SLATE_400)} />
                      <span className={MOTION_STYLES.RENDER_CONTROL_LABEL}>{state.drawingMode === MR.MOTION_TEXT_2D ? text.DRAWING_2D : text.DRAWING_3D}</span>
                    </div>
                    <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(MOTION_STYLES.TOGGLE_SWITCH_BASE, state.drawingMode === MR.MOTION_TEXT_2D ? MOTION_STYLES.TOGGLE_SWITCH_ACTIVE : MOTION_STYLES.TOGGLE_SWITCH_INACTIVE)}>
                      <span className={cn(MOTION_STYLES.TOGGLE_THUMB_BASE, state.drawingMode === MR.MOTION_TEXT_2D ? MOTION_STYLES.TOGGLE_THUMB_ACTIVE : MOTION_STYLES.TOGGLE_THUMB_INACTIVE)} />
                    </span>
                  </Button>
                </div>
                <div className={MOTION_STYLES.STEP1_TOGGLE_WRAPPER}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_AUTO_PIPELINE : MR.MOTION_TEXT_TU_DONG_KICH_BAN}</span>
                  <Button
                    variant={MR.MOTION_TEXT_UNSTYLED}
                    role={MR.MOTION_TEXT_SWITCH}
                    aria-checked={state.autoContinue !== false}
                    aria-label={text.AUTO_CONTINUE}
                    title={text.AUTO_CONTINUE}
                    disabled={studio.storyBusy}
                    onClick={() => patch({ autoContinue: state.autoContinue === false })}
                    className={cn(MOTION_STYLES.RENDER_CONTROL_CARD, studio.storyBusy && MOTION_STYLES.SFX_TOGGLE_CONTAINER_DISABLED)}>
                    <div className={MOTION_STYLES.RENDER_CONTROL_INFO}>
                      <Wand2 className={cn(MOTION_STYLES.W_3_5_H_3_5_SHRINK_0, state.autoContinue !== false ? MOTION_STYLES.TEXT_PURPLE_400 : MOTION_STYLES.TEXT_SLATE_400)} />
                      <span className={MOTION_STYLES.RENDER_CONTROL_LABEL}>{state.autoContinue !== false ? (currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_AUTO_WRITE : MR.MOTION_TEXT_TU_VIET_KICH_BAN) : currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_MANUAL : MR.MOTION_TEXT_THU_CONG}</span>
                    </div>
                    <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(MOTION_STYLES.TOGGLE_SWITCH_BASE, state.autoContinue !== false ? MOTION_STYLES.TOGGLE_SWITCH_ACTIVE : MOTION_STYLES.TOGGLE_SWITCH_INACTIVE)}>
                      <span className={cn(MOTION_STYLES.TOGGLE_THUMB_BASE, state.autoContinue !== false ? MOTION_STYLES.TOGGLE_THUMB_ACTIVE : MOTION_STYLES.TOGGLE_THUMB_INACTIVE)} />
                    </span>
                  </Button>
                </div>
              </div>
              <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_PT_2_GAP_2_FLEX_WRAP}>
                <div />
                {busyKind === MOTION_TEXT_ANALYZE ? (
                  <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2}>
                    <ActionBtn busy={true} icon={Sparkles} onClick={() => {}} className={MOTION_STYLES.PX_5_PY_2_5}>
                      {text.ANALYZING}
                    </ActionBtn>
                    {stopAi}
                  </div>
                ) : (
                  <ActionBtn icon={Sparkles} onClick={() => void studio.analyze()} disabled={!state.source || studio.storyBusy} className={MOTION_STYLES.PX_5_PY_2_5}>
                    {state.analysis ? text.REANALYZE_BTN : text.ANALYZE_BTN}
                  </ActionBtn>
                )}
              </div>
            </div>
          </div>
          {busyKind === MOTION_TEXT_ANALYZE ? (
            <div className={cardCls}>
              <StepHeader n={MOTION_TEXT_02} icon={Users} title={text.STEP_ANALYSIS} badge={text.BADGE_ANALYZING} />
              <div className={MOTION_STYLES.PY_14_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_CENTER_SPACE_Y_4}>
                <div className={MOTION_STYLES.RELATIVE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER}>
                  <div className={MOTION_STYLES.W_14_H_14_ROUNDED_2XL_BG_GRADIENT_TO_TR_FROM_PURPLE_600_20_VIA_FUCHSIA_600_20_TO_PINK_600_20}>
                    <MotionLoadingIcon className={MOTION_STYLES.W_7_H_7_TEXT_PURPLE_400_ANIMATE_SPIN} />
                  </div>
                  <div className={MOTION_STYLES.ABSOLUTE_INSET_1_ROUNDED_2XL_BG_PURPLE_500_20_BLUR_MD_Z_10_ANIMATE_PULSE} />
                </div>
                <div className={MOTION_STYLES.SPACE_Y_1_MAX_W_SM}>
                  <p className={MOTION_STYLES.TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_100}>{text.ANALYZING_TITLE}</p>
                  <p className={MOTION_STYLES.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED_FONT_SANS}>{job?.log?.[job.log.length - 1] || text.LOG_ANALYZING_DEFAULT}</p>
                </div>
                {job?.startedAt && <ElapsedLine since={job.startedAt} label={text.EXEC_TIME} suffix={text.ELAPSED} />}
                <MotionProgressBar progress={job?.progress} minimum={15} className={MOTION_STYLES.W_56_H_1_5} />
              </div>
            </div>
          ) : state.analysis ? (
            <div className={cardCls}>
              <StepHeader
                n={MOTION_TEXT_02}
                icon={Users}
                title={text.STEP_ANALYSIS}
                badge={MOTION_TEXT_ENTITIES_CAST}
                right={
                  <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_1_P_0_5_ROUNDED_XL_BG_SLATE_955_80_BORDER_2}>
                    <MotionAnalysisTabButton active={analysisTab === MOTION_TEXT_CAST} onClick={() => setAnalysisTab(MOTION_TEXT_CAST)} label={text.CAST} prefix={MOTION_TEXT_SYMBOL_5} count={state.analysis.cast.length} />
                    <MotionAnalysisTabButton active={analysisTab === MOTION_TEXT_PLACES} onClick={() => setAnalysisTab(MOTION_TEXT_PLACES)} label={text.PLACES} count={state.analysis.places.length} />
                    <MotionAnalysisTabButton active={analysisTab === MOTION_TEXT_CHAPTERS} onClick={() => setAnalysisTab(MOTION_TEXT_CHAPTERS)} label={text.CHAPTERS} prefix={MOTION_TEXT_SYMBOL_8} count={state.analysis.chapters.length} />
                    {!_.isEmpty(state.analysis.facts) && <MotionAnalysisTabButton active={analysisTab === MOTION_TEXT_FACTS} onClick={() => setAnalysisTab(MOTION_TEXT_FACTS)} label={text.FACTS} prefix={MOTION_TEXT_SYMBOL_9} />}
                  </div>
                }
              />
              <div className={MOTION_STYLES.SPACE_Y_3}>
                <input value={state.analysis.title} onChange={(e) => patch({ analysis: { ...state.analysis!, title: e.target.value } })} placeholder={MOTION_TEXT_TIEU_DE_CAU_CHUYEN} className={cn(inputCls, MOTION_STYLES.TEXT_SM_FONT_BOLD)} />
                {state.analysis.genre && (
                  <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2}>
                    <span className={MOTION_STYLES.TEXT_10PX_TEXT_SLATE_400_LINE_CLAMP_3}>{text.GENRE}</span>
                    {_.map(_.compact([state.analysis.genre, state.analysis.genre2]), (id) => (
                      <span key={id} className={MOTION_STYLES.PX_2_PY_0_5_ROUNDED_LG_TEXT_10PX_FONT_MONO_FONT_BLACK_BG_PURPLE_500_15}>
                        {id}
                      </span>
                    ))}
                    <span className={MOTION_STYLES.TEXT_10PX_TEXT_SLATE_400_LINE_CLAMP_3}>
                      {state.analysis.factual === false ? text.GENRE_FICTION : state.analysis.factual === true ? text.GENRE_FACTUAL : ""}
                      {state.analysis.genreReason ? MR.MOTION_TEXT_SYMBOL_10 + state.analysis.genreReason : ""}
                    </span>
                  </div>
                )}
                {state.analysis.videoDna && <MotionVideoDnaCard dna={state.analysis.videoDna} text={text} currentLang={currentLang} />}
                {analysisTab === MOTION_TEXT_CAST && (
                  <div className={MOTION_STYLES.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_3_MAX_H_380PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR}>
                    {_.map(state.analysis.cast, (c) => {
                      const outfit: any = gen?.cast?.[c.key];
                      const colors: string[] = _.take(_.compact(_.map(outfit?.layers || [], MOTION_TEXT_COLOR)), 6);
                      return (
                        <div key={c.key} className={MOTION_STYLES.FLEX_ITEMS_START_GAP_3_ROUNDED_2XL_BORDER_BORDER_SLATE_800_BG_SLATE_955_70}>
                          <div className={MOTION_STYLES.W_12_H_16_ROUNDED_XL_BG_SLATE_900_FLEX_FLEX_COL_ITEMS_CENTER}>{colors.length ? _.map(colors, (col, k) => <span key={k} className={MOTION_STYLES.W_8_H_2_ROUNDED_SM_BORDER_BORDER_WHITE_10} style={{ background: col }} />) : <Users className={MOTION_STYLES.W_5_H_5_TEXT_SLATE_400} />}</div>
                          <div className={MOTION_STYLES.MIN_W_0_FLEX_1_SPACE_Y_1}>
                            <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                              <span className={MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_TRUNCATE}>{c.name}</span>
                              <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_TEXT_SLATE_300_PX_1_5_PY_0_5_ROUNDED_BG_SLATE_900}>{c.key}</span>
                            </div>
                            <p className={MOTION_STYLES.TEXT_10PX_TEXT_SLATE_400_LINE_CLAMP_2}>{c.role || c.description}</p>
                            {c.look && (
                              <p className={MOTION_STYLES.TEXT_10PX_TEXT_PURPLE_300_90_LINE_CLAMP_2} title={c.look}>
                                {text.CAST_LOOK}
                                {MOTION_TEXT_SYMBOL_21}
                                {c.look}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {analysisTab === MOTION_TEXT_PLACES && (
                  <div className={MOTION_STYLES.SPACE_Y_2_MAX_H_380PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_PR_1}>
                    {_.map(state.analysis.places, (p) => {
                      const info = gen?.locationInfo?.[p.key];
                      return (
                        <div key={p.key} className={MOTION_STYLES.FLEX_ITEMS_START_GAP_3_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_955_70}>
                          {info?.files?.[0] ? <img src={genPreviewUrl(info.files[0], info.at)} alt={p.key} className={MOTION_STYLES.W_24_H_14_ROUNDED_LG_OBJECT_COVER_SHRINK_0} /> : <div className={MOTION_STYLES.W_24_H_14_ROUNDED_LG_BG_SLATE_900_SHRINK_0} />}
                          <div className={MOTION_STYLES.MIN_W_0_FLEX_1_SPACE_Y_0_5}>
                            <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                              <span className={MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_TRUNCATE}>{p.name}</span>
                              <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_TEXT_SLATE_400}>{p.key}</span>
                            </div>
                            <p className={MOTION_STYLES.TEXT_10PX_TEXT_SLATE_400_LINE_CLAMP_3}>{p.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {analysisTab === MOTION_TEXT_CHAPTERS && (
                  <div className={MOTION_STYLES.SPACE_Y_2_MAX_H_380PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_PR_1}>
                    {_.map(state.analysis.chapters, (c, i) => (
                      <div key={c.id} className={MOTION_STYLES.FLEX_ITEMS_START_GAP_3_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_955_70}>
                        <span className={MOTION_STYLES.FONT_MONO_TEXT_XS_FONT_BOLD_TEXT_PURPLE_400_W_6_SHRINK_0_MT_0_5}>{String(i + 1).padStart(2, MOTION_TEXT_0)}</span>
                        <div className={MOTION_STYLES.MIN_W_0_FLEX_1_SPACE_Y_1}>
                          <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                            <span className={MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_SLATE_100}>{c.title}</span>
                            <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_TEXT_SLATE_400_BG_SLATE_900_BORDER_BORDER_SLATE_800_PX_2}>
                              {MOTION_TEXT_SYMBOL_2}
                              {c.targetSeconds}
                              {MOTION_TEXT_S}
                            </span>
                          </div>
                          <p className={MOTION_STYLES.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED}>{c.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {analysisTab === MOTION_TEXT_FACTS && !_.isEmpty(state.analysis.facts) && (
                  <div className={MOTION_STYLES.SPACE_Y_2_MAX_H_380PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_PR_1}>
                    {_.map(state.analysis.facts, (f, i) => (
                      <div key={i} className={MOTION_STYLES.TEXT_XS_FLEX_GAP_2_5_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_955_70}>
                        <span
                          className={cn(
                            MOTION_STYLES.SHRINK_0_PX_2_PY_0_5_ROUNDED_LG_TEXT_9PX_FONT_BOLD_UPPERCASE,
                            f.status === MOTION_TEXT_OK ? MOTION_STYLES.BG_EMERALD_500_15_TEXT_EMERALD_600_DARK_TEXT_EMERALD_400_BORDER_BORDER_EMERALD_500_30 : f.status === MOTION_TEXT_WRONG ? MOTION_STYLES.BG_ROSE_500_15_TEXT_ROSE_600_DARK_TEXT_ROSE_400_BORDER_BORDER_ROSE_500_30 : MOTION_STYLES.BG_PURPLE_500_15_TEXT_PURPLE_300_BORDER_BORDER_PURPLE_500_30,
                          )}>
                          {f.status === MOTION_TEXT_OK ? text.FACT_OK : f.status === MOTION_TEXT_WRONG ? text.FACT_WRONG : text.FACT_UNCERTAIN}
                        </span>
                        <div className={MOTION_STYLES.MIN_W_0_FLEX_1_SPACE_Y_0_5}>
                          <div className={MOTION_STYLES.TEXT_SLATE_100_FONT_MEDIUM}>{f.claim}</div>
                          {f.note && <div className={MOTION_STYLES.TEXT_11PX_TEXT_SLATE_400}>{f.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={MOTION_STYLES.FLEX_JUSTIFY_END_PT_2_GAP_2_FLEX_WRAP}>
                  {busyKind === MOTION_TEXT_SCRIPT ? (
                    <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2}>
                      <ActionBtn busy={true} icon={Wand2} onClick={() => {}} className={MOTION_STYLES.PX_5_PY_2_5}>
                        {text.WRITING_SCRIPT}
                      </ActionBtn>
                      {stopAi}
                    </div>
                  ) : (
                    <>
                      {!!state.script?.beats?.length && missingChapterIds.length > 0 && (
                        <ActionBtn icon={RefreshCw} onClick={() => void studio.writeScript(missingChapterIds, undefined, true)} disabled={studio.storyBusy} className={MOTION_STYLES.PX_5_PY_2_5}>
                          {text.SCRIPT_RESUME}
                          {MR.MOTION_TEXT_SYMBOL_6}
                          {missingChapterIds.length}
                          {MR.MOTION_TEXT_SYMBOL_7}
                        </ActionBtn>
                      )}
                      <ActionBtn icon={Wand2} onClick={() => void studio.writeScript()} disabled={studio.storyBusy} className={MOTION_STYLES.PX_5_PY_2_5}>
                        {text.SCRIPT_BTN}
                      </ActionBtn>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          {busyKind === MOTION_TEXT_SCRIPT ? (
            <div className={cardCls}>
              <StepHeader n={MOTION_TEXT_03} icon={Film} title={text.STEP_SCRIPT} badge={text.BADGE_SCRIPT_WRITING} />
              <div className={MOTION_STYLES.PY_14_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_CENTER_SPACE_Y_4}>
                <div className={MOTION_STYLES.RELATIVE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER}>
                  <div className={MOTION_STYLES.W_14_H_14_ROUNDED_2XL_BG_GRADIENT_TO_TR_FROM_PURPLE_600_20_VIA_FUCHSIA_600_20_TO_PINK_600_20}>
                    <Film className={MOTION_STYLES.W_7_H_7_TEXT_PURPLE_400_ANIMATE_PULSE} />
                  </div>
                  <div className={MOTION_STYLES.ABSOLUTE_INSET_1_ROUNDED_2XL_BG_PURPLE_500_20_BLUR_MD_Z_10_ANIMATE_PULSE} />
                </div>
                <div className={MOTION_STYLES.SPACE_Y_1_MAX_W_SM}>
                  <p className={MOTION_STYLES.TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_100}>{text.SCRIPT_WRITING}</p>
                  <p className={MOTION_STYLES.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED_FONT_SANS}>{job?.log?.[job.log.length - 1] || text.LOG_SCRIPT_DEFAULT}</p>
                </div>
                {job?.startedAt && <ElapsedLine since={job.startedAt} label={text.SCRIPT_TIME} suffix={text.ELAPSED} />}
                <MotionProgressBar progress={job?.progress} minimum={15} className={MOTION_STYLES.W_56_H_1_5} />
              </div>
            </div>
          ) : state.script && state.analysis ? (
            <div className={cardCls}>
              <StepHeader
                n={MOTION_TEXT_03}
                icon={Film}
                title={text.STEP_SCRIPT}
                badge={MOTION_TEMPLATE_BEATS(MR.MOTION_TEMPLATE_SYMBOL_18(state.script.beats.length))}
                right={
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_TEXT_SLATE_400}>
                    {formatSeconds(estimateTotal)} {!studio.voiceValid && !state.uploadedAudio ? MOTION_TEMPLATE_SYMBOL_2(MR.MOTION_TEMPLATE_SYMBOL_22(text.ESTIMATED)) : ""}
                  </span>
                }
              />
              <div className={MOTION_STYLES.SPACE_Y_4_MAX_H_620PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_PR_1}>
                {_.map(state.analysis.chapters, (chapter, ci) => (
                  <div key={chapter.id} className={MOTION_STYLES.SPACE_Y_3}>
                    <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_STICKY_TOP_0_BG_SLATE_900_95_BACKDROP_BLUR_MD}>
                      <div className={MOTION_STYLES.TEXT_XS_FONT_BLACK_UPPERCASE_TRACKING_WIDE_FLEX_ITEMS_CENTER_GAP_2}>
                        <span className={MOTION_STYLES.W_5_H_5_ROUNDED_LG_BG_PURPLE_600_TEXT_WHITE_FLEX_ITEMS_CENTER}>{ci + 1}</span>
                        <span className={MOTION_STYLES.TEXT_PURPLE_400_FONT_EXTRABOLD}>{chapter.title}</span>
                        <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_LOWERCASE}>
                          {MOTION_TEXT_SYMBOL_43}
                          {chapter.targetSeconds}
                          {MOTION_TEXT_S_2}
                        </span>
                      </div>
                      <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void studio.writeScript([chapter.id])} disabled={studio.storyBusy} className={MOTION_STYLES.PX_2_5_PY_1_ROUNDED_LG_TEXT_11PX_FONT_BOLD_BG_SLATE_955_80_BORDER}>
                        <RefreshCw className={MOTION_STYLES.W_3_H_3} /> <span>{text.SCRIPT_REGEN_CHAPTER}</span>
                      </Button>
                    </div>
                    <div className={MOTION_STYLES.SPACE_Y_2_5}>
                      {_.map(beatsByChapter[chapter.id] || [], (b, bi) => (
                        <div key={b.id} className={MOTION_STYLES.ROUNDED_2XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_70_P_3_5_SHADOW_XS_HOVER_BORDER_PURPLE_500_40}>
                          <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_FLEX_WRAP}>
                            <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_1_5_FLEX_WRAP}>
                              <span className={MOTION_STYLES.PX_2_PY_0_5_ROUNDED_LG_TEXT_10PX_FONT_MONO_FONT_BLACK_BG_PURPLE_500_15}>
                                {MOTION_TEXT_SYMBOL_44}
                                {bi + 1}
                              </span>
                              <span
                                className={cn(
                                  MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_PX_2_5_PY_0_5_ROUNDED_LG_UPPERCASE,
                                  b.visual === MOTION_TEXT_SCENE
                                    ? MOTION_STYLES.BG_SKY_500_15_BORDER_SKY_500_30_TEXT_SKY_700_DARK_TEXT_SKY_300
                                    : b.visual === MOTION_TEXT_TITLE
                                      ? MOTION_STYLES.BG_PURPLE_500_15_BORDER_PURPLE_500_30_TEXT_PURPLE_700_DARK_TEXT_PURPLE_300
                                      : b.visual === MOTION_TEXT_STATS
                                        ? MOTION_STYLES.BG_EMERALD_500_15_BORDER_EMERALD_500_30_TEXT_EMERALD_700_DARK_TEXT_EMERALD_300
                                        : MOTION_STYLES.BG_FUCHSIA_500_15_BORDER_FUCHSIA_500_30_TEXT_FUCHSIA_700_DARK_TEXT_FUCHSIA_300,
                                )}>
                                {b.visual === MOTION_TEXT_SCENE ? MOTION_TEXT_SCENE_2 : b.visual === MOTION_TEXT_TITLE ? MOTION_TEXT_TITLE_2 : b.visual === MOTION_TEXT_STATS ? MOTION_TEXT_STATS_2 : b.visual}
                              </span>
                              {b.visual === MOTION_TEXT_SCENE && (b.place || b.time) && (
                                <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_MEDIUM_TEXT_SLATE_400_BG_SLATE_955_80_PX_2_PY_0_5} title={MOTION_TEMPLATE_SYMBOL_7(MR.MOTION_TEMPLATE_SYMBOL_30(b.place || ""), MR.MOTION_TEMPLATE_SYMBOL_31(b.time || ""))}>
                                  {b.place}
                                  {b.time ? MOTION_TEMPLATE_SYMBOL_6(MR.MOTION_TEMPLATE_SYMBOL_32(b.time)) : ""}
                                </span>
                              )}
                              {b.visual === MOTION_TEXT_SCENE && gen?.staging?.[b.id] ? <Check className={MOTION_STYLES.W_3_5_H_3_5_TEXT_EMERALD_400} /> : null}
                            </div>
                            <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => removeBeat(b.id)} className={MOTION_STYLES.P_1_5_ROUNDED_LG_TEXT_SLATE_400_HOVER_TEXT_ROSE_500_HOVER_BG_ROSE_500_10_TRANSITION_ALL_CURSOR_POINTER} title={text.DELETE || MOTION_TEXT_XOA} disabled={studio.storyBusy}>
                              <Trash2 className={MOTION_STYLES.W_3_5_H_3_5} />
                            </Button>
                          </div>
                          <textarea value={b.narration} onChange={(e) => updateBeat(b.id, { narration: e.target.value })} rows={2} placeholder={MOTION_TEXT_NHAP_NOI_DUNG_LOI_DAN_CHO_PHAN_CANH} className={MOTION_STYLES.W_FULL_BG_SLATE_955_80_BORDER_BORDER_SLATE_800_ROUNDED_XL_P_3_TEXT_XS} disabled={studio.storyBusy} />
                          {b.visual === MOTION_TEXT_SCENE && <input value={b.action || ""} onChange={(e) => updateBeat(b.id, { action: e.target.value })} className={MOTION_STYLES.W_FULL_BG_SLATE_955_60_BORDER_BORDER_SLATE_800_ROUNDED_LG_PX_2_5_PY_1_5} disabled={studio.storyBusy} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {state.script?.beats?.length ? <MotionSeoCard seo={state.seo} busy={studio.storyBusy} canGenerate={!!state.analysis} onGenerate={() => void studio.generateSeo()} lang={currentLang} thumbnail={state.thumbnail} thumbnails={state.thumbnails} onThumbnail={(i) => void studio.generateThumbnail(i)} /> : null}
        </div>
        <div className={MOTION_STYLES.STUDIO_RIGHT_COLUMN}>
          <div className={cardCls}>
            <StepHeader n={MOTION_TEXT_SYMBOL_11} icon={PlayCircle} title={text.PREVIEW} badge={text.PREVIEW_BADGE} />
            {!!studio.compiled?.missing?.length && <p className={MOTION_STYLES.TEXT_11PX_TEXT_AMBER_400}>{text.SCENES_MISSING}</p>}
            {studio.ME ? (
              <MotionSpecPlayer ME={studio.ME} spec={previewSpec} audioUrl={motionAudioUrl(studio.audioId)} />
            ) : (
              <div className={MOTION_STYLES.W_FULL_H_340PX_SM_H_380PX_MD_H_420PX_FLEX_ITEMS_CENTER_JUSTIFY_CENTER}>
                <div className={MOTION_STYLES.W_14_H_14_ROUNDED_2XL_BG_GRADIENT_TO_TR_FROM_PURPLE_600_20_VIA_FUCHSIA_600_20_TO_PINK_600_20}>
                  <MotionLoadingIcon className={MOTION_STYLES.W_7_H_7_TEXT_PURPLE_400_ANIMATE_SPIN} />
                </div>
              </div>
            )}
          </div>
          {state.script && state.analysis && (
            <div className={cardCls}>
              <StepHeader n={MOTION_TEXT_AI_2} icon={Box} title={text.STEP_SCENES} badge={sceneBeats.length ? MOTION_TEMPLATE_SYMBOL_4(MR.MOTION_TEMPLATE_SYMBOL_33(builtCount), MR.MOTION_TEMPLATE_SYMBOL_34(sceneBeats.length)) : undefined} />
              <div className={MOTION_STYLES.SPACE_Y_3}>
                <p className={MOTION_STYLES.TEXT_11PX_LEADING_RELAXED_TEXT_SLATE_500}>{text.SCENES_HINT}</p>
                <input value={sceneNote} onChange={(e) => setSceneNote(e.target.value)} placeholder={text.SCENES_NOTE} className={cn(inputCls, MOTION_STYLES.PY_1_5_TEXT_11PX)} disabled={studio.storyBusy} />
                {busyKind === MOTION_TEXT_SCENES ? (
                  <div className={MOTION_STYLES.SPACE_Y_3}>
                    <div className={MOTION_STYLES.PY_6_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_CENTER_SPACE_Y_3}>
                      <div className={MOTION_STYLES.W_10_H_10_ROUNDED_XL_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_500_30_FLEX}>
                        <Box className={MOTION_STYLES.W_5_H_5_TEXT_PURPLE_400_ANIMATE_PULSE} />
                      </div>
                      <div className={MOTION_STYLES.SPACE_Y_1}>
                        <p className={MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_SLATE_200}>{text.SCENES_RUNNING}</p>
                        <p className={MOTION_STYLES.TEXT_11PX_TEXT_SLATE_400_FONT_MONO}>{job?.log?.[job.log.length - 1] || ""}</p>
                      </div>
                      {job?.startedAt && <ElapsedLine since={job.startedAt} label={text.SCENES_TIME} suffix={text.ELAPSED} />}
                      <MotionProgressBar progress={job?.progress} minimum={6} className={MOTION_STYLES.W_FULL_MAX_W_XS_H_1_5} />
                    </div>
                    <StopBtn className={MOTION_STYLES.W_FULL} onClick={() => void studio.cancelStory()} label={storyStopping ? text.STOPPING : text.STOP_AI} stopping={storyStopping} />
                  </div>
                ) : (
                  <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP}>
                    <ActionBtn icon={Wand2} className={MOTION_STYLES.FLEX_1} onClick={() => void studio.buildScenes({ note: sceneNote || undefined })} disabled={studio.storyBusy}>
                      {builtCount ? text.SCENES_CONTINUE : text.SCENES_BTN}
                    </ActionBtn>
                    {!!builtCount && (
                      <>
                        <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void studio.buildScenes({ restyle: true, beats: [], note: sceneNote || undefined })} disabled={studio.storyBusy} className={MOTION_STYLES.TEXT_10PX_FONT_BOLD_TEXT_SLATE_500_HOVER_TEXT_PURPLE_300_FLEX_ITEMS_CENTER_GAP_1}>
                          <Users className={MOTION_STYLES.W_3_H_3} /> {text.SCENES_RESTYLE}
                        </Button>
                        <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void studio.buildScenes({ restart: true, note: sceneNote || undefined })} disabled={studio.storyBusy} className={MOTION_STYLES.TEXT_10PX_FONT_BOLD_TEXT_SLATE_500_HOVER_TEXT_PURPLE_300_FLEX_ITEMS_CENTER_GAP_1}>
                          <RefreshCw className={MOTION_STYLES.W_3_H_3} /> {text.SCENES_RESTART}
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {!_.isEmpty(gen?.locationInfo) && (
                  <div className={MOTION_STYLES.SPACE_Y_1_5}>
                    <div className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_500_UPPERCASE_TRACKING_WIDER}>{text.SCENES_LOCATIONS}</div>
                    <div className={MOTION_STYLES.GRID_GRID_COLS_2_GAP_2}>
                      {_.map(gen!.locationInfo, (info, key) => (
                        <div
                          key={key}
                          onClick={() =>
                            info.files?.[0] &&
                            setPreviewModal({
                              type: MR.MOTION_TEXT_LOCATION,
                              id: key,
                              title: key,
                              imageUrl: genPreviewUrl(info.files[0], info.at),
                              score: info.score,
                              issues: info.issues,
                              note: info.note,
                            })
                          }
                          className={cn(MOTION_STYLES.LOCATION_CARD_CONTAINER, info.files?.[0] && MR.MOTION_TEXT_CURSOR_POINTER)}
                          title={(info.issues || []).join(MOTION_TEXT_SYMBOL_10)}>
                          {info.files?.[0] ? <img src={genPreviewUrl(info.files[0], info.at)} alt={key} className={MOTION_STYLES.W_FULL_H_FULL_OBJECT_COVER_SCALE} loading={MOTION_TEXT_LAZY} /> : <div className={MOTION_STYLES.LOCATION_EMPTY_PLACEHOLDER}>{key}</div>}
                          <div className={MOTION_STYLES.LOCATION_OVERLAY_GRADIENT} />
                          {info.files?.[0] && (
                            <div className={MOTION_STYLES.ZOOM_HOVER_ICON_WRAPPER}>
                              <div className={MOTION_STYLES.ZOOM_HOVER_ICON_BADGE}>
                                <Maximize2 className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                              </div>
                            </div>
                          )}
                          <div className={MOTION_STYLES.LOCATION_BOTTOM_BADGE_BAR}>
                            <span className={MOTION_STYLES.LOCATION_NAME_BADGE}>{key}</span>
                            {info.score != null && (
                              <span className={cn(MOTION_STYLES.LOCATION_SCORE_BASE, info.score >= 8 ? MOTION_STYLES.SCORE_EMERALD : info.score >= 6 ? MOTION_STYLES.SCORE_PURPLE : MOTION_STYLES.SCORE_AMBER)}>
                                {info.score}
                                {MOTION_TEXT_10}
                              </span>
                            )}
                          </div>
                          <Button
                            variant={MOTION_TEXT_UNSTYLED}
                            type={MOTION_TEXT_BUTTON}
                            onClick={(e) => {
                              e.stopPropagation();
                              void studio.buildScenes({ locations: [key], note: sceneNote || undefined });
                            }}
                            disabled={studio.storyBusy}
                            title={text.SCENES_REDO_LOCATION}
                            aria-label={text.SCENES_REDO_LOCATION}
                            className={MOTION_STYLES.REDO_CIRCLE_BUTTON}>
                            <RotateCcw className={MOTION_STYLES.REDO_ICON_ROTATING} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!!builtCount && (
                  <div className={MOTION_STYLES.SPACE_Y_1_5}>
                    <div className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_500_UPPERCASE_TRACKING_WIDER}>
                      {text.SCENES_BEATS}
                      {gen?.failed?.length ? MOTION_TEMPLATE_SYMBOL_57(MR.MOTION_TEMPLATE_SYMBOL_35(gen.failed.length), MR.MOTION_TEMPLATE_SYMBOL_36(text.SCENES_FAILED)) : ""}
                    </div>
                    <div className={MOTION_STYLES.GRID_GRID_COLS_2_GAP_2_MAX_H_360PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_PR_1}>
                      {_.map(sceneBeats, (b) => {
                        const pv = gen?.previews?.[b.id];
                        const bad = !gen?.staging?.[b.id] || (pv?.score != null && pv.score < 6);
                        return (
                          <div
                            key={b.id}
                            onClick={() =>
                              pv?.file &&
                              setPreviewModal({
                                type: MR.MOTION_TEXT_BEAT,
                                id: b.id,
                                title: b.id,
                                imageUrl: genPreviewUrl(pv.file, pv.at),
                                score: pv?.score,
                                issues: pv?.issues,
                                note: pv?.note,
                                narration: b.narration,
                                action: b.action,
                              })
                            }
                            className={cn(MOTION_STYLES.SCENE_BEAT_CARD_BASE, bad ? MOTION_STYLES.SCENE_BEAT_CARD_BAD : MOTION_STYLES.SCENE_BEAT_CARD_GOOD, pv?.file && MR.MOTION_TEXT_CURSOR_POINTER)}
                            title={[b.narration, b.action, ...(pv?.issues || []), pv?.note || ""].filter(Boolean).join(MOTION_TEXT_SYMBOL_10)}>
                            {pv?.file ? <img src={genPreviewUrl(pv.file, pv.at)} alt={b.id} className={MOTION_STYLES.W_FULL_H_FULL_OBJECT_COVER_SCALE} loading={MOTION_TEXT_LAZY} /> : <div className={MOTION_STYLES.LOCATION_EMPTY_PLACEHOLDER}>{b.id}</div>}
                            <div className={MOTION_STYLES.LOCATION_OVERLAY_GRADIENT} />
                            {pv?.file && (
                              <div className={MOTION_STYLES.ZOOM_HOVER_ICON_WRAPPER}>
                                <div className={MOTION_STYLES.ZOOM_HOVER_ICON_BADGE}>
                                  <Maximize2 className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                                </div>
                              </div>
                            )}
                            <div className={MOTION_STYLES.SCENE_BEAT_TOP_BADGE_BAR}>
                              <span className={MOTION_STYLES.SCENE_BEAT_ID_BADGE}>{b.id}</span>
                              {bad && (
                                <span className={MOTION_STYLES.SCENE_BEAT_WARNING_BADGE}>
                                  <AlertTriangle className={MOTION_STYLES.W_2_5_H_2_5} />
                                </span>
                              )}
                            </div>
                            {pv?.score != null && (
                              <div className={MOTION_STYLES.SCENE_BEAT_BOTTOM_SCORE_BAR}>
                                <span className={cn(MOTION_STYLES.LOCATION_SCORE_BASE, pv.score >= 8 ? MOTION_STYLES.SCORE_EMERALD : pv.score >= 6 ? MOTION_STYLES.SCORE_PURPLE : MOTION_STYLES.SCORE_AMBER)}>
                                  {pv.score}
                                  {MOTION_TEXT_10}
                                </span>
                              </div>
                            )}
                            <Button
                              variant={MOTION_TEXT_UNSTYLED}
                              type={MOTION_TEXT_BUTTON}
                              onClick={(e) => {
                                e.stopPropagation();
                                void studio.buildScenes({ beats: [b.id], note: sceneNote || undefined });
                              }}
                              disabled={studio.storyBusy}
                              title={text.SCENES_REDO}
                              aria-label={text.SCENES_REDO}
                              className={MOTION_STYLES.REDO_CIRCLE_BUTTON}>
                              <RotateCcw className={MOTION_STYLES.REDO_ICON_ROTATING} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className={cardCls}>
            <StepHeader n={MOTION_TEXT_04} icon={Mic} title={text.STEP_VOICE} badge={MOTION_TEXT_AI_VOICE} />
            <div className={MOTION_STYLES.SPACE_Y_3}>
              <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setVoiceDialog(true)} className={cn(inputCls, MOTION_STYLES.TEXT_LEFT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_CURSOR_POINTER_PY_2_5)}>
                <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_MIN_W_0}>
                  <div className={MOTION_STYLES.W_6_H_6_ROUNDED_FULL_BG_PURPLE_500_20_TEXT_PURPLE_400_FLEX_ITEMS_CENTER}>
                    <Mic className={MOTION_STYLES.W_3_5_H_3_5} />
                  </div>
                  <span className={MOTION_STYLES.TRUNCATE_FONT_BOLD_TEXT_SLATE_100}>{state.voiceName || text.VOICE_PICK}</span>
                </div>
                <ChevronDown className={MOTION_STYLES.W_4_H_4_TEXT_SLATE_400_SHRINK_0} />
              </Button>
              <div className={MOTION_STYLES.SPACE_Y_1}>
                <div className={MOTION_STYLES.FLEX_JUSTIFY_BETWEEN_TEXT_11PX_FONT_BOLD_TEXT_SLATE_400}>
                  <span>{text.VOICE_SPEED}</span>
                  <span className={MOTION_STYLES.FONT_MONO_FONT_BOLD_TEXT_PURPLE_400}>
                    {state.voiceSpeed.toFixed(2)}
                    {MOTION_TEXT_SYMBOL_12}
                  </span>
                </div>
                <input type={MOTION_TEXT_RANGE} min={0.8} max={1.2} step={0.05} value={state.voiceSpeed} onChange={(e) => patch({ voiceSpeed: _.toNumber(e.target.value) })} className={MOTION_STYLES.W_FULL_ACCENT_PURPLE_500} />
              </div>
              {busyKind === MOTION_TEXT_VOICE ? (
                <div className={MOTION_STYLES.SPACE_Y_3}>
                  <div className={MOTION_STYLES.PY_6_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_CENTER_SPACE_Y_3}>
                    <div className={MOTION_STYLES.W_10_H_10_ROUNDED_XL_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_500_30_FLEX}>
                      <Mic className={MOTION_STYLES.W_5_H_5_TEXT_PURPLE_400_ANIMATE_PULSE} />
                    </div>
                    <div className={MOTION_STYLES.SPACE_Y_1}>
                      <p className={MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_SLATE_200}>{text.VOICE_GENERATING}</p>
                      <p className={MOTION_STYLES.TEXT_11PX_TEXT_SLATE_400_FONT_MONO}>{job?.log?.[job.log.length - 1] || text.LOG_VOICE_DEFAULT}</p>
                    </div>
                    {job?.startedAt && <ElapsedLine since={job.startedAt} label={text.VOICE_TIME} suffix={text.ELAPSED} />}
                    <MotionProgressBar progress={job?.progress} minimum={10} className={MOTION_STYLES.W_FULL_MAX_W_XS_H_1_5} />
                  </div>
                  <StopBtn className={MOTION_STYLES.W_FULL} onClick={() => void studio.cancelStory()} label={storyStopping ? text.STOPPING : text.STOP_AI} stopping={storyStopping} />
                </div>
              ) : (
                <ActionBtn icon={Mic} className={MOTION_STYLES.W_FULL} onClick={() => void studio.generateVoice()} disabled={!state.script?.beats?.length || !state.voiceId || studio.storyBusy}>
                  {text.VOICE_BTN}
                </ActionBtn>
              )}
              {state.voice && (
                <div className={MOTION_STYLES.TEXT_11PX_TEXT_EMERALD_600_DARK_TEXT_EMERALD_400_FLEX_ITEMS_CENTER_GAP_1_5_P_2}>
                  <Check className={MOTION_STYLES.W_3_5_H_3_5_TEXT_EMERALD_600} />
                  <span>
                    {text.VOICE_READY}
                    {MOTION_TEXT_SYMBOL_10}
                    {formatSeconds(state.voice.totalSeconds)}
                  </span>
                </div>
              )}
              <div className={MOTION_STYLES.BORDER_T_BORDER_SLATE_800_PT_3_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => fileRef.current?.click()} className={MOTION_STYLES.TEXT_XS_TEXT_SLATE_400_HOVER_TEXT_PURPLE_300_FLEX_ITEMS_CENTER_GAP_1_5_CURSOR_POINTER}>
                  <Upload className={MOTION_STYLES.W_3_5_H_3_5} />
                  <span>{text.VOICE_UPLOAD}</span>
                </Button>
                <input ref={fileRef} type={MOTION_TEXT_FILE} accept={MOTION_TEXT_AUDIO} className={MOTION_STYLES.HIDDEN} onChange={(e) => e.target.files?.[0] && void studio.uploadVoice(e.target.files[0])} />
              </div>
            </div>
          </div>
          <div className={cardCls}>
            <StepHeader n={MOTION_TEXT_05} icon={Clapperboard} title={text.STEP_RENDER} badge={MOTION_TEXT_OUTPUT_MP4} />
            <div className={MOTION_STYLES.SPACE_Y_4}>
              <div className={MOTION_STYLES.SPACE_Y_1_5}>
                <label className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER}>{text.ASPECT}</label>
                <div className={MOTION_STYLES.GRID_GRID_COLS_4_GAP_1_5}>
                  {_.map(
                    [
                      { aspect: MotionAspect.LANDSCAPE, label: MOTION_TEXT_16_9, icon: Tv },
                      { aspect: MotionAspect.PORTRAIT, label: MOTION_TEXT_9_16, icon: Smartphone },
                      { aspect: MotionAspect.SQUARE, label: MOTION_TEXT_1_1, icon: Square },
                      { aspect: MotionAspect.FOUR_FIVE, label: MOTION_TEXT_4_5, icon: Monitor },
                    ],
                    ({ aspect, label, icon: Icon }) => (
                      <ChipButton key={aspect} active={state.aspect === aspect} onClick={() => patch({ aspect })} disabled={studio.renderBusy} className={MOTION_STYLES.H_9}>
                        <Icon className={MOTION_STYLES.W_3_5_H_3_5_SHRINK_0} />
                        <span>{label}</span>
                      </ChipButton>
                    ),
                  )}
                </div>
              </div>
              <div className={MOTION_STYLES.SPACE_Y_1_5}>
                <label className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER}>{text.QUALITY}</label>
                <div className={MOTION_STYLES.GRID_GRID_COLS_2_GAP_1_5}>
                  {_.map(
                    [
                      [MotionQuality.DRAFT, text.QUALITY_DRAFT],
                      [MotionQuality.STANDARD, text.QUALITY_STANDARD],
                      [MotionQuality.HIGH, text.QUALITY_HIGH],
                      [MotionQuality.ULTRA, text.QUALITY_ULTRA],
                    ],
                    ([q, label]) => (
                      <ChipButton key={q} active={state.quality === q} onClick={() => patch({ quality: q as MotionQuality })} disabled={studio.renderBusy}>
                        {label}
                      </ChipButton>
                    ),
                  )}
                </div>
              </div>
              <div className={MOTION_STYLES.GRID_GRID_COLS_1_SM_GRID_COLS_3_GAP_2}>
                <label className={MOTION_STYLES.SPACE_Y_1}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.FPS}</span>
                  <select value={state.fps} onChange={(e) => patch({ fps: _.toNumber(e.target.value) })} className={inputCls} disabled={studio.renderBusy}>
                    {_.map([24, 25, 30, 60], (f) => (
                      <option key={f} value={f}>
                        {f}
                        {MOTION_TEXT_FPS}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={MOTION_STYLES.SPACE_Y_1}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.ENCODER}</span>
                  <select value={state.encoder} onChange={(e) => patch({ encoder: e.target.value as MotionEncoderPreference })} className={inputCls} disabled={studio.renderBusy}>
                    <option value={MotionEncoderPreference.AUTO}>{text.ENCODER_AUTO}</option>
                    <option value={MotionEncoderPreference.GPU}>{text.ENCODER_GPU}</option>
                    <option value={MotionEncoderPreference.CPU}>{text.ENCODER_CPU}</option>
                  </select>
                </label>
                <div className={MOTION_STYLES.SPACE_Y_1}>
                  <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.SFX}</span>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} role={MR.MOTION_TEXT_SWITCH} aria-checked={Boolean(state.sfx)} aria-label={text.SFX} title={text.SFX} disabled={studio.renderBusy} onClick={() => patch({ sfx: !state.sfx })} className={cn(MOTION_STYLES.RENDER_CONTROL_CARD, studio.renderBusy && MOTION_STYLES.SFX_TOGGLE_CONTAINER_DISABLED)}>
                    <div className={MOTION_STYLES.RENDER_CONTROL_INFO}>
                      <Volume2 className={cn(MOTION_STYLES.W_3_5_H_3_5_SHRINK_0, state.sfx ? MOTION_STYLES.TEXT_PURPLE_400 : MOTION_STYLES.TEXT_SLATE_400)} />
                      <span className={MOTION_STYLES.RENDER_CONTROL_LABEL}>{state.sfx ? text.SFX_ON : text.SFX_OFF}</span>
                    </div>
                    <span aria-hidden={MR.MOTION_TEXT_TRUE} className={cn(MOTION_STYLES.TOGGLE_SWITCH_BASE, state.sfx ? MOTION_STYLES.TOGGLE_SWITCH_ACTIVE : MOTION_STYLES.TOGGLE_SWITCH_INACTIVE)}>
                      <span className={cn(MOTION_STYLES.TOGGLE_THUMB_BASE, state.sfx ? MOTION_STYLES.TOGGLE_THUMB_ACTIVE : MOTION_STYLES.TOGGLE_THUMB_INACTIVE)} />
                    </span>
                  </Button>
                </div>
              </div>
              <div className={MOTION_STYLES.GRID_GRID_COLS_AUTO_1FR_GAP_2_PT_2}>
                <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void studio.check()} disabled={!studio.compiled || studio.checking || studio.renderBusy} className={MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_2_5_ROUNDED_XL_TEXT_XS}>
                  {studio.checking ? <MotionLoadingIcon className={MOTION_STYLES.W_4_H_4_ANIMATE_SPIN_TEXT_PURPLE_400_SHRINK_0} /> : <ScanSearch className={MOTION_STYLES.W_4_H_4} />}
                  <span>{text.CHECK_BTN}</span>
                </Button>
                {studio.renderBusy ? (
                  <StopBtn onClick={() => void studio.cancelRender()} label={renderStopping ? text.STOPPING : text.STOP_RENDER} stopping={renderStopping} />
                ) : (
                  <ActionBtn icon={Clapperboard} onClick={() => void studio.render()} disabled={!studio.compiled}>
                    {text.RENDER_BTN}
                  </ActionBtn>
                )}
              </div>
            </div>
          </div>
          {(job || rj) && (
            <div className={cardCls}>
              <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800_PB_2}>
                <span className={MOTION_STYLES.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100_FONT_MONO}>{rj ? MOTION_TEXT_RENDER_VIDEO_MP4 : job?.kind === MOTION_TEXT_ANALYZE ? text.STEP_ANALYSIS : job?.kind === MOTION_TEXT_SCRIPT ? text.STEP_SCRIPT : job?.kind === MOTION_TEXT_SCENES ? text.STEP_SCENES : text.STEP_VOICE}</span>
                <span className={MOTION_STYLES.TEXT_10PX_FONT_MONO_TEXT_EMERALD_600_DARK_TEXT_EMERALD_400_FONT_BOLD}>{rj ? MOTION_TEMPLATE_SYMBOL_3(MR.MOTION_TEMPLATE_SYMBOL_37(Math.round((rj.progress || 0) * 100))) : MOTION_TEMPLATE_SYMBOL_3(MR.MOTION_TEMPLATE_SYMBOL_38(Math.round((job?.progress || 0) * 100)))}</span>
              </div>
              {studio.storyBusy && job?.startedAt && <ElapsedLine since={job.startedAt} label={job.kind === MOTION_TEXT_VOICE ? text.STEP_VOICE : text.WAITING_AI} suffix={text.ELAPSED} />}
              <MotionProgressBar progress={rj ? rj.progress : job?.progress} minimum={8} className={MOTION_STYLES.H_2} animated={false} />
              <div className={MOTION_STYLES.MAX_H_36_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_FONT_MONO_TEXT_10PX_TEXT_SLATE_400_BG_SLATE_955_90}>
                {_.map(_.takeRight((rj ? rj.log : job?.log) || [], 15), (l, i) => (
                  <div key={i} className={MOTION_STYLES.TRUNCATE}>
                    {l}
                  </div>
                ))}
              </div>
              {rj?.result && (
                <div className={MR.MOTION_TEXT_PT_2_BORDER_T_BORDER_SLATE_800}>
                  <div className={MR.MOTION_TEXT_RELATIVE_ROUNDED_XL_OVERFLOW_HIDDEN_BG_BLACK_SHADOW_LG_GROUP}>
                    <video src={rj.result.videoUrl} controls className={MR.MOTION_TEXT_W_FULL_ROUNDED_XL_BG_BLACK_SHADOW_LG_BLOCK} />
                    <div className={MR.MOTION_TEXT_ABSOLUTE_TOP_3_RIGHT_3_Z_10}>
                      <a href={rj.result.videoUrl} download={MOTION_TEXT_MOTION_VIDEO_MP4} className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_F}>
                        <Download className={MR.MOTION_TEXT_W_3_5_H_3_5_TEXT_PURPLE_300} />
                        <span>{text.SAVE_AS}</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <VoiceSelectionDialog
        isOpen={voiceDialog}
        onClose={() => setVoiceDialog(false)}
        currentLang={currentLang === MOTION_TEXT_EN ? MOTION_TEXT_EN : MOTION_TEXT_VI}
        selectedVoiceId={state.voiceId}
        favoriteVoices={[]}
        onToggleFavoriteVoice={_.noop}
        persistenceScope={MOTION_TEXT_MOTION_VIDEO}
        onSelectVoice={(v) => {
          patch({ voiceId: v.voice_id, voiceName: v.name });
          setVoiceDialog(false);
        }}
      />
      {previewModal && (
        <Modal
          isOpen
          onClose={() => setPreviewModal(null)}
          maxWidth={MR.MOTION_TEXT_4XL}
          title={
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
              {previewModal.type === MR.MOTION_TEXT_LOCATION ? <Layers className={MR.MOTION_TEXT_W_4_H_4_TEXT_PURPLE_400_SHRINK_0} /> : <Clapperboard className={MR.MOTION_TEXT_W_4_H_4_TEXT_PURPLE_400_SHRINK_0} />}
              <span className={MR.MOTION_TEXT_TRUNCATE}>{previewModal.type === MR.MOTION_TEXT_LOCATION ? MR.MOTION_TEMPLATE_SYMBOL_39(text.LOCATION_LABEL, previewModal.title) : MR.MOTION_TEMPLATE_SYMBOL_40(text.BEAT_LABEL, previewModal.title)}</span>
              {previewModal.score != null && (
                <span className={cn(MOTION_STYLES.LOCATION_SCORE_BASE, previewModal.score >= 8 ? MOTION_STYLES.SCORE_EMERALD : previewModal.score >= 6 ? MOTION_STYLES.SCORE_PURPLE : MOTION_STYLES.SCORE_AMBER)}>
                  {previewModal.score}
                  {MOTION_TEXT_10}
                </span>
              )}
            </div>
          }>
          <div className={MR.MOTION_TEXT_SPACE_Y_4}>
            <div className={MOTION_STYLES.LIGHTBOX_IMAGE_CONTAINER}>
              <img src={previewModal.imageUrl} alt={previewModal.title} className={MOTION_STYLES.LIGHTBOX_IMAGE} />
            </div>
            {(previewModal.narration || previewModal.action || (previewModal.issues && previewModal.issues.length > 0) || previewModal.note) && (
              <div className={MOTION_STYLES.LIGHTBOX_INFO_CARD}>
                {previewModal.narration && (
                  <div className={MR.MOTION_TEXT_TEXT_XS_SPACE_Y_0_5}>
                    <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_UPPERCASE_TEXT_SLATE_400_TRACKING_W}>{text.NARRATION_LABEL}</span>
                    <p className={MR.MOTION_TEXT_TEXT_SLATE_200_LEADING_RELAXED_FONT_MEDIUM}>{previewModal.narration}</p>
                  </div>
                )}
                {previewModal.action && (
                  <div className={MR.MOTION_TEXT_TEXT_XS_SPACE_Y_0_5_PT_1_5_BORDER_T_BORDER_SLATE_800_80}>
                    <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_UPPERCASE_TEXT_SLATE_400_TRACKING_W}>{text.ACTION_LABEL}</span>
                    <p className={MR.MOTION_TEXT_TEXT_SLATE_300_LEADING_RELAXED_FONT_MONO_TEXT_11PX}>{previewModal.action}</p>
                  </div>
                )}
                {((previewModal.issues && previewModal.issues.length > 0) || previewModal.note) && (
                  <div className={MR.MOTION_TEXT_TEXT_XS_SPACE_Y_1_PT_1_5_BORDER_T_BORDER_SLATE_800_80}>
                    <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_UPPERCASE_TEXT_AMBER_400_FLEX_ITEMS}>
                      <AlertTriangle className={MR.MOTION_TEXT_W_3_H_3_TEXT_AMBER_400} />
                      {text.ISSUES_LABEL}
                    </span>
                    {previewModal.note && <p className={MR.MOTION_TEXT_TEXT_AMBER_200_90_TEXT_11PX_LEADING_RELAXED}>{previewModal.note}</p>}
                    {previewModal.issues && previewModal.issues.length > 0 && (
                      <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_1}>
                        {previewModal.issues.map((iss, i) => (
                          <span key={i} className={MR.MOTION_TEXT_PX_2_PY_0_5_ROUNDED_MD_BG_AMBER_500_15_BORDER_BORDER_AMBER_500_30}>
                            {iss}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_PT_3_BORDER_T_BORDER_SLAT}>
              <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
                <a href={previewModal.imageUrl} download={MR.MOTION_TEMPLATE_PNG_2(previewModal.title || MR.MOTION_TEXT_MOTION_PREVIEW)} className={MR.MOTION_TEXT_H_9_MIN_H_36PX_PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX}>
                  <Download className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                  <span>{text.SAVE_AS}</span>
                </a>
                <Button
                  variant={MOTION_TEXT_UNSTYLED}
                  type={MR.MOTION_TEXT_BUTTON}
                  onClick={() => {
                    const m = previewModal;
                    setPreviewModal(null);
                    if (m.type === MR.MOTION_TEXT_LOCATION) { void studio.buildScenes({ locations: [m.id], note: sceneNote || undefined }); } else { void studio.buildScenes({ beats: [m.id], note: sceneNote || undefined }); }
                  }}
                  disabled={studio.storyBusy}
                  className={MR.MOTION_TEXT_H_9_MIN_H_36PX_PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX_2}>
                  <RotateCcw className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                  <span>{text.REDO_THIS}</span>
                </Button>
              </div>
              <Button variant={MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} onClick={() => setPreviewModal(null)} className={MR.MOTION_TEXT_H_9_MIN_H_36PX_PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX_3}>
                {text.RESULTS_CANCEL}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
const JunkDialog: FC<{ studio: MotionStudio; text: MotionVideoTexts; onClose: () => void; }> = ({ studio, text, onClose }) => {
  const [report, setReport] = useState<StorageJunkReport | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const load = async () => { setReport(null); try { const r = await studio.scanJunk(); setReport(r); setPicked(new Set(_.map(r.groups, MOTION_TEXT_GROUP))); } catch (e: any) { toast.error(e?.message); onClose(); } };
  useEffect(() => {
    void load();
  }, []);
  const total = report ? _.sumBy( _.filter(report.groups, (g) => picked.has(g.group)), MOTION_TEXT_BYTES, ) : 0;
  const run = async () => { setBusy(true); try { const r = await studio.cleanJunk([...picked]); toast.success(MOTION_TEMPLATE_JOIN_SPACE(r.recycled ? text.JUNK_RECYCLED : text.RESULTS_FREED, formatBytes(r.freedBytes))); setFailed(r.failed); await load(); } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); } };
  const label = (g: string) => (text as unknown as Record<string, string>)[MOTION_TEMPLATE_JUNK_GROUP_KEY(g)] || g;
  return (
    <Modal isOpen onClose={() => !busy && onClose()} title={text.JUNK_TITLE} maxWidth={MOTION_TEXT_MODAL_2XL}>
      {!report ? (
        <div className={MOTION_STYLES.PY_10_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_TEXT_SM_TEXT_SLATE_500}>
          <MotionLoadingIcon className={MOTION_STYLES.W_5_H_5_TEXT_PURPLE_400_ANIMATE_SPIN_SHRINK_0} />
          {text.JUNK_SCANNING}
        </div>
      ) : (
        <div className={MOTION_STYLES.SPACE_Y_4}>
          <div className={MOTION_STYLES.TEXT_XS_TEXT_SLATE_600_DARK_TEXT_SLATE_300}>
            <div>{text.JUNK_STORAGE}</div>
            <div className={MOTION_STYLES.FONT_MONO_FONT_BOLD_TEXT_SLATE_900_DARK_TEXT_SLATE_100_BREAK_ALL}>{report.storageDir}</div>
          </div>
          {_.isEmpty(report.groups) ? (
            <div className={MOTION_STYLES.PY_6_TEXT_CENTER_TEXT_SM_TEXT_SLATE_500}>{text.JUNK_EMPTY}</div>
          ) : (
            <div className={MOTION_STYLES.SPACE_Y_2_MAX_H_46VH_OVERFLOW_Y_AUTO_PR_1}>
              {_.map(report.groups, (g) => (
                <label key={g.group} className={MOTION_STYLES.FLEX_GAP_3_ITEMS_START_ROUNDED_XL_BORDER_BORDER_SLATE_200_DARK_BORDER_SLATE_800}>
                  <input
                    type={MOTION_TEXT_CHECKBOX}
                    className={MOTION_STYLES.MT_1_ACCENT_PURPLE_500}
                    checked={picked.has(g.group)}
                    onChange={(e) =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(g.group); else next.delete(g.group);
                        return next;
                      })
                    }
                  />
                  <div className={MOTION_STYLES.FLEX_1_MIN_W_0_SPACE_Y_1}>
                    <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                      <span className={MOTION_STYLES.TEXT_SM_FONT_BOLD_TEXT_SLATE_900_DARK_TEXT_SLATE_100}>{label(g.group)}</span>
                      <span className={MOTION_STYLES.TEXT_XS_FONT_MONO_FONT_BOLD_TEXT_ROSE_600_DARK_TEXT_ROSE_400_SHRINK_0}>{formatBytes(g.bytes)}</span>
                    </div>
                    <div className={MOTION_STYLES.TEXT_10PX_FONT_MONO_TEXT_SLATE_500_DARK_TEXT_SLATE_400_SPACE_Y_0_5}>
                      {_.map(_.take(g.items, 4), (it) => (
                        <div key={it.path} className={MOTION_STYLES.TRUNCATE}>
                          {it.path}
                          {MOTION_TEXT_SYMBOL_10}
                          {formatBytes(it.bytes)}
                        </div>
                      ))}
                      {g.items.length > 4 && <div>{MOTION_TEMPLATE_JUNK_MORE(MR.MOTION_TEMPLATE_SYMBOL_41(g.items.length - 4), text.JUNK_MORE)}</div>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {!_.isEmpty(failed) && (
            <div className={MOTION_STYLES.TEXT_11PX_TEXT_PURPLE_300}>
              <div className={MOTION_STYLES.FONT_BOLD}>{text.JUNK_FAILED}</div>
              {_.map(_.take(failed, 5), (f) => (
                <div key={f} className={MOTION_STYLES.FONT_MONO_TRUNCATE}>
                  {f}
                </div>
              ))}
            </div>
          )}
          <p className={MOTION_STYLES.TEXT_11PX_TEXT_SLATE_500_DARK_TEXT_SLATE_400_LEADING_RELAXED}>{text.JUNK_NOTE}</p>
          <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3}>
            <div className={MOTION_STYLES.TEXT_SM_FONT_BOLD_TEXT_SLATE_900_DARK_TEXT_SLATE_100}>{MOTION_TEMPLATE_JOIN_SPACE(text.JUNK_TOTAL, formatBytes(total))}</div>
            <div className={MOTION_STYLES.FLEX_GAP_2}>
              <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={onClose} disabled={busy} className={MOTION_STYLES.PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_BORDER_BORDER_SLATE_300}>
                {text.RESULTS_CANCEL}
              </Button>
              <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void run()} disabled={busy || !total} className={MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_4_PY_2_ROUNDED_XL_TEXT_XS}>
                {busy ? <MotionLoadingIcon className={MOTION_STYLES.W_3_5_H_3_5_ANIMATE_SPIN_TEXT_WHITE_SHRINK_0} /> : <Trash2 className={MOTION_STYLES.W_3_5_H_3_5} />}
                <span>{text.JUNK_CLEAN}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
const ResultsPanel: FC<{ studio: MotionStudio; text: MotionVideoTexts; }> = ({ studio, text }) => {
  const [confirm, setConfirm] = useState<MotionResultItem | true | null>(null);
  const [busy, setBusy] = useState(false);
  const [junkOpen, setJunkOpen] = useState(false);
  const junkButton = (
    <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setJunkOpen(true)} disabled={studio.renderBusy} className={MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_2_ROUNDED_XL_TEXT_XS}>
      <Sparkles className={MOTION_STYLES.W_3_5_H_3_5} />
      <span>{text.JUNK_BUTTON}</span>
    </Button>
  );
  const junkDialog = junkOpen && <JunkDialog studio={studio} text={text} onClose={() => setJunkOpen(false)} />;
  const runDelete = async () => { if (!confirm) return; setBusy(true); try { const freed = confirm === true ? await studio.deleteAllResults() : await studio.deleteResult(confirm.id); toast.success(MOTION_TEMPLATE_JOIN_SPACE(text.RESULTS_FREED, formatBytes(freed))); setConfirm(null); } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); } };
  if (_.isEmpty(studio.results)) {
    return (
      <div className={cn(cardCls, MOTION_STYLES.TEXT_CENTER_TEXT_XS_TEXT_SLATE_500_DARK_TEXT_SLATE_400_PY_20_FLEX_1_FLEX)}>
        <FolderKanban className={MOTION_STYLES.W_10_H_10_TEXT_SLATE_300_DARK_TEXT_SLATE_700_STROKE_1} />
        <span>{text.RESULTS_EMPTY}</span>
        <div className={MOTION_STYLES.PT_3}>{junkButton}</div>
        {junkDialog}
      </div>
    );
  }
  return (
    <div className={MOTION_STYLES.FLEX_FLEX_COL_GAP_4_W_FULL_PB_16_TEXT_LEFT}>
      <div className={cn(cardCls, MOTION_STYLES.PX_4_PY_3_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_FLEX_WRAP)}>
        <div className={MOTION_STYLES.TEXT_XS_FONT_BOLD_TEXT_SLATE_800_DARK_TEXT_SLATE_200}>{MOTION_TEMPLATE_JOIN_SPACE(MOTION_TEMPLATE_JOIN_SPACE(MR.MOTION_TEMPLATE_SYMBOL_42(studio.results.length), text.RESULTS_SUMMARY), formatBytes(_.sumBy(studio.results, (r) => r.sizeBytes || 0)))}</div>
        <div className={MOTION_STYLES.FLEX_GAP_2_FLEX_WRAP}>
          {junkButton}
          <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setConfirm(true)} disabled={studio.renderBusy} className={MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_2_ROUNDED_XL_TEXT_XS_2}>
            <Trash2 className={MOTION_STYLES.W_3_5_H_3_5} />
            <span>{text.RESULTS_DELETE_ALL}</span>
          </Button>
        </div>
      </div>
      <div className={MOTION_STYLES.GRID_GRID_COLS_1_MD_GRID_COLS_2_2XL_GRID_COLS_3_GAP_5_PB_8}>
        {_.map(studio.results, (r) => (
          <div key={r.id} className={cn(cardCls, MR.MOTION_TEXT_P_4_SPACE_Y_3_BG_WHITE_95_DARK_BG_SLATE_900_80_BORDER_BORDER_SLAT)}>
            <div className={MR.MOTION_TEXT_RELATIVE_ROUNDED_XL_OVERFLOW_HIDDEN_BG_BLACK_SHADOW_MD}>
              <video src={r.videoUrl} controls preload={MOTION_TEXT_METADATA} className={MR.MOTION_TEXT_W_FULL_ROUNDED_XL_BG_BLACK_MAX_H_380PX_SHADOW_MD_BLOCK} />
              <div className={MR.MOTION_TEXT_ABSOLUTE_TOP_3_RIGHT_3_FLEX_ITEMS_CENTER_GAP_2_Z_10}>
                <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void studio.saveResult(r)} title={text.SAVE_AS} className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_F}>
                  <Download className={MR.MOTION_TEXT_W_3_5_H_3_5_TEXT_PURPLE_300_GROUP_HOVER_TEXT_WHITE} />
                  <span>{text.SAVE_AS}</span>
                </Button>
                <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setConfirm(r)} title={text.RESULTS_DELETE} className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_W_8_H_8_ROUNDED_XL_BG_SLA}>
                  <Trash2 className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                </Button>
              </div>
            </div>
            <div className={MR.MOTION_TEXT_SPACE_Y_1}>
              <div className={MOTION_STYLES.TEXT_XS_FONT_BLACK_TEXT_SLATE_900_DARK_TEXT_SLATE_100_TRUNCATE}>{r.title}</div>
              <div className={MOTION_STYLES.TEXT_10PX_FONT_MONO_FONT_MEDIUM_TEXT_SLATE_600_DARK_TEXT_SLATE_400}>
                {r.width}
                {MOTION_TEXT_SYMBOL_12}
                {r.height}
                {MOTION_TEXT_SYMBOL_10}
                {r.fps}
                {MOTION_TEXT_FPS_2}
                {r.quality}
                {MOTION_TEXT_SYMBOL_10}
                {formatSeconds(r.durationSeconds)}
                {MOTION_TEXT_SYMBOL_10}
                {formatBytes(r.sizeBytes)}
                {MOTION_TEXT_SYMBOL_10}
                {r.encoder}
                {MOTION_TEXT_RENDER}
                {formatSeconds(r.renderSeconds)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {junkDialog}
      <Modal
        isOpen={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        maxWidth={MOTION_TEXT_MAX_W_MD}
        title={
          <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_GAP_2_UPPERCASE_TRACKING_WIDER_FONT_EXTRABOLD_TEXT_SLATE_900}>
            <Trash2 className={MOTION_STYLES.W_4_H_4_TEXT_ROSE_500_SHRINK_0} />
            <span className={MOTION_STYLES.UPPERCASE_FONT_EXTRABOLD_TRACKING_WIDER}>{text.RESULTS_CONFIRM_TITLE}</span>
          </div>
        }>
        <div className={MOTION_STYLES.SPACE_Y_4_TEXT_LEFT}>
          {confirm && confirm !== true && <div className={MOTION_STYLES.P_2_5_ROUNDED_XL_BG_SLATE_100_DARK_BG_SLATE_955_BORDER_BORDER_SLATE_200_DARK_BORDER_SLATE_800}>{confirm.title}</div>}
          <p className={MOTION_STYLES.TEXT_XS_SM_TEXT_SM_TEXT_SLATE_700_DARK_TEXT_SLATE_300_LEADING_RELAXED}>{confirm === true ? text.RESULTS_CONFIRM_ALL : text.RESULTS_CONFIRM_ONE}</p>
          <div className={MOTION_STYLES.P_3_ROUNDED_XL_BG_ROSE_500_10_BORDER_BORDER_ROSE_500_20_TEXT_ROSE_700_DARK_TEXT_ROSE_400}>{MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC}</div>
          <div className={MOTION_STYLES.FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2_5_PT_4_BORDER_T_BORDER_SLATE_200}>
            <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setConfirm(null)} disabled={busy} className={MOTION_STYLES.PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_BORDER_BORDER_SLATE_300_2}>
              {text.RESULTS_CANCEL}
            </Button>
            <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => void runDelete()} disabled={busy} className={MOTION_STYLES.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_5_PY_2_ROUNDED_XL_TEXT_XS}>
              {busy ? <MotionLoadingIcon className={MOTION_STYLES.W_3_5_H_3_5_ANIMATE_SPIN_TEXT_WHITE_SHRINK_0} /> : <Trash2 className={MOTION_STYLES.W_3_5_H_3_5} />}
              <span>{text.RESULTS_CONFIRM_YES}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
