import { PUPPET_KIT_API } from "../../../../constants/motionPuppet.js";
import { listPuppetKitItems, removePuppetKitItems, renamePuppetKitItem, seedPuppetKitItems, servePuppetKitThumb } from "../controllers/motionVideoController.js";
import { MOTION_SOUND_CONFIG } from "../../../../constants/motionSound.js";
import { listMotionSfx, serveMotionSfx } from "../controllers/motionVideoController.js";
import { listMotionVoices, registerMotionVoice, updateMotionVoiceMeta, removeMotionVoice, listMotionVoiceChannels, saveMotionVoiceChannel, removeMotionVoiceChannel } from "../controllers/motionVideoController.js";
import { MOTION_VOICE, MOTION_VOICE_LIBRARY } from "../../../../constants/motionVoice.js";
import express from "express";
import { deleteMotionTrainedVoice, getMotionVoiceSpeed, listMotionTrainedVoices, measureMotionVoiceSpeed, measureMotionVoiceSpeedAudio, trainMotionVoice } from "../controllers/motionVideoController.js";
import { MOTION_VOICE_TRAIN } from "../../../../constants/motionVoiceTrain.js";
import { MOTION_VOICE_SPEED } from "../../../../constants/motionVoice.js";
import { MOTION_VIDEO_API_PATHS } from "../../../../constants/apiRoutes.js";
import { FeatureType } from "../../../../constants/security.js";
import {
  createMotionProduction,
  continueMotionProduction,
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
  getMotionStoryLogs,
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
  startMotionVideoRender,
  uploadMotionAudio,
  voiceMotionStory,
  addMotionAi33Voice,
  previewMotionVoice,
} from "../controllers/motionVideoController.js";
import { requireLicense } from "../../../../server/middlewares/requireLicense.js";
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
router.get(PUPPET_KIT_API.ROUTES.LIST, listPuppetKitItems);
router.post(PUPPET_KIT_API.ROUTES.SEED, seedPuppetKitItems);
router.post(PUPPET_KIT_API.ROUTES.REMOVE, removePuppetKitItems);
router.post(PUPPET_KIT_API.ROUTES.RENAME, renamePuppetKitItem);
router.get(PUPPET_KIT_API.ROUTES.THUMB, servePuppetKitThumb);
router.get(MOTION_SOUND_CONFIG.LIST_ROUTE, listMotionSfx);
router.get(MOTION_SOUND_CONFIG.ASSET_ROUTE, serveMotionSfx);
router.get(MOTION_VIDEO_API_PATHS.ENGINE, getMotionEngineScript);
router.get(MOTION_VIDEO_API_PATHS.DEMO, getMotionDemo);
router.get(MOTION_VIDEO_API_PATHS.GEN_PREVIEW, serveGenPreview);
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
router.post(MOTION_VIDEO_API_PATHS.PRODUCTION, createMotionProduction);
router.post(MOTION_VIDEO_API_PATHS.PRODUCTION_RESUME, continueMotionProduction);
router.post(MOTION_VIDEO_API_PATHS.STORY_PARSE, parseMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_ANALYZE, analyzeMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_SCRIPT, scriptMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_SCENES, scenesMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_SEO, seoMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_THUMBNAIL, requireLicense(FeatureType.IMAGE), thumbnailMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_VOICE, voiceMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_COMPILE, compileMotionStory);
router.get(MOTION_VIDEO_API_PATHS.STORY_STATUS, getMotionStoryStatus);
router.get(MOTION_VIDEO_API_PATHS.STORY_LOGS, getMotionStoryLogs);
router.post(MOTION_VIDEO_API_PATHS.STORY_CANCEL, cancelMotionStory);
export default router;
