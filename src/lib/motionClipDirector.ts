import { MOTION_CLIP as M } from "../constants/motionClip.js";
import { MOTION_CLIP_DIRECTOR as D } from "../constants/motionClipDirector.js";
import { compositionElements } from "./motionSceneComposition.js";
import { validateMotionClips } from "./motionClipCompiler.js";
import { motionResponseErrors } from "./motionResponseContract.js";
import type { MotionClip, MotionClipScript, MotionRig, MotionRigPart, MotionSceneMotion } from "../types/motionClip.js";
import type { MotionMeasuredRect, MotionRemotionProfile, MotionSceneComposition, MotionVectorAsset } from "../types/motionVisual.js";
/** Group ids worth measuring for motion: every named group except drawing scaffolding. */
export const motionClipPartIds = (svg: string): string[] =>
  [...compositionElements(svg).entries()]
    .filter(([id, element]) => element.tag === "g" && !D.SKIP_PART.test(id))
    .map(([id]) => id)
    .slice(0, D.MAX_PARTS);
/** Builds the rig from measured boxes (fractions + local user-space box) so pivots match each group's own space. */
export const motionClipRig = (asset: MotionVectorAsset, boxes: Record<string, MotionMeasuredRect | null>): MotionRig => {
  const elements = compositionElements(asset.svg);
  const ids = new Set(Object.keys(boxes).filter((id) => boxes[id]?.local && elements.get(id)?.tag === "g"));
  const parts: MotionRigPart[] = [];
  for (const id of ids) {
    const rect = boxes[id]!;
    const measured = rect.local!;
    if (!(measured.width > 0 || measured.height > 0)) continue;
    // Stroke-only groups (straight limbs, ropes, spears) measure zero thickness; widen them symmetrically so joints stay on the line.
    const widen = (box: { x: number; y: number; width: number; height: number }) => {
      const width = Math.max(box.width, D.MIN_PART_SIZE),
        height = Math.max(box.height, D.MIN_PART_SIZE);
      return { x: box.x - (width - box.width) / 2, y: box.y - (height - box.height) / 2, width, height };
    };
    const local = widen(measured);
    const parent = [...(elements.get(id)?.ancestors || [])].reverse().find((ancestor) => ids.has(ancestor));
    parts.push({
      id,
      ...(parent ? { parent } : {}),
      box: { x: local.x, y: local.y, width: local.width, height: local.height },
      canvas: widen({ x: rect.x * asset.width, y: rect.y * asset.height, width: rect.width * asset.width, height: rect.height * asset.height }),
      ...(rect.flip ? { flip: true } : {}),
    });
  }
  return { width: asset.width, height: asset.height, parts };
};
const share = (value: number) => Number(value.toFixed(3));
/** Suggested pivot side from the drawing's semantic part name (the AI may override it per clip). */
export const motionClipPartHint = (id: string): string | undefined => D.PART_HINTS.find(([pattern]) => pattern.test(id))?.[1];
/** Text-only context for the motion director: parts as canvas fractions, layer roles, narration and continuity notes. */
export const motionClipContext = (input: {
  composition: MotionSceneComposition;
  rig: MotionRig;
  narration: string;
  purpose?: string;
  seconds: number;
  profile: MotionRemotionProfile;
  genre?: string;
  nodes?: { id: string; kind: string; description?: string; pose?: string; gait?: string; animal?: string; facing?: string }[];
  bible?: Record<string, string>;
}) => ({
  narration: input.narration,
  purpose: input.purpose,
  seconds: Number(input.seconds.toFixed(2)),
  temperament: D.TEMPERAMENT[input.profile] || "lively",
  genre: input.genre,
  canvas: { width: input.rig.width, height: input.rig.height },
  layers: input.composition.layers.map((layer) => ({ id: layer.id, kind: layer.kind, ...(layer.entityId ? { entityId: layer.entityId } : {}), ...(layer.effectKind ? { effectKind: layer.effectKind } : {}), ...(layer.description ? { description: layer.description.slice(0, 120) } : {}) })),
  nodes: input.nodes?.map((node) => Object.fromEntries(Object.entries({ id: node.id, kind: node.kind, description: node.description?.slice(0, 120), pose: node.pose, gait: node.gait, animal: node.animal, facing: node.facing }).filter(([, value]) => value !== undefined))),
  parts: input.rig.parts.map((part) => {
    const box = part.canvas || part.box;
    const hint = motionClipPartHint(part.id);
    return { id: part.id, ...(part.parent ? { parent: part.parent } : {}), box: [share(box.x / input.rig.width), share(box.y / input.rig.height), share(box.width / input.rig.width), share(box.height / input.rig.height)], ...(hint ? { joint: hint } : {}), ...(box.width >= M.SCROLL_MIN_WIDTH * input.rig.width ? { scrollable: true } : {}) };
  }),
  partBox: "[x, y, width, height] as canvas fractions",
  bible: input.bible && Object.keys(input.bible).length ? input.bible : undefined,
});
/**
 * Checks an AI motion response against the schema and the measured rig; never guesses missing parts.
 * With `salvage`, invalid clips (and clips that depend on them) are dropped when valid clips remain, and listed in `dropped`.
 */
export const assessMotionClips = (raw: unknown, rig: MotionRig, svg: string, scene: string, key: string, salvage = false): { value: MotionSceneMotion | unknown; errors: string[]; bible?: Record<string, string>; dropped?: string[] } => {
  const schemaErrors = motionResponseErrors(raw, D.SCHEMA);
  if (schemaErrors.length) return { value: raw, errors: schemaErrors };
  const response = raw as { temperament?: MotionClipScript["temperament"]; clips: MotionClip[]; bible?: { subject: string; note: string }[] };
  const motion: MotionSceneMotion = { revision: D.REVISION, key, scene, intent: "", ...(response.temperament ? { temperament: response.temperament } : {}), rig, clips: response.clips };
  const errors = validateMotionClips(motion, svg);
  const bible = Object.fromEntries((response.bible || []).slice(0, D.BIBLE_ENTRIES).map((entry) => [entry.subject.slice(0, 80), entry.note.slice(0, D.BIBLE_CHARS)]));
  if (!errors.length) return { value: motion, errors, bible };
  if (salvage) {
    // Drop exactly the clips named in the issues; repeat because removing a travel clip can invalidate clips coupled to it.
    let clips = response.clips;
    for (let pass = 0; pass < D.SALVAGE_PASSES; pass++) {
      const issues = validateMotionClips({ ...motion, clips }, svg);
      if (!issues.length) break;
      const bad = new Set(issues.map((issue) => Number(issue.match(D.CLIP_INDEX)?.[1])).filter(Number.isInteger));
      if (!bad.size) break;
      clips = clips.filter((_, index) => !bad.has(index));
    }
    if (clips.length && !validateMotionClips({ ...motion, clips }, svg).length && clips.length >= Math.ceil(response.clips.length * D.SALVAGE_MIN_SHARE)) return { value: { ...motion, clips }, errors: [], bible, dropped: errors };
  }
  return { value: raw, errors, bible };
};
