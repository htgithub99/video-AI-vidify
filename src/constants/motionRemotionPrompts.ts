import { stringifyJson } from "../lib/jsonStringify.js";
import { MOTION_VISUAL as V } from "./motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "./motionRemotionLayout.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
import { MOTION_COMPOSITION_SCHEMA, MOTION_SCENE_COMPOSITION } from "./motionSceneComposition.js";
import { MOTION_QA as Q } from "./motionQa.js";
import { MOTION_SCENE_FORMATS, MOTION_SCENE_VIEWS } from "./motionProfiles/framing.js";
import { MOTION_OBJECT_CLASSES, MOTION_OBJECT_SIZES } from "./motionObjectClasses.js";
import { MOTION_ANIMALS, MOTION_DETAIL_SUBJECTS, MOTION_FACINGS, MOTION_GAITS, MOTION_POSTURES } from "./motionProfiles/sceneSpec.js";
const text: MotionResponseSchema = { type: "string", minLength: 1 };
export const MOTION_REMOTION_SCHEMAS: Record<string, MotionResponseSchema> = {
  [MOTION_SCENE_COMPOSITION.ARTIFACT]: MOTION_COMPOSITION_SCHEMA,
  [V.ARTIFACT_ASSET]: { type: "object", properties: { svg: text, anchors: { type: "object" }, regions: { type: "object" }, bounds: { type: "object" } }, required: ["svg", "anchors"] },
  motion_remotion_sheet: { type: "object", properties: { sheets: { type: "array", minItems: 1, items: { type: "object", properties: { key: text, svg: text }, required: ["key", "svg"] } } }, required: ["sheets"] },
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
            view: { type: "string", enum: [...MOTION_SCENE_VIEWS] },
            camera: text,
            lead: text,
            detailSubject: { type: "string", enum: [...MOTION_DETAIL_SUBJECTS] },
            objects: { type: "array", maxItems: 8, items: { type: "object", properties: { id: text, class: { type: "string", enum: [...MOTION_OBJECT_CLASSES] }, term: text, size: { type: "string", enum: [...MOTION_OBJECT_SIZES] }, description: text }, required: ["id", "class"] } },
            format: { type: "string", enum: [...MOTION_SCENE_FORMATS] },
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
                  crowd: { type: "object", properties: { groupKey: text, faction: text, appearance: text, depth: { type: "string", enum: ["foreground", "midground", "background"] }, rows: { type: "number", minimum: 1, maximum: 8 }, facing: text, count: { type: "number", minimum: 1 } }, required: ["depth"] },
                  visibleCount: { type: "number", minimum: 1, maximum: 40 },
                  groupKey: text,
                  uses: { type: "object", properties: { objectId: text, how: text }, required: ["objectId", "how"] },
                  description: text,
                  pose: text,
                  stance: { type: "string", enum: [...MOTION_POSTURES] },
                  facing: { type: "string", enum: [...MOTION_FACINGS] },
                  rides: text,
                  animal: { type: "string", enum: [...MOTION_ANIMALS] },
                  gait: { type: "string", enum: [...MOTION_GAITS] },
                  representation: { type: "string", enum: ["full", "bust", "detail"] },
                  slot: { type: "string", enum: ["left", "center", "right"] },
                  relation: { type: "string", enum: ["beside", "behind", "on", "inside", "heldBy"] },
                  target: text,
                  attachmentAnchor: { type: "string", enum: [...L.ANCHORS] },
                  evidence: text,
                  essential: { type: "boolean" },
                  appearanceChanged: { type: "boolean" },
                  outfitChange: { type: "boolean" },
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
  VISIBLE_MAX: 40,
  SCENE_TEXT_FIELDS: ["camera", "lead"] as readonly string[],
  NODE_ENUMS: { stance: MOTION_POSTURES, facing: MOTION_FACINGS, animal: MOTION_ANIMALS, gait: MOTION_GAITS } as Record<string, readonly string[]>,
  SCENE_ENUMS: { detailSubject: MOTION_DETAIL_SUBJECTS } as Record<string, readonly string[]>,
  OBJECT_SIZES: MOTION_OBJECT_SIZES as readonly string[],
  TERM_CHARS: 40,
  SCENE_TEXT_CHARS: 160,
  HOLDER: { IMPLIED: /\b(?:to|in|by|on|at)\s+(?:a|an|the)\s+([a-z]+)'s\s+(?:lips|mouth|hands?|shoulders?|arms?)\b|\bheld\s+(?:up\s+)?by\s+(?:a|an|the)\s+([a-z]+)\b/i, ID: (prop: string) => `${prop}_holder`, DESCRIPTION: (who: string, prop: string) => `${who}, anonymous background extra holding the ${prop}`, POSE: "holding it", RELATION: "heldBy", KIND: "character" },
  CAST_KEY: { FORM: "NFD", MARKS: /[\u0300-\u036f]/g, D_STROKE: /đ/gi, D_PLAIN: "d", OTHER: /[^a-z0-9]/g },
  PLAN_RECOVERY_REVISION: 2,
  LOG_PENDING_PLANS: (remaining: number) => (remaining > 0 ? ` Còn ${remaining} nhóm đang phân cảnh; tổng số cảnh sẽ cập nhật khi phân cảnh xong.` : ""),
  ANONYMOUS_CHARACTER: /\b(?:crowd|extras?|bystanders?|villagers?|soldiers?|troops?|infantry|archers?|cavalry|legionaries|spearmen|slingers|artillery crews?|passengers?|customers?|visitors?|guards?|workers?)\b|đám đông|quần chúng|dân làng|quân lính|binh lính|bộ binh|kỵ binh|cung thủ|hành khách|khách hàng|người qua đường/iu,
  SCENE: (context: unknown) =>
    "Named recurring people use their exact supplied cast entityId. Unnamed people, background extras or groups use kind=character, anonymous=true, and omit entityId; describe the group's count, role, clothing and side accurately. Never map a crowd to a named person. Keep at most 16 meaningful nodes per scene; a formation or crowd can be one coherent group, with ordinary decoration drawn inside the complete scene. " +
    `Plan the narrated 2D pictures for these consecutive beats and exact source lines. Each beat in context.beats carries the script's intent: shot (the requested view), visual (scene or a device such as map, timeline, verdict, scoreboard, chapter, quote), subject (what is on screen for that sentence) and, when present, frame. Give every beat the view its shot asks for (see artDirection.views) and the format its visual asks for; consecutive beats sharing the same view and subject share one picture, a change of view, subject, object, clue, emotion, time of day or weather starts a new one; pose, posture, support and the named objects follow the narration's own words (sitting on a crate stays sitting on a crate); a named cast member's description states pose, action and expression only, clothing comes from the cast look unless the narration changes it (then outfitChange: true); a close view always shows one person's face from about the waist up, an object alone is detail; the protagonist is drawn from outside like any cast member, never through their own eyes, and a detail of hands is seen from the side by an outside camera, never from the owner's eyes; and each scene's time and weather are copied from the first beat it covers. Each scene also gives camera (one short sentence saying where the camera stands and at what height, e.g. "camera at shoulder height from the left, outside the rank"), lead (the node id of the main person for close and medium_close views) and objects (every large object, vehicle, gun on a carriage, boat, machine or animal in the scene as {id, class, term, size, description} with class one of ${MOTION_OBJECT_CLASSES.join("|")}, term the singular English noun of the thing (horse, cannon, wagon), size large, and description naming the era-correct type; a rifle, sword, spear, pistol or tool carried in the hands is not an object but a prop node with relation heldBy its owner). Every character node also gives stance, the body position this picture shows, one of ${MOTION_POSTURES.join("|")} (mounted = sitting on a riding animal, back = seen from behind), facing front|side|back, and rides = the node id of the animal when stance is mounted; an animal is its own node with animal one of ${MOTION_ANIMALS.join("|")} and gait one of ${MOTION_GAITS.join("|")}. A detail view gives detailSubject one of ${MOTION_DETAIL_SUBJECTS.join("|")}; hands appear only holding or using an object (handsWithObject); when the narration dwells on feet, boots, legs, a wound or another body part, set detailSubject bodyPart and include its owner as a character node, because that picture is drawn as a medium view of the whole person, never as a body part alone. An unnamed single person who belongs to one of the supplied groups (an envoy, a sentry, a warrior, a trooper) gives groupKey = that group's key so the picture uses the group's skin, origin and dress. A crowd node gives visibleCount: how many people must be individually visible in this picture for its view (wide 12-24, medium 4-8, medium_close at most 3), separate from crowd.count which is the number in the story. A character who rides, drives, fires or operates something gives uses {objectId, how}: how is one short sentence saying where the hands and body sit on that object. Follow context.pacing as soft guidance and context.genreGrammar for what pictures this genre uses. Stage people simply; AI draws each complete picture and optional ambient animation, code handles playback timing and camera movement. Cover every line once in order with supplied fromLineId/toLineId. establishing has no character nodes; detail has the object (and hands at most); close has one character with representation=bust; over_shoulder has the listener as a bust at one side. Device formats (map, timeline, comparison, diagram, card) use label nodes with the exact supplied text and the recurring device named in the beat's subject; a verdict or scoreboard picture shows the device with the candidates or cards, never a person facing the viewer. Keep architecture and object positions consistent. Each scene has purpose, environment (architecture/terrain or abstract diagram backdrop; NO people or movable story props), and nodes. Each node: id, kind character|prop|label, entityId from supplied cast, description, pose, slot left|center|right, evidence copied from source. Optional representation=full|bust|detail describes the visible crop of a character; a hand-only detail is not a full standing person. Default to arms at rest; do not invent a raised hand for speech. Optional relation beside|behind|on|inside|heldBy and target node ID. Preserve essential relationships and simplify optional actions. Labels are short and optional according to artDirection. Diagrams need no physical location, floor or characters. Narration does not make the narrator visible. Show only people/props present at this point, never future reveals. Preserve identities, count, appearance/color, owner and spatial relations. Pose is short English; change it only when important. Separate moving/focal objects into prop nodes. No library IDs, coordinates, JavaScript, animation code or URLs. Output JSON only. ${MOTION_SCENE_COMPOSITION.PLAN_CONTINUITY} Context:\n${stringifyJson(context)}`,
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
