import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import fs from "fs";
import { VideoProject } from "../../types.js";
import { PROJECTS_FILE_NAME, ENCODING_UTF8, SQLITE_DB_NAME, PROJECTS_BACKUP_DIR_NAME, getBackendMsg } from "../../constants";
import { appError } from "../../lib/logger.js";
import _ from 'lodash';


let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;
const dbPath = path.join(process.cwd(), SQLITE_DB_NAME);

export async function initDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!_.isNil(dbInstance)) return dbInstance;

  try {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await dbInstance.exec("PRAGMA journal_mode = WAL;");

    await dbInstance.exec(`
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
    `);

    return dbInstance;
  } catch (error) {
    appError(getBackendMsg("SQLITE_INIT_ERR"), error);
    throw error;
  }
}

export async function getProjectsListFromDb(): Promise<any[]> {
  try {
    const db = await initDb();
    const rows = await db.all(`
      SELECT id, name, description, created_at as createdAt, updated_at as updatedAt, 
             current_step as currentStep, credits_used as creditsUsed, data 
      FROM projects 
      ORDER BY updated_at DESC
    `);

    return _.map(rows, (row) => {
      let config = undefined;
      try {
        const detail = JSON.parse(row.data);
        config = detail.config
          ? {
              genre: detail.config.genre,
              language: detail.config.language,
              duration: detail.config.duration,
            }
          : undefined;
      } catch (e) {}

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
    const row = await db.get("SELECT data FROM projects WHERE id = ?", [id]);
    if (!_.isNil(row) && !_.isNil(row.data)) {
      return JSON.parse(row.data) as VideoProject;
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
      `INSERT OR REPLACE INTO projects (id, name, description, created_at, updated_at, current_step, credits_used, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project.id, project.name, project.description || "", project.createdAt || new Date().toISOString(), project.updatedAt || new Date().toISOString(), project.currentStep || 0, project.creditsUsed || 0, JSON.stringify(project)],
    );
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_WRITE_ERR")} ${project.id}`, error);
    throw error;
  }
}

export async function deleteProjectFromDb(id: string): Promise<boolean> {
  try {
    const db = await initDb();
    const result = await db.run("DELETE FROM projects WHERE id = ?", [id]);
    return (result.changes && _.gt(result.changes, 0)) || false;
  } catch (error) {
    appError(`${getBackendMsg("SQLITE_DELETE_ERR")} ${id}`, error);
    return false;
  }
}

export async function migrateJsonToSqlite(): Promise<void> {
  try {
    const projectsFile = path.join(process.cwd(), PROJECTS_FILE_NAME);
    const projectsDir = path.join(process.cwd(), "projects");
    const backupDir = path.join(process.cwd(), PROJECTS_BACKUP_DIR_NAME);

    if (_.eq(fs.existsSync(projectsFile), false)) {
      return;
    }

    console.log(getBackendMsg("SQLITE_MIGRATION_START"));

    const db = await initDb();

    const rawList = fs.readFileSync(projectsFile, ENCODING_UTF8);
    const metadataList = JSON.parse(rawList);

    if (_.eq(_.isArray(metadataList), false) || _.eq(metadataList.length, 0)) {
      console.log(getBackendMsg("SQLITE_MIGRATION_EMPTY"));
      return;
    }

    if (_.eq(fs.existsSync(backupDir), false)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    await db.exec("BEGIN TRANSACTION;");

    for (const meta of metadataList) {
      const id = meta.id;
      if (_.isEmpty(id)) continue;

      let projectDetail: VideoProject | null = null;

      const detailFile = path.join(projectsDir, `${id}.json`);
      if (_.eq(fs.existsSync(detailFile), true)) {
        try {
          const detailRaw = fs.readFileSync(detailFile, ENCODING_UTF8);
          projectDetail = JSON.parse(detailRaw);
        } catch (e) {
          appError(`${getBackendMsg("SQLITE_MIGRATE_PARSE_ERR")} ${id}`, e);
        }
      }

      if (_.isNil(projectDetail)) {
        projectDetail = {
          id,
          name: meta.name || "Dự án di chuyển",
          description: meta.description || "",
          createdAt: meta.createdAt || new Date().toISOString(),
          updatedAt: meta.updatedAt || new Date().toISOString(),
          currentStep: meta.currentStep || 0,
          creditsUsed: meta.creditsUsed || 0,
          input: meta.input || { type: "script", content: "" },
          config: meta.config || { genre: "Kể chuyện", language: "vi", duration: "2m" },
          hookConfig: meta.hookConfig || { type: "Auto", duration: 10, count: 3, positions: "start", versions: [] },
          voiceConfig: meta.voiceConfig || { provider: "google", audioType: "tts", gender: "male", age: "adult", emotion: "neutral", speed: 1.0, pitch: 1.0, volume: 1.0, voiceURI: "google-cloud-vi-a" },
          visualConfig: meta.visualConfig || { source: "Veo3", style: "cinematic", quality: "standard", density: 5, characterConsistency: true, assetsMode: "mixed", imageGeneratorEngine: "Veo3", generateType: "image", aspectRatio: "16:9", promptInputMethod: "paste", generateCount: 1 },
        } as any;
      }

      await db.run(
        `INSERT OR REPLACE INTO projects (id, name, description, created_at, updated_at, current_step, credits_used, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectDetail.id, projectDetail.name, projectDetail.description || "", projectDetail.createdAt || new Date().toISOString(), projectDetail.updatedAt || new Date().toISOString(), projectDetail.currentStep || 0, projectDetail.creditsUsed || 0, JSON.stringify(projectDetail)],
      );

      if (_.eq(fs.existsSync(detailFile), true)) {
        try {
          fs.renameSync(detailFile, path.join(backupDir, `${id}.json`));
        } catch (e) {
          appError(`${getBackendMsg("SQLITE_MIGRATE_PARSE_ERR")} ${id}.json`, e);
        }
      }
    }

    await db.exec("COMMIT;");

    try {
      fs.renameSync(projectsFile, path.join(backupDir, PROJECTS_FILE_NAME));
      const backupFile = path.join(process.cwd(), "projects.backup.json");
      if (_.eq(fs.existsSync(backupFile), true)) {
        fs.renameSync(backupFile, path.join(backupDir, "projects.backup.json"));
      }
      console.log(getBackendMsg("SQLITE_MIGRATION_SUCCESS"));
    } catch (e) {
      appError(getBackendMsg("SQLITE_MIGRATE_BACKUP_ERR"), e);
    }
  } catch (error) {
    appError(getBackendMsg("SQLITE_MIGRATE_CRITICAL"), error);
    try {
      if (!_.isNil(dbInstance)) {
        await dbInstance.exec("ROLLBACK;");
      }
    } catch (e) {}
  }
}
