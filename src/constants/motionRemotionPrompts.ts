import { stringifyJson } from "../lib/jsonStringify.js";
import { MOTION_VISUAL as V } from "./motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "./motionRemotionLayout.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
import { MOTION_COMPOSITION_SCHEMA, MOTION_SCENE_COMPOSITION } from "./motionSceneComposition.js";
import { MOTION_QA as Q } from "./motionQa.js";
const text: MotionResponseSchema = { type: "string", minLength: 1 };
export const MOTION_REMOTION_SCHEMAS: Record<string, MotionResponseSchema> = {
  [MOTION_SCENE_COMPOSITION.ARTIFACT]: MOTION_COMPOSITION_SCHEMA,
  [V.ARTIFACT_ASSET]: { type: "object", properties: { svg: text, anchors: { type: "object" }, regions: { type: "object" }, bounds: { type: "object" } }, required: ["svg", "anchors"] },
  [V.ARTIFACT_SCENE]: {
    type: "object",
    properties: {
      scenes: {
        type: "array",
        minItems: 1,
        maxItems: V.MAX_SCENES_PER_BEAT,
        items: {
          type: "object",
          properties: {
            fromLineId: text,
            toLineId: text,
            purpose: text,
            environment: text,
            time: text,
            weather: text,
            removedObjects: { type: "array", items: text, maxItems: V.MAX_NODES },
            view: { type: "string", enum: ["wide", "detail"] },
            focus: { type: "array", maxItems: V.MAX_NODES, items: text },
            effects: { type: "array", maxItems: 12, items: { type: "object", properties: { id: text, kind: { type: "string", enum: [...L.EFFECTS] }, source: text, anchor: text, region: text, essential: { type: "boolean" }, direction: { type: "string", enum: ["up", "ground", "left", "right"] }, intensity: { type: "number" } }, required: ["id", "kind"] } },
            nodes: {
              type: "array",
              maxItems: V.MAX_NODES,
              items: {
                type: "object",
                properties: {
                  id: text,
                  kind: { type: "string", enum: ["character", "prop", "label"] },
                  entityId: text,
                  anonymous: { type: "boolean" },
                  description: text,
                  pose: text,
                  representation: { type: "string", enum: ["full", "bust", "detail"] },
                  slot: { type: "string", enum: ["left", "center", "right"] },
                  relation: { type: "string", enum: ["beside", "behind", "on", "inside", "heldBy"] },
                  target: text,
                  attachmentAnchor: { type: "string", enum: [...L.ANCHORS] },
                  evidence: text,
                  essential: { type: "boolean" },
                  appearanceChanged: { type: "boolean" },
                  poseEssential: { type: "boolean" },
                  role: { type: "string", enum: ["fixture", "support", "object", "decal"] },
                  mount: text,
                  contact: { type: "string", enum: ["base", "seat", "body"] },
                  objectId: text,
                  state: text,
                  stateEvidence: text,
                  persistent: { type: "boolean" },
                },
                required: ["id", "kind", "description", "slot"],
              },
            },
          },
          required: ["fromLineId", "toLineId", "purpose", "environment", "nodes"],
        },
      },
    },
    required: ["scenes"],
  },
  [V.ARTIFACT_REVIEW]: { type: "object", properties: { ok: { type: "boolean" }, issues: { type: "array", items: text, maxItems: 8 } }, required: ["ok", "issues"] },
};
export const MOTION_REMOTION_PROMPTS = {
  SOFT_NODE_FIELDS: ["posture", "support"] as readonly string[],
  SOFT_NODE_CHARS: 60,
  HOLDER: {
    IMPLIED: /\b(?:to|in|by|on|at)\s+(?:a|an|the)\s+([a-z]+)'s\s+(?:lips|mouth|hands?|shoulders?|arms?)\b|\bheld\s+(?:up\s+)?by\s+(?:a|an|the)\s+([a-z]+)\b/i,
    ID: (prop: string) => `${prop}_holder`,
    DESCRIPTION: (who: string, prop: string) => `${who}, anonymous background extra holding the ${prop}`,
    POSE: "holding it",
    RELATION: "heldBy",
    KIND: "character",
  },
  CAST_KEY: { FORM: "NFD", MARKS: /[\u0300-\u036f]/g, D_STROKE: /đ/gi, D_PLAIN: "d", OTHER: /[^a-z0-9]/g },
  PLAN_RECOVERY_REVISION: 2,
  LOG_PENDING_PLANS: (remaining: number) => (remaining > 0 ? ` Còn ${remaining} nhóm đang phân cảnh; tổng số cảnh sẽ cập nhật khi phân cảnh xong.` : ""),
  ANONYMOUS_CHARACTER: /\b(?:crowd|extras?|bystanders?|villagers?|soldiers?|troops?|infantry|archers?|cavalry|legionaries|spearmen|slingers|artillery crews?|passengers?|customers?|visitors?|guards?|workers?)\b|đám đông|quần chúng|dân làng|quân lính|binh lính|bộ binh|kỵ binh|cung thủ|hành khách|khách hàng|người qua đường/iu,
  SCENE: (context: unknown) =>
    "Named recurring people use their exact supplied cast entityId. Unnamed people, background extras or groups use kind=character, anonymous=true, and omit entityId; describe the group's count, role, clothing and side accurately. Never map a crowd to a named person. Keep at most 16 meaningful nodes per scene; a formation or crowd can be one coherent group, with ordinary decoration drawn inside the complete scene. " +
    `Plan representative narrated 2D illustration shots across these consecutive beats and exact source lines. Follow context.pacing as soft editorial guidance. Stage people simply; AI draws each complete scene and optional ambient animation, code handles playback timing and camera movement. Cover every line once in order with supplied fromLineId/toLineId. A scene may span several beats, sentences and speakers while its visible situation stays valid. Split for an actual place/time change, meaningful new visual task, essential clue/reveal or contradictory physical state. Do not cut for incidental gestures, a sentence ending, speaker change or a new beat. Establish a location with view=wide; view=detail and focus=[visible node IDs] are optional when needed to make an essential clue readable, never a mandatory extra shot. Keep architecture and object positions consistent. Each scene has purpose, environment (architecture/terrain or abstract diagram backdrop; NO people or movable story props), and nodes. Each node: id, kind character|prop|label, entityId from supplied cast, description, pose, slot left|center|right, evidence copied from source. Optional representation=full|bust|detail describes the visible crop of a character; a hand-only detail is not a full standing person. Default to arms at rest; do not invent a raised hand for speech. Optional relation beside|behind|on|inside|heldBy and target node ID. Preserve essential relationships and simplify optional actions. Labels are short and optional according to artDirection. Diagrams need no physical location, floor or characters. Narration does not make the narrator visible. Show only people/props present at this point, never future reveals. Preserve identities, count, appearance/color, owner and spatial relations. Pose is short English; change it only when important. Separate moving/focal objects into prop nodes. No library IDs, coordinates, JavaScript, animation code or URLs. Output JSON only. ${MOTION_SCENE_COMPOSITION.PLAN_CONTINUITY} Context:\n${stringifyJson(context)}`,
  REPAIR: (context: unknown, draft: unknown, errors: string[]) => {
    const data = context as { lines?: { id: string; text: string }[]; beats?: { id: string }[]; [key: string]: unknown };
    const rows = (draft as { scenes?: { fromLineId: string; toLineId: string }[] })?.scenes || [];
    const rangeIssue = errors.some((error) => error === MOTION_REMOTION_PROMPTS.INVALID_RANGE);
    const pending = rangeIssue ? rows : rows.filter((row) => errors.some((error) => error.includes(`scenes[${row.fromLineId}]`)));
    const selected = pending.length ? pending : rows;
    const lines = rangeIssue || !selected.length ? data?.lines : data?.lines?.filter((_, index, all) => selected.some((row) => index >= all.findIndex((line) => line.id === row.fromLineId) && index <= all.findIndex((line) => line.id === row.toLineId)));
    const beats = data?.beats?.filter((beat) => typeof beat?.id === "string" && lines?.some((line) => line.id.startsWith(`${beat.id}::`)));
    return `Repair only rejected scene-plan rows. Return complete corrected rows with stable fromLineId/toLineId. A supplied nodes array REPLACES the prior array; remove obsolete nodes, keep needed subjects, and use at most 16 nodes. Omitted scene rows stay unchanged. Unnamed extras/groups use anonymous=true without entityId; named people use the supplied cast. Preserve story facts and essential relationships. Return scenes JSON only. Context:\n${stringifyJson({ ...data, beats, lines })}\nDraft: ${stringifyJson({ scenes: selected })}\nErrors: ${stringifyJson(errors)}`;
  },
  REVIEW: (context: unknown) =>
    `Check this rendered illustration against the exact narration and scene data. Use the selected artDirection rules for this profile. Only block wrong identity/count, essential spatial relation/owner or causal direction, explicit color/appearance, missing key clue/step, contradictory factual labels, unreadable/empty/cropped main subject or severely disconnected main anatomy. A diagram needs no floor or physical room. Ignore optional pose/action differences, minor style variations and small decorative details. Keep issues specific to visible failures and name the relevant node/group; never demand an unrelated reference object or scene. ${Q.REVIEW_PROMPT} Return {"ok":true,"issues":[],"checks":[]} or {"ok":false,"issues":["specific entity and problem"],"checks":[{"ok":false,"category":"one supplied category","evidence":"visible evidence","problem":"specific entity and problem"}]}. Each blocking issue needs a categorized check and visible evidence; uncertain or unclassified feedback is advisory. Context:\n${stringifyJson(context)}`,
  ERROR: (id: string, errors: string[]) => `Remotion ${id}: ${errors.join("; ")}`,
  INVALID_RANGE: "Scene source ranges must cover the exact input line IDs once in order.",
  INVALID_NODE: "Invalid or duplicate node ID, unknown character, unsupported relation, missing target or source evidence.",
  NODE_ISSUE: (scene: string, node: string, field: string) => `scenes[${scene}].nodes[${node}].${field}`,
  DUPLICATE_NODE: "id: duplicate node ID",
  UNKNOWN_CHARACTER: "entityId: select an ID from the supplied cast",
  INVALID_TARGET: "target: select a different node ID in this scene",
  RELATION_TARGET: "relation/target: supply both or omit both",
  CYCLIC_TARGET: "target: cyclic placement dependency",
  LAYOUT: "Essential placement does not fit the frame or is cyclic; simplify optional content and preserve the required relationship.",
  REVIEW_REQUIRED: "Review ảnh chưa xác nhận hình phù hợp; giữ tiến độ để sửa đúng cảnh.",
} as const;
