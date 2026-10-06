import { STORAGE_TEXTS } from "../constants/storage.js";
import { logger } from "../lib/logger.js";
import { migrateLegacyStorage } from "./services/storageService.js";
try {
  migrateLegacyStorage();
} catch (error) {
  logger.warn(STORAGE_TEXTS.MIGRATE_FAILED, error);
}
