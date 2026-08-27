import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { ProjectKind, VideoProject } from "../../types.js";
import { randomUUID } from "crypto";
import _ from "lodash";

import { REFACTOR_CONSTANTS, ASSETS_DIR_NAME, PROJECTS_DIR_NAME, IMAGES_DIR_NAME, VOICES_DIR_NAME, THUMBNAILS_DIR_NAME, VIDEOS_DIR_NAME, getBackendMsg, ERROR_MESSAGES, COMMON_STRINGS, LOG_MESSAGES, VIETNAMESE_ACCENT_MARKS_REGEX, VIETNAMESE_D_LETTER_REGEX, SAFE_FOLDER_CHARS_REGEX, MULTIPLE_SPACES_REGEX, BASE64_IMAGE_MIME_REGEX, BASE64_VIDEO_MIME_REGEX, ASSET_PROJECT_PATH_REGEX, SecurityConstants, ALIGN_CONFIG, PROJECT_VISUAL_ASSET_CONFIG, REFERENCE_ASSET_GROUP } from "../../constants/index.js";
import { appError, appLog } from "../../lib/logger.js";
import { getProjectsListFromDb, getProjectDetailFromDb, saveProjectDetailToDb, deleteProjectFromDb, migrateJsonToSqlite } from "../utils/db.js";
import { getDataDirectory } from "../utils/paths.js";

async function getProjectDetail(id: string): Promise<VideoProject | null> {
  try {
    const project = await getProjectDetailFromDb(id);
    if (!project) return null;

    return project;
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_DETAIL_ERR")} ${id}`, error);
    return null;
  }
}

export function getSafeFolderName(name: string): string {
  if (_.isEmpty(name)) return COMMON_STRINGS.PROJECT_DEFAULT_NAME;

  const safeName = name.normalize(COMMON_STRINGS.NORMALIZATION_FORM).replace(VIETNAMESE_ACCENT_MARKS_REGEX, "").replace(VIETNAMESE_D_LETTER_REGEX, "d").replace(SAFE_FOLDER_CHARS_REGEX, "").trim().replace(MULTIPLE_SPACES_REGEX, "_").toUpperCase();

  return safeName || COMMON_STRINGS.PROJECT_DEFAULT_NAME;
}

const getProjectTree = (projects: VideoProject[], rootId: string): VideoProject[] => {
  const projectIds = new Set<string>([rootId]);
  let descendantsAdded = true;

  while (descendantsAdded) {
    descendantsAdded = false;
    _.forEach(projects, (project) => {
      if (project.parentId && projectIds.has(project.parentId) && !projectIds.has(project.id)) {
        projectIds.add(project.id);
        descendantsAdded = true;
      }
    });
  }

  return _.filter(projects, (project) => projectIds.has(project.id));
};

const deleteProjectAssetDirectory = (assetsRoot: string, folderName: string): void => {
  const projectDir = path.resolve(assetsRoot, folderName);
  if (!_.isEqual(path.dirname(projectDir), assetsRoot) || !fs.existsSync(projectDir)) return;
  try {
    fs.rmSync(projectDir, { recursive: true, force: true });
  } catch (error) {
    appError(ERROR_MESSAGES.DELETE_PROJECT_ASSETS_ERR, error);
  }
};

