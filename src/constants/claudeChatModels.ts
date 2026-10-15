import { AiPlanningChatModel } from "../types";
export const CLAUDE_MODEL_ENCODING = { SEPARATOR: "::", PAID_MODEL_PATTERN: /Fable|Opus/ } as const;
export const CLAUDE_EFFORT_OPTIONS = [
  { value: "low", label: "Thấp", labelEn: "Low", pattern: /^(?:Thấp|Low)(?:\s|$)/i },
  { value: "medium", label: "Trung bình", labelEn: "Medium", pattern: /^(?:Trung bình|Medium)(?:\s|$)/i },
  { value: "high", label: "Cao", labelEn: "High", pattern: /^(?:Cao|High)(?:\s*(?:Được đề xuất|Recommended|[\uE000-\uF8FF])|$)/i },
  { value: "xhigh", label: "Cao hơn", labelEn: "Higher", pattern: /^(?:Cao hơn|Higher|Extra high)(?:\s|$)/i },
  { value: "max", label: "Tối đa", labelEn: "Max", pattern: /^(?:Tối đa|Max(?:imum)?)(?:\s|$)/i },
] as const;
export type ClaudeEffort = (typeof CLAUDE_EFFORT_OPTIONS)[number]["value"];
const standardEfforts: readonly ClaudeEffort[] = ["low", "medium", "high", "xhigh", "max"];
const legacyEfforts: readonly ClaudeEffort[] = ["low", "medium", "high", "max"];
export const CLAUDE_CHAT_MODELS = [
  { value: AiPlanningChatModel.ClaudeFable51, label: "Fable 5.1", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeOpus55, label: "Opus 5.5", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeSonnet55, label: "Sonnet 5.5", efforts: standardEfforts },
  { value: AiPlanningChatModel.ClaudeHaiku55, label: "Haiku 5.5", efforts: standardEfforts },
  { value: AiPlanningChatModel.ClaudeFable5, label: "Fable 5", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeOpus5, label: "Opus 5", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeOpus48, label: "Opus 4.8", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeOpus47, label: "Opus 4.7", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeOpus46, label: "Opus 4.6", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeOpus3, label: "Opus 3", efforts: [] as readonly ClaudeEffort[] },
  { value: AiPlanningChatModel.ClaudeSonnet5, label: "Sonnet 5", efforts: standardEfforts },
  { value: AiPlanningChatModel.ClaudeSonnet46, label: "Sonnet 4.6", efforts: legacyEfforts },
  { value: AiPlanningChatModel.ClaudeHaiku45, label: "Haiku 4.5", efforts: [] as readonly ClaudeEffort[] },
] as const;
export const encodeClaudeChatModel = (model: AiPlanningChatModel, effort?: ClaudeEffort): AiPlanningChatModel => {
  const spec = CLAUDE_CHAT_MODELS.find((entry) => entry.value === model);
  return spec && effort && spec.efforts.includes(effort) ? (`${model}${CLAUDE_MODEL_ENCODING.SEPARATOR}${effort}` as AiPlanningChatModel) : model;
};
export const parseClaudeChatModel = (value: unknown) => {
  if (value === AiPlanningChatModel.ClaudeAuto) return { model: AiPlanningChatModel.ClaudeAuto, effort: undefined, spec: undefined };
  if (typeof value !== "string") return undefined;
  const [id, effort, ...extra] = value.split(CLAUDE_MODEL_ENCODING.SEPARATOR);
  const spec = CLAUDE_CHAT_MODELS.find((entry) => entry.value === id);
  if (!spec || extra.length || (effort !== undefined && !spec.efforts.includes(effort as ClaudeEffort))) return undefined;
  return { model: spec.value, effort: effort as ClaudeEffort | undefined, spec };
};
export const CLAUDE_CHAT_MODEL_OPTIONS = [{ value: AiPlanningChatModel.ClaudeAuto, label: "Mặc định" }, ...CLAUDE_CHAT_MODELS.flatMap((model) => [{ value: model.value, label: model.label }, ...model.efforts.map((effort) => ({ value: encodeClaudeChatModel(model.value, effort), label: `${model.label} · ${CLAUDE_EFFORT_OPTIONS.find((item) => item.value === effort)!.label}` }))])];
export const CLAUDE_CHAT_BASE_MODEL_OPTIONS = CLAUDE_CHAT_MODEL_OPTIONS.filter((option) => !option.value.includes(CLAUDE_MODEL_ENCODING.SEPARATOR));
