import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { VideoProject } from "../../types.js";
import { randomUUID } from "crypto";
import { EXTERNAL_URLS, UNSPLASH_IMAGE_REGEX, ASSETS_DIR_NAME, PROJECTS_DIR_NAME, IMAGES_DIR_NAME, VOICES_DIR_NAME, getBackendMsg, ERROR_MESSAGES, COMMON_STRINGS, LOG_MESSAGES, VIETNAMESE_ACCENT_MARKS_REGEX, VIETNAMESE_D_LETTER_REGEX, SAFE_FOLDER_CHARS_REGEX, MULTIPLE_SPACES_REGEX, BASE64_IMAGE_MIME_REGEX } from "../../constants";
import { appError, appLog } from "../../lib/logger.js";
import { getProjectsListFromDb, getProjectDetailFromDb, saveProjectDetailToDb, deleteProjectFromDb, migrateJsonToSqlite } from "../utils/db.js";

async function getProjectDetail(id: string): Promise<VideoProject | null> {
  try {
    const project = await getProjectDetailFromDb(id);
    if (project) {
      const projectStr = JSON.stringify(project);
      const cleaned = projectStr.replace(UNSPLASH_IMAGE_REGEX, (match, query) => {
        const decoded = decodeURIComponent(query).replace(/%2C/g, ",").replace(/\+/g, ",").replace(/,/g, ",");
        return `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${decoded}`;
      });
      return JSON.parse(cleaned) as VideoProject;
    }
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_DETAIL_ERR")} ${id}`, error);
  }
  return null;
}

function getSafeFolderName(name: string): string {
  if (!name) return COMMON_STRINGS.PROJECT_DEFAULT_NAME;
  const safeName = name.normalize("NFD").replace(VIETNAMESE_ACCENT_MARKS_REGEX, "").replace(VIETNAMESE_D_LETTER_REGEX, "d").replace(SAFE_FOLDER_CHARS_REGEX, "").trim().replace(MULTIPLE_SPACES_REGEX, "_").toUpperCase();

  return safeName || COMMON_STRINGS.PROJECT_DEFAULT_NAME;
}

function replaceAssetPaths(project: VideoProject, oldFolderName: string, newFolderName: string): VideoProject {
  const oldPathPrefix = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${oldFolderName}/`;
  const newPathPrefix = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${newFolderName}/`;

  let storyboard = project.storyboard;
  if (storyboard && Array.isArray(storyboard)) {
    storyboard = storyboard.map((scene) => {
      let assetUrl = scene.assetUrl;
      let assetUrls = scene.assetUrls || [];
      let audioUrl = scene.audioUrl;

      if (assetUrl && assetUrl.startsWith(oldPathPrefix)) {
        assetUrl = assetUrl.replace(oldPathPrefix, newPathPrefix);
      }
      if (assetUrls.length > 0) {
        assetUrls = assetUrls.map((url) => (url && url.startsWith(oldPathPrefix) ? url.replace(oldPathPrefix, newPathPrefix) : url));
      }
      if (audioUrl && audioUrl.startsWith(oldPathPrefix)) {
        audioUrl = audioUrl.replace(oldPathPrefix, newPathPrefix);
      }

      return {
        ...scene,
        assetUrl,
        assetUrls,
        audioUrl,
      };
    });
  }

  let thumbnails = project.thumbnails;
  if (thumbnails && Array.isArray(thumbnails)) {
    thumbnails = thumbnails.map((thumb) => {
      let imageUrl = thumb.imageUrl;
      if (imageUrl && imageUrl.startsWith(oldPathPrefix)) {
        imageUrl = imageUrl.replace(oldPathPrefix, newPathPrefix);
      }
      return {
        ...thumb,
        imageUrl,
      };
    });
  }

  let voiceConfig = project.voiceConfig;
  if (voiceConfig && (voiceConfig as any).audioUrl && (voiceConfig as any).audioUrl.startsWith(oldPathPrefix)) {
    voiceConfig = {
      ...voiceConfig,
      audioUrl: (voiceConfig as any).audioUrl.replace(oldPathPrefix, newPathPrefix),
    };
  }

  return {
    ...project,
    storyboard,
    thumbnails,
    voiceConfig,
  };
}

