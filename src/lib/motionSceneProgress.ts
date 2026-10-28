import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_PROGRESS as P } from "../constants/motionProgress.js";
import type { PuppetLine } from "./motionPuppet.js";
export const motionSceneProgress = (stage: string, status: string, line: PuppetLine, all: PuppetLine[], places: Record<string, { name?: string }> = {}): string => P.SCENE(stage, status, all.findIndex((row) => row.key === line.key) + 1, all.length, places[line.place || ""]?.name || line.place || "", line.text.replace(/\s+/gu, RT_SHARED.SYMBOL_36A9E7).slice(0, P.TEXT_LIMIT));
