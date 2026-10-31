import { MOTION_SCENE_COMPOSITION as C } from "../motionSceneComposition.js";
const obsolete = new Set(["profile", "drawingReference", "poseConstruction", "handlingReference", "crowdStaging", "identityReferences", "placeLayout", "placeLayouts", "staging"]);
export const motionScenePromptContext = (context: unknown): Record<string, any> => {
  const input = context && typeof context === "object" ? (context as Record<string, any>) : {};
  const cleaned = Object.fromEntries(Object.entries(input).filter(([key]) => !obsolete.has(key)));
  if (cleaned.scene?.nodes) cleaned.scene = { ...cleaned.scene, nodes: cleaned.scene.nodes.map((node: Record<string, unknown>) => Object.fromEntries(Object.entries(node).filter(([key]) => !C.DRAW_NODE_OMIT.includes(key)))) };
  if (cleaned.continuity) {
    const { placeSvg, design, ...facts } = cleaned.continuity;
    cleaned.continuity = facts;
  }
  if (cleaned.artDirection) {
    const { layouts, reference, ...direction } = cleaned.artDirection;
    cleaned.artDirection = direction;
  }
  return cleaned;
};