function processSceneAssets(scene: any, imageDir: string, videoDir: string, audioDir: string, folderName: string): any {
  const imgBase64 = _.get(scene, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY);
  if (imgBase64 && !_.get(scene, REFACTOR_CONSTANTS.AVG_ASSET_URL_KEY)) {
    _.set(scene, REFACTOR_CONSTANTS.AVG_ASSET_URL_KEY, imgBase64);
  }
  if (imgBase64) delete scene[REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY];

  let { assetUrl, assetUrls, audioUrl, audioBase64 } = scene;
  let sceneUpdated = false;
  assetUrls = assetUrls || [];

  if (_.isString(audioBase64) && _.gt(_.size(audioBase64), COMMON_STRINGS.BASE64_AUDIO_LENGTH_THRESHOLD)) {
    const sceneId = _.replace(_.toString(scene.id), /[^a-zA-Z0-9_-]/g, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    const fileName = `${sceneId || COMMON_STRINGS.SCENE_PREFIX}${ALIGN_CONFIG.WAV_EXT}`;
    const filePath = path.join(audioDir, fileName);
    try {
      fs.writeFileSync(filePath, Buffer.from(audioBase64, COMMON_STRINGS.BASE64));
      audioUrl = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${folderName}/${VOICES_DIR_NAME}/${fileName}`;
      audioBase64 = undefined;
      sceneUpdated = true;
    } catch (err) {
      appError(`${ERROR_MESSAGES.WRITE_UNIFIED_AUDIO_ERR}${scene.id}`, err);
    }
  }

  const enforceCorrectFolder = (u: string | undefined) => {
    const assetsPrefix = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}`;
    if (!u || !_.includes(u, assetsPrefix)) return u;
    return _.replace(u, ASSET_PROJECT_PATH_REGEX, `${COMMON_STRINGS.REGEX_REPLACE_GROUP_1}${folderName}${COMMON_STRINGS.SLASH_PREFIX}`);
  };

  if (_.includes(assetUrl, COMMON_STRINGS.BASE64_VIDEO_PREFIX)) {
    const matches = assetUrl.match(BASE64_VIDEO_MIME_REGEX);
    if (matches) {
      const data = matches[2];
      const sceneIdStr = String(scene.id);
      const cleanId = _.startsWith(sceneIdStr, COMMON_STRINGS.SCENE_PREFIX) ? sceneIdStr.slice(COMMON_STRINGS.SCENE_PREFIX.length) : sceneIdStr;
      const fileName = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}${SecurityConstants.DOT}${COMMON_STRINGS.MP4_EXT}`;
      const filePath = path.join(videoDir, fileName);

      try {
        fs.writeFileSync(filePath, Buffer.from(data, COMMON_STRINGS.BASE64));
        assetUrl = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${folderName}${COMMON_STRINGS.SLASH_PREFIX}${VIDEOS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${fileName}`;
        sceneUpdated = true;
      } catch (err) {
        appError(`${ERROR_MESSAGES.WRITE_SCENE_VIDEO_ERR}${scene.id}`, err);
      }
    }
  } else if (_.includes(assetUrl, COMMON_STRINGS.BASE64_IMAGE_PREFIX)) {
    const matches = assetUrl.match(BASE64_IMAGE_MIME_REGEX);
    if (matches) {
      const ext = _.eq(matches[1], COMMON_STRINGS.JPEG_EXT) ? COMMON_STRINGS.JPG_EXT : matches[1];
      const data = matches[2];
      const sceneIdStr = String(scene.id);
      const cleanId = _.startsWith(sceneIdStr, COMMON_STRINGS.SCENE_PREFIX) ? sceneIdStr.slice(COMMON_STRINGS.SCENE_PREFIX.length) : sceneIdStr;
      const fileName = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}${SecurityConstants.DOT}${ext}`;
      const filePath = path.join(imageDir, fileName);

      try {
        fs.writeFileSync(filePath, Buffer.from(data, COMMON_STRINGS.BASE64));
        assetUrl = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${folderName}${COMMON_STRINGS.SLASH_PREFIX}${IMAGES_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${fileName}`;
        sceneUpdated = true;
      } catch (err) {
        appError(`${ERROR_MESSAGES.WRITE_SCENE_IMAGE_ERR}${scene.id}`, err);
      }
    }
  }

  if (assetUrl) {
    const isNotBase64 = _.every([COMMON_STRINGS.BASE64_IMAGE_PREFIX, COMMON_STRINGS.BASE64_VIDEO_PREFIX], (prefix) => !_.includes(assetUrl, prefix));
    if (isNotBase64) {
      const fixedUrl = enforceCorrectFolder(assetUrl);
      if (!_.eq(fixedUrl, assetUrl)) {
        assetUrl = fixedUrl;
        sceneUpdated = true;
      }
    }

    const needsSync = _.isEmpty(assetUrls) || !_.eq(_.size(assetUrls), 1) || !_.includes(assetUrls, assetUrl);
    if (isNotBase64 && needsSync) {
      assetUrls = [assetUrl];
      sceneUpdated = true;
    }
  } else if (!_.isEmpty(assetUrls)) {
    assetUrls = [];
    sceneUpdated = true;
  } else if (audioUrl) {
    const fixedAudioUrl = enforceCorrectFolder(audioUrl);
    if (!_.eq(fixedAudioUrl, audioUrl)) {
      audioUrl = fixedAudioUrl;
      sceneUpdated = true;
    }
  }

  if (sceneUpdated) {
    const assetRevisions = _.map(scene.assetRevisions, (revision) => ({
      ...revision,
      assetUrl: _.isEmpty(revision?.assetUrl) || (_.isString(revision?.assetUrl) && _.startsWith(revision.assetUrl, "data:")) ? assetUrl : revision?.assetUrl,
    }));
    return { ...scene, assetUrl, assetUrls, audioUrl, audioBase64, assetRevisions, isUpdated: true };
  }
  return scene;
}

