import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { ProjectKind, VideoProject } from "../../types.js";
import { randomUUID } from "crypto";
import _ from 'lodash';

import { REFACTOR_CONSTANTS, EXTERNAL_URLS, UNSPLASH_IMAGE_REGEX, ASSETS_DIR_NAME, PROJECTS_DIR_NAME, IMAGES_DIR_NAME, VOICES_DIR_NAME, THUMBNAILS_DIR_NAME, VIDEOS_DIR_NAME, getBackendMsg, ERROR_MESSAGES, COMMON_STRINGS, LOG_MESSAGES, VIETNAMESE_ACCENT_MARKS_REGEX, VIETNAMESE_D_LETTER_REGEX, SAFE_FOLDER_CHARS_REGEX, MULTIPLE_SPACES_REGEX, BASE64_IMAGE_MIME_REGEX, BASE64_VIDEO_MIME_REGEX, URL_ENCODED_COMMA_REGEX, URL_ENCODED_PLUS_REGEX, URL_ENCODED_LITERAL_COMMA_REGEX, ASSET_PROJECT_PATH_REGEX, SecurityConstants, ALIGN_CONFIG } from "../../constants/index.js";
import { appError, appLog } from "../../lib/logger.js";
import { getProjectsListFromDb, getProjectDetailFromDb, saveProjectDetailToDb, deleteProjectFromDb, migrateJsonToSqlite } from "../utils/db.js";
import { getDataDirectory } from "../utils/paths.js";
import { jsonUtils } from "../../lib/json.js";

async function getProjectDetail(id: string): Promise<VideoProject | null> {
  try {
    const project = await getProjectDetailFromDb(id);
    if (!project) return null;

    const projectStr = jsonUtils.safeStringify(project);
    const cleaned = _.replace(projectStr, UNSPLASH_IMAGE_REGEX, (match, query) => {
      const decoded = decodeURIComponent(query)
        .replace(URL_ENCODED_COMMA_REGEX, ",")
        .replace(URL_ENCODED_PLUS_REGEX, ",")
        .replace(URL_ENCODED_LITERAL_COMMA_REGEX, ",");
      return `${EXTERNAL_URLS.LOREM_FLICKR}/${COMMON_STRINGS.LOREM_FLICKR_SIZE}/${decoded}`;
    });
    return jsonUtils.safeParse<VideoProject>(cleaned, null);
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_DETAIL_ERR")} ${id}`, error);
    return null;
  }
}

