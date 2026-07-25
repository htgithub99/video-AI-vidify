import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import fs from "fs";
import { VideoProject } from "../../types.js";
import { PROJECTS_FILE_NAME, ENCODING_UTF8, SQLITE_DB_NAME, PROJECTS_BACKUP_DIR_NAME, getBackendMsg } from "../../constants";
import { appError, appLog } from "../../lib/logger.js";
import _ from 'lodash';
import { getDataDirectory } from "./paths.js";
import { jsonUtils } from "../../lib/json";

const SQL_STATEMENTS = {
  PRAGMA_WAL: "PRAGMA journal_mode = WAL;",
  CREATE_PROJECTS_TABLE: `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      current_step INTEGER DEFAULT 0,
      credits_used INTEGER DEFAULT 0,
      data TEXT NOT NULL
    );
  `,
  CREATE_PRESETS_TABLE: `
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  SELECT_PROJECTS_LIST: `
    SELECT id, name, description, created_at as createdAt, updated_at as updatedAt, 
           current_step as currentStep, credits_used as creditsUsed, data 
    FROM projects 
    ORDER BY updated_at DESC
  `,
  SELECT_PRESETS_LIST: `
    SELECT id, name, config, created_at as createdAt, updated_at as updatedAt
    FROM presets
    ORDER BY updated_at DESC
  `,
  SELECT_PROJECT_DETAIL: "SELECT data FROM projects WHERE id = ?",
  INSERT_PROJECT: `
    INSERT OR REPLACE INTO projects (id, name, description, created_at, updated_at, current_step, credits_used, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  INSERT_PRESET: `
    INSERT OR REPLACE INTO presets (id, name, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  DELETE_PROJECT: "DELETE FROM projects WHERE id = ?",
  DELETE_PRESET: "DELETE FROM presets WHERE id = ?",
  BEGIN_TRANSACTION: "BEGIN TRANSACTION;",
  COMMIT: "COMMIT;",
  ROLLBACK: "ROLLBACK;",
} as const;

const MIGRATION_DEFAULTS = {
  PROJECTS_DIR: "projects",
  BACKUP_JSON: "projects.backup.json",
  MIGRATE_PROJECT_NAME: "Dự án di chuyển",
  GENRE: "Kể chuyện",
  LANGUAGE: "vi",
  DURATION: "2m",
  HOOK_TYPE: "Auto",
  HOOK_DURATION: 10,
  HOOK_COUNT: 3,
  HOOK_POSITIONS: "start",
  VOICE_PROVIDER: "google",
  VOICE_AUDIO_TYPE: "tts",
  VOICE_GENDER: "male",
  VOICE_AGE: "adult",
  VOICE_EMOTION: "neutral",
  VOICE_SPEED: 1.0,
  VOICE_PITCH: 1.0,
  VOICE_VOLUME: 1.0,
  VOICE_URI: "google-cloud-vi-a",
  VISUAL_SOURCE: "Veo3",
  VISUAL_STYLE: "cinematic",
  VISUAL_QUALITY: "standard",
  VISUAL_DENSITY: 5,
  VISUAL_ASSETS_MODE: "mixed",
  VISUAL_ASPECT_RATIO: "16:9",
  VISUAL_PROMPT_INPUT: "paste",
} as const;

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!_.isNil(dbInstance)) {
    return dbInstance;
  }

  try {
    dbInstance = await open({
      filename: path.join(getDataDirectory(), SQLITE_DB_NAME),
      driver: sqlite3.Database,
    });

    await dbInstance.exec(SQL_STATEMENTS.PRAGMA_WAL);
    await dbInstance.exec(SQL_STATEMENTS.CREATE_PROJECTS_TABLE);
    await dbInstance.exec(SQL_STATEMENTS.CREATE_PRESETS_TABLE);

    return dbInstance;
  } catch (error) {
    appError(getBackendMsg("SQLITE_INIT_ERR"), error);
    throw error;
  }
}

export async function getPresetsFromDb(): Promise<any[]> {
  try {
    const db = await initDb();
    const rows = await db.all(SQL_STATEMENTS.SELECT_PRESETS_LIST);
    return _.map(rows, (row) => ({
      id: row.id,
      name: row.name,
      config: jsonUtils.safeParse<any>(row.config, {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    appError(getBackendMsg("SQLITE_PRESETS_LIST_ERR"), error);
    return [];
  }
}

export async function savePresetToDb(preset: { id: string; name: string; config: any }): Promise<any> {
  try {
    const db = await initDb();
    const now = new Date().toISOString();
    await db.run(SQL_STATEMENTS.INSERT_PRESET, [
      preset.id,
      preset.name,
      jsonUtils.safeStringify(preset.config),
      now,
      now,
    ]);
    return {
      id: preset.id,
      name: preset.name,
      config: preset.config,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_PRESET_WRITE_ERR")} ${preset.id}`, error);
    throw error;
  }
}