function processThumbAssets(thumb: any, thumbDir: string, folderName: string): any {
  let { imageUrl } = thumb;
  let thumbUpdated = false;

  if (_.includes(imageUrl, COMMON_STRINGS.BASE64_IMAGE_PREFIX)) {
    const matches = imageUrl?.match(BASE64_IMAGE_MIME_REGEX);
    if (matches) {
      const ext = _.eq(matches[1], COMMON_STRINGS.JPEG_EXT) ? COMMON_STRINGS.JPG_EXT : matches[1];
      const data = matches[2];
      const fileName = `${COMMON_STRINGS.THUMB_PREFIX}${thumb.id}.${ext}`;
      const filePath = path.join(thumbDir, fileName);

      try {
        fs.writeFileSync(filePath, Buffer.from(data, COMMON_STRINGS.BASE64));
        imageUrl = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${folderName}${COMMON_STRINGS.SLASH_PREFIX}${THUMBNAILS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${fileName}`;
        thumbUpdated = true;
      } catch (err) {
        appError(`${ERROR_MESSAGES.WRITE_THUMB_IMAGE_ERR}${thumb.id}`, err);
      }
    }
  } else if (imageUrl && !_.startsWith(imageUrl, "data:")) {
    const fileName = path.basename(imageUrl);
    const filePath = path.join(thumbDir, fileName);
    if (!fs.existsSync(filePath)) {
      imageUrl = undefined;
      thumbUpdated = true;
    }
  }

  if (thumbUpdated) {
    return { ...thumb, imageUrl, isUpdated: true };
  }
  return thumb;
}

function processVoiceConfig(voiceConfig: any, audioDir: string, folderName: string, projectId: string): any {
  let configUpdated = false;
  let audioUrl = voiceConfig?.audioUrl;

  const audioBase64 = _.get(voiceConfig, "audioBase64");
  if (_.isString(audioBase64) && _.gt(_.size(audioBase64), COMMON_STRINGS.BASE64_AUDIO_LENGTH_THRESHOLD)) {
    const fileName = COMMON_STRINGS.UNIFIED_WAV;
    const filePath = path.join(audioDir, fileName);
    try {
      fs.writeFileSync(filePath, Buffer.from(audioBase64, COMMON_STRINGS.BASE64));
      audioUrl = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${folderName}${COMMON_STRINGS.SLASH_PREFIX}${VOICES_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${fileName}`;
      configUpdated = true;
    } catch (err) {
      appError(`${ERROR_MESSAGES.WRITE_UNIFIED_AUDIO_ERR}${projectId}`, err);
    }
  }

  if (configUpdated) {
    const newConfig = { ...voiceConfig, audioUrl };
    delete newConfig.audioBase64;
    return { ...newConfig, isUpdated: true };
  }
  return voiceConfig;
}

function convertBase64AssetsToFiles(projects: VideoProject[]): VideoProject[] {
  const assetsDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
  return _.map(projects, (project) => {
    if (_.isEqual(project.projectKind, ProjectKind.Container)) return project;

    const oldFolderName = getSafeFolderName(project.name);
    const oldProjectDir = path.join(assetsDir, oldFolderName);
    const newProjectDir = path.join(assetsDir, project.id);

    if (!_.eq(oldFolderName, project.id) && fs.existsSync(oldProjectDir) && !fs.existsSync(newProjectDir)) {
      try {
        fs.renameSync(oldProjectDir, newProjectDir);
        appLog(`${LOG_MESSAGES.MIGRATE_PROJECT_DIR_SUCCESS}${oldFolderName} -> ${project.id}`);
      } catch (err) {
        appError(`${ERROR_MESSAGES.MIGRATE_PROJECT_DIR_ERR}${oldFolderName} -> ${project.id}`, err);
      }
    }

    const folderName = project.id;
    const projectDir = newProjectDir;
    const imageDir = path.join(projectDir, IMAGES_DIR_NAME);
    const audioDir = path.join(projectDir, VOICES_DIR_NAME);
    const thumbDir = path.join(projectDir, THUMBNAILS_DIR_NAME);
    const videoDir = path.join(projectDir, VIDEOS_DIR_NAME);
    const legacyCharacterReferenceDir = path.join(projectDir, PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY, REFERENCE_ASSET_GROUP.CHARACTER);
    fs.rmSync(legacyCharacterReferenceDir, { recursive: true, force: true });

    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

    let storyboardUpdated = false;
    let storyboard = project.storyboard;
    if (_.isArray(storyboard)) {
      storyboard = _.map(storyboard, (scene) => {
        const processed = processSceneAssets(scene, imageDir, videoDir, audioDir, folderName);
        if (processed.isUpdated) {
          storyboardUpdated = true;
          delete processed.isUpdated;
        }
        return processed;
      });
    }

    let thumbnailsUpdated = false;
    let thumbnails = project.thumbnails;
    if (_.isArray(thumbnails)) {
      thumbnails = _.map(thumbnails, (thumb) => {
        const processed = processThumbAssets(thumb, thumbDir, folderName);
        if (processed.isUpdated) {
          thumbnailsUpdated = true;
          delete processed.isUpdated;
        }
        return processed;
      });
    }

    let voiceConfigUpdated = false;
    let voiceConfig = project.voiceConfig;
    if (voiceConfig) {
      const processed = processVoiceConfig(voiceConfig, audioDir, folderName, project.id);
      if (processed.isUpdated) {
        voiceConfigUpdated = true;
        delete processed.isUpdated;
        voiceConfig = processed;
      }
    }

    _.forEach(
      _.filter(fs.readdirSync(audioDir), (fileName) => {
        if (!ALIGN_CONFIG.LEGACY_SEGMENT_FILE_REGEX.test(fileName)) return false;
        const canonicalFileName = _.replace(fileName, ALIGN_CONFIG.LEGACY_SEGMENT_PREFIX, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        return fs.existsSync(path.join(audioDir, canonicalFileName));
      }),
      (fileName) => {
        const legacyFilePath = path.join(audioDir, fileName);
        try {
          fs.unlinkSync(legacyFilePath);
          appLog(`${LOG_MESSAGES.DELETE_SCENE_AUDIO_DISK_SUCCESS}${legacyFilePath}`);
        } catch (error) {
          appError(`${ERROR_MESSAGES.DELETE_SCENE_AUDIO_DISK_ERR}${legacyFilePath}`, error);
        }
      },
    );

    if (storyboardUpdated || thumbnailsUpdated || voiceConfigUpdated) {
      const updatedProject: VideoProject = { ...project, updatedAt: new Date().toISOString() };
      if (storyboardUpdated) updatedProject.storyboard = storyboard;
      if (thumbnailsUpdated) updatedProject.thumbnails = thumbnails;
      if (voiceConfigUpdated) updatedProject.voiceConfig = voiceConfig;
      return updatedProject;
    }
    return project;
  });
}

function syncOrphanedScenes(newProject: any, oldProject: any): any[] {
  const oldImagesCount = _.size(_.filter(oldProject.storyboard, (s: any) => s.assetUrl));
  const newImagesCount = _.size(_.filter(newProject.storyboard, (s: any) => s.assetUrl));

  if (_.gt(_.subtract(oldImagesCount, newImagesCount), COMMON_STRINGS.IMAGE_DIFF_THRESHOLD) && !newProject.allowBulkDeleteImages) {
    return _.map(newProject.storyboard, (newScene: any) => {
      const oldScene = _.find(oldProject.storyboard, (s: any) => _.eq(s.id, newScene.id));
      if (_.get(oldScene, "assetUrl") && !_.get(newScene, "assetUrl")) {
        return { ...newScene, assetUrl: oldScene.assetUrl, assetUrls: !_.isEmpty(newScene.assetUrls) ? newScene.assetUrls : !_.isEmpty(oldScene?.assetUrls) ? oldScene.assetUrls : [oldScene.assetUrl], assetName: newScene.assetName || oldScene?.assetName, assetType: newScene.assetType || oldScene?.assetType, };
      }
      return newScene;
    });
  }
  return newProject.storyboard;
}

function cleanupUnusedSceneImages(storyboard: any[], imageDir: string): void {
  if (!fs.existsSync(imageDir) || !_.isArray(storyboard)) return;

  const activeImageFiles = new Set<string>();
  _.forEach(storyboard, (scene: any) => {
    if (scene?.assetUrl && !_.eq(scene.assetUrl, COMMON_STRINGS.UNDEFINED)) {
      activeImageFiles.add(path.basename(scene.assetUrl));
    }
    if (_.isArray(scene?.assetUrls)) {
      _.forEach(scene.assetUrls, (url: string) => {
        if (url) activeImageFiles.add(path.basename(url));
      });
    }
  });

  _.forEach(storyboard, (newScene: any) => {
    const hasImage = (!_.isEmpty(newScene?.assetUrl) && !_.eq(newScene.assetUrl, COMMON_STRINGS.UNDEFINED)) || !_.isEmpty(newScene?.assetUrls);
    if (hasImage) return;

    try {
      const files = fs.readdirSync(imageDir);
      const newSceneIdStr = String(newScene.id);
      const cleanId = _.startsWith(newSceneIdStr, COMMON_STRINGS.SCENE_PREFIX) ? newSceneIdStr.slice(COMMON_STRINGS.SCENE_PREFIX.length) : newSceneIdStr;
      const prefix1 = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}${SecurityConstants.DOT}`;
      const prefix2 = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}_`;

      _.forEach(files, (file) => {
        if ((_.startsWith(file, prefix1) || _.startsWith(file, prefix2)) && !activeImageFiles.has(file)) {
          const filePath = path.join(imageDir, file);
          try {
            fs.unlinkSync(filePath);
            appLog(`${LOG_MESSAGES.DELETE_SCENE_IMAGE_DISK_SUCCESS}${filePath}`);
          } catch (err) {
            appError(`${ERROR_MESSAGES.DELETE_SCENE_IMAGE_DISK_ERR}${filePath}`, err);
          }
        }
      });
    } catch (err) {
      appError(`${ERROR_MESSAGES.READ_IMAGES_DIR_CLEAN_ERR}${imageDir}`, err);
    }
  });
}

function cleanupUnusedSceneAudios(storyboard: any[], oldProject: any, newProject: any, audioDir: string, cleanAudio: boolean): void {
  if (!cleanAudio || !fs.existsSync(audioDir) || !_.isArray(storyboard)) return;

  _.forEach(storyboard, (newScene: any) => {
    const hasAudio = !_.isEmpty(newScene?.audioUrl) && !_.eq(newScene.audioUrl, COMMON_STRINGS.UNDEFINED);
    if (hasAudio) return;

    try {
      const files = fs.readdirSync(audioDir);
      const newSceneIdStr = String(newScene.id);
      const cleanId = _.startsWith(newSceneIdStr, COMMON_STRINGS.SCENE_PREFIX) ? newSceneIdStr.slice(COMMON_STRINGS.SCENE_PREFIX.length) : newSceneIdStr;
      const prefix = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}${SecurityConstants.DOT}`;
      _.forEach(files, (file) => {
        if (_.startsWith(file, prefix)) {
          const filePath = path.join(audioDir, file);
          try {
            fs.unlinkSync(filePath);
            appLog(`${LOG_MESSAGES.DELETE_SCENE_AUDIO_DISK_SUCCESS}${filePath}`);
          } catch (err) {
            appError(`${ERROR_MESSAGES.DELETE_SCENE_AUDIO_DISK_ERR}${filePath}`, err);
          }
        }
      });
    } catch (err) {
      appError(`${ERROR_MESSAGES.READ_AUDIO_DIR_CLEAN_ERR}${audioDir}`, err);
    }
  });

  const oldAudioUrl = _.get(oldProject, "voiceConfig.audioUrl");
  const newAudioUrl = _.get(newProject, "voiceConfig.audioUrl");
  if (oldAudioUrl && (_.isEmpty(newAudioUrl) || _.eq(newAudioUrl, ""))) {
    const unifiedAudioFile = path.join(audioDir, COMMON_STRINGS.UNIFIED_WAV);
    if (fs.existsSync(unifiedAudioFile)) {
      try {
        fs.unlinkSync(unifiedAudioFile);
        appLog(`${LOG_MESSAGES.DELETE_UNIFIED_AUDIO_DISK_SUCCESS}${unifiedAudioFile}`);
      } catch (err) {
        appError(`${ERROR_MESSAGES.DELETE_UNIFIED_AUDIO_DISK_ERR}${unifiedAudioFile}`, err);
      }
    }
  }
}

function cleanupUnusedThumbnails(thumbnails: any[], thumbDir: string): void {
  if (!fs.existsSync(thumbDir)) return;

  try {
    const activeThumbnailFiles = new Set<string>();
    if (_.isArray(thumbnails)) {
      _.forEach(thumbnails, (thumb: any) => {
        if (thumb?.imageUrl && !_.startsWith(thumb.imageUrl, "data:")) {
          activeThumbnailFiles.add(path.basename(thumb.imageUrl));
        }
      });
    }
    const files = fs.readdirSync(thumbDir);
    _.forEach(files, (file) => {
      if (!activeThumbnailFiles.has(file)) {
        const filePath = path.join(thumbDir, file);
        try {
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            appLog(`${LOG_MESSAGES.DELETE_SCENE_IMAGE_DISK_SUCCESS}${filePath}`);
          }
        } catch (err) {
          appError(`${ERROR_MESSAGES.DELETE_SCENE_IMAGE_DISK_ERR}${filePath}`, err);
        }
      }
    });
  } catch (err) {
    appError(`${ERROR_MESSAGES.READ_IMAGES_DIR_CLEAN_ERR}${thumbDir}`, err);
  }
}

function cleanupUnusedReferenceFiles(newProject: any, referencesDir: string): void {
  if (!fs.existsSync(referencesDir)) return;

  try {
    const activeReferenceUrls = new Set<string>();
    const addRef = (val: unknown) => {
      if (_.isString(val) && !_.isEmpty(val) && !_.startsWith(val, "data:")) {
        activeReferenceUrls.add(val);
        activeReferenceUrls.add(path.basename(val));
      }
    };

    const addRefList = (list: unknown) => {
      if (_.isArray(list)) {
        _.forEach(list, (item) => addRef(item));
      }
    };

    const vc = newProject.visualConfig || {};
    addRefList(vc.styleReferenceImages);
    addRefList(vc.thumbnailReferenceImages);
    addRefList(vc.sceneReferenceImages);
    addRefList(vc.referenceImages);
    addRefList(vc.characterImages);
    if (_.isArray(vc.characters)) {
      _.forEach(vc.characters, (char: any) => {
        addRef(char?.referenceImage);
        addRef(char?.avatarUrl);
        addRefList(char?.images);
        addRefList(char?.referenceImages);
      });
    }

    if (_.isArray(newProject.storyboard)) {
      _.forEach(newProject.storyboard, (scene: any) => {
        addRef(scene?.assetUrl);
        addRefList(scene?.assetUrls);
        if (_.isArray(scene?.assetRevisions)) {
          _.forEach(scene.assetRevisions, (revision: any) => addRef(revision?.assetUrl));
        }
      });
    }

    const cfg = newProject.config || {};
    addRefList(cfg.referenceImages);
    addRefList(cfg.thumbnailReferenceImages);
    addRefList(cfg.sceneReferenceImages);
    addRef(cfg.musicAssetUrl);

    const groups = fs.readdirSync(referencesDir);
    _.forEach(groups, (groupName) => {
      const groupDir = path.join(referencesDir, groupName);
      if (fs.existsSync(groupDir) && fs.statSync(groupDir).isDirectory()) {
        const refFiles = fs.readdirSync(groupDir);
        _.forEach(refFiles, (file) => {
          const relUrl = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${newProject.id}/references/${groupName}/${file}`;
          const isReferenced = activeReferenceUrls.has(file) || activeReferenceUrls.has(relUrl) || Array.from(activeReferenceUrls).some((u) => u.includes(file));
          if (!isReferenced) {
            const filePath = path.join(groupDir, file);
            try {
              if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                appLog(`${LOG_MESSAGES.DELETE_SCENE_IMAGE_DISK_SUCCESS}${filePath}`);
              }
            } catch (err) {
              appError(`${ERROR_MESSAGES.DELETE_SCENE_IMAGE_DISK_ERR}${filePath}`, err);
            }
          }
        });
      }
    });
  } catch (err) {
    appError(`${ERROR_MESSAGES.READ_IMAGES_DIR_CLEAN_ERR}${referencesDir}`, err);
  }
}

