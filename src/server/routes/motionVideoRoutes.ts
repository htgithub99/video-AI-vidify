import { MOTION_SOUND_CONFIG } from "../../constants/motionSound.js";
import { listMotionSfx, serveMotionSfx } from "../controllers/motionVideoController.js";
import { listMotionVoices, registerMotionVoice } from "../controllers/motionVideoController.js";
import { MOTION_VOICE } from "../../constants/motionVoice.js";
import express from "express";
import { MOTION_VIDEO_API_PATHS } from "../../constants/apiRoutes.js";
import { MOTION_TEMPLATE_SYMBOL_13 } from "../../constants/motionRuntime.js";
import { FeatureType } from "../../constants/security.js";
import {
  analyzeMotionStory,
  cancelMotionStory,
  cancelMotionVideo,
  checkMotionVideo,
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
  serveMotionAsset,
  startMotionVideoRender,
  uploadMotionAudio,
  voiceMotionStory,
  previewMotionVoice,
} from "../controllers/motionVideoController.js";
import { requireLicense } from "../middlewares/requireLicense.js";
const router = express.Router();
router.get(MOTION_VOICE.VOICES_ROUTE, listMotionVoices);
router.post(MOTION_VOICE.REFERENCE_ROUTE, registerMotionVoice);
router.post(MOTION_VOICE.PREVIEW_ROUTE, previewMotionVoice);
router.get(MOTION_SOUND_CONFIG.LIST_ROUTE, listMotionSfx);
router.get(MOTION_SOUND_CONFIG.ASSET_ROUTE, serveMotionSfx);
router.get(MOTION_VIDEO_API_PATHS.ENGINE, getMotionEngineScript);
router.get(MOTION_VIDEO_API_PATHS.DEMO, getMotionDemo);
router.get(MOTION_TEMPLATE_SYMBOL_13(`${MOTION_VIDEO_API_PATHS.ASSET}`), serveMotionAsset);
router.get(MOTION_VIDEO_API_PATHS.GEN_PREVIEW, serveGenPreview);
router.post(MOTION_VIDEO_API_PATHS.AUDIO, uploadMotionAudio);
router.post(MOTION_VIDEO_API_PATHS.CHECK, checkMotionVideo);
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
