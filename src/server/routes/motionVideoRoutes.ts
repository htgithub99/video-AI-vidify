import { MOTION_SOUND_CONFIG } from "../../constants/motionSound.js";
import { listMotionSfx, serveMotionSfx } from "../controllers/motionVideoController.js";
import { listMotionVoices, registerMotionVoice, updateMotionVoiceMeta, removeMotionVoice, listMotionVoiceChannels, saveMotionVoiceChannel, removeMotionVoiceChannel } from "../controllers/motionVideoController.js";
import { MOTION_VOICE, MOTION_VOICE_LIBRARY } from "../../constants/motionVoice.js";
import express from "express";
import { MOTION_SCENE_LIBRARY } from "../../constants/motionSceneLibrary.js";
import { calibrateSceneLibraryStyleJob, deleteMotionTrainedVoice, getMotionVoiceSpeed, listMotionTrainedVoices, measureMotionVoiceSpeed, measureMotionVoiceSpeedAudio, serveSceneStyleCalibration, trainMotionVoice } from "../controllers/motionVideoController.js";
import { MOTION_VOICE_TRAIN } from "../../constants/motionVoiceTrain.js";
import { MOTION_VOICE_SPEED } from "../../constants/motionVoice.js";
import { MOTION_STYLE_CALIBRATION } from "../../constants/motionStyleMetrics.js";
import { getSceneLibraryStyle, listSceneLibrary, removeSceneLibraryItem, removeSceneLibraryStyle, renameSceneLibraryItem, renameSceneLibraryStyle, seedSceneLibraryJob, importSceneLibraryJob, clearSceneLibraryItems, exportSceneLibraryFile, serveSceneLibraryThumb } from "../controllers/motionVideoController.js";
import { MOTION_VIDEO_API_PATHS } from "../../constants/apiRoutes.js";
import { MOTION_TEMPLATE_SYMBOL_13 } from "../../constants/motionRuntime.js";
import { FeatureType } from "../../constants/security.js";
import {
  analyzeMotionStory,
  cancelMotionStory,
  cancelMotionVideo,
  checkMotionVideo,
  renderBoard2dSheet,
  cleanStorageJunkHandler,
  clearMotionVideoResults,
  compileMotionStory,
  deleteMotionVideoResult,
  getMotionDemo,
  getMotionEngineScript,
  getMotionStoryStatus,
  getMotionVideoStatus,
  getStorageJunk,
  listMotionVideoResults,
  parseMotionStory,
  saveMotionVideo,
  scenesMotionStory,
  seoMotionStory,
  thumbnailMotionStory,
  scriptMotionStory,
  selectMotionSaveDestination,
  serveGenPreview,
  serveStylePreview,
  serveMotionAsset,
  startMotionVideoRender,
  uploadMotionAudio,
  voiceMotionStory,
  addMotionAi33Voice,
  previewMotionVoice,
} from "../controllers/motionVideoController.js";
import { requireLicense } from "../middlewares/requireLicense.js";
const router = express.Router();
router.get(MOTION_VOICE.VOICES_ROUTE, listMotionVoices);
router.post(MOTION_VOICE.REFERENCE_ROUTE, registerMotionVoice);
router.post(MOTION_VOICE.PREVIEW_ROUTE, previewMotionVoice);
router.post(MOTION_VOICE_LIBRARY.META_ROUTE, updateMotionVoiceMeta);
router.get(MOTION_VOICE_SPEED.ROUTE, getMotionVoiceSpeed);
router.post(MOTION_VOICE_SPEED.MEASURE_ROUTE, measureMotionVoiceSpeed);
router.post(MOTION_VOICE_SPEED.AUDIO_ROUTE, measureMotionVoiceSpeedAudio);
router.post(MOTION_VOICE_TRAIN.ROUTE, trainMotionVoice);
router.get(MOTION_VOICE_TRAIN.LIST_ROUTE, listMotionTrainedVoices);
router.post(MOTION_VOICE_TRAIN.DELETE_ROUTE, deleteMotionTrainedVoice);
router.post(MOTION_VOICE_LIBRARY.REMOVE_ROUTE, removeMotionVoice);
router.post(MOTION_VOICE_LIBRARY.AI33_ROUTE, addMotionAi33Voice);
router.get(MOTION_VOICE_LIBRARY.CHANNELS_ROUTE, listMotionVoiceChannels);
router.post(MOTION_VOICE_LIBRARY.CHANNELS_ROUTE, saveMotionVoiceChannel);
router.post(MOTION_VOICE_LIBRARY.CHANNEL_DELETE_ROUTE, removeMotionVoiceChannel);
router.get(MOTION_SCENE_LIBRARY.ROUTES.LIST, listSceneLibrary);
router.post(MOTION_SCENE_LIBRARY.ROUTES.REMOVE, removeSceneLibraryItem);
router.post(MOTION_SCENE_LIBRARY.ROUTES.RENAME, renameSceneLibraryItem);
router.get(MOTION_SCENE_LIBRARY.ROUTES.THUMB, serveSceneLibraryThumb);
router.get(MOTION_SCENE_LIBRARY.ROUTES.STYLE, getSceneLibraryStyle);
router.post(MOTION_SCENE_LIBRARY.ROUTES.STYLE_REMOVE, removeSceneLibraryStyle);
router.post(MOTION_SCENE_LIBRARY.ROUTES.STYLE_RENAME, renameSceneLibraryStyle);
router.post(MOTION_STYLE_CALIBRATION.ROUTES.CALIBRATE, calibrateSceneLibraryStyleJob);
router.get(MOTION_STYLE_CALIBRATION.IMAGE_ROUTE, serveSceneStyleCalibration);
router.post(MOTION_SCENE_LIBRARY.ROUTES.SEED, seedSceneLibraryJob);
router.post(MOTION_SCENE_LIBRARY.ROUTES.IMPORT, importSceneLibraryJob);
router.post(MOTION_SCENE_LIBRARY.ROUTES.CLEAR, clearSceneLibraryItems);
router.get(MOTION_SCENE_LIBRARY.ROUTES.EXPORT, exportSceneLibraryFile);
router.get(MOTION_SOUND_CONFIG.LIST_ROUTE, listMotionSfx);
router.get(MOTION_SOUND_CONFIG.ASSET_ROUTE, serveMotionSfx);
router.get(MOTION_VIDEO_API_PATHS.ENGINE, getMotionEngineScript);
router.get(MOTION_VIDEO_API_PATHS.DEMO, getMotionDemo);
router.get(MOTION_TEMPLATE_SYMBOL_13(String(MOTION_VIDEO_API_PATHS.ASSET)), serveMotionAsset);
router.get(MOTION_VIDEO_API_PATHS.GEN_PREVIEW, serveGenPreview);
router.get(MOTION_VIDEO_API_PATHS.STYLE_PREVIEW, serveStylePreview);
router.post(MOTION_VIDEO_API_PATHS.AUDIO, uploadMotionAudio);
router.post(MOTION_VIDEO_API_PATHS.CHECK, checkMotionVideo);
router.post(MOTION_VIDEO_API_PATHS.BOARD2D_SHEET, renderBoard2dSheet);
router.post(MOTION_VIDEO_API_PATHS.RENDER, startMotionVideoRender);
router.get(MOTION_VIDEO_API_PATHS.STATUS, getMotionVideoStatus);
router.post(MOTION_VIDEO_API_PATHS.CANCEL, cancelMotionVideo);
router.get(MOTION_VIDEO_API_PATHS.RESULTS, listMotionVideoResults);
router.get(MOTION_VIDEO_API_PATHS.STORAGE_JUNK, getStorageJunk);
router.post(MOTION_VIDEO_API_PATHS.STORAGE_CLEAN, cleanStorageJunkHandler);
router.delete(MOTION_VIDEO_API_PATHS.RESULTS, clearMotionVideoResults);
router.delete(MOTION_VIDEO_API_PATHS.RESULTS_ID, deleteMotionVideoResult);
router.post(MOTION_VIDEO_API_PATHS.SELECT_SAVE_DESTINATION, selectMotionSaveDestination);
router.post(MOTION_VIDEO_API_PATHS.SAVE_VIDEO, saveMotionVideo);
router.post(MOTION_VIDEO_API_PATHS.STORY_PARSE, parseMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_ANALYZE, analyzeMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_SCRIPT, scriptMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_SCENES, scenesMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_SEO, seoMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_THUMBNAIL, requireLicense(FeatureType.IMAGE), thumbnailMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_VOICE, voiceMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_COMPILE, compileMotionStory);
router.get(MOTION_VIDEO_API_PATHS.STORY_STATUS, getMotionStoryStatus);
router.post(MOTION_VIDEO_API_PATHS.STORY_CANCEL, cancelMotionStory);
export default router;