function cleanUpDiskFiles(newProject: any, oldProject: any, projectDir: string, cleanAudio: boolean): void {
  cleanupUnusedSceneImages(newProject.storyboard, path.join(projectDir, IMAGES_DIR_NAME));
  cleanupUnusedSceneAudios(newProject.storyboard, oldProject, newProject, path.join(projectDir, VOICES_DIR_NAME), cleanAudio);
  cleanupUnusedThumbnails(newProject.thumbnails, path.join(projectDir, THUMBNAILS_DIR_NAME));
  cleanupUnusedReferenceFiles(newProject, path.join(projectDir, PROJECT_VISUAL_ASSET_CONFIG.REFERENCES_DIRECTORY));
}

async function saveProjectDetail(project: VideoProject): Promise<VideoProject> {
  try {
    const cleanedProjects = convertBase64AssetsToFiles([project]);
    const cleanedProject = cleanedProjects[0];
    await saveProjectDetailToDb(cleanedProject);
    return cleanedProject;
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_WRITE_ERR")} ${project.id}`, error);
    throw error;
  }
}

migrateJsonToSqlite().catch((error) => {
  appError(getBackendMsg("SQLITE_MIGRATE_CRITICAL"), error);
});

const inferLegacyChildKind = (project: VideoProject): ProjectKind | undefined => {
  if (_.endsWith(project.name, COMMON_STRINGS.STUDIO_CHILD_SUFFIX)) return ProjectKind.Studio;
  if (_.endsWith(project.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)) return ProjectKind.Auto;
  if (_.endsWith(project.name, COMMON_STRINGS.CINEMATIC_CHILD_SUFFIX)) return ProjectKind.Cinematic;
  return undefined;
};

