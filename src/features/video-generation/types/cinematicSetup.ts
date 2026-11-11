import type { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, ProjectLanguage } from "../../../types.js";
import type { Lang } from "../../../lib/lang.js";
import type { ChatExecutionPolicyProps } from "../../../hooks/useChatExecutionPolicy.js";
export interface CinematicSetupProps {
  idea: string;
  setIdea: (value: string) => void;
  language: ProjectLanguage;
  setLanguage: (value: ProjectLanguage) => void;
  duration: string;
  setDuration: (value: string) => void;
  planningFallbackProvider: AiPlanningFallbackProvider;
  setPlanningFallbackProvider: (value: AiPlanningFallbackProvider) => void;
  planningChatModel: AiPlanningChatModel;
  setPlanningChatModel: (value: AiPlanningChatModel) => void;
  planningExecutionMode: AiPlanningExecutionMode;
  setPlanningExecutionMode: (value: AiPlanningExecutionMode) => void;
  planningChromeHeadless: boolean;
  setPlanningChromeHeadless: (value: boolean) => void;
  chatPolicyProps?: ChatExecutionPolicyProps;
  currentLang?: Lang;
}
