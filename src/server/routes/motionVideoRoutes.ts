import express from "express";
import { MOTION_VIDEO_API_PATHS } from "../../constants/apiRoutes.js";
import { MOTION_TEMPLATE_SYMBOL_13 } from "../../constants/motionRuntime.js";
import { FeatureType } from "../../constants/security.js";
import {
  analyzeMotionStory,
  artMotionStory,
  cancelMotionStory,
  cancelMotionVideo,
  cancelRealJobRequest,
  checkMotionVideo,
  cleanStorageJunkHandler,
  clearMotionVideoResults,
  compileMotionStory,
  createMotionLibraryItem,
  deleteMotionLibraryItem,
  deleteMotionVideoResult,
  deleteRealAsset,
  downloadRealAssets,
  downloadRealStarter,
  getMotionCatalog,
  getMotionDemo,
  getMotionEngineScript,
  getMotionEnvironment,
  getMotionStoryStatus,
  getMotionVideoStatus,
  getRealJobStatus,
  getRealManifest,
  getStorageJunk,
  importRealAsset,
  listMotionLibrary,
  listMotionVideoResults,
  listRealPolyHaven,
  parseMotionStory,
  saveMotionVideo,
  scriptMotionStory,
  selectMotionSaveDestination,
  serveRealDraco,
  serveRealFile,
  setRealEnv,
  startMotionVideoRender,
  updateMotionLibraryItem,
  updateRealAsset,
  uploadMotionAudio,
  voiceMotionStory,
  createMotionDesign,
  getMotionDesign,
  redesignMotionDesign,
  serveMotionDesignFile,
  deleteMotionDesign,
  listMotionDesigns,
} from "../controllers/motionVideoController.js";
import { requireLicense } from "../middlewares/requireLicense.js";
const router = express.Router();
router.get(MOTION_VIDEO_API_PATHS.ENGINE, getMotionEngineScript);
router.get(MOTION_VIDEO_API_PATHS.CATALOG, getMotionCatalog);
router.get(MOTION_VIDEO_API_PATHS.DEMO, getMotionDemo);
router.get(MOTION_VIDEO_API_PATHS.ENVIRONMENT, getMotionEnvironment);
router.get(MOTION_VIDEO_API_PATHS.LIBRARY, listMotionLibrary);
router.post(MOTION_VIDEO_API_PATHS.LIBRARY, createMotionLibraryItem);
router.put(MOTION_VIDEO_API_PATHS.LIBRARY_ID, updateMotionLibraryItem);
router.delete(MOTION_VIDEO_API_PATHS.LIBRARY_ID, deleteMotionLibraryItem);
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
router.post(MOTION_VIDEO_API_PATHS.STORY_ART, requireLicense(FeatureType.IMAGE), artMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_VOICE, requireLicense(FeatureType.VOICE), voiceMotionStory);
router.post(MOTION_VIDEO_API_PATHS.STORY_COMPILE, compileMotionStory);
router.get(MOTION_VIDEO_API_PATHS.DESIGNS, listMotionDesigns);
router.get(MOTION_VIDEO_API_PATHS.DESIGNS_FILE, serveMotionDesignFile);
router.get(MOTION_VIDEO_API_PATHS.DESIGNS_ID, getMotionDesign);
router.post(MOTION_VIDEO_API_PATHS.DESIGNS_REDESIGN, redesignMotionDesign);
router.post(MOTION_VIDEO_API_PATHS.DESIGNS, createMotionDesign);
router.delete(MOTION_VIDEO_API_PATHS.DESIGNS_ID, deleteMotionDesign);
router.get(MOTION_VIDEO_API_PATHS.STORY_STATUS, getMotionStoryStatus);
router.post(MOTION_VIDEO_API_PATHS.STORY_CANCEL, cancelMotionStory);
router.get(MOTION_VIDEO_API_PATHS.REAL_MANIFEST, getRealManifest);
router.get(MOTION_TEMPLATE_SYMBOL_13(`${MOTION_VIDEO_API_PATHS.REAL_FILE}`), serveRealFile);
router.get(MOTION_VIDEO_API_PATHS.REAL_POLYHAVEN, listRealPolyHaven);
router.post(MOTION_VIDEO_API_PATHS.REAL_DOWNLOAD, downloadRealAssets);
router.post(MOTION_VIDEO_API_PATHS.REAL_STARTER, downloadRealStarter);
router.get(MOTION_VIDEO_API_PATHS.REAL_JOB, getRealJobStatus);
router.delete(MOTION_VIDEO_API_PATHS.REAL_JOB, cancelRealJobRequest);
router.post(MOTION_VIDEO_API_PATHS.REAL_IMPORT, importRealAsset);
router.put(MOTION_VIDEO_API_PATHS.REAL_ITEM, updateRealAsset);
router.delete(MOTION_VIDEO_API_PATHS.REAL_ITEM, deleteRealAsset);
router.post(MOTION_VIDEO_API_PATHS.REAL_ENV, setRealEnv);
router.get(MOTION_VIDEO_API_PATHS.REAL_DRACO, serveRealDraco);
export default router;
