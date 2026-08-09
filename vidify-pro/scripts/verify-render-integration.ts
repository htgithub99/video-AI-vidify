import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { renderFFmpegVideo } from "../src/server/utils/ffmpegRender.ts";
import { VideoQuality } from "../src/constants/enums.ts";

const execFileAsync = promisify(execFile);
const PROJECT_ID = "integration_video2_test";
const sourceAssetsRoot = path.basename(process.cwd()) === "vidify-pro" ? path.resolve(process.cwd(), "../vidify-lite/assets") : path.resolve(process.cwd(), "assets");
const IMAGE_DATA_URL = `data:image/jpeg;base64,${fs.readFileSync(path.join(sourceAssetsRoot, "projects/proj_video1_auto_du6s9m26x/images/sc_9.jpg")).toString("base64")}`;
const createSilentWav = (durationSeconds: number): string => {
  const sampleRate = 44100;
  const dataSize = sampleRate * durationSeconds * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);buffer.writeUInt32LE(36 + dataSize, 4);buffer.write("WAVEfmt ", 8);buffer.writeUInt32LE(16, 16);buffer.writeUInt16LE(1, 20);buffer.writeUInt16LE(1, 22);buffer.writeUInt32LE(sampleRate, 24);buffer.writeUInt32LE(sampleRate * 2, 28);buffer.writeUInt16LE(2, 32);buffer.writeUInt16LE(16, 34);buffer.write("data", 36);buffer.writeUInt32LE(dataSize, 40);
  return buffer.toString("base64");
};

const outputUrl = await renderFFmpegVideo({ projectId: PROJECT_ID, quality: VideoQuality.LOW, aspectRatio: "16:9", globalAudioBase64: createSilentWav(3), scenes: [1, 2, 3].map(index => ({ id: `sc_${index}`, imageBase64: IMAGE_DATA_URL, duration: 1, cameraMotion: "static", transition: "cut" })) });
const outputPath = path.resolve(process.cwd(), outputUrl.replace(/^\//, ""));
if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) throw new Error("Rendered MP4 is missing or empty");
const outputBytes = fs.statSync(outputPath).size;
const { stdout } = await execFileAsync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height", "-of", "json", outputPath]);
const probe = JSON.parse(stdout);
const duration = Number(probe.format?.duration || 0);
if (duration < 2.8 || duration > 3.2) throw new Error(`Unexpected rendered duration: ${duration}`);
if (!probe.streams?.some((stream: any) => stream.codec_type === "video" && stream.width === 854 && stream.height === 480)) throw new Error("Rendered video stream is invalid");
if (!probe.streams?.some((stream: any) => stream.codec_type === "audio")) throw new Error("Rendered audio stream is missing");
fs.rmSync(path.dirname(outputPath), { recursive: true, force: true });
process.stdout.write(JSON.stringify({ outputUrl, bytes: outputBytes, duration, streams: probe.streams, passed: true }, null, 2));
