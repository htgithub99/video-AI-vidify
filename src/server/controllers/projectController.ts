import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { VideoProject } from "../../types.js";
import { randomUUID } from "crypto";
import _ from 'lodash';

import { EXTERNAL_URLS, UNSPLASH_IMAGE_REGEX, ASSETS_DIR_NAME, PROJECTS_DIR_NAME, IMAGES_DIR_NAME, VOICES_DIR_NAME, getBackendMsg, ERROR_MESSAGES, COMMON_STRINGS, LOG_MESSAGES, VIETNAMESE_ACCENT_MARKS_REGEX, VIETNAMESE_D_LETTER_REGEX, SAFE_FOLDER_CHARS_REGEX, MULTIPLE_SPACES_REGEX, BASE64_IMAGE_MIME_REGEX, URL_ENCODED_COMMA_REGEX, URL_ENCODED_PLUS_REGEX, URL_ENCODED_LITERAL_COMMA_REGEX } from "../../constants";
import { appError, appLog } from "../../lib/logger.js";
import { getProjectsListFromDb, getProjectDetailFromDb, saveProjectDetailToDb, deleteProjectFromDb, migrateJsonToSqlite } from "../utils/db.js";
import { getDataDirectory } from "../utils/paths.js";

async function getProjectDetail(id: string): Promise<VideoProject | null> {
  try {
    const project = await getProjectDetailFromDb(id);
    if (!project) return null;
    
    const projectStr = JSON.stringify(project);
    const cleaned = _.replace(projectStr, UNSPLASH_IMAGE_REGEX, (match, query) => {
      const decoded = decodeURIComponent(query)
        .replace(URL_ENCODED_COMMA_REGEX, ",")
        .replace(URL_ENCODED_PLUS_REGEX, ",")
        .replace(URL_ENCODED_LITERAL_COMMA_REGEX, ",");
      return `${EXTERNAL_URLS.LOREM_FLICKR}/${COMMON_STRINGS.LOREM_FLICKR_SIZE}/${decoded}`;
    });
    return JSON.parse(cleaned) as VideoProject;
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_DETAIL_ERR")} ${id}`, error);
    return null;
  }
}

function getSafeFolderName(name: string): string {
  if (_.isEmpty(name)) return COMMON_STRINGS.PROJECT_DEFAULT_NAME;
  
  const safeName = name.normalize(COMMON_STRINGS.NORMALIZATION_FORM)
    .replace(VIETNAMESE_ACCENT_MARKS_REGEX, "")
    .replace(VIETNAMESE_D_LETTER_REGEX, "d")
    .replace(SAFE_FOLDER_CHARS_REGEX, "")
    .trim()
    .replace(MULTIPLE_SPACES_REGEX, "_")
    .toUpperCase();

  return safeName || COMMON_STRINGS.PROJECT_DEFAULT_NAME;
}

function replaceAssetPaths(project: VideoProject, oldFolderName: string, newFolderName: string): VideoProject {
  const oldPathPrefix = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${oldFolderName}${COMMON_STRINGS.SLASH_PREFIX}`;
  const newPathPrefix = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${newFolderName}${COMMON_STRINGS.SLASH_PREFIX}`;

  const storyboard = _.map(project.storyboard || [], (scene) => {
    let { assetUrl, assetUrls, audioUrl } = scene;

    if (_.includes(assetUrl, oldPathPrefix)) assetUrl = _.replace(assetUrl, oldPathPrefix, newPathPrefix);
    
    if (_.size(assetUrls) > 0) {
      assetUrls = _.map(assetUrls, (url) => _.includes(url, oldPathPrefix) ? _.replace(url, oldPathPrefix, newPathPrefix) : url);
    }
    
    if (_.includes(audioUrl, oldPathPrefix)) audioUrl = _.replace(audioUrl, oldPathPrefix, newPathPrefix);
    
    return { ...scene, assetUrl, assetUrls, audioUrl };
  });

  const thumbnails = _.map(project.thumbnails || [], (thumb) => {
    let { imageUrl } = thumb;
    if (_.includes(imageUrl, oldPathPrefix)) imageUrl = _.replace(imageUrl, oldPathPrefix, newPathPrefix);
    return { ...thumb, imageUrl };
  });

  let voiceConfig = project.voiceConfig;
  const oldVoiceUrl = _.get(voiceConfig, 'audioUrl', '');
  if (_.includes(oldVoiceUrl, oldPathPrefix)) {
    voiceConfig = { ...voiceConfig, audioUrl: _.replace(oldVoiceUrl, oldPathPrefix, newPathPrefix) };
  }

  return { ...project, storyboard, thumbnails, voiceConfig };
}