export function getSafeFolderName(name: string): string {
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


function processSceneAssets(scene: any, imageDir: string, audioDir: string, videoDir: string, folderName: string): any {
  const imgBase64 = _.get(scene, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY);
  if (imgBase64 && !_.get(scene, REFACTOR_CONSTANTS.AVG_ASSET_URL_KEY)) {
    _.set(scene, REFACTOR_CONSTANTS.AVG_ASSET_URL_KEY, imgBase64);
  }
  if (imgBase64) {
    delete scene[REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY];
  }

  let { assetUrl, assetUrls, audioUrl, audioBase64 } = scene;
  let sceneUpdated = false;
  assetUrls = assetUrls || [];

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

  if (_.some(assetUrls, (url) => _.some(
    [COMMON_STRINGS.BASE64_IMAGE_PREFIX, COMMON_STRINGS.BASE64_VIDEO_PREFIX],
    (prefix) => _.includes(url, prefix),
  ))) {
    assetUrls = assetUrl ? [assetUrl] : [];
    sceneUpdated = true;
  }

  if (assetUrl) {
    const isNotBase64 = _.every(
      [COMMON_STRINGS.BASE64_IMAGE_PREFIX, COMMON_STRINGS.BASE64_VIDEO_PREFIX],
      (prefix) => !_.includes(assetUrl, prefix),
    );
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
  }

  const hasBase64Audio = _.isString(audioBase64) && _.gt(_.size(audioBase64), COMMON_STRINGS.BASE64_AUDIO_LENGTH_THRESHOLD) && !_.some([COMMON_STRINGS.SLASH_PREFIX, COMMON_STRINGS.HTTP_PREFIX], (prefix) => _.startsWith(audioBase64, prefix));

  if (hasBase64Audio) {
    const sceneIdStr = String(scene.id);
    const cleanId = _.startsWith(sceneIdStr, COMMON_STRINGS.SCENE_PREFIX) ? sceneIdStr.slice(COMMON_STRINGS.SCENE_PREFIX.length) : sceneIdStr;
    const fileName = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}${COMMON_STRINGS.WAV_EXT}`;
    const filePath = path.join(audioDir, fileName);
    try {
      fs.writeFileSync(filePath, Buffer.from(audioBase64, COMMON_STRINGS.BASE64));
      audioUrl = `${COMMON_STRINGS.SLASH_PREFIX}${ASSETS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${PROJECTS_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${folderName}${COMMON_STRINGS.SLASH_PREFIX}${VOICES_DIR_NAME}${COMMON_STRINGS.SLASH_PREFIX}${fileName}`;
      delete scene.audioBase64;
      sceneUpdated = true;
    } catch (err) {
      appError(`${ERROR_MESSAGES.WRITE_SCENE_AUDIO_ERR}${scene.id}`, err);
    }
  } else if (audioUrl) {
    const fixedAudioUrl = enforceCorrectFolder(audioUrl);
    if (!_.eq(fixedAudioUrl, audioUrl)) {
      audioUrl = fixedAudioUrl;
      sceneUpdated = true;
    }
  }

  if (sceneUpdated) {
    return { ...scene, assetUrl, assetUrls, audioUrl, isUpdated: true };
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

    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

    let storyboardUpdated = false;
    let storyboard = project.storyboard;
    if (_.isArray(storyboard)) {
      storyboard = _.map(storyboard, (scene) => {
        const processed = processSceneAssets(scene, imageDir, audioDir, videoDir, folderName);
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
        const canonicalFileName = _.replace(
          fileName,
          ALIGN_CONFIG.LEGACY_SEGMENT_PREFIX,
          REFACTOR_CONSTANTS.VD_EMPTY_STRING,
        );
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
        const newSceneIdStr = String(newScene.id);
        const cleanId = _.startsWith(newSceneIdStr, COMMON_STRINGS.SCENE_PREFIX) ? newSceneIdStr.slice(COMMON_STRINGS.SCENE_PREFIX.length) : newSceneIdStr;
        const prefix1 = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}${SecurityConstants.DOT}`;
        const prefix2 = `${COMMON_STRINGS.SCENE_PREFIX}${cleanId}_`;

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

export const getAllProjects = async (request: Request, response: Response) => {
  try {
    const list = await getProjectsListFromDb();
    response.json(list);
  } catch (error: any) {
    response.status(500).json({ error: _.defaultTo(error.message, getBackendMsg("SQLITE_LIST_ERR")) });
  }
};

export const getProjectById = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const project = await getProjectDetail(id);
    if (project) {
      response.json(project);
    } else {
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

      if (newProject.name && oldProject.name && !_.eq(newProject.name, oldProject.name)) {
        const assetsDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
        const oldDir = path.join(assetsDir, getSafeFolderName(oldProject.name));
        const newDir = path.join(assetsDir, id);
        if (fs.existsSync(oldDir) && !fs.existsSync(newDir)) {
          renameProjectAssetsDir(oldDir, newDir, newProject, oldProject);
        }
      }

      if (oldProject?.storyboard && newProject?.storyboard) {
        const folderName = id;
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
    const project = await getProjectDetail(id);
    const deleted = await deleteProjectFromDb(id);

    if (deleted) {
      if (project?.id) {
        const projectDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, project.id);
        if (fs.existsSync(projectDir)) {
          try {
            fs.rmSync(projectDir, { recursive: true, force: true });
          } catch (err) {
            appError(ERROR_MESSAGES.DELETE_PROJECT_ASSETS_ERR, err);
          }
        }
      }
      if (project?.name) {
        const folderName = getSafeFolderName(project.name);
        const oldProjectDir = path.join(getDataDirectory(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME, folderName);
        if (fs.existsSync(oldProjectDir)) {
          try {
            fs.rmSync(oldProjectDir, { recursive: true, force: true });
          } catch (err) { }
        }
      }
      response.json({ success: true });
    } else {
      response.status(404).json({ error: getBackendMsg(ERROR_MESSAGES.PROJECT_NOT_FOUND, isVi) });
    }
  } catch (error: any) {
    response.status(500).json({ error: _.defaultTo(error.message, getBackendMsg("SQLITE_DELETE_ERR")) });
  }
};
