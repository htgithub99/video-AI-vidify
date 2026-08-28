export const SQL_STATEMENTS = {
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
  CREATE_RENDER_JOBS_TABLE: `
    CREATE TABLE IF NOT EXISTS render_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      data TEXT NOT NULL
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
  SELECT_RENDER_JOBS: "SELECT data FROM render_jobs ORDER BY updated_at ASC",
  SELECT_RENDER_JOB: "SELECT data FROM render_jobs WHERE id = ?",
  INSERT_RENDER_JOB: `
    INSERT OR REPLACE INTO render_jobs (id, status, updated_at, data)
    VALUES (?, ?, ?, ?)
  `,
  BEGIN_TRANSACTION: "BEGIN TRANSACTION;",
  COMMIT: "COMMIT;",
  ROLLBACK: "ROLLBACK;",
} as const;

export const MIGRATION_DEFAULTS = { PROJECTS_DIR: "projects", BACKUP_JSON: "projects.backup.json", MIGRATE_PROJECT_NAME: "Dự án di chuyển", GENRE: "Kể chuyện", LANGUAGE: "vi", DURATION: "2m", HOOK_TYPE: "Auto", HOOK_DURATION: 10, HOOK_COUNT: 3, HOOK_POSITIONS: "start", VOICE_PROVIDER: "google", VOICE_AUDIO_TYPE: "tts", VOICE_GENDER: "male", VOICE_AGE: "adult", VOICE_EMOTION: "neutral", VOICE_SPEED: 1.0, VOICE_PITCH: 1.0, VOICE_VOLUME: 1.0, VOICE_URI: "google-cloud-vi-a", VISUAL_SOURCE: "Veo3", VISUAL_STYLE: "cinematic", VISUAL_QUALITY: "standard", VISUAL_DENSITY: 5, VISUAL_ASSETS_MODE: "mixed", VISUAL_ASPECT_RATIO: "16:9", VISUAL_PROMPT_INPUT: "paste" } as const;