export async function deletePresetFromDb(id: string): Promise<boolean> {
  try {
    const db = await initDb();
    const result = await db.run(SQL_STATEMENTS.DELETE_PRESET, [id]);
    return !_.isNil(result.changes) && _.gt(result.changes, 0);
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_PRESET_DELETE_ERR")} ${id}`, error);
    return false;
  }
}


export async function getProjectsListFromDb(): Promise<any[]> {
  try {
    const db = await initDb();
    const rows = await db.all(SQL_STATEMENTS.SELECT_PROJECTS_LIST);

    return _.map(rows, (row) => {
      let config = undefined;
      const detail = jsonUtils.safeParse<any>(row.data, {});
      if (!_.isNil(detail.config)) {
          config = {
            genre: detail.config.genre,
            language: detail.config.language,
            duration: detail.config.duration,
          };
        }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        currentStep: row.currentStep,
        creditsUsed: row.creditsUsed,
        config,
      };
    });
  } catch (error) {
    appError(getBackendMsg("SQLITE_LIST_ERR"), error);
    return [];
  }
}

export async function getProjectDetailFromDb(id: string): Promise<VideoProject | null> {
  try {
    const db = await initDb();
    const row = await db.get(SQL_STATEMENTS.SELECT_PROJECT_DETAIL, [id]);
    if (!_.isNil(row) && !_.isNil(row.data)) {
      return jsonUtils.safeParse<VideoProject>(row.data, null);
    }
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_DETAIL_ERR")} ${id}`, error);
  }
  return null;
}

export async function saveProjectDetailToDb(project: VideoProject): Promise<void> {
  try {
    const db = await initDb();

    await db.run(
      SQL_STATEMENTS.INSERT_PROJECT,
      [
        project.id,
        project.name,
        project.description || "",
        project.createdAt || new Date().toISOString(),
        project.updatedAt || new Date().toISOString(),
        project.currentStep || 0,
        project.creditsUsed || 0,
        jsonUtils.safeStringify(project)
      ],
    );
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_WRITE_ERR")} ${project.id}`, error);
    throw error;
  }
}

export async function deleteProjectFromDb(id: string): Promise<boolean> {
  try {
    const db = await initDb();
    const result = await db.run(SQL_STATEMENTS.DELETE_PROJECT, [id]);
    return !_.isNil(result.changes) && _.gt(result.changes, 0);
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_DELETE_ERR")} ${id}`, error);
    return false;
  }
}