const repairLegacyWorkspaceProjects = async (projects: VideoProject[]): Promise<boolean> => {
  let repaired = false;

  const rootProjectsByName = _.keyBy(
    _.filter(projects, (project) => _.isEmpty(project.parentId) && !inferLegacyChildKind(project)),
    (project) => _.trim(project.name),
  );
  for (const project of projects) {
    const inferredKind = inferLegacyChildKind(project);
    if (!project.parentId && !inferredKind) {
      if (_.isEqual(project.projectKind, ProjectKind.Container)) continue;
      const detail = await getProjectDetail(project.id);
      if (!detail) continue;
      await saveProjectDetailToDb({
        ...detail,
        projectKind: ProjectKind.Container,
      });
      repaired = true;
      continue;
    }
    if (!inferredKind) continue;

    const suffix = inferredKind === ProjectKind.Studio ? COMMON_STRINGS.STUDIO_CHILD_SUFFIX : inferredKind === ProjectKind.Cinematic ? COMMON_STRINGS.CINEMATIC_CHILD_SUFFIX : COMMON_STRINGS.AUTO_CHILD_SUFFIX;
    const parentName = _.trim(project.name.slice(0, -suffix.length));
    const inferredParent = rootProjectsByName[parentName];
    const targetParentId = project.parentId || inferredParent?.id;
    if (!targetParentId) continue;
    if (_.isEqual(project.projectKind, inferredKind) && _.isEqual(project.parentId, targetParentId)) continue;

    if (_.isEqual(targetParentId, project.id)) continue;

    const detail = await getProjectDetail(project.id);
    if (!detail) continue;

    await saveProjectDetailToDb({
      ...detail,
      parentId: targetParentId,
      projectKind: inferredKind,
    });
    repaired = true;
  }

  return repaired;
};

