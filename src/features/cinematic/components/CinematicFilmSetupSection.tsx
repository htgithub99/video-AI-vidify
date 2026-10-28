import type { CinematicSetupProps } from "../../video-generation/types/cinematicSetup.js";
import { RUNTIME_TEXT as RT_CINEMATIC } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard, StudioTextarea, StudioSelect } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_10_MINUTES, SOURCE_TEXT_15_MINUTES, SOURCE_TEXT_1_MINUTE, SOURCE_TEXT_2_MINUTES, SOURCE_TEXT_3_MINUTES, SOURCE_TEXT_5_MINUTES, SOURCE_TEXT_8_MINUTES, SOURCE_TEXT_FLEX_1_BG_TRANSPARENT_TEXT_SLATE, SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_2, SOURCE_TEXT_VI } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import { ChevronDown, Clapperboard, Clock, Globe } from "lucide-react";
import { AiPlanningExecutionMode, ProjectLanguage } from "../../../types";
import { CINEMATIC_SETUP_TEXTS, UI_COMMON_TEXTS } from "../../../constants/texts";
import ChatPlanningSettingsBlock from "../../../components/common/ChatPlanningSettingsBlock";
import _ from "lodash";
const SELECT_BASE_CLASSNAME = SOURCE_TEXT_FLEX_1_BG_TRANSPARENT_TEXT_SLATE;
const FIELD_BASE_CLASSNAME = SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_2;
export default function CinematicFilmSetupSection({ idea, setIdea, language, setLanguage, duration, setDuration, planningFallbackProvider, setPlanningFallbackProvider, planningChatModel, setPlanningChatModel, planningExecutionMode, setPlanningExecutionMode, planningChromeHeadless, setPlanningChromeHeadless, currentLang = SOURCE_TEXT_VI }: CinematicSetupProps) {
  const texts = _.get(CINEMATIC_SETUP_TEXTS, currentLang, CINEMATIC_SETUP_TEXTS.vi);
  const common = _.get(UI_COMMON_TEXTS, currentLang, UI_COMMON_TEXTS.vi);
  return (
    <StudioCard className={cn(RT_CINEMATIC.GLASS_CARD_ROUNDED_3XL_P_5_SM_P_6_SPACE)}>
      <div className={cn(RT_CINEMATIC.FLEX_ITEMS_CENTER_GAP_3_MIN_W_0_RELATIVE_Z)}>
        <div className={cn(RT_CINEMATIC.W_10_H_10_ROUNDED_2XL_BG_GRADIENT_TO_TR)}>
          <div className={cn(RT_SHARED.W_FULL_H_FULL_BG_SLATE_950_ROUNDED_14PX_FLEX)}>
            <Clapperboard className={cn(RT_CINEMATIC.W_5_H_5_TEXT_AMBER_400)} />
          </div>
        </div>
        <div className={cn(RT_SHARED.MIN_W_0_FLEX_1)}>
          <h2 className={cn(RT_CINEMATIC.TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_100_FLEX_ITEMS_CENTER)} title={texts.TITLE}>
            <span className={cn(RT_SHARED.TRUNCATE)}>{texts.TITLE}</span>
            <span className={cn(RT_CINEMATIC.PX_2_PY_0_5_ROUNDED_FULL_BG_AMBER_500)}>{common.CINEMATIC_ENGINE}</span>
          </h2>
          <p className={cn(RT_CINEMATIC.TEXT_11PX_TEXT_SLATE_400_MT_0_5_TRUNCATE)} title={texts.SUBTITLE}>
            {texts.SUBTITLE}
          </p>
        </div>
      </div>
      <div className={cn(RT_SHARED.RELATIVE_Z_10)}>
        <StudioTextarea rows={4} value={idea} onChange={(event) => setIdea(event.target.value)} placeholder={texts.PLACEHOLDER} className={cn(RT_CINEMATIC.W_FULL_MIN_H_120PX_SM_MIN_H_140PX_BG)} />
      </div>
      <div className={cn(RT_SHARED.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_3)}>
        <div className={cn(RT_SHARED.SPACE_Y_1_5_MIN_W_0)}>
          <span className={cn(RT_CINEMATIC.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE)} title={texts.LANGUAGE_LABEL}>
            {texts.LANGUAGE_LABEL}
          </span>
          <div className={cn(FIELD_BASE_CLASSNAME)} title={texts.LANGUAGE_LABEL}>
            <Globe className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_SKY_400_MR)} />
            <StudioSelect value={language} onChange={(event) => setLanguage(event.target.value as ProjectLanguage)} className={cn(SELECT_BASE_CLASSNAME)}>
              <option value={ProjectLanguage.VI} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.VIETNAMESE_LANG}
              </option>
              <option value={ProjectLanguage.EN} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.ENGLISH_LANG}
              </option>
            </StudioSelect>
            <ChevronDown className={cn(RT_CINEMATIC.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_3_TEXT_SLATE_500_W)} />
          </div>
        </div>
        <div className={cn(RT_SHARED.SPACE_Y_1_5_MIN_W_0)}>
          <span className={cn(RT_CINEMATIC.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE)} title={texts.DURATION_LABEL}>
            {texts.DURATION_LABEL}
          </span>
          <div className={cn(FIELD_BASE_CLASSNAME)} title={texts.DURATION_LABEL}>
            <Clock className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_EMERALD_400_MR)} />
            <StudioSelect value={duration} onChange={(event) => setDuration(event.target.value)} className={cn(SELECT_BASE_CLASSNAME)}>
              <option value={SOURCE_TEXT_1_MINUTE} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.DURATIONS.ONE_MIN}
              </option>
              <option value={SOURCE_TEXT_2_MINUTES} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.DURATIONS.TWO_MIN}
              </option>
              <option value={SOURCE_TEXT_3_MINUTES} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.DURATIONS.THREE_MIN}
              </option>
              <option value={SOURCE_TEXT_5_MINUTES} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.DURATIONS.FIVE_MIN}
              </option>
              <option value={SOURCE_TEXT_8_MINUTES} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.DURATIONS.EIGHT_MIN}
              </option>
              <option value={SOURCE_TEXT_10_MINUTES} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.DURATIONS.TEN_MIN}
              </option>
              <option value={SOURCE_TEXT_15_MINUTES} className={cn(RT_CINEMATIC.BG_SLATE_955_TEXT_SLATE_200)}>
                {texts.DURATIONS.FIFTEEN_MIN}
              </option>
            </StudioSelect>
            <ChevronDown className={cn(RT_CINEMATIC.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_3_TEXT_SLATE_500_W)} />
          </div>
        </div>
      </div>
      <ChatPlanningSettingsBlock
        provider={planningFallbackProvider}
        model={planningChatModel}
        onProviderChange={setPlanningFallbackProvider}
        onModelChange={setPlanningChatModel}
        executionMode={planningExecutionMode}
        onExecutionModeChange={setPlanningExecutionMode}
        chromeHeadless={planningChromeHeadless}
        onChromeHeadlessChange={setPlanningChromeHeadless}
        currentLang={currentLang}
        allowHybrid={false}
        title={texts.AI_DIRECTOR_TITLE}
        note={_.isEqual(planningExecutionMode, AiPlanningExecutionMode.ApiOnly) ? texts.PLANNING_API_NOTE : texts.PLANNING_ROOM_NOTE}
      />
    </StudioCard>
  );
}
