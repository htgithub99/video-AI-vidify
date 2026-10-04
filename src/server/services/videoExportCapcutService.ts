import {
  VIDEO_EXPORT_TEMPLATE_CAPCUT_EXPORT_CREATED_PROJECT,
  VIDEO_EXPORT_TEMPLATE_SYMBOL_3,
  VIDEO_EXPORT_TEXT_16_9,
  VIDEO_EXPORT_TEXT_187_0_0,
  VIDEO_EXPORT_TEXT_1_1,
  VIDEO_EXPORT_TEXT_9_16,
  VIDEO_EXPORT_TEXT_AUDIO,
  VIDEO_EXPORT_TEXT_CANVAS_COLOR,
  VIDEO_EXPORT_TEXT_CAPCUT,
  VIDEO_EXPORT_TEXT_CAPCUT_EXPORT,
  VIDEO_EXPORT_TEXT_COM_LVEDITOR_DRAFT,
  VIDEO_EXPORT_TEXT_DONG_THOI_GIAN_01,
  VIDEO_EXPORT_TEXT_DRAFT_CONTENT_JSON,
  VIDEO_EXPORT_TEXT_DRAFT_CONTENT_JSON_BAK,
  VIDEO_EXPORT_TEXT_DRAFT_META_INFO_JSON,
  VIDEO_EXPORT_TEXT_D_CAPCUT_CAPCUT_DRAFTS,
  VIDEO_EXPORT_TEXT_EFFECT,
  VIDEO_EXPORT_TEXT_EXTRACT_MUSIC,
  VIDEO_EXPORT_TEXT_HIEU_UNG_VIDEO,
  VIDEO_EXPORT_TEXT_KHONG_TINH_DUOC_THOI_LUONG_NHAC,
  VIDEO_EXPORT_TEXT_LOCAL,
  VIDEO_EXPORT_TEXT_MUSIC,
  VIDEO_EXPORT_TEXT_NONE,
  VIDEO_EXPORT_TEXT_PHOTO,
  VIDEO_EXPORT_TEXT_PLACEHOLDER_INFO,
  VIDEO_EXPORT_TEXT_PROJECTS,
  VIDEO_EXPORT_TEXT_PROJECT_JSON,
  VIDEO_EXPORT_TEXT_SPEED,
  VIDEO_EXPORT_TEXT_SYMBOL_11,
  VIDEO_EXPORT_TEXT_SYMBOL_12,
  VIDEO_EXPORT_TEXT_SYMBOL_13,
  VIDEO_EXPORT_TEXT_TEMPLATE_2_TMP,
  VIDEO_EXPORT_TEXT_TIMELINES,
  VIDEO_EXPORT_TEXT_TRANSITION,
  VIDEO_EXPORT_TEXT_USER_DATA,
  VIDEO_EXPORT_TEXT_UTF8,
  VIDEO_EXPORT_TEXT_VIDEO,
  VIDEO_EXPORT_TEXT_VIDEO_EFFECT,
  VIDEO_EXPORT_TEXT_VOCAL_SEPARATION,
} from "../../constants/videoExportText";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import _ from "lodash";
import { logger } from "../../lib/logger.js";
import { computeVideoExportSlidePlan } from "../../lib/videoExportPlan.js";
import { probeMediaDurationSeconds } from "./videoExportFfmpegService.js";
import { getCapcutResourceCatalog } from "./capcutResourceService.js";
import { VideoExportAspectRatio, VideoExportConfig } from "../../types/videoExport.js";
const MICROSECONDS = 1_000_000;
export type ExportCapcutProjectParams = {
  projectName: string;
  audioPaths: string[];
  imagePaths: string[];
  config: VideoExportConfig;
  capcutEffectId?: string;
  capcutTransitionId?: string;
};
export type ExportCapcutProjectResult = {
  projectName: string;
  projectPath: string;
  durationSeconds: number;
  imageCount: number;
  trackCount: number;
};
const getCapcutDraftsDirectory = (): string => {
  const customDraftsDir = VIDEO_EXPORT_TEXT_D_CAPCUT_CAPCUT_DRAFTS;
  if (fs.existsSync(customDraftsDir)) return customDraftsDir;
  const localAppData = process.env.LOCALAPPDATA || "";
  const standardDraftsDir = path.join(localAppData, VIDEO_EXPORT_TEXT_CAPCUT, VIDEO_EXPORT_TEXT_USER_DATA, VIDEO_EXPORT_TEXT_PROJECTS, VIDEO_EXPORT_TEXT_COM_LVEDITOR_DRAFT);
  if (fs.existsSync(standardDraftsDir)) return standardDraftsDir;
  try {
    fs.mkdirSync(standardDraftsDir, { recursive: true });
    return standardDraftsDir;
  } catch {
    return customDraftsDir;
  }
};
const normalizeCapcutPath = (rawPath: string): string => {
  const normalized = path.resolve(rawPath).replace(/\\/g, VIDEO_EXPORT_TEXT_SYMBOL_12);
  if (normalized.length >= 2 && normalized[1] === VIDEO_EXPORT_TEXT_SYMBOL_13) {
    return normalized[0].toUpperCase() + normalized.slice(1);
  }
  return normalized;
};
const resolveCanvasDimensions = (aspectRatio: VideoExportAspectRatio): { width: number; height: number; ratio: string } => {
  switch (aspectRatio) {
    case VideoExportAspectRatio.VERTICAL_9_16:
      return { width: 1080, height: 1920, ratio: VIDEO_EXPORT_TEXT_9_16 };
    case VideoExportAspectRatio.SQUARE_1_1:
      return { width: 1080, height: 1080, ratio: VIDEO_EXPORT_TEXT_1_1 };
    default:
      return { width: 1920, height: 1080, ratio: VIDEO_EXPORT_TEXT_16_9 };
  }
};
export const exportCapcutProject = async (params: ExportCapcutProjectParams): Promise<ExportCapcutProjectResult> => {
  const { projectName, audioPaths, imagePaths, config, capcutEffectId, capcutTransitionId } = params;
  const rootDraftsDir = getCapcutDraftsDirectory();
  const safeBaseName = _.truncate(_.replace(_.trim(projectName) || VIDEO_EXPORT_TEXT_CAPCUT_EXPORT, /[\\/:*?"<>|]+/g, VIDEO_EXPORT_TEXT_SYMBOL_11), { length: 50, omission: "" });
  let finalProjectName = safeBaseName;
  let projectDir = path.join(rootDraftsDir, finalProjectName);
  let counter = 1;
  while (fs.existsSync(projectDir)) {
    finalProjectName = VIDEO_EXPORT_TEMPLATE_SYMBOL_3(`${safeBaseName}`, `${counter}`);
    projectDir = path.join(rootDraftsDir, finalProjectName);
    counter += 1;
  }
  await fs.promises.mkdir(projectDir, { recursive: true });
  await fs.promises.mkdir(path.join(projectDir, VIDEO_EXPORT_TEXT_TIMELINES), { recursive: true });
  const catalog = getCapcutResourceCatalog();
  const selectedEffect = _.find(catalog.effects, { effect_id: capcutEffectId });
  const selectedTransition = _.find(catalog.transitions, { effect_id: capcutTransitionId });
  const audioDurations = await Promise.all(_.map(audioPaths, (audioPath) => probeMediaDurationSeconds(audioPath)));
  const totalDurationSeconds = _.sum(audioDurations);
  if (!(totalDurationSeconds > 0)) {
    throw new Error(VIDEO_EXPORT_TEXT_KHONG_TINH_DUOC_THOI_LUONG_NHAC);
  }
  const totalDurationUs = Math.round(totalDurationSeconds * MICROSECONDS);
  const slidePlan = computeVideoExportSlidePlan(totalDurationSeconds, imagePaths.length, config);
  const segmentDurationUs = Math.round(slidePlan.slideSeconds * MICROSECONDS);
  const canvas = resolveCanvasDimensions(config.aspectRatio);
  const materials: any = {
    videos: [],
    audios: [],
    speeds: [],
    canvases: [],
    placeholder_infos: [],
    sound_channel_mappings: [],
    vocal_separations: [],
    video_effects: [],
    transitions: [],
  };
  let chosenTransitionMaterialId = "";
  if (selectedTransition) {
    chosenTransitionMaterialId = randomUUID().toUpperCase();
    materials.transitions.push({
      id: chosenTransitionMaterialId,
      effect_id: selectedTransition.effect_id,
      resource_id: selectedTransition.effect_id,
      name: selectedTransition.title,
      type: VIDEO_EXPORT_TEXT_TRANSITION,
      category_name: VIDEO_EXPORT_TEXT_TRANSITION,
      duration: Math.round(config.transitionSeconds * MICROSECONDS),
      path: "",
    });
  }
  const videoSegments: any[] = [];
  let currentVidStartUs = 0;
  for (let index = 0; index < slidePlan.segmentCount; index += 1) {
    const imgPath = imagePaths[index % imagePaths.length];
    const imgMatId = randomUUID().toUpperCase();
    const speedId = randomUUID().toUpperCase();
    const canvasId = randomUUID().toUpperCase();
    const placeholderId = randomUUID().toUpperCase();
    materials.speeds.push({ id: speedId, type: VIDEO_EXPORT_TEXT_SPEED, mode: 0, speed: 1.0, curve_speed: null });
    materials.canvases.push({ id: canvasId, type: VIDEO_EXPORT_TEXT_CANVAS_COLOR, color: "", blur: 0, image: "", album_image: "", image_id: "", image_name: "", source_platform: 0, team_id: "" });
    materials.placeholder_infos.push({ id: placeholderId, type: VIDEO_EXPORT_TEXT_PLACEHOLDER_INFO, meta_type: VIDEO_EXPORT_TEXT_NONE, res_path: "", res_text: "", error_path: "", error_text: "" });
    materials.videos.push({
      id: imgMatId,
      type: VIDEO_EXPORT_TEXT_PHOTO,
      duration: 10800000000,
      path: normalizeCapcutPath(imgPath),
      width: canvas.width,
      height: canvas.height,
      category_name: VIDEO_EXPORT_TEXT_LOCAL,
      material_name: path.basename(imgPath),
      has_audio: false,
    });
    const isLastSegment = index === slidePlan.segmentCount - 1;
    const durUs = isLastSegment ? totalDurationUs - currentVidStartUs : segmentDurationUs;
    const extraRefs = [speedId, canvasId, placeholderId];
    if (chosenTransitionMaterialId && !isLastSegment) {
      extraRefs.push(chosenTransitionMaterialId);
    }
    const segObj: any = {
      id: randomUUID().toUpperCase(),
      material_id: imgMatId,
      source_timerange: { start: 0, duration: durUs },
      target_timerange: { start: currentVidStartUs, duration: durUs },
      render_timerange: { start: 0, duration: 0 },
      speed: 1,
      volume: 1,
      visible: true,
      clip: { scale: { x: 1, y: 1 }, rotation: 0, transform: { x: 0, y: 0 }, flip: { vertical: false, horizontal: false }, alpha: 1 },
      uniform_scale: { on: true, value: 1 },
      extra_material_refs: extraRefs,
      common_keyframes: [],
    };
    if (chosenTransitionMaterialId && !isLastSegment) {
      segObj.transition = {
        id: chosenTransitionMaterialId,
        duration: Math.round(config.transitionSeconds * MICROSECONDS),
      };
    }
    videoSegments.push(segObj);
    currentVidStartUs += durUs;
  }
  const audioSegments: any[] = [];
  let currentAudStartUs = 0;
  for (let index = 0; index < audioPaths.length; index += 1) {
    const audioPath = audioPaths[index];
    const durSeconds = audioDurations[index] || 0;
    const durUs = Math.round(durSeconds * MICROSECONDS);
    const audioMatId = randomUUID().toUpperCase();
    const speedId = randomUUID().toUpperCase();
    const soundMappingId = randomUUID().toUpperCase();
    const vocalSepId = randomUUID().toUpperCase();
    materials.speeds.push({ id: speedId, type: VIDEO_EXPORT_TEXT_SPEED, mode: 0, speed: 1.0, curve_speed: null });
    materials.sound_channel_mappings.push({ id: soundMappingId, type: "", audio_channel_mapping: 0, is_config_open: false });
    materials.vocal_separations.push({ id: vocalSepId, type: VIDEO_EXPORT_TEXT_VOCAL_SEPARATION, choice: 0, removed_sounds: [], time_range: null, production_path: "", final_algorithm: "", enter_from: "" });
    materials.audios.push({
      id: audioMatId,
      type: VIDEO_EXPORT_TEXT_EXTRACT_MUSIC,
      name: path.basename(audioPath),
      duration: durUs,
      path: normalizeCapcutPath(audioPath),
      category_name: VIDEO_EXPORT_TEXT_LOCAL,
    });
    audioSegments.push({
      id: randomUUID().toUpperCase(),
      material_id: audioMatId,
      source_timerange: { start: 0, duration: durUs },
      target_timerange: { start: currentAudStartUs, duration: durUs },
      render_timerange: { start: 0, duration: 0 },
      speed: 1,
      volume: 1,
      visible: true,
      extra_material_refs: [speedId, soundMappingId, vocalSepId],
      common_keyframes: [],
    });
    currentAudStartUs += durUs;
  }
  const tracks: any[] = [
    { id: randomUUID().toUpperCase(), type: VIDEO_EXPORT_TEXT_VIDEO, segments: videoSegments, flag: 0, attribute: 0, name: "", is_default_name: true },
    { id: randomUUID().toUpperCase(), type: VIDEO_EXPORT_TEXT_AUDIO, segments: audioSegments, flag: 0, attribute: 0, name: "", is_default_name: true },
  ];
  if (selectedEffect) {
    const effectMatId = randomUUID().toUpperCase();
    materials.video_effects.push({
      id: effectMatId,
      effect_id: selectedEffect.effect_id,
      resource_id: selectedEffect.effect_id,
      name: selectedEffect.title,
      type: VIDEO_EXPORT_TEXT_VIDEO_EFFECT,
      category_name: VIDEO_EXPORT_TEXT_HIEU_UNG_VIDEO,
      apply_target_type: 2,
      value: 1,
      adjust_params: [],
    });
    tracks.push({
      id: randomUUID().toUpperCase(),
      type: VIDEO_EXPORT_TEXT_EFFECT,
      segments: [
        {
          id: randomUUID().toUpperCase(),
          material_id: effectMatId,
          source_timerange: null,
          target_timerange: { start: 0, duration: totalDurationUs },
          render_timerange: { start: 0, duration: 0 },
          visible: true,
          extra_material_refs: [],
        },
      ],
      flag: 0,
      attribute: 0,
      name: "",
      is_default_name: true,
    });
  }
  const timelineId = randomUUID().toUpperCase();
  const draftContent = {
    id: timelineId,
    version: 360000,
    new_version: VIDEO_EXPORT_TEXT_187_0_0,
    name: finalProjectName,
    duration: totalDurationUs,
    fps: 30.0,
    canvas_config: { ratio: canvas.ratio, width: canvas.width, height: canvas.height, background: null },
    materials,
    tracks,
  };
  const draftContentStr = JSON.stringify(draftContent, null, 2);
  await fs.promises.writeFile(path.join(projectDir, VIDEO_EXPORT_TEXT_DRAFT_CONTENT_JSON), draftContentStr, VIDEO_EXPORT_TEXT_UTF8);
  await fs.promises.writeFile(path.join(projectDir, VIDEO_EXPORT_TEXT_DRAFT_CONTENT_JSON_BAK), draftContentStr, VIDEO_EXPORT_TEXT_UTF8);
  await fs.promises.writeFile(path.join(projectDir, VIDEO_EXPORT_TEXT_TEMPLATE_2_TMP), draftContentStr, VIDEO_EXPORT_TEXT_UTF8);
  const nowUs = Date.now() * 1000;
  const metaMaterials: any[] = [];
  const audioMetaList = _.map(materials.audios, (a: any) => ({
    create_time: Math.floor(Date.now() / 1000),
    duration: a.duration,
    enter_from: 0,
    extra_info: a.name,
    file_Path: a.path,
    height: 0,
    id: a.id,
    import_time: Math.floor(Date.now() / 1000),
    metetype: VIDEO_EXPORT_TEXT_MUSIC,
    roughcut_time_range: { duration: a.duration, start: 0 },
    sub_time_range: { duration: -1, start: -1 },
    type: 0,
    width: 0,
  }));
  metaMaterials.push({ type: 0, value: audioMetaList });
  const draftMetaInfo = {
    draft_id: randomUUID().toUpperCase(),
    draft_name: finalProjectName,
    draft_fold_path: normalizeCapcutPath(projectDir),
    draft_root_path: normalizeCapcutPath(rootDraftsDir),
    tm_draft_create: nowUs,
    tm_draft_modified: nowUs,
    tm_duration: totalDurationUs,
    draft_type: "",
    draft_materials_copied_info: [],
    draft_materials: metaMaterials,
  };
  await fs.promises.writeFile(path.join(projectDir, VIDEO_EXPORT_TEXT_DRAFT_META_INFO_JSON), JSON.stringify(draftMetaInfo, null, 2), VIDEO_EXPORT_TEXT_UTF8);
  const projectJson = {
    config: { color_space: -1, hdr_vivid: false, mixed_track_mode_on: false, render_index_track_mode_on: false, use_float_render: false },
    create_time: nowUs,
    id: randomUUID().toUpperCase(),
    main_timeline_id: timelineId,
    timelines: [{ create_time: nowUs, id: timelineId, is_marked_delete: false, name: VIDEO_EXPORT_TEXT_DONG_THOI_GIAN_01, update_time: nowUs }],
    update_time: nowUs,
    version: 0,
  };
  await fs.promises.writeFile(path.join(projectDir, VIDEO_EXPORT_TEXT_TIMELINES, VIDEO_EXPORT_TEXT_PROJECT_JSON), JSON.stringify(projectJson, null, 2), VIDEO_EXPORT_TEXT_UTF8);
  logger.log(VIDEO_EXPORT_TEMPLATE_CAPCUT_EXPORT_CREATED_PROJECT(`${projectDir}`));
  return {
    projectName: finalProjectName,
    projectPath: projectDir,
    durationSeconds: totalDurationSeconds,
    imageCount: imagePaths.length,
    trackCount: audioPaths.length,
  };
};
