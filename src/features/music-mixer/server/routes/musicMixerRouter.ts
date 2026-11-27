import { CHAT_PLANNING_RUNTIME as C } from "../../../../constants/chatPlanningRuntime.js";
import {
  SOURCE_TEMPLATE_SYMBOL_75,
  SOURCE_TEMPLATE_SYMBOL_86,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEMPLATE_PARTIAL,
  SOURCE_TEMPLATE_SEO_4,
  SOURCE_TEMPLATE_SYMBOL_33,
  SOURCE_TEMPLATE_SYMBOL_5,
  SOURCE_TEMPLATE_SYMBOL_51,
  SOURCE_TEXT_1,
  SOURCE_TEXT_AUDIO_MPEG,
  SOURCE_TEXT_AUDIO_WAV,
  SOURCE_TEXT_FAILED_TO_BUILD_MUSIC_MIXER_ZIP,
  SOURCE_TEXT_MANIFEST_JSON,
  SOURCE_TEXT_MUSIC_MIXER_MANIFEST,
  SOURCE_TEXT_SELECT_SAVE_FILE,
  SOURCE_TEXT_UTF_8,
  SOURCE_TEXT_WAV_2,
  SOURCE_TEXT_WX,
} from "../../../../constants/sourceText.js";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import express, { Request, Response } from "express";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { pipeline as streamPipeline } from "stream/promises";
import { EXPORT_ZIP_CONFIG } from "../../../../constants";
import { MOTION_TEXT_STRING } from "../../../../constants/motionRuntime.js";
import { MUSIC_MIXER_SERVER, buildMusicMixerAnalyzePrompt, buildMusicMixerSeoPrompt } from "../../../../constants/musicMixer.js";
import { SUNO_AUTOMATION_CONFIG } from "../../../../constants/sunoAutomation.js";
import { stringifyJson, parseJson } from "../../../../lib/jsonStringify.js";
import { logger } from "../../../../lib/logger.js";
import { AiPlanningFallbackProvider } from "../../../../types.js";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { beginChatPlanningRun, cancelChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoomsForProject, generatePlanningWithChatUi } from "../../../../server/services/chatUiPlanningService.js";
import { getPythonCommand, getStaticResourcePath, getTempDirectory } from "../../../../server/utils/paths.js";
import { currentChatPolicy } from "../../../../server/utils/requestContext.js";
import { runInChatRoomLanes } from "../../../../lib/chatExecutionPolicy.js";
import { CHAT_EXECUTION_POLICY } from "../../../../constants/chatExecutionPolicy.js";
import { readMediaDurationSeconds } from "../../../../server/controllers/pipelineShared.js";
const router = express.Router();
const musicMixerSources = new Map<string, string[]>();
const musicMixerAllowedSources = new Set<string>();
const MUSIC_MIXER_SOURCE_TTL_MS = 30 * 60 * 1000;
router.post(MUSIC_MIXER_SERVER.ROUTE_SELECT_SOURCE, (_req: Request, res: Response) => {
  execFile(getPythonCommand(), [getStaticResourcePath(MUSIC_MIXER_SERVER.PICKER_SCRIPT)], { windowsHide: true }, async (error, stdout, stderr) => {
    if (error || !stdout.trim()) {
      if (error) logger.error(MUSIC_MIXER_SERVER.LOG_SELECT_SOURCE_ERROR(error.message, stderr || C.EMPTY));
      return res.json({ success: false });
    }
    const audioPattern = /\.(mp3|wav|m4a|aac|flac|ogg|opus|webm)$/i;
    const scan = async (directory: string, files: string[], recursive = true): Promise<void> => {
      try {
        for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
          const fullPath = path.join(directory, entry.name);
          if (entry.isDirectory() && recursive) await scan(fullPath, files);
          else if (entry.isFile() && audioPattern.test(entry.name)) files.push(fullPath);
        }
      } catch (err: any) {
        logger.error(MUSIC_MIXER_SERVER.LOG_SCAN_DIR_ERROR(directory, err?.message || C.EMPTY));
      }
    };
    try {
      const selectedPaths = parseJson(stdout.trim());
      if (!Array.isArray(selectedPaths) || !_.every(selectedPaths, (folderPath) => typeof folderPath === MOTION_TEXT_STRING)) throw new Error(MUSIC_MIXER_SERVER.ERROR_SOURCE_MISSING);
      const folderPaths: string[] = [];
      const directOnlyFolderPaths = new Set<string>();
      for (const folderPath of selectedPaths) {
        const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
        const hasDirectAudio = _.some(entries, (e) => e.isFile() && audioPattern.test(e.name));
        const subDirs = _.map(
          _.filter(entries, (e) => e.isDirectory()),
          (e) => path.join(folderPath, e.name),
        );
        const nested = await Promise.all(_.map(subDirs, async (dir) => _.some(await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => []), (e) => e.isDirectory())));
        if (subDirs.length === 0 || !_.some(nested)) {
          folderPaths.push(folderPath);
        } else {
          if (hasDirectAudio) {
            folderPaths.push(folderPath);
            directOnlyFolderPaths.add(path.resolve(folderPath));
          }
          folderPaths.push(...subDirs);
        }
      }
      const folders = _.filter(
        await Promise.all(
          _.map(
            _.uniqBy(folderPaths, (folderPath) => path.resolve(folderPath).toLowerCase()),
            async (folderPath: string) => {
              const files: string[] = [];
              await scan(folderPath, files, !directOnlyFolderPaths.has(path.resolve(folderPath)));
              const token = randomUUID();
              musicMixerSources.set(token, files);
              files.forEach((filePath) => musicMixerAllowedSources.add(path.resolve(filePath)));
              setTimeout(() => {
                musicMixerSources.delete(token);
                files.forEach((filePath) => musicMixerAllowedSources.delete(path.resolve(filePath)));
              }, MUSIC_MIXER_SOURCE_TTL_MS).unref();
              return {
                folderPath,
                files: await Promise.all(
                  _.map(files, async (filePath, index) => ({
                    name: path.basename(filePath),
                    relativePath: path.relative(folderPath, filePath),
                    sourcePath: filePath,
                    size: (await fs.promises.stat(filePath)).size,
                    type: path.extname(filePath).toLowerCase() === SOURCE_TEXT_WAV_2 ? SOURCE_TEXT_AUDIO_WAV : SOURCE_TEXT_AUDIO_MPEG,
                    index,
                    url: SOURCE_TEMPLATE_SYMBOL_33(SOURCE_TEMPLATE_SYMBOL_86(`${MUSIC_MIXER_SERVER.SOURCE_URL_PREFIX}`), SOURCE_TEMPLATE_SYMBOL_86(`${token}`), SOURCE_TEMPLATE_SYMBOL_86(`${index}`)),
                  })),
                ),
              };
            },
          ),
        ),
        (folder) => folder.files.length > 0,
      );
      return res.json({ success: true, folders });
    } catch (err: any) {
      logger.error(MUSIC_MIXER_SERVER.LOG_PROCESS_FOLDERS_ERROR(err?.message || C.EMPTY));
      return res.status(500).json({ success: false });
    }
  });
});
router.get(MUSIC_MIXER_SERVER.ROUTE_SOURCE, (req: Request, res: Response) => {
  const files = musicMixerSources.get(req.params.token);
  const index = Number(req.params.index);
  if (!files || !Number.isInteger(index) || index < 0 || index >= files.length) return res.sendStatus(404);
  return res.sendFile(files[index]);
});
router.post(MUSIC_MIXER_SERVER.ROUTE_SOURCE_FILE, async (req: Request, res: Response) => {
  const sourcePath = req.body?.sourcePath;
  if (typeof sourcePath !== MOTION_TEXT_STRING || !/\.(mp3|wav|m4a|aac|flac|ogg|opus|webm)$/i.test(sourcePath)) return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ERROR_SOURCE_MISSING });
  try {
    if (!(await fs.promises.stat(sourcePath)).isFile()) throw new Error();
    return res.sendFile(path.resolve(sourcePath));
  } catch {
    return res.status(404).json({ success: false, error: MUSIC_MIXER_SERVER.ERROR_SOURCE_MISSING });
  }
});
router.post(MUSIC_MIXER_SERVER.ROUTE_ANALYZE, async (req: Request, res: Response) => {
  const items = Array.isArray(req.body?.tracks) ? req.body.tracks : [];
  if (!items.length || items.length > 100) return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ERROR_TRACK_COUNT });
  const rankingId = typeof req.body?.projectId === MOTION_TEXT_STRING && req.body.projectId.startsWith(MUSIC_MIXER_SERVER.ANALYZE_RUN_PREFIX) ? req.body.projectId : SOURCE_TEMPLATE_SYMBOL_75(`${MUSIC_MIXER_SERVER.ANALYZE_RUN_PREFIX}`, `${randomUUID()}`);
  const planningRun = beginChatPlanningRun(rankingId, Date.now(), undefined, req.body?.provider || AiPlanningFallbackProvider.GeminiChat);
  const cancelOnDisconnect = () => {
    if (!res.writableEnded) planningRun.cancel();
  };
  res.once(SOURCE_TEXT_CLOSE_2, cancelOnDisconnect);
  try {
    const availableFiles = await Promise.all(
      items.map(async (item: any) => {
        try {
          return (await fs.promises.stat(item.sourcePath)).isFile();
        } catch {
          return false;
        }
      }),
    );
    if (_.some(availableFiles, (available) => !available)) return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ERROR_SOURCE_MISSING });
    planningRun.signal.throwIfAborted();
    const chunkScores = await runInChatRoomLanes(_.chunk(items, MUSIC_MIXER_SERVER.MAX_ATTACHMENTS_PER_ROOM_REQUEST), currentChatPolicy(), async (chunk, chunkIndex, lane) => {
      const requestId = SOURCE_TEMPLATE_SYMBOL_5(SOURCE_TEMPLATE_SYMBOL_86(`${rankingId}`), SOURCE_TEMPLATE_SYMBOL_86(`${chunkIndex + 1}`));
      const offset = chunkIndex * MUSIC_MIXER_SERVER.MAX_ATTACHMENTS_PER_ROOM_REQUEST;
      const attachments = _.map(chunk, (item: any, index: number) => ({ name: SOURCE_TEMPLATE_SYMBOL_51(SOURCE_TEMPLATE_SYMBOL_86(`${offset + index + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${path.basename(item.sourcePath)}`)), mimeType: path.extname(item.sourcePath).toLowerCase() === SOURCE_TEXT_WAV_2 ? SOURCE_TEXT_AUDIO_WAV : SOURCE_TEXT_AUDIO_MPEG, path: item.sourcePath }));
      const prompt = buildMusicMixerAnalyzePrompt(
        _.map(chunk, (item: any, index: number) => ({ index: offset + index + 1, title: item.title })),
        requestId,
      );
      const result = await generatePlanningWithChatUi({
        provider: req.body?.provider || AiPlanningFallbackProvider.GeminiChat,
        model: req.body?.model,
        prompt,
        projectId: rankingId,
        workerId: lane === 0 ? undefined : CHAT_EXECUTION_POLICY.WORKER_ID(MUSIC_MIXER_SERVER.ANALYZE_RUN_PREFIX, lane),
        signal: planningRun.signal,
        chromeHeadless: req.body?.chromeHeadless === true,
        attachments,
        artifactType: MUSIC_MIXER_SERVER.ANALYZE_ARTIFACT,
        requestId,
        closeRoomOnComplete: false,
        allowDefaultGeminiModel: true,
      });
      const parsed = parseJson(result.text.replace(/^```(?:json)?\s*|\s*```$/g, C.EMPTY));
      const validScores = parsed.artifactType === MUSIC_MIXER_SERVER.ANALYZE_ARTIFACT && parsed.requestId === requestId && Array.isArray(parsed.scores) && parsed.scores.length === chunk.length && parsed.scores.every((item: any) => Number.isInteger(item.index) && item.index >= offset + 1 && item.index <= offset + chunk.length && Number.isInteger(item.score) && item.score >= 0 && item.score <= 100);
      if (!validScores) throw new Error(MUSIC_MIXER_SERVER.ERROR_RANKING_RESPONSE);
      const durations = await Promise.all(_.map(chunk, (item: any) => readMediaDurationSeconds(item.sourcePath)));
      return parsed.scores.map((item: any) => ({ ...item, durationSeconds: durations[item.index - offset - 1] || 0 }));
    });
    const scores: Array<{ index: number; score: number; durationSeconds: number }> = _.flatten(chunkScores);
    planningRun.signal.throwIfAborted();
    return res.json({ success: true, scores, roomId: rankingId });
  } catch (error) {
    await closeChatPlanningRoomsForProject({ provider: req.body?.provider || AiPlanningFallbackProvider.GeminiChat, projectId: rankingId }).catch(() => undefined);
    return res.status(500).json({ success: false, error: String(error) });
  } finally {
    res.off(SOURCE_TEXT_CLOSE_2, cancelOnDisconnect);
    planningRun.complete();
    if (planningRun.signal.aborted) {
      await closeChatPlanningRoomsForProject({ provider: req.body?.provider || AiPlanningFallbackProvider.GeminiChat, projectId: rankingId }).catch(() => undefined);
    }
  }
});
router.post(MUSIC_MIXER_SERVER.ROUTE_CANCEL, async (req: Request, res: Response) => {
  const projectId = typeof req.body?.projectId === MOTION_TEXT_STRING ? req.body.projectId : C.EMPTY;
  if (!projectId) return res.status(400).json({ success: false });
  const projectIds = _.uniq([projectId, ...(Array.isArray(req.body?.projectIds) ? req.body.projectIds.filter((value: unknown): value is string => typeof value === MOTION_TEXT_STRING) : [])]);
  projectIds.forEach((id) => cancelChatPlanningRun(id));
  await Promise.all(projectIds.map((id) => closeChatPlanningRoomsForProject({ provider: req.body?.provider || AiPlanningFallbackProvider.GeminiChat, projectId: id }).catch(() => undefined)));
  await closeChatBrowserIfIdle().catch(() => undefined);
  return res.json({ success: true });
});
router.post(MUSIC_MIXER_SERVER.ROUTE_SEO, async (req: Request, res: Response) => {
  const titles = Array.isArray(req.body?.titles) ? req.body.titles.map((value: unknown) => String(value).trim()).filter(Boolean) : [];
  if (!titles.length || titles.length > 100) return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ERROR_PLAYLIST });
  const execution = req.body?.aiExecution || {};
  const projectId = typeof req.body?.roomId === MOTION_TEXT_STRING && req.body.roomId.startsWith(MUSIC_MIXER_SERVER.ANALYZE_RUN_PREFIX) ? req.body.roomId : SOURCE_TEMPLATE_SYMBOL_75(`${MUSIC_MIXER_SERVER.SEO_RUN_PREFIX}`, `${randomUUID()}`);
  const requestId = SOURCE_TEMPLATE_SEO_4(SOURCE_TEMPLATE_SYMBOL_86(`${projectId}`));
  const prompt = buildMusicMixerSeoPrompt(titles, requestId);
  const planningRun = beginChatPlanningRun(projectId, Date.now(), undefined, execution.provider || AiPlanningFallbackProvider.GeminiChat);
  const cancelOnDisconnect = () => {
    if (!res.writableEnded) planningRun.cancel();
  };
  res.once(SOURCE_TEXT_CLOSE_2, cancelOnDisconnect);
  try {
    const response = await generatePlanningWithChatUi({ provider: execution.provider || AiPlanningFallbackProvider.GeminiChat, model: execution.model, prompt, projectId, requestId, signal: planningRun.signal, artifactType: MUSIC_MIXER_SERVER.SEO_ARTIFACT, chromeHeadless: execution.chromeHeadless !== false, closeRoomOnComplete: true });
    planningRun.signal.throwIfAborted();
    const parsed = parseJson(response.text.replace(/^```(?:json)?\s*|\s*```$/g, C.EMPTY));
    if (parsed.artifactType !== MUSIC_MIXER_SERVER.SEO_ARTIFACT || parsed.requestId !== requestId || !Array.isArray(parsed.seoOptions) || parsed.seoOptions.length !== 5) throw new Error(MUSIC_MIXER_SERVER.ERROR_SEO_RESPONSE);
    await closeChatPlanningRoomsForProject({ provider: execution.provider || AiPlanningFallbackProvider.GeminiChat, projectId }).catch(() => undefined);
    await closeChatBrowserIfIdle().catch(() => undefined);
    return res.json({ success: true, playlistSeoOptions: parsed.seoOptions });
  } catch (error) {
    await closeChatPlanningRoomsForProject({ provider: execution.provider || AiPlanningFallbackProvider.GeminiChat, projectId }).catch(() => undefined);
    await closeChatBrowserIfIdle().catch(() => undefined);
    return res.status(500).json({ success: false, error: String(error) });
  } finally {
    res.off(SOURCE_TEXT_CLOSE_2, cancelOnDisconnect);
    planningRun.complete();
  }
});
const musicMixerZipDestinations = new Map<string, string>();
const musicMixerStagedDirs = new Map<string, string>();
const cleanupMusicMixerStagedDir = async (token: string): Promise<void> => {
  const stagedDir = musicMixerStagedDirs.get(token);
  if (!stagedDir) return;
  musicMixerStagedDirs.delete(token);
  await fs.promises.rm(stagedDir, { recursive: true, force: true }).catch(() => undefined);
};
router.post(MUSIC_MIXER_SERVER.ROUTE_SELECT_ZIP_DESTINATION, (req: Request, res: Response) => {
  const name = path.basename(String(req.body?.suggestedName || MUSIC_MIXER_SERVER.DEFAULT_ZIP_NAME));
  execFile(getPythonCommand(), [getStaticResourcePath(SUNO_AUTOMATION_CONFIG.CAPCUT_ULTRA_TOOL_SCRIPT), SOURCE_TEXT_SELECT_SAVE_FILE, name, MUSIC_MIXER_SERVER.ZIP_EXTENSION], { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: SOURCE_TEXT_UTF_8, PYTHONUTF8: SOURCE_TEXT_1 } }, (error, stdout) => {
    if (error) return res.status(500).json({ success: false, error: error.message });
    const target = stdout.trim();
    if (!target) return res.json({ success: true, cancelled: true });
    const token = randomUUID();
    musicMixerZipDestinations.set(token, target);
    setTimeout(() => {
      musicMixerZipDestinations.delete(token);
      void cleanupMusicMixerStagedDir(token);
    }, MUSIC_MIXER_SERVER.ZIP_TOKEN_TTL_MS).unref();
    return res.json({ success: true, token });
  });
});
router.post(MUSIC_MIXER_SERVER.ROUTE_STAGE_ZIP_FILE, async (req: Request, res: Response) => {
  req.setTimeout(0);
  res.setTimeout(0);
  const token = req.header(MUSIC_MIXER_SERVER.HEADER_ZIP_TOKEN) || C.EMPTY;
  if (!token || !musicMixerZipDestinations.has(token)) {
    return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ZIP_SAVE_ERROR });
  }
  const rawName = decodeURIComponent(req.header(MUSIC_MIXER_SERVER.HEADER_FILE_NAME) || C.EMPTY);
  const ext = path.extname(path.basename(rawName)) || EXPORT_ZIP_CONFIG.WAV_EXT;
  try {
    let stagedDir = musicMixerStagedDirs.get(token);
    if (!stagedDir) {
      stagedDir = await fs.promises.mkdtemp(path.join(getTempDirectory(), MUSIC_MIXER_SERVER.STAGE_DIR_PREFIX));
      musicMixerStagedDirs.set(token, stagedDir);
    }
    const stagedFilePath = path.join(stagedDir, SOURCE_TEMPLATE_SYMBOL_75(`${randomUUID()}`, `${ext}`));
    await streamPipeline(req, fs.createWriteStream(stagedFilePath, { flags: SOURCE_TEXT_WX }));
    return res.json({ success: true, sourcePath: stagedFilePath });
  } catch (error) {
    return res.status(500).json({ success: false, error: getErrorMessage(error, MUSIC_MIXER_SERVER.SOURCE_READ_ERROR) });
  }
});
router.post(MUSIC_MIXER_SERVER.ROUTE_BUILD_ZIP, async (req: Request, res: Response) => {
  req.setTimeout(0);
  res.setTimeout(0);
  const token = typeof req.body?.token === MOTION_TEXT_STRING ? req.body.token : C.EMPTY;
  const target = musicMixerZipDestinations.get(token);
  if (!target) return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ZIP_SAVE_ERROR });
  musicMixerZipDestinations.delete(token);
  const folders = Array.isArray(req.body?.folders) ? req.body.folders : [];
  if (!folders.length) {
    await cleanupMusicMixerStagedDir(token);
    return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ERROR_NO_FOLDERS_ZIP });
  }
  const tempManifestDir = await fs.promises.mkdtemp(path.join(getTempDirectory(), SOURCE_TEXT_MUSIC_MIXER_MANIFEST));
  const tempManifestPath = path.join(tempManifestDir, SOURCE_TEXT_MANIFEST_JSON);
  try {
    const manifest = {
      targetZipPath: target,
      folders: folders.map((folder: any) => ({
        name: String(folder.name || C.EMPTY),
        files: Array.isArray(folder.files) ? folder.files.map((file: any) => ({ sourcePath: String(file.sourcePath || C.EMPTY), zipPath: String(file.zipPath || C.EMPTY) })) : [],
        texts: Array.isArray(folder.texts) ? folder.texts.map((textItem: any) => ({ content: String(textItem.content || C.EMPTY), zipPath: String(textItem.zipPath || C.EMPTY) })) : [],
      })),
    };
    await fs.promises.writeFile(tempManifestPath, stringifyJson(manifest), SOURCE_TEXT_UTF_8);
    const result = await new Promise<{ success: boolean; path?: string; error?: string }>((resolve) => {
      execFile(getPythonCommand(), [getStaticResourcePath(MUSIC_MIXER_SERVER.ZIP_BUILDER_SCRIPT), tempManifestPath], { windowsHide: true, maxBuffer: MUSIC_MIXER_SERVER.ZIP_BUILDER_MAX_BUFFER_BYTES, env: { ...process.env, PYTHONIOENCODING: SOURCE_TEXT_UTF_8, PYTHONUTF8: SOURCE_TEXT_1 } }, (error, stdout, stderr) => {
        const trimmedStdout = String(stdout || C.EMPTY).trim();
        if (trimmedStdout) {
          try {
            const parsed = parseJson(trimmedStdout);
            if (parsed && typeof parsed.success === "boolean") {
              return resolve(parsed);
            }
          } catch {}
        }
        if (error) {
          return resolve({ success: false, error: stderr?.trim() || error.message || MUSIC_MIXER_SERVER.ERROR_ZIP_BUILD_FAILED });
        }
        return resolve({ success: true, path: target });
      });
    });
    if (!result.success) {
      throw new Error(result.error || MUSIC_MIXER_SERVER.ZIP_SAVE_ERROR);
    }
    return res.json({ success: true, filePath: target });
  } catch (error) {
    logger.error(SOURCE_TEXT_FAILED_TO_BUILD_MUSIC_MIXER_ZIP, error);
    return res.status(500).json({ success: false, error: getErrorMessage(error, MUSIC_MIXER_SERVER.ZIP_SAVE_ERROR) });
  } finally {
    await fs.promises.rm(tempManifestDir, { recursive: true, force: true }).catch(() => undefined);
    await cleanupMusicMixerStagedDir(token);
  }
});
router.post(MUSIC_MIXER_SERVER.ROUTE_WRITE_ZIP, async (req: Request, res: Response) => {
  req.setTimeout(0);
  res.setTimeout(0);
  const token = req.header(MUSIC_MIXER_SERVER.HEADER_ZIP_TOKEN) || C.EMPTY;
  const target = musicMixerZipDestinations.get(token);
  if (!target) return res.status(400).json({ success: false, error: MUSIC_MIXER_SERVER.ZIP_SAVE_ERROR });
  musicMixerZipDestinations.delete(token);
  const temp = SOURCE_TEMPLATE_PARTIAL(SOURCE_TEMPLATE_SYMBOL_86(`${target}`), SOURCE_TEMPLATE_SYMBOL_86(`${randomUUID()}`));
  try {
    await streamPipeline(req, fs.createWriteStream(temp, { flags: SOURCE_TEXT_WX }));
    const stat = await fs.promises.stat(temp);
    if (stat.size < 22) throw new Error(MUSIC_MIXER_SERVER.ERROR_ZIP_EMPTY);
    await fs.promises.rm(target, { force: true });
    await fs.promises.rename(temp, target);
    return res.json({ success: true });
  } catch (error) {
    await fs.promises.rm(temp, { force: true }).catch(() => undefined);
    return res.status(500).json({ success: false, error: getErrorMessage(error, MUSIC_MIXER_SERVER.ZIP_SAVE_ERROR) });
  } finally {
    await cleanupMusicMixerStagedDir(token);
  }
});
export default router;
