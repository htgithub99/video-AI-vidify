import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
export const createMotionEditorialId = (): string => Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16).padStart(8, RT_MOTION.VALUE_0)).join("");
