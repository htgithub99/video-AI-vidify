import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import { createHash } from "crypto";
import * as MR from "../../constants/motionRuntime.js";
import fs from "node:fs";
import { MOTION_VOICE_QUALITY as Q } from "../../constants/motionVoice.js";
export const motionAudioHash = (value: unknown): string => createHash(MR.MOTION_TEXT_SHA256).update(stringifyJson(value)).digest(MR.MOTION_TEXT_HEX).slice(0, 32);
const pcmInfo = (read: (start: number, length: number) => Buffer, size: number) => {
  if (size < 44) throw new Error(Q.INVALID);
  const header = read(0, 12);
  const end = header.readUInt32LE(4) + 8;
  if (header.toString(RT_SERVER.ASCII, 0, 4) !== MR.MOTION_TEXT_RIFF || header.toString(RT_SERVER.ASCII, 8, 12) !== MR.MOTION_TEXT_WAVE || end > size || end < 44) throw new Error(Q.INVALID);
  let offset = 12,
    format: { channels: number; sampleRate: number; bits: number; align: number } | undefined,
    data: { start: number; length: number } | undefined;
  while (offset + 8 <= end) {
    const chunk = read(offset, 8);
    const key = chunk.toString(RT_SERVER.ASCII, 0, 4),
      length = chunk.readUInt32LE(4),
      start = offset + 8;
    if (start + length + (length % 2) > end) throw new Error(Q.INVALID);
    if (key === MR.MOTION_TEXT_FMT) {
      if (format || length < 16 || data) throw new Error(Q.INVALID);
      const fmt = read(start, 16);
      const channels = fmt.readUInt16LE(2),
        sampleRate = fmt.readUInt32LE(4),
        bits = fmt.readUInt16LE(14),
        align = fmt.readUInt16LE(12);
      if (fmt.readUInt16LE(0) !== 1 || !channels || !sampleRate || bits !== 16 || align !== channels * 2 || fmt.readUInt32LE(8) !== sampleRate * align) throw new Error(Q.INVALID);
      format = { channels, sampleRate, bits, align };
    }
    if (key === MR.MOTION_TEXT_DATA) {
      if (data || !format || !length || length % format.align) throw new Error(Q.INVALID);
      data = { start, length };
    }
    offset = start + length + (length % 2);
  }
  if (!format || !data || offset !== end || end !== size) throw new Error(Q.INVALID);
  return { ...data, availableBytes: size - data.start, ...format, duration: data.length / format.align / format.sampleRate };
};
export const motionWavData = (wav: Buffer) => pcmInfo((start, length) => wav.subarray(start, start + length), wav.length);
export const motionWavFileInfo = (file: string) => {
  const handle = fs.openSync(file, RT_SERVER.R);
  try {
    return pcmInfo((start, length) => {
      const buffer = Buffer.alloc(length);
      if (fs.readSync(handle, buffer, 0, length, start) !== length) throw new Error(Q.INVALID);
      return buffer;
    }, fs.fstatSync(handle).size);
  } finally {
    fs.closeSync(handle);
  }
};
