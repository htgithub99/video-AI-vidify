import { MOTION_VISUAL as V } from "./motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "./motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "./motionRemotionStaging.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
import { MOTION_COMPOSITION_SCHEMA, MOTION_SCENE_COMPOSITION } from "./motionSceneComposition.js";
import { MOTION_SCENE_DESIGN, MOTION_SCENE_DESIGN_SCHEMA } from "./motionSceneDesign.js";
const text: MotionResponseSchema = { type: "string", minLength: 1 };
export const MOTION_REMOTION_SCHEMAS: Record<string, MotionResponseSchema> = {
  [MOTION_SCENE_DESIGN.ARTIFACT]: MOTION_SCENE_DESIGN_SCHEMA,
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
                  description: text,
                  pose: text,
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
  SCENE: (context: unknown) =>
    `Plan representative narrated 2D illustration shots across these consecutive beats and exact source lines. Follow context.pacing as soft editorial guidance. Stage people simply; AI draws each complete scene and optional ambient animation, code handles playback timing and camera movement. Cover every line once in order with supplied fromLineId/toLineId. A scene may span several beats, sentences and speakers while its visible situation stays valid. Split for an actual place/time change, meaningful new visual task, essential clue/reveal or contradictory physical state. Do not cut for incidental gestures, a sentence ending, speaker change or a new beat. Establish a location with view=wide; view=detail and focus=[visible node IDs] are optional when needed to make an essential clue readable, never a mandatory extra shot. Keep architecture and object positions consistent. Each scene has purpose, environment (architecture/terrain or abstract diagram backdrop; NO people or movable story props), and nodes. Each node: id, kind character|prop|label, entityId from supplied cast, description, pose, slot left|center|right, evidence copied from source. Optional relation beside|behind|on|inside|heldBy and target node ID. Preserve essential relationships and simplify optional actions. Labels are short and optional according to artDirection. Diagrams need no physical location, floor or characters. Narration does not make the narrator visible. Show only people/props present at this point, never future reveals. Preserve identities, count, appearance/color, owner and spatial relations. Pose is short English; change it only when important. Separate moving/focal objects into prop nodes. No library IDs, coordinates, JavaScript, animation code or URLs. Output JSON only. ${L.CONTINUITY_POLICY} Context:\n${JSON.stringify(context)}`,
  ASSET: (context: Record<string, unknown>) =>
    `Write SVG SOURCE CODE for ONE flat 2D ${context.kind}, returned directly as JSON text. Do NOT generate a raster image or use image-generation/canvas tools. Return {"svg":"<svg ...>...</svg>","anchors":{"base":{"x":0.5,"y":0.98}}}. Anchor coordinates are normalized to viewBox 0..1 and MUST match the actual drawing: base=feet/bottom; surface=usable supporting top (bed/table); grip=hand holding point; wrist=center of the visible wrist, not torso or floor; inside=visible inner area. Supply every requested anchor. Use xmlns and viewBox="0 0 W H", W/H up to 1920. ${context.kind === "background" ? "BACKGROUND LAYER: fill the scene with architecture/terrain only, under neutral daylight. A full-canvas opaque background is allowed. No people, movable/focal story props or text. Do not duplicate separately listed nodes." : `ISOLATED ${context.kind === "character" ? "CHARACTER" : "OBJECT"} LAYER: draw only this complete subject with a small transparent margin around it. The outer canvas MUST stay transparent. Do not add a full-canvas rectangle/path, paper, sky, wall, ground, tiles, scenery or a framed panel, even if the style mentions paper backgrounds. Preserve white paint/clothes as opaque white within the subject. ${context.kind === "character" ? "Readable full-body proportions and closed mouth. Match supplied base SVG identity; change only requested pose/state." : "Do not include people or unrelated objects. Supporting scenery belongs to the separate background layer."}`} Use paths/shapes/groups and local gradients with url(#id) only; no text, scripts, animation, CSS imports, foreignObject, embedded images, external resources or href. ${L.ASSET_POLICY} ${context.kind === "background" ? L.LOCATION_POLICY : ""} Simple geometry sufficient to identify this subject. Keep below ${V.ASSET_LIMIT} characters. Context:\n${JSON.stringify(context)}`,
  ANCHOR_REPAIR: (svg: string, required: string[], anchors: unknown) =>
    `The SVG code below is accepted. Return ONLY {"anchors":{...}} with normalized 0..1 coordinates for the requested anchors: ${JSON.stringify(required)}. base=feet/bottom, surface=supporting top, grip=holding hand, inside=visible inner area; seat=seated body contact (not feet); body=lying body contact; emitter=smoke outlet; flame=wick; pivot=physical hinge. Preserve valid anchors ${JSON.stringify(anchors)}. Do not redraw the SVG or use image generation. SVG: ${svg}`,
  SCENE_POLICY:
    "For horror storytelling use character and prop nodes only; never label nodes or explanatory text. Subtitles are rendered separately. " +
    "Do not split a living person's hands, arms, head or feet into separate prop nodes, including for a hand-holding reveal. Keep the whole person intact and focus the shot on the relevant two people/upper bodies; a simple standing illustration is sufficient. A severed part is allowed only when explicitly a severed object in the story. A described oil lamp must be an oil lamp, never replaced with a candle. Use composition relationships for clues such as sandals BESIDE a person: relation=beside, target=that person's node, not merely the same slot. " +
    "Use appearanceChanged=true ONLY for an explicit change of age, clothes, color or bodily state from the supplied character identity. Use poseEssential=true when a pose or focal facial reaction carries the meaning (lying in bed, a frightened face in a detail shot, a revealed ghost). Describe that simple pose/expression and viewing angle in English. Incidental looking, talking, walking or opening a door can reuse the standing illustration; do not create a new pose for every verb. Alternate an establishing wide shot with detail shots of the person or clue named by the narration; do not keep everyone in a distant wide shot during a focal reaction. Evidence is a short optional source hint, not an exact quotation requirement. " +
    L.SCENE_POLICY +
    " " +
    S.STAGING_POLICY,
  REPAIR: (base: string, draft: unknown, errors: string[]) => `${base}\nRepair only rejected fields/items, preserve accepted IDs and source ranges. Do not repeat unrelated data. Draft: ${JSON.stringify(draft)}\nErrors: ${JSON.stringify(errors)}`,
  REVIEW: (context: unknown) =>
    `Check this rendered illustration against the exact narration and scene data. Use the selected artDirection rules for this profile. Only block wrong identity/count, essential spatial relation/owner or causal direction, explicit color/appearance, missing key clue/step, contradictory factual labels, unreadable/empty/cropped main subject or severely disconnected main anatomy. A diagram needs no floor or physical room. Ignore optional pose/action differences, minor style variations and small decorative details. Keep issues specific to visible failures and name the relevant node/group; never demand an unrelated reference object or scene. Return {"ok":true,"issues":[]} or {"ok":false,"issues":["specific entity and problem"]}. Context:\n${JSON.stringify(context)}`,
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