function convertBase64AssetsToFiles(projects: VideoProject[]): VideoProject[] {
  const assetsDir = path.join(process.cwd(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);

  return projects.map((project) => {
    const folderName = getSafeFolderName(project.name);
    const projectDir = path.join(assetsDir, folderName);
    const imageDir = path.join(projectDir, IMAGES_DIR_NAME);
    const audioDir = path.join(projectDir, VOICES_DIR_NAME);

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    let storyboardUpdated = false;
    let storyboard = project.storyboard;
    if (storyboard && Array.isArray(storyboard)) {
      storyboard = storyboard.map((scene) => {
        let assetUrl = scene.assetUrl;
        let assetUrls = scene.assetUrls || [];
        let audioUrl = scene.audioUrl;
        let sceneUpdated = false;

        if (assetUrl && assetUrl.includes(COMMON_STRINGS.BASE64_IMAGE_PREFIX)) {
          const matches = assetUrl.match(BASE64_IMAGE_MIME_REGEX);
          if (matches) {
            const ext = matches[1] === COMMON_STRINGS.JPEG_EXT ? COMMON_STRINGS.JPG_EXT : matches[1];
            const data = matches[2];
            const fileName = `scene_${scene.id}.${ext}`;
            const filePath = path.join(imageDir, fileName);

            try {
              fs.writeFileSync(filePath, Buffer.from(data, "base64"));
              assetUrl = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${folderName}/${IMAGES_DIR_NAME}/${fileName}`;
              sceneUpdated = true;
              storyboardUpdated = true;
            } catch (err) {
              appError(`${ERROR_MESSAGES.WRITE_SCENE_IMAGE_ERR}${scene.id}`, err);
            }
          }
        }

        if (assetUrls?.length) {
          const hasBase64 = assetUrls.some((url) => url && url.includes(COMMON_STRINGS.BASE64_IMAGE_PREFIX));
          if (hasBase64) {
            assetUrls = assetUrl ? [assetUrl] : [];
            sceneUpdated = true;
            storyboardUpdated = true;
          }
        }

        if (assetUrl) {
          const isNotBase64 = !assetUrl.includes(COMMON_STRINGS.BASE64_IMAGE_PREFIX);
          const needsSync = !assetUrls || assetUrls.length !== 1 || !assetUrls.includes(assetUrl);
          if (isNotBase64 && needsSync) {
            assetUrls = [assetUrl];
            sceneUpdated = true;
            storyboardUpdated = true;
          }
        } else {
          if (assetUrls?.length) {
            assetUrls = [];
            sceneUpdated = true;
            storyboardUpdated = true;
          }
        }

        const anyScene = scene as any;
        const hasBase64Audio = typeof anyScene.audioBase64 === "string" && anyScene.audioBase64.length > COMMON_STRINGS.BASE64_AUDIO_LENGTH_THRESHOLD && ![COMMON_STRINGS.SLASH_PREFIX, COMMON_STRINGS.HTTP_PREFIX].some((prefix) => anyScene.audioBase64?.startsWith(prefix));
        if (hasBase64Audio) {
          const fileName = `scene_${scene.id}.wav`;
          const filePath = path.join(audioDir, fileName);
          try {
            fs.writeFileSync(filePath, Buffer.from(anyScene.audioBase64, "base64"));
            audioUrl = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${folderName}/${VOICES_DIR_NAME}/${fileName}`;
            delete anyScene.audioBase64;
            sceneUpdated = true;
            storyboardUpdated = true;
          } catch (err) {
            appError(`${ERROR_MESSAGES.WRITE_SCENE_AUDIO_ERR}${scene.id}`, err);
          }
        }

        if (sceneUpdated) {
          return {
            ...scene,
            assetUrl,
            assetUrls,
            audioUrl,
          };
        }
        return scene;
      });
    }

    let thumbnailsUpdated = false;
    let thumbnails = project.thumbnails;
    if (thumbnails && Array.isArray(thumbnails)) {
      thumbnails = thumbnails.map((thumb) => {
        let imageUrl = thumb.imageUrl;
        let thumbUpdated = false;

        if (imageUrl && imageUrl.includes(COMMON_STRINGS.BASE64_IMAGE_PREFIX)) {
          const matches = imageUrl.match(BASE64_IMAGE_MIME_REGEX);
          if (matches) {
            const ext = matches[1] === COMMON_STRINGS.JPEG_EXT ? COMMON_STRINGS.JPG_EXT : matches[1];
            const data = matches[2];
            const fileName = `thumb_${thumb.id}.${ext}`;
            const filePath = path.join(imageDir, fileName);

            try {
              fs.writeFileSync(filePath, Buffer.from(data, "base64"));
              imageUrl = `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${folderName}/${IMAGES_DIR_NAME}/${fileName}`;
              thumbUpdated = true;
              thumbnailsUpdated = true;
            } catch (err) {
              appError(`${ERROR_MESSAGES.WRITE_THUMB_IMAGE_ERR}${thumb.id}`, err);
            }
          }
        }

        if (thumbUpdated) {
          return {
            ...thumb,
            imageUrl,
          };
        }
        return thumb;
      });
    }

    let voiceConfigUpdated = false;
    let voiceConfig = project.voiceConfig;
    if (typeof (voiceConfig as any)?.audioBase64 === "string" && (voiceConfig as any).audioBase64.length > 100) {
      const fileName = COMMON_STRINGS.UNIFIED_WAV;
      const filePath = path.join(audioDir, fileName);
      try {
        fs.writeFileSync(filePath, Buffer.from((voiceConfig as any).audioBase64, "base64"));
        voiceConfig = {
          ...voiceConfig,
          audioUrl: `/${ASSETS_DIR_NAME}/${PROJECTS_DIR_NAME}/${folderName}/${VOICES_DIR_NAME}/${fileName}`,
        };
        delete (voiceConfig as any).audioBase64;
        voiceConfigUpdated = true;
      } catch (err) {
        appError(`${ERROR_MESSAGES.WRITE_UNIFIED_AUDIO_ERR}${project.id}`, err);
      }
    }

    if (storyboardUpdated || thumbnailsUpdated || voiceConfigUpdated) {
      const updatedProject: VideoProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };
      if (storyboardUpdated) updatedProject.storyboard = storyboard;
      if (thumbnailsUpdated) updatedProject.thumbnails = thumbnails;
      if (voiceConfigUpdated) updatedProject.voiceConfig = voiceConfig;
      return updatedProject;
    }
    return project;
  });
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
      if (newProject.name && oldProject.name && newProject.name !== oldProject.name) {
        const oldFolderName = getSafeFolderName(oldProject.name);
        const newFolderName = getSafeFolderName(newProject.name);

        if (oldFolderName !== newFolderName) {
          const assetsDir = path.join(process.cwd(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
          const oldDir = path.join(assetsDir, oldFolderName);
          const newDir = path.join(assetsDir, newFolderName);

          if (fs.existsSync(oldDir)) {
            try {
              fs.renameSync(oldDir, newDir);
            } catch (err) {
              appError(ERROR_MESSAGES.RENAME_ASSETS_DIR_ERR, err);
            }
          }

          newProject = replaceAssetPaths(newProject, oldFolderName, newFolderName);
        }
      }

      if (oldProject?.storyboard && newProject?.storyboard) {
        const oldImagesCount = oldProject.storyboard.filter((s: any) => s.assetUrl).length;
        const newImagesCount = newProject.storyboard.filter((s: any) => s.assetUrl).length;

        if (oldImagesCount - newImagesCount > 1 && !newProject.allowBulkDeleteImages) {
          newProject.storyboard = newProject.storyboard.map((newScene: any) => {
            const oldScene = oldProject.storyboard.find((s: any) => s.id === newScene.id);
            if (oldScene?.assetUrl && !newScene.assetUrl) {
              return {
                ...newScene,
                assetUrl: oldScene.assetUrl,
                assetUrls: newScene.assetUrls?.length ? newScene.assetUrls : oldScene.assetUrls || [oldScene.assetUrl],
                assetName: newScene.assetName || oldScene.assetName,
                assetType: newScene.assetType || oldScene.assetType,
              };
            }
            return newScene;
          });
        }

        const folderName = getSafeFolderName(newProject.name || oldProject.name);
        const assetsDir = path.join(process.cwd(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
        const imageDir = path.join(assetsDir, folderName, IMAGES_DIR_NAME);
        const audioDir = path.join(assetsDir, folderName, VOICES_DIR_NAME);

        newProject.storyboard.forEach((newScene: any) => {
          const newHasImage = !!(newScene?.assetUrl && newScene.assetUrl !== COMMON_STRINGS.UNDEFINED) || !!newScene?.assetUrls?.length;

          if (!newHasImage) {
            if (fs.existsSync(imageDir)) {
              try {
                const files = fs.readdirSync(imageDir);
                const prefix1 = `scene_${newScene.id}.`;
                const prefix2 = `scene_${newScene.id}_`;

                files.forEach((file) => {
                  if (file.startsWith(prefix1) || file.startsWith(prefix2)) {
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
          }

          const newHasAudio = !!(newScene?.audioUrl && newScene.audioUrl !== COMMON_STRINGS.UNDEFINED);
          if (!newHasAudio) {
            if (fs.existsSync(audioDir)) {
              try {
                const files = fs.readdirSync(audioDir);
                const prefix = `scene_${newScene.id}.`;
                files.forEach((file) => {
                  if (file.startsWith(prefix)) {
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
          }
        });

        const oldAudioUrl = (oldProject?.voiceConfig as any)?.audioUrl;
        const newAudioUrl = (newProject?.voiceConfig as any)?.audioUrl;
        if (oldAudioUrl && (!newAudioUrl || newAudioUrl === "")) {
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

      delete newProject.allowBulkDeleteImages;

      const updatedProject = { ...oldProject, ...newProject, updatedAt: new Date().toISOString() };
      const savedProject = await saveProjectDetail(updatedProject);
      res.json(savedProject);
    } else {
      const isVi = req.query.lang !== COMMON_STRINGS.EN;
      res.status(404).json({ error: getBackendMsg(ERROR_MESSAGES.PROJECT_NOT_FOUND, isVi) });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || getBackendMsg("SQLITE_WRITE_ERR") });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const isVi = req.query.lang !== COMMON_STRINGS.EN;

  try {
    const project = await getProjectDetail(id);
    const deleted = await deleteProjectFromDb(id);

    if (deleted) {
      if (project && project.name) {
        const folderName = getSafeFolderName(project.name);
        const assetsDir = path.join(process.cwd(), ASSETS_DIR_NAME, PROJECTS_DIR_NAME);
        const projectDir = path.join(assetsDir, folderName);
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