export async function migrateJsonToSqlite(): Promise<void> {
  try {
    const projectsFile = path.join(getDataDirectory(), PROJECTS_FILE_NAME);
    const projectsDir = path.join(getDataDirectory(), MIGRATION_DEFAULTS.PROJECTS_DIR);
    const backupDir = path.join(getDataDirectory(), PROJECTS_BACKUP_DIR_NAME);

    if (_.isEqual(fs.existsSync(projectsFile), false)) {
      return;
    }

    appLog(getBackendMsg("SQLITE_MIGRATION_START"));

    const db = await initDb();
    const rawList = fs.readFileSync(projectsFile, ENCODING_UTF8);
    const metadataList = jsonUtils.safeParse<any[]>(rawList, []);

    if (_.isEqual(_.isArray(metadataList), false) || _.isEqual(metadataList.length, 0)) {
      appLog(getBackendMsg("SQLITE_MIGRATION_EMPTY"));
      return;
    }

    if (_.isEqual(fs.existsSync(backupDir), false)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    await db.exec(SQL_STATEMENTS.BEGIN_TRANSACTION);

    for (const meta of metadataList) {
      const id = meta.id;
      if (_.isEmpty(id)) {
        continue;
      }

      let projectDetail: VideoProject | null = null;
      const detailFile = path.join(projectsDir, `${id}.json`);
      if (_.isEqual(fs.existsSync(detailFile), true)) {
        const detailRaw = fs.readFileSync(detailFile, ENCODING_UTF8);
        projectDetail = jsonUtils.safeParse<VideoProject>(detailRaw, null);
      }

      if (_.isNil(projectDetail)) {
        projectDetail = {
          id,
          name: meta.name || MIGRATION_DEFAULTS.MIGRATE_PROJECT_NAME,
          description: meta.description || "",
          createdAt: meta.createdAt || new Date().toISOString(),
          updatedAt: meta.updatedAt || new Date().toISOString(),
          currentStep: meta.currentStep || 0,
          creditsUsed: meta.creditsUsed || 0,
          input: meta.input || { type: "script", content: "" },
          config: meta.config || { 
            genre: MIGRATION_DEFAULTS.GENRE, 
            language: MIGRATION_DEFAULTS.LANGUAGE, 
            duration: MIGRATION_DEFAULTS.DURATION 
          },
          hookConfig: meta.hookConfig || { 
            type: MIGRATION_DEFAULTS.HOOK_TYPE, 
            duration: MIGRATION_DEFAULTS.HOOK_DURATION, 
            count: MIGRATION_DEFAULTS.HOOK_COUNT, 
            positions: MIGRATION_DEFAULTS.HOOK_POSITIONS, 
            versions: [] 
          },
          voiceConfig: meta.voiceConfig || { 
            provider: MIGRATION_DEFAULTS.VOICE_PROVIDER, 
            audioType: MIGRATION_DEFAULTS.VOICE_AUDIO_TYPE, 
            gender: MIGRATION_DEFAULTS.VOICE_GENDER, 
            age: MIGRATION_DEFAULTS.VOICE_AGE, 
            emotion: MIGRATION_DEFAULTS.VOICE_EMOTION, 
            speed: MIGRATION_DEFAULTS.VOICE_SPEED, 
            pitch: MIGRATION_DEFAULTS.VOICE_PITCH, 
            volume: MIGRATION_DEFAULTS.VOICE_VOLUME, 
            voiceURI: MIGRATION_DEFAULTS.VOICE_URI 
          },
          visualConfig: meta.visualConfig || { 
            source: MIGRATION_DEFAULTS.VISUAL_SOURCE, 
            style: MIGRATION_DEFAULTS.VISUAL_STYLE, 
            quality: MIGRATION_DEFAULTS.VISUAL_QUALITY, 
            density: MIGRATION_DEFAULTS.VISUAL_DENSITY, 
            characterConsistency: true, 
            assetsMode: MIGRATION_DEFAULTS.VISUAL_ASSETS_MODE, 
            imageGeneratorEngine: MIGRATION_DEFAULTS.VISUAL_SOURCE, 
            generateType: "image", 
            aspectRatio: MIGRATION_DEFAULTS.VISUAL_ASPECT_RATIO, 
            promptInputMethod: MIGRATION_DEFAULTS.VISUAL_PROMPT_INPUT, 
            generateCount: 1 
          },
        } as any;
      }

      await db.run(
        SQL_STATEMENTS.INSERT_PROJECT,
        [
          projectDetail!.id,
          projectDetail!.name,
          projectDetail!.description || "",
          projectDetail!.createdAt || new Date().toISOString(),
          projectDetail!.updatedAt || new Date().toISOString(),
          projectDetail!.currentStep || 0,
          projectDetail!.creditsUsed || 0,
          jsonUtils.safeStringify(projectDetail)
        ],
      );

      if (_.isEqual(fs.existsSync(detailFile), true)) {
        try {
          fs.renameSync(detailFile, path.join(backupDir, `${id}.json`));
        } catch (e) {
          appError(`${getBackendMsg("SQLITE_MIGRATE_PARSE_ERR")} ${id}.json`, e);
        }
      }
    }

    await db.exec(SQL_STATEMENTS.COMMIT);

    try {
      fs.renameSync(projectsFile, path.join(backupDir, PROJECTS_FILE_NAME));
      const backupFile = path.join(getDataDirectory(), MIGRATION_DEFAULTS.BACKUP_JSON);
      if (_.isEqual(fs.existsSync(backupFile), true)) {
        fs.renameSync(backupFile, path.join(backupDir, MIGRATION_DEFAULTS.BACKUP_JSON));
      }
      appLog(getBackendMsg("SQLITE_MIGRATION_SUCCESS"));
    } catch (e) {
      appError(getBackendMsg("SQLITE_MIGRATE_BACKUP_ERR"), e);
    }
  } catch (error) {
    appError(getBackendMsg("SQLITE_MIGRATE_CRITICAL"), error);
    try {
      if (!_.isNil(dbInstance)) {
        await dbInstance.exec(SQL_STATEMENTS.ROLLBACK);
      }
    } catch (e) {}
  }
}
