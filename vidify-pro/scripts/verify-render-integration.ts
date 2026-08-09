import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { renderFFmpegVideo } from "../src/server/utils/ffmpegRender.ts";
import { VideoQuality } from "../src/constants/enums.ts";

const execFileAsync = promisify(execFile);
const PROJECT_ID = "integration_video2_test";
const createBmpDataUrl = (): string => {
  const width = 2;
  const height = 2;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const buffer = Buffer.alloc(54 + pixelDataSize);
  buffer.write("BM", 0);
  buffer.writeUInt32LE(buffer.length, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(pixelDataSize, 34);
  for (let offset = 54; offset < buffer.length; offset += 3) {
    buffer[offset] = 0x20;
    buffer[offset + 1] = 0x80;
    buffer[offset + 2] = 0xe0;
  }
  return `data:image/bmp;base64,${buffer.toString("base64")}`;
};
const IMAGE_DATA_URL = createBmpDataUrl();
const createSilentWav = (durationSeconds: number): string => {
  const sampleRate = 44100;
  const dataSize = sampleRate * durationSeconds * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer.toString("base64");
};

const outputUrl = await renderFFmpegVideo({
  projectId: PROJECT_ID,
  quality: VideoQuality.LOW,
  aspectRatio: "16:9",
  globalAudioBase64: createSilentWav(3),
  scenes: [1, 2, 3].map((index) => ({
    id: `sc_${index}`,
    imageBase64: IMAGE_DATA_URL,
    duration: 1,
    cameraMotion: "static",
    transition: "cut",
  })),
});
const outputPath = path.resolve(process.cwd(), outputUrl.replace(/^\//, ""));
if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0)
  throw new Error("Rendered MP4 is missing or empty");
const outputBytes = fs.statSync(outputPath).size;
const { stdout } = await execFileAsync("ffprobe", [
  "-v",
  "error",
  "-show_entries",
  "format=duration:stream=codec_type,codec_name,width,height",
  "-of",
  "json",
  outputPath,
]);
const probe = JSON.parse(stdout);
const duration = Number(probe.format?.duration || 0);
if (duration < 2.8 || duration > 3.2)
  throw new Error(`Unexpected rendered duration: ${duration}`);
if (
  !probe.streams?.some(
    (stream: any) =>
      stream.codec_type === "video" &&
      stream.width === 854 &&
      stream.height === 480,
  )
)
  throw new Error("Rendered video stream is invalid");
if (!probe.streams?.some((stream: any) => stream.codec_type === "audio"))
  throw new Error("Rendered audio stream is missing");
fs.rmSync(path.dirname(outputPath), { recursive: true, force: true });
process.stdout.write(
  JSON.stringify(
    {
      outputUrl,
      bytes: outputBytes,
      duration,
      streams: probe.streams,
      passed: true,
    },
    null,
    2,
  ),
);
