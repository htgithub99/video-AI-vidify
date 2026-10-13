import { createHash } from "crypto";
import * as MR from "../../constants/motionRuntime.js";
export const motionAudioHash = (value: unknown): string => createHash(MR.MOTION_TEXT_SHA256).update(JSON.stringify(value)).digest(MR.MOTION_TEXT_HEX).slice(0, 32);
