import { useState, type FC } from "react";
import { Copy, Eye, EyeOff, FolderKanban, Mic2, Wand2 } from "lucide-react";
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
import { ReupToggle } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import type { ReupAiChoice } from "../../reup/types/reup.js";
import { BORNAS_STEPS } from "../constants/bornasConfig.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import { useBornasStudio, type BornasStudio } from "../hooks/useBornasStudio.js";
import { BornasChannelCard } from "./BornasChannelCard.js";
import { BornasLogCard } from "./BornasLogCard.js";
import { BornasResultsPanel } from "./BornasResultsPanel.js";
import { BornasScriptsCard } from "./BornasScriptsCard.js";
import { BornasSourceCard } from "./BornasSourceCard.js";
import { BornasVideosCard } from "./BornasVideosCard.js";
type Tab = "create" | "voices" | "results";
type AiField = "mainAi" | "visionAi" | "lightAi";
const AiBlock: FC<{ studio: BornasStudio; field: AiField; title: string; note: string; lang: Lang }> = ({ studio, field, title, note, lang }) => {
  const ai = studio.ai[field];
  const set = (value: Partial<ReupAiChoice>) => studio.setAi({ ...studio.ai, [field]: { ...ai, ...value } });
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
const Stepper: FC<{ studio: BornasStudio }> = ({ studio }) => {
  const steps = studio.job?.steps;
  const current = steps ? BORNAS_STEPS.findIndex((id) => ["running", "waiting", "error"].includes(steps[id].status)) : 0;
  return (
    <div className={S.STEPPER}>
      {BORNAS_STEPS.map((id, i) => {
        const done = steps?.[id].status === "done";
        const isCurrent = i === current;
        return (
          <div key={id} className={cn(S.STEPPER_ITEM, isCurrent ? S.STEPPER_ACTIVE : done ? S.STEPPER_DONE : S.STEPPER_IDLE)}>
            <span className={cn(S.STEPPER_NUM, isCurrent ? S.STEPPER_NUM_ACTIVE : done ? S.STEPPER_NUM_DONE : S.STEPPER_NUM_IDLE)}>{done && !isCurrent ? "✓" : i + 1}</span>
            <span className={S.STEPPER_TITLE}>{studio.text.STEPS[id]}</span>
          </div>
        );
      })}
    </div>
  );
};
const BornasVideoCreator: FC<{ currentLang?: Lang }> = ({ currentLang = "vi" as Lang }) => {
  const ui = currentLang === "en" ? "en" : "vi";
  const studio = useBornasStudio(currentLang);
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
          icon={Copy}
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
            <AiBlock studio={studio} field="mainAi" title={text.AI_MAIN} note={text.AI_MAIN_NOTE} lang={currentLang} />
            <AiBlock studio={studio} field="visionAi" title={text.AI_VISION} note={text.AI_VISION_NOTE} lang={currentLang} />
            <AiBlock studio={studio} field="lightAi" title={text.AI_LIGHT} note={text.AI_LIGHT_NOTE} lang={currentLang} />
            <div className={B.AI_DRAW}>
              <p className={B.AI_DRAW_TITLE}>{text.AI_DRAW}</p>
              <p className={S.HINT}>{text.AI_DRAW_NOTE}</p>
              <ReupToggle label={text.AI_DRAW} icon={studio.ai.drawHeadless ? EyeOff : Eye} checked={studio.ai.drawHeadless} on={text.AI_DRAW_HIDE} off={text.AI_DRAW_SHOW} onChange={(drawHeadless) => studio.setAi({ ...studio.ai, drawHeadless })} />
            </div>
          </StudioFieldset>
        )}
        {tab === "create" && (
          <div className={S.PAGE}>
            <Stepper studio={studio} />
            <div className={S.GRID}>
              <div className={S.LEFT}>
                <BornasChannelCard studio={studio} ui={ui} />
                <BornasSourceCard studio={studio} />
                <BornasScriptsCard studio={studio} />
              </div>
              <div className={B.RIGHT}>
                <BornasVideosCard studio={studio} />
                <BornasLogCard studio={studio} title={motionText.STEP_LOG} />
              </div>
            </div>
          </div>
        )}
        {tab === "voices" && <MotionVoicePanel studio={studio} currentLang={currentLang} />}
        {tab === "results" && <BornasResultsPanel studio={studio} onOpen={() => setTab("create")} />}
      </StudioCanvas>
    </StudioPage>
  );
};
export default BornasVideoCreator;
