import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import * as MR from "../../../constants/motionRuntime.js";
import ChatPlanningSettingsBlock from "../../../components/common/ChatPlanningSettingsBlock.js";
import { MOTION_AI_SETTINGS_TEXT } from "../../../constants/motionSceneLibrary.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
import { AiPlanningExecutionMode } from "../../../types.js";
import type { Lang } from "../../../lib/lang.js";
import { motionLightAiExecution, motionPlanAiExecution, motionSceneAiExecution, resolveMotionSceneExecution, type MotionAiChoice, type MotionLightAiChoice, type MotionPlanAiChoice, type MotionSceneAiChoice } from "../lib/motionSceneAi.js";
import type { MotionVisualSettings } from "../../../types/motionVisual.js";
export function MotionAiSettings({ state, patch, currentLang }: { state: MotionAiChoice & MotionSceneAiChoice & MotionPlanAiChoice & MotionLightAiChoice & { visualSettings?: MotionVisualSettings }; patch: (value: Partial<MotionAiChoice & MotionSceneAiChoice & MotionPlanAiChoice & MotionLightAiChoice>) => void; currentLang: Lang }) {
  const text = MOTION_AI_SETTINGS_TEXT[currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI];
  const scene = motionSceneAiExecution(state);
  const plan = motionPlanAiExecution(state);
  const light = motionLightAiExecution(state);
  const onePass = state.visualSettings?.mode === RT_MAINTENANCE.REMOTION;
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
          multiRoom={state.aiMultiRoom === true}
          onMultiRoomChange={(value) => patch({ aiMultiRoom: value })}
          allowFallback={state.aiFallback !== false}
          onAllowFallbackChange={(value) => patch({ aiFallback: value })}
        />
      </section>
      <section aria-label={text.LIGHT_TITLE}>
        <ChatPlanningSettingsBlock
          title={text.LIGHT_TITLE}
          note={text.LIGHT_NOTE}
          provider={light.provider}
          model={light.model}
          executionMode={AiPlanningExecutionMode.RoomOnly}
          chromeHeadless={light.chromeHeadless}
          onProviderChange={(value) => patch({ lightAiProvider: value, lightAiModel: undefined, lightAiHeadless: light.chromeHeadless })}
          onModelChange={(value) => patch({ lightAiProvider: light.provider, lightAiModel: value })}
          onExecutionModeChange={() => undefined}
          onChromeHeadlessChange={(value) => patch({ lightAiProvider: light.provider, lightAiModel: light.model, lightAiHeadless: value })}
          currentLang={currentLang}
          roomOnly
          multiRoom={light.multiRoom}
          onMultiRoomChange={(value) => patch({ lightAiProvider: light.provider, lightAiModel: light.model, lightAiMultiRoom: value })}
          allowFallback={light.allowFallback}
          onAllowFallbackChange={(value) => patch({ lightAiProvider: light.provider, lightAiModel: light.model, lightAiFallback: value })}
        />
      </section>
      {onePass && (
        <section aria-label={text.PLAN_TITLE}>
          <ChatPlanningSettingsBlock
            title={text.PLAN_TITLE}
            note={text.PLAN_NOTE}
            provider={plan.provider}
            model={plan.model}
            executionMode={AiPlanningExecutionMode.RoomOnly}
            chromeHeadless={plan.chromeHeadless}
            onProviderChange={(value) => patch({ planAiProvider: value, planAiModel: undefined, planAiHeadless: plan.chromeHeadless })}
            onModelChange={(value) => patch({ planAiProvider: plan.provider, planAiModel: value })}
            onExecutionModeChange={() => undefined}
            onChromeHeadlessChange={(value) => patch({ planAiProvider: plan.provider, planAiModel: plan.model, planAiHeadless: value })}
            currentLang={currentLang}
            roomOnly
            multiRoom={plan.multiRoom}
            onMultiRoomChange={(value) => patch({ planAiProvider: plan.provider, planAiModel: plan.model, planAiMultiRoom: value })}
            allowFallback={plan.allowFallback}
            onAllowFallbackChange={(value) => patch({ planAiProvider: plan.provider, planAiModel: plan.model, planAiFallback: value })}
          />
        </section>
      )}
      <section aria-label={text.DRAW_TITLE}>
        <ChatPlanningSettingsBlock
          title={text.DRAW_TITLE}
          note={onePass ? text.REMOTION_DRAW_NOTE : text.DRAW_NOTE}
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
          multiRoom={state.sceneAiMultiRoom === true}
          onMultiRoomChange={(value) => patch({ sceneAiMultiRoom: value })}
          allowFallback={state.sceneAiFallback !== false}
          onAllowFallbackChange={(value) => patch({ sceneAiFallback: value })}
        />
      </section>
    </div>
  );
}
