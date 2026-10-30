import * as MR from "../../../constants/motionRuntime.js";
import ChatPlanningSettingsBlock from "../../../components/common/ChatPlanningSettingsBlock.js";
import { MOTION_AI_SETTINGS_TEXT } from "../../../constants/motionSceneLibrary.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
import { AiPlanningExecutionMode } from "../../../types.js";
import { Shuffle } from "lucide-react";
import { MotionToggle } from "./MotionToggle.js";
import type { Lang } from "../../../lib/lang.js";
import { motionSceneAiExecution, resolveMotionSceneExecution, type MotionAiChoice, type MotionSceneAiChoice } from "../lib/motionSceneAi.js";
export function MotionAiSettings({ state, patch, currentLang }: { state: MotionAiChoice & MotionSceneAiChoice; patch: (value: Partial<MotionAiChoice & MotionSceneAiChoice>) => void; currentLang: Lang }) {
  const text = MOTION_AI_SETTINGS_TEXT[currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI];
  const scene = motionSceneAiExecution(state);
  const selectSceneProvider = (provider: MotionSceneAiChoice["sceneAiProvider"]) => {
    const next = resolveMotionSceneExecution({ provider });
    patch({ sceneAiProvider: next.provider, sceneAiModel: next.model });
  };
  return (
    <div className={MOTION_STYLES.SPACE_Y_3}>
      <section aria-label={text.MAIN_TITLE}>
        <ChatPlanningSettingsBlock
          title={text.MAIN_TITLE}
          note={text.MAIN_NOTE}
          provider={state.aiProvider}
          model={state.aiModel}
          executionMode={state.aiMode}
          chromeHeadless={state.aiHeadless}
          onProviderChange={(value) => patch({ aiProvider: value })}
          onModelChange={(value) => patch({ aiModel: value })}
          onExecutionModeChange={(value) => patch({ aiMode: value })}
          onChromeHeadlessChange={(value) => patch({ aiHeadless: value })}
          currentLang={currentLang}
          allowHybrid
        />
      </section>
      <section aria-label={text.DRAW_TITLE}>
        <ChatPlanningSettingsBlock
          title={text.DRAW_TITLE}
          note={text.DRAW_NOTE}
          provider={scene.provider}
          model={scene.model}
          executionMode={AiPlanningExecutionMode.RoomOnly}
          chromeHeadless={scene.chromeHeadless}
          onProviderChange={selectSceneProvider}
          onModelChange={(value) => patch({ sceneAiModel: value })}
          onExecutionModeChange={() => undefined}
          onChromeHeadlessChange={(value) => patch({ sceneAiHeadless: value })}
          currentLang={currentLang}
          roomOnly
          extraControl={<MotionToggle checked={state.sceneAiFallback !== false} label={text.FALLBACK_LABEL} title={text.FALLBACK_HINT} text={state.sceneAiFallback !== false ? text.FALLBACK_ON : text.FALLBACK_OFF} icon={Shuffle} className={MOTION_STYLES.SCENE_AI_FALLBACK_CONTROL} onClick={() => patch({ sceneAiFallback: state.sceneAiFallback === false })} />}
        />
      </section>
    </div>
  );
}