function processSceneAssets(scene: any, imageDir: string, audioDir: string, folderName: string): any {
  let { assetUrl, assetUrls, audioUrl, audioBase64 } = scene;
  let sceneUpdated = false;
  assetUrls = assetUrls || [];

  if (_.includes(assetUrl, COMMON_STRINGS.BASE64_IMAGE_PREFIX)) {
    const matches = assetUrl.match(BASE64_IMAGE_MIME_REGEX);
    if (matches) {
      const ext = _.eq(matches[1], COMMON_STRINGS.JPEG_EXT) ? COMMON_STRINGS.JPG_EXT : matches[1];
      const data = matches[2];
      const fileName = `${COMMON_STRINGS.SCENE_PREFIX}${scene.id}.${ext}`;
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

  if (_.some(assetUrls, (url) => _.includes(url, COMMON_STRINGS.BASE64_IMAGE_PREFIX))) {
    assetUrls = assetUrl ? [assetUrl] : [];
    sceneUpdated = true;
  }

  if (assetUrl) {
    const isNotBase64 = !_.includes(assetUrl, COMMON_STRINGS.BASE64_IMAGE_PREFIX);
    const needsSync = _.isEmpty(assetUrls) || !_.eq(_.size(assetUrls), 1) || !_.includes(assetUrls, assetUrl);
    if (isNotBase64 && needsSync) {
      assetUrls = [assetUrl];
      sceneUpdated = true;
    }
  } else if (!_.isEmpty(assetUrls)) {
    assetUrls = [];
    sceneUpdated = true;
  }

  const hasBase64Audio = _.isString(audioBase64) && _.gt(_.size(audioBase64), COMMON_STRINGS.BASE64_AUDIO_LENGTH_THRESHOLD) && !_.some([COMMON_STRINGS.SLASH_PREFIX, COMMON_STRINGS.HTTP_PREFIX], (prefix) => _.startsWith(audioBase64, prefix));
  
  if (hasBase64Audio) {
    const fileName = `${COMMON_STRINGS.SCENE_PREFIX}${scene.id}${COMMON_STRINGS.WAV_EXT}`;
    const filePath = path.join(audioDir, fileName);
    try {
      fs.writeFileSync(filePath, Buffer.from(audioBase64, COMMON_STRINGS.BASE64));
      audioUrl = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${folderName}${COMMON_STRINGS.SLASH_PREFIX}${VOICES_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${fileName}`;
      delete scene.audioBase64;
      sceneUpdated = true;
    } catch (err) {
      appError(`${ERROR_MESSAGES.WRITE_SCENE_AUDIO_ERR}${scene.id}`, err);
    }
  }

  if (sceneUpdated) {
    return { ...scene, assetUrl, assetUrls, audioUrl, isUpdated: true };
  }
  return scene;
}

function processThumbAssets(thumb: any, imageDir: string, folderName: string): any {
  let { imageUrl } = thumb;
  let thumbUpdated = false;

  if (_.includes(imageUrl, COMMON_STRINGS.BASE64_IMAGE_PREFIX)) {
    const matches = imageUrl?.match(BASE64_IMAGE_MIME_REGEX);
    if (matches) {
      const ext = _.eq(matches[1], COMMON_STRINGS.JPEG_EXT) ? COMMON_STRINGS.JPG_EXT : matches[1];
      const data = matches[2];
      const fileName = `${COMMON_STRINGS.THUMB_PREFIX}${thumb.id}.${ext}`;
      const filePath = path.join(imageDir, fileName);

      try {
        fs.writeFileSync(filePath, Buffer.from(data, COMMON_STRINGS.BASE64));
        imageUrl = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${folderName}${COMMON_STRINGS.SLASH_PREFIX}${IMAGES_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${fileName}`;
        thumbUpdated = true;
      } catch (err) {
        appError(`${ERROR_MESSAGES.WRITE_THUMB_IMAGE_ERR}${thumb.id}`, err);
      }
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

  const audioBase64 = _.get(voiceConfig, 'audioBase64');
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
    const folderName = getSafeFolderName(project.name);
    const projectDir = path.join(assetsDir, folderName);
    const imageDir = path.join(projectDir, IMAGES_DIR_NAME);
    const audioDir = path.join(projectDir, VOICES_DIR_NAME);

    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

    let storyboardUpdated = false;
    let storyboard = project.storyboard;
    if (_.isArray(storyboard)) {
      storyboard = _.map(storyboard, (scene) => {
        const processed = processSceneAssets(scene, imageDir, audioDir, folderName);
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
        const processed = processThumbAssets(thumb, imageDir, folderName);
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
      if (_.get(oldScene, 'assetUrl') && !_.get(newScene, 'assetUrl')) {
        return {
          ...newScene,
          assetUrl: oldScene.assetUrl,
          assetUrls: !_.isEmpty(newScene.assetUrls) ? newScene.assetUrls : (!_.isEmpty(oldScene?.assetUrls) ? oldScene.assetUrls : [oldScene.assetUrl]),
          assetName: newScene.assetName || oldScene?.assetName,
          assetType: newScene.assetType || oldScene?.assetType,
        };
      }
      return newScene;
    });
  }
  return newProject.storyboard;
}

function cleanUpDiskFiles(newProject: any, oldProject: any, projectDir: string) {
  const imageDir = path.join(projectDir, IMAGES_DIR_NAME);
  const audioDir = path.join(projectDir, VOICES_DIR_NAME);

  _.forEach(newProject.storyboard, (newScene: any) => {
    const newHasImage = (!_.isEmpty(newScene?.assetUrl) && !_.eq(newScene.assetUrl, COMMON_STRINGS.UNDEFINED)) || !_.isEmpty(newScene?.assetUrls);
    
    if (!newHasImage && fs.existsSync(imageDir)) {
      try {
        const files = fs.readdirSync(imageDir);
        const prefix1 = `${COMMON_STRINGS.SCENE_PREFIX}${newScene.id}.`;
        const prefix2 = `${COMMON_STRINGS.SCENE_PREFIX}${newScene.id}_`;

        _.forEach(files, (file) => {
          if (_.startsWith(file, prefix1) || _.startsWith(file, prefix2)) {
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
    }

    const newHasAudio = (!_.isEmpty(newScene?.audioUrl) && !_.eq(newScene.audioUrl, COMMON_STRINGS.UNDEFINED));
    
    if (!newHasAudio && fs.existsSync(audioDir)) {
      try {
        const files = fs.readdirSync(audioDir);
        const prefix = `${COMMON_STRINGS.SCENE_PREFIX}${newScene.id}.`;
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
    }
  });

  const oldAudioUrl = _.get(oldProject, 'voiceConfig.audioUrl');
  const newAudioUrl = _.get(newProject, 'voiceConfig.audioUrl');
  
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

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const list = await getProjectsListFromDb();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || getBackendMsg("SQLITE_LIST_ERR") });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const project = await getProjectDetail(id);
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ error: getBackendMsg(ERROR_MESSAGES.PROJECT_NOT_FOUND) });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || getBackendMsg("SQLITE_DETAIL_ERR") });
  }
};

export const createProject = async (req: Request, res: Response) => {
  const now = new Date().toISOString();
  const newProject: VideoProject = {
    ...req.body,
    id: req.body.id || randomUUID(),
    createdAt: req.body.createdAt || now,
    updatedAt: req.body.updatedAt || now,
  };
  try {
    const savedProject = await saveProjectDetail(newProject);
    res.status(201).json(savedProject);
  } catch (error: any) {
    res.status(500).json({ error: error.message || getBackendMsg("SQLITE_WRITE_ERR") });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const oldProject = await getProjectDetail(id);

    if (oldProject) {
      let newProject = req.body;
      let isRenamed = false;
      let oldFolderName = "";
      let newFolderName = "";

      if (newProject.name && oldProject.name && !_.eq(newProject.name, oldProject.name)) {
        oldFolderName = getSafeFolderName(oldProject.name);
        newFolderName = getSafeFolderName(newProject.name);

        if (!_.eq(oldFolderName, newFolderName)) {
          isRenamed = true;
          const assetsDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
          const oldDir = path.join(assetsDir, oldFolderName);
          const newDir = path.join(assetsDir, newFolderName);

          if (fs.existsSync(oldDir)) {
            try {
              fs.renameSync(oldDir, newDir);
            } catch (err) {
              appError(ERROR_MESSAGES.RENAME_ASSETS_DIR_ERR, err);
            }
          }
        }
      }

      if (oldProject?.storyboard && newProject?.storyboard) {
        const folderName = getSafeFolderName(newProject.name || oldProject.name);
        const projectDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, folderName);

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
          cleanUpDiskFiles(newProject, oldProject, projectDir);
        }
      }

      delete newProject.allowBulkDeleteImages;
      delete newProject.isRecreatingStoryboard;

      let updatedProject = { ...oldProject, ...newProject, updatedAt: new Date().toISOString() };
      if (isRenamed) {
        updatedProject = replaceAssetPaths(updatedProject, oldFolderName, newFolderName);
      }
      
      const savedProject = await saveProjectDetail(updatedProject);
      res.json(savedProject);
    } else {
      const isVi = !_.eq(req.query.lang, COMMON_STRINGS.EN);
      res.status(404).json({ error: getBackendMsg(ERROR_MESSAGES.PROJECT_NOT_FOUND, isVi) });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || getBackendMsg("SQLITE_WRITE_ERR") });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const isVi = !_.eq(req.query.lang, COMMON_STRINGS.EN);

  try {
    const project = await getProjectDetail(id);
    const deleted = await deleteProjectFromDb(id);

    if (deleted) {
      if (project?.name) {
        const folderName = getSafeFolderName(project.name);
        const projectDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, folderName);
        if (fs.existsSync(projectDir)) {
          try {
            fs.rmSync(projectDir, { recursive: true, force: true });
          } catch (err) {
            appError(ERROR_MESSAGES.DELETE_PROJECT_ASSETS_ERR, err);
          }
        }
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: getBackendMsg(ERROR_MESSAGES.PROJECT_NOT_FOUND, isVi) });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || getBackendMsg("SQLITE_DELETE_ERR") });
  }
};
