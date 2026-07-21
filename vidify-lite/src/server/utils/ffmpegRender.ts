import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { getDataDirectory, getStaticResourcePath, getPythonCommand } from "./paths.js";
import { logger } from "../../lib/logger.js";
import { promisify } from "util";
import _ from "lodash";
import { VideoQuality } from "../../constants/enums.js";
import { FFMPEG_RESOLUTIONS } from "../../constants/config.js";

const execAsync = promisify(exec);

export interface FFmpegRenderOptions {
  scenes: Array<{
    id: string;
    imageBase64?: string;
    imageUrl?: string;
    audioBase64?: string;
    audioUrl?: string;
    duration: number;
    text?: string;
  }>;
  quality?: VideoQuality;
  globalAudioUrl?: string;
}

export const renderFFmpegVideo = async (options: FFmpegRenderOptions): Promise<string> => {
  const { scenes, quality = VideoQuality.LOW } = options;
  if (_.isEmpty(scenes)) {
    throw new Error("No scenes provided");
  }

  const tempDir = path.join(getDataDirectory(), `temp_render_${uuidv4()}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const ffmpegBinary = getStaticResourcePath("ffmpeg.exe");

  const resolutionConfig = FFMPEG_RESOLUTIONS[quality] || FFMPEG_RESOLUTIONS[VideoQuality.LOW];
  const { width, height, fps, bitrate } = resolutionConfig;

  const finalOutputName = `final_${uuidv4()}.mp4`;
  const finalOutputPath = path.join(getDataDirectory(), "assets", finalOutputName);
  const finalOutputUrl = `/assets/${finalOutputName}`;
  
  const config = {
    tempDir,
    ffmpegCmd: fs.existsSync(ffmpegBinary) ? ffmpegBinary : "ffmpeg",
    width,
    height,
    fps,
    bitrate,
    finalOutputPath,
    finalOutputUrl,
    scenes
  };

  const configPath = path.join(tempDir, "render_config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  const pyCmd = getPythonCommand();
  const scriptPath = getStaticResourcePath("python_scripts/ffmpeg_render.py");

  try {
    const { stdout } = await execAsync(`"${pyCmd}" "${scriptPath}" "${configPath}"`);
    const outputLines = stdout.trim().split("\n");
    let result = null;
    for (let i = outputLines.length - 1; i >= 0; i--) {
      try {
        result = JSON.parse(outputLines[i]);
        if (result.success !== undefined) break;
      } catch (e) {}
    }

    if (result && result.success) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return result.url;
    } else {
      throw new Error(result ? result.error : "Unknown error from Python script");
    }
  } catch (err: any) {
    logger.error("FFMPEG Python Render Error", err);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw err;
  }
};