export const getAllProjects = async (_request: Request, response: Response) => {
  try {
    const list = await getProjectsListFromDb();
    const repaired = await repairLegacyWorkspaceProjects(list);
    response.json(repaired ? await getProjectsListFromDb() : list);
  } catch (error: any) {
    response.status(500).json({ error: _.defaultTo(error.message, getBackendMsg("SQLITE_LIST_ERR")) });
  }
};

export const getProjectById = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const project = await getProjectDetail(id);
    if (project) response.json(project); else {
      response.status(404).json({ error: getBackendMsg(ERROR_MESSAGES.PROJECT_NOT_FOUND) });
    }
  } catch (error: any) {
    response.status(500).json({ error: _.defaultTo(error.message, getBackendMsg("SQLITE_DETAIL_ERR")) });
  }
};

export const createProject = async (request: Request, response: Response) => {
  const now = new Date().toISOString();
  const newProject: VideoProject = {
    ...request.body,
    id: _.defaultTo(request.body.id, randomUUID()),
    createdAt: _.defaultTo(request.body.createdAt, now),
    updatedAt: _.defaultTo(request.body.updatedAt, now),
  };
  try {
    const savedProject = await saveProjectDetail(newProject);
    response.status(201).json(savedProject);
  } catch (error: any) {
    response.status(500).json({ error: _.defaultTo(error.message, getBackendMsg("SQLITE_WRITE_ERR")) });
  }
};

