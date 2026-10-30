import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import { createHash } from "node:crypto";
import { MOTION_PACK_SELECTION as K } from "../../../../../constants/motionPackSelection.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../../../../../constants/motionPuppet.js";
import type { PuppetFrame, PuppetGen, PuppetSceneSelection, PuppetSet } from "../../../../../types/motionPuppet.js";
import { readPuppet, puppetSetForLight } from "./kitLibrary.js";
import { puppetSpots } from "./layout.js";
import { puppetSpatialAssignmentsValid } from "./spatialPlacement.js";
import { puppetPropAssignmentsValid } from "./propPlacement.js";
import { canonicalMotionValue } from "../../../../../lib/motionValue.js";
export const puppetSelectionHash = (value: unknown): string =>
  createHash(P.SHA)
    .update(stringifyJson(canonicalMotionValue(value)))
    .digest(P.HEX);
export const puppetSelectionFrameKey = (frame: PuppetFrame): string => puppetSelectionHash({ ...frame, speaker: undefined, why: undefined });
export const puppetSelectionBindings = (gen: PuppetGen, frame: PuppetFrame, resolvedSet?: PuppetSet): PuppetSceneSelection["bindings"] => {
  const set = resolvedSet || (frame.set && readPuppet<PuppetSet>(T.SET, gen.sets[frame.set]));
  if (!set || set.styleId !== gen.styleId) throw new Error(K.NO_CHOICES(frame.set || P.EMPTY));
  const keys = [...new Set([frame.prop, ...(frame.items || []).map((item) => item.prop), ...frame.actors.flatMap((actor) => [actor.hold, ...(actor.wear || [])])].filter((key): key is string => !!key))];
  return { styleId: gen.styleId, setId: puppetSetForLight(set, frame.light).id, characters: Object.fromEntries(frame.actors.map((actor) => [actor.char, gen.characters[actor.char]])), props: Object.fromEntries(keys.map((key) => [key, gen.props[key]])) };
};
export const assertPuppetSceneSelection = (gen: PuppetGen, key: string): void => {
  if (gen.selectionVersion === undefined) return;
  const selected = gen.sceneSelections?.[key];
  const frame = gen.frames[key];
  if (
    gen.selectionVersion !== K.VERSION ||
    !selected ||
    selected.version !== K.VERSION ||
    !frame ||
    !gen.reads?.[key] ||
    ![K.AI, K.DETERMINISTIC].includes(selected.source) ||
    !frame.layoutLocked ||
    selected.choiceId !== frame.choiceId ||
    !selected.candidateIds.includes(selected.choiceId) ||
    selected.frameKey !== puppetSelectionFrameKey(frame) ||
    selected.inputKey !== puppetSelectionHash(gen.reads[key]) ||
    puppetSelectionHash(selected.bindings) !== puppetSelectionHash(puppetSelectionBindings(gen, frame))
  )
    throw new Error(K.BAD_SELECTION(key));
  const set = readPuppet<PuppetSet>(T.SET, selected.bindings.setId);
  if (!set || !puppetSpatialAssignmentsValid(gen.reads![key], new Map(frame.actors.map((actor) => [actor.char, actor.spot || P.EMPTY])), puppetSpots(set)) || !puppetPropAssignmentsValid(gen.reads![key], frame, puppetSpots(set))) throw new Error(K.BAD_SELECTION(key));
  const references = [
    [T.STYLE, [selected.bindings.styleId]],
    [T.SET, [selected.bindings.setId]],
    [T.CHARACTER, Object.values(selected.bindings.characters)],
    [T.PROP, Object.values(selected.bindings.props)],
  ] as const;
  for (const [type, ids] of references)
    for (const id of ids) {
      const asset = id && readPuppet(type, id);
      if (!asset || (asset.type === T.STYLE ? asset.id !== gen.styleId : !(RT_SERVER.STYLEID in asset) || asset.styleId !== gen.styleId)) throw new Error(K.BAD_SELECTION(key));
    }
};
