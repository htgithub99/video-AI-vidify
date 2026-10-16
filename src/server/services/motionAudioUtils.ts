import { createHash } from "crypto";
import * as MR from "../../constants/motionRuntime.js";
export const motionAudioHash = (value: unknown): string => createHash(MR.MOTION_TEXT_SHA256).update(JSON.stringify(value)).digest(MR.MOTION_TEXT_HEX).slice(0, 32);
export const motionWavData = (wav: Buffer): { start: number; length: number; availableBytes: number } => {
  const offset = wav.indexOf(Buffer.from(MR.MOTION_TEXT_DATA), 12),
    start = offset >= 0 ? offset + 8 : 44;
  return { start, length: offset >= 0 ? wav.readUInt32LE(offset + 4) : 0, availableBytes: wav.length - start };
};
