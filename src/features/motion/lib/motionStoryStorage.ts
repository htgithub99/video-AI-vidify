import { MOTION_STORY_CONFIG as S } from "../../../constants/motionVideo.js";
import { jsonUtils } from "../../../lib/json.js";
import { migrateMotionRenderKey, migrateMotionVisualDraft, motionVisualDraftKey, type MotionVisualDraft } from "./motionVisualDraft.js";
import type { MotionVisualSettings } from "../../../types/motionVisual.js";
type StoredState = Record<string, unknown> & { script?: { gen?: MotionVisualDraft["gen"] } | null; visualSettings?: MotionVisualSettings; visualDrafts?: Record<string, MotionVisualDraft>; renderSignature?: string };
export const loadMotionStoryState = async <T>(): Promise<Partial<T>> => {
  const saved = await jsonUtils.getAsyncItem<StoredState>(S.STORY_STORAGE_KEY, {});
  if (saved[S.STORY_SPLIT_FIELD]) {
    const [script, compiled] = await Promise.all([jsonUtils.getAsyncItem<StoredState["script"]>(S.STORY_SCRIPT_STORAGE_KEY, null), jsonUtils.getAsyncItem<MotionVisualDraft["compiled"]>(S.STORY_COMPILED_STORAGE_KEY, null)]);
    saved.script = script;
    const key = saved.visualSettings && motionVisualDraftKey(saved.visualSettings);
    const draft = key ? saved.visualDrafts?.[key] : undefined;
    if (key && draft) saved.visualDrafts = { ...saved.visualDrafts, [key]: { ...draft, gen: script?.gen, compiled } };
    delete saved[S.STORY_SPLIT_FIELD];
  }
  saved.renderSignature = migrateMotionRenderKey(saved.renderSignature);
  if (saved.visualDrafts) saved.visualDrafts = Object.fromEntries(Object.entries(saved.visualDrafts).map(([key, draft]) => [key, migrateMotionVisualDraft(draft)]));
  return saved as Partial<T>;
};
export const createMotionStoryWriter = () => {
  let written = false;
  let script: unknown;
  let compiled: unknown;
  return (input: object) => {
    const state = input as StoredState;
    const key = state.visualSettings && motionVisualDraftKey(state.visualSettings);
    const draft = key ? state.visualDrafts?.[key] : undefined;
    if (!written || script !== state.script) void jsonUtils.setAsyncImmutableItem(S.STORY_SCRIPT_STORAGE_KEY, state.script ?? null);
    if (!written || compiled !== draft?.compiled) void jsonUtils.setAsyncImmutableItem(S.STORY_COMPILED_STORAGE_KEY, draft?.compiled ?? null);
    written = true;
    script = state.script;
    compiled = draft?.compiled;
    const { script: _script, ...rest } = state;
    const visualDrafts = key && draft ? { ...state.visualDrafts, [key]: { ...draft, gen: undefined, compiled: undefined } } : state.visualDrafts;
    void jsonUtils.setAsyncImmutableItem(S.STORY_STORAGE_KEY, { ...rest, visualDrafts, [S.STORY_SPLIT_FIELD]: true });
  };
};
