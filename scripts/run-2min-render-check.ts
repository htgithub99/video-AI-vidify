import { stringifyJson } from "../src/lib/jsonStringify.js";
import { writeVerificationLog } from "./verificationLogger.ts";
import fs from "node:fs";
import path from "node:path";
import { VideoQuality } from "../src/constants/enums";
import { getProjectDetailFromDb } from "../src/server/utils/db";
import { renderFFmpegVideo, type FFmpegRenderOptions } from "../src/server/utils/ffmpegRender";
import { GenerateType } from "../src/types";
const projectId = process.argv[2] || "proj_video1_auto_axd6txpav";
const project = await getProjectDetailFromDb(projectId);
if (!project?.storyboard?.length) throw new Error(`Project ${projectId} has no storyboard.`);
const projectRoot = path.resolve("assets", "projects", projectId);
const availableImages = fs
  .readdirSync(path.join(projectRoot, "images"))
  .filter((file) => /\.(?:png|jpe?g|webp)$/i.test(file))
  .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }));
if (!availableImages.length) throw new Error(`Project ${projectId} has no generated images.`);
const narrationPath = path.join(projectRoot, "voices", "narration.wav");
if (!fs.existsSync(narrationPath)) throw new Error(`Project ${projectId} has no narration.wav.`);
const scenes: FFmpegRenderOptions["scenes"] = project.storyboard.map((scene, index) => {
  const fileName = availableImages[index % availableImages.length];
  const imageUrl = `/assets/projects/${projectId}/images/${fileName}`;
  return {
    id: scene.id,
    imageUrl,
    duration: scene.duration,
    text: scene.script,
    assetType: GenerateType.Image,
    cameraMotion: scene.cameraMotion,
    effects: scene.effects,
    lightingEffect: scene.lightingEffect,
    transition: scene.transition,
  };
});
const outputUrl = await renderFFmpegVideo(
  {
    projectId,
    scenes,
    quality: VideoQuality.HIGHEST,
    globalAudioUrl: `/assets/projects/${projectId}/voices/narration.wav`,
    aspectRatio: "16:9",
  },
  (progress) => {
    if (progress % 10 === 0 || progress >= 94) writeVerificationLog(`[render] ${progress}%`);
  },
);
writeVerificationLog(
  stringifyJson(
    {
      projectId,
      scenes: scenes.length,
      sourceImages: availableImages.length,
      storyboardDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
      outputUrl,
    },
    null,
    2,
  ),
);