function renameProjectAssetsDir(oldDir: string, newDir: string, newProject: any, oldProject: any): boolean {
  if (!fs.existsSync(oldDir)) return true;

  try {
    fs.renameSync(oldDir, newDir);
    return true;
  } catch (err) {
    appError(`${ERROR_MESSAGES.RENAME_ASSETS_DIR_ERR}${ERROR_MESSAGES.RENAME_ASSETS_DIR_ERR_FALLBACK}`, err);
    try {
      fs.cpSync(oldDir, newDir, { recursive: true });
      try {
        fs.rmSync(oldDir, { recursive: true, force: true });
      } catch (rmErr) {
        appLog(`${LOG_MESSAGES.DELETE_OLD_LOCKED_DIR_WARN}${oldDir}`);
      }
      return true;
    } catch (cpErr) {
      appError(ERROR_MESSAGES.COPY_ASSETS_DIR_ERR, cpErr);
      newProject.name = oldProject.name;
      return false;
    }
  }
}

export const updateProject = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const oldProject = await getProjectDetail(id);

    if (oldProject) {
      let newProject = request.body;

      const failedBeforeProducingStoryboard = _.includes([REFACTOR_CONSTANTS.STATUS_PARTIAL, REFACTOR_CONSTANTS.STATUS_FAILED], newProject.status) && _.isEmpty(newProject.storyboard) && !_.isEmpty(oldProject.storyboard);
      if (failedBeforeProducingStoryboard && !newProject.isRecreatingStoryboard) {
        newProject = {
          ...newProject,
          storyboard: oldProject.storyboard,
          thumbnails: _.isEmpty(newProject.thumbnails) ? oldProject.thumbnails : newProject.thumbnails,
          voiceConfig: _.isEmpty(newProject.voiceConfig?.audioUrl) && _.isEmpty(newProject.voiceConfig?.audioBase64) ? oldProject.voiceConfig : newProject.voiceConfig,
          renderedVideoUrl: newProject.renderedVideoUrl || oldProject.renderedVideoUrl,
        };
      }

      if (newProject.name && oldProject.name && !_.eq(newProject.name, oldProject.name)) {
        const assetsDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
        const oldDir = path.join(assetsDir, getSafeFolderName(oldProject.name));
        const newDir = path.join(assetsDir, id);
        if (fs.existsSync(oldDir) && !fs.existsSync(newDir)) {
          renameProjectAssetsDir(oldDir, newDir, newProject, oldProject);
        }
      }

      const folderName = id;
      const projectDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, folderName);

      if (oldProject?.storyboard && newProject?.storyboard) {
        if (newProject.isRecreatingStoryboard) {
          const imageDir = path.join(projectDir, IMAGES_DIR_NAME);
          if (fs.existsSync(imageDir)) {
            try {
              fs.rmSync(imageDir, { recursive: true, force: true });
              fs.mkdirSync(imageDir, { recursive: true });
              appLog(`${LOG_MESSAGES.BULK_DELETE_PROJECT_DIR_SUCCESS}${imageDir}`);
            } catch (err) {
              appError(`${ERROR_MESSAGES.BULK_DELETE_PROJECT_DIR_ERR}${imageDir}`, err);
            }
          }
        } else {
          newProject.storyboard = syncOrphanedScenes(newProject, oldProject);
        }
      }

      cleanUpDiskFiles(newProject, oldProject, projectDir, Boolean(newProject.allowAudioCleanup));

      delete newProject.allowBulkDeleteImages;
      delete newProject.isRecreatingStoryboard;
      delete newProject.allowAudioCleanup;

      const updatedProject = { ...oldProject, ...newProject, updatedAt: new Date().toISOString() };
      const savedProject = await saveProjectDetail(updatedProject);
      response.json(savedProject);
    } else {
      const now = new Date().toISOString();
      const newProject: VideoProject = {
        ...request.body,
        id: id,
        createdAt: _.defaultTo(request.body.createdAt, now),
        updatedAt: _.defaultTo(request.body.updatedAt, now),
      };
      const savedProject = await saveProjectDetail(newProject);
      response.json(savedProject);
    }
  } catch (error: any) {
    response.status(500).json({ error: _.defaultTo(error.message, getBackendMsg("SQLITE_WRITE_ERR")) });
  }
};

export const deleteProject = async (request: Request, response: Response) => {
  const { id } = request.params;
  const isVi = !_.eq(request.query.lang, COMMON_STRINGS.EN);

  try {
    const projects = (await getProjectsListFromDb()) as VideoProject[];
    const projectTree = getProjectTree(projects, id);
    const projectsToDelete = _.isEmpty(projectTree) ? _.compact([await getProjectDetail(id)]) : projectTree;
    const deletionResults = await Promise.all(_.map(projectsToDelete, (project) => deleteProjectFromDb(project.id)));
    const deleted = _.some(deletionResults);

    if (deleted) {
      const assetsRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
      _.forEach(projectsToDelete, (project) => {
        deleteProjectAssetDirectory(assetsRoot, project.id);
        deleteProjectAssetDirectory(assetsRoot, getSafeFolderName(project.name));
      });
      response.json({ success: true });
    } else {
      response.status(404).json({ error: getBackendMsg(ERROR_MESSAGES.PROJECT_NOT_FOUND, isVi) });
    }
  } catch (error: any) {
    response.status(500).json({ error: _.defaultTo(error.message, getBackendMsg("SQLITE_DELETE_ERR")) });
  }
};
