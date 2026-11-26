import { useState, type FC } from "react";
import { FolderKanban, Mic2, Repeat, Wand2 } from "lucide-react";
import ChatPlanningSettingsBlock from "../../../components/common/ChatPlanningSettingsBlock.js";
import { Button } from "../../../components/ui/Button.js";
import { StudioCanvas, StudioDisclosureButton, StudioFieldset, StudioHeader, StudioPage } from "../../../components/ui/Studio.js";
import { Tooltip } from "../../../components/ui/Tooltip.js";
import { MOTION_VIDEO_TEXTS } from "../../../constants/motionVideoTexts.js";
import { MOTION_VOICE_CHANNEL_TEXT } from "../../../constants/motionVoice.js";
import type { Lang } from "../../../lib/lang.js";
import { cn } from "../../../lib/utils.js";
import type { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import { MotionVoicePanel } from "../../motion/components/MotionVoicePanel.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import { useReupStudio, type ReupStudio } from "../hooks/useReupStudio.js";
import type { ReupAiChoice, ReupStepId } from "../types/reup.js";
import { ReupExportCard } from "./ReupExportCard.js";
import { ReupLogCard } from "./ReupLogCard.js";
import { ReupPreviewCard } from "./ReupPreviewCard.js";
import { ReupResultsPanel } from "./ReupResultsPanel.js";
import { ReupScenesCard } from "./ReupScenesCard.js";
import { ReupScriptReview } from "./ReupScriptReview.js";
import { ReupSeoCard } from "./ReupSeoCard.js";
import { ReupSourceCard } from "./ReupSourceCard.js";
type Tab = "create" | "voices" | "results";
const STAGES: { steps: ReupStepId[]; label: keyof ReupStudio["text"] }[] = [
  { steps: ["source"], label: "STEP_SOURCE" },
  { steps: ["scenes"], label: "STEP_SCENES" },
  { steps: ["script"], label: "STEP_SCRIPT" },
  { steps: ["package"], label: "STEP_PACKAGE" },
  { steps: ["voice", "build"], label: "STEP_EXPORT" },
];
const AiBlock: FC<{ studio: ReupStudio; field: "visionAi" | "scriptAi"; title: string; note: string; lang: Lang }> = ({ studio, field, title, note, lang }) => {
  const ai = studio.settings[field];
  const set = (value: Partial<ReupAiChoice>) => studio.patch({ [field]: { ...ai, ...value } });
  return (
    <ChatPlanningSettingsBlock
      title={title}
      note={note}
      provider={ai.provider as AiPlanningFallbackProvider}
      model={ai.model as AiPlanningChatModel}
      executionMode={ai.mode as AiPlanningExecutionMode}
      chromeHeadless={ai.chromeHeadless}
      onProviderChange={(provider) => set({ provider })}
      onModelChange={(model) => set({ model })}
      onExecutionModeChange={(mode) => set({ mode })}
      onSourceChange={(provider, mode) => set({ provider, mode })}
      onChromeHeadlessChange={(chromeHeadless) => set({ chromeHeadless })}
      currentLang={lang}
      allowHybrid
      multiRoom={ai.multiRoom}
      onMultiRoomChange={(multiRoom) => set({ multiRoom })}
      allowFallback={ai.allowFallback}
      onAllowFallbackChange={(allowFallback) => set({ allowFallback })}
    />
  );
};
const Stepper: FC<{ studio: ReupStudio }> = ({ studio }) => {
  const steps = studio.job?.steps;
  const states = STAGES.map(({ steps: ids }) => (steps ? ids.map((id) => steps[id].status) : []));
  const current = steps ? states.findIndex((s) => s.some((x) => x === "running" || x === "waiting" || x === "error")) : 0;
  const done = (i: number) => states[i].length > 0 && states[i].every((x) => x === "done");
  return (
    <div className={S.STEPPER}>
      {STAGES.map((stage, i) => {
        const isCurrent = i === current;
        return (
          <div key={stage.label} className={cn(S.STEPPER_ITEM, isCurrent ? S.STEPPER_ACTIVE : done(i) ? S.STEPPER_DONE : S.STEPPER_IDLE)}>
            <span className={cn(S.STEPPER_NUM, isCurrent ? S.STEPPER_NUM_ACTIVE : done(i) ? S.STEPPER_NUM_DONE : S.STEPPER_NUM_IDLE)}>{done(i) && !isCurrent ? "✓" : i + 1}</span>
            <span className={S.STEPPER_TITLE}>{String(studio.text[stage.label])}</span>
          </div>
        );
      })}
    </div>
  );
};
const ReupVideoCreator: FC<{ currentLang?: Lang }> = ({ currentLang = "vi" as Lang }) => {
  const ui = currentLang === "en" ? "en" : "vi";
  const studio = useReupStudio(currentLang);
  const motionText = MOTION_VIDEO_TEXTS[ui];
  const { text } = studio;
  const [tab, setTab] = useState<Tab>("create");
  const [aiOpen, setAiOpen] = useState(false);
  const tabs = [
    { id: "create" as const, label: motionText.TAB_CREATE, icon: Wand2 },
    { id: "voices" as const, label: MOTION_VOICE_CHANNEL_TEXT[ui].TAB, icon: Mic2 },
    { id: "results" as const, label: `${motionText.TAB_RESULTS} (${studio.results.length})`, icon: FolderKanban },
  ];
  return (
    <StudioPage aria-busy={studio.running}>
      <StudioCanvas>
        <StudioHeader
          icon={Repeat}
          title={text.TITLE}
          badge={text.BADGE}
          description={text.SUBTITLE}
          actions={
            <div className={S.HEADER_ACTIONS}>
              <div className={S.TABS}>
                {tabs.map(({ id, label, icon: Icon }) => (
                  <Button key={id} variant="unstyled" onClick={() => setTab(id)} className={cn(S.TAB, tab === id ? S.TAB_ON : S.TAB_OFF)}>
                    <Icon className={S.ICON} />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
              <Tooltip content={motionText.AI_CONFIG} align="end">
                <StudioDisclosureButton type="button" expanded={aiOpen} label={motionText.AI_CONFIG} disabled={studio.running} onClick={() => setAiOpen((v) => !v)} />
              </Tooltip>
            </div>
          }
        />
        {aiOpen && (
          <StudioFieldset disabled={studio.running} className={S.AI_PANEL}>
            <AiBlock studio={studio} field="visionAi" title={text.AI_VISION_TITLE} note={text.AI_VISION_NOTE} lang={currentLang} />
            <AiBlock studio={studio} field="scriptAi" title={text.AI_SCRIPT_TITLE} note={text.AI_SCRIPT_NOTE} lang={currentLang} />
          </StudioFieldset>
        )}
        {tab === "create" && (
          <div className={S.PAGE}>
            <Stepper studio={studio} />
            <div className={S.GRID}>
              <div className={S.LEFT}>
                <ReupSourceCard studio={studio} ui={ui} motionText={motionText} />
                <ReupScenesCard studio={studio} ui={ui} />
                <ReupScriptReview studio={studio} />
                <ReupSeoCard studio={studio} lang={ui} />
              </div>
              <div className={S.RIGHT}>
                <ReupPreviewCard studio={studio} motionText={motionText} />
                <ReupExportCard studio={studio} motionText={motionText} />
                <ReupLogCard studio={studio} motionText={motionText} />
              </div>
            </div>
          </div>
        )}
        {tab === "voices" && <MotionVoicePanel studio={studio} currentLang={currentLang} />}
        {tab === "results" && <ReupResultsPanel studio={studio} ui={ui} onOpen={() => setTab("create")} />}
      </StudioCanvas>
    </StudioPage>
  );
};
export default ReupVideoCreator;
