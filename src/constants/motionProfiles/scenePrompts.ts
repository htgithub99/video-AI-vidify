import type { MotionRemotionProfile } from "../../types/motionVisual.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../motionIllustrationProfiles.js";
import { MOTION_SCENE_OUTPUT_CONTRACT } from "./sceneContract.js";
import { motionScenePromptContext } from "./sceneContext.js";
import { MOTION_CHARACTER_FRAMES, MOTION_CHARACTER_FRAME_DIRECTION } from "./characterFrames/index.js";
export const motionProfileScenePrompt = (context: unknown): string => {
  const cleaned = motionScenePromptContext(context);
  const id = cleaned.artDirection?.id as MotionRemotionProfile;
  if (!id || !Object.hasOwn(MOTION_ILLUSTRATION_PROFILES, id)) throw new Error("Select a valid illustration profile before requesting a scene.");
  const people = !Array.isArray(cleaned.scene?.nodes) || cleaned.scene.nodes.some((node: Record<string, unknown>) => node.kind === "character" && node.representation !== "detail");
  const frame = people ? `${MOTION_CHARACTER_FRAME_DIRECTION}\n${MOTION_CHARACTER_FRAMES[id]}\nEND CHARACTER SVG FRAME\n` : "";
  return `TEXT CODING TASK: draw ONE complete scene as SVG source. The selected artDirection locks character construction only; you design the setting, poses and actual layout from current story facts. Use cast and accepted identityMemory to keep recurring people consistent. No image generation tools or reference-image upload.\n${frame}${MOTION_SCENE_OUTPUT_CONTRACT}\nContext:\n${stringifyJson(cleaned)}\nReturn only the finished json code block.`;
};
