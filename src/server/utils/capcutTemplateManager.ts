import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getDataDirectory } from "./paths.js";
import _ from "lodash";
import { logger } from "../../lib/logger.js";
import { TEMPLATE_CONFIG } from "../../constants/index.js";
import { BACKEND_MESSAGES_LOCALIZED } from "../../constants/messages.js";
import { jsonUtils } from "../../lib/json.js";

export interface CapcutTemplate {
  id: string;
  name: string;
  createdAt: string;
  filePath: string;
}

function getTemplatesDirectory(): string {
  const dataDir = getDataDirectory();
  const templatesDir = path.join(dataDir, TEMPLATE_CONFIG.DIR_NAME);
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  return templatesDir;
}

export function listTemplates(): CapcutTemplate[] {
  const templatesDir = getTemplatesDirectory();
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const files = fs.readdirSync(templatesDir);
  const templates: CapcutTemplate[] = [];

  for (const file of files) {
    if (file.endsWith(TEMPLATE_CONFIG.JSON_EXT)) {
      const filePath = path.join(templatesDir, file);
      const stat = fs.statSync(filePath);
      const id = _.replace(file, TEMPLATE_CONFIG.JSON_EXT, "");
      const uuidRegex = new RegExp(`(?:_([a-zA-Z0-9]{${TEMPLATE_CONFIG.ID_LENGTH}}))+$`);
      const name = _.replace(id, uuidRegex, "");

      templates.push({
        id: id,
        name: name,
        createdAt: stat.birthtime.toISOString(),
        filePath: filePath,
      });
    }
  }

  return _.orderBy(templates, [TEMPLATE_CONFIG.SORT_FIELD_CREATED_AT], [TEMPLATE_CONFIG.SORT_ORDER_DESC]);
}

export function saveTemplate(name: string, folderPath: string): CapcutTemplate {
  const templatesDir = getTemplatesDirectory();

  const currentTemplates = listTemplates();
  if (currentTemplates.length >= TEMPLATE_CONFIG.MAX_TEMPLATES) throw new Error(TEMPLATE_CONFIG.MAX_TEMPLATES_ERROR);

  if (!fs.existsSync(path.join(folderPath, TEMPLATE_CONFIG.DRAFT_CONTENT_FILE))) {
    throw new Error(TEMPLATE_CONFIG.INVALID_TEMPLATE_ERROR);
  }

  const uuidRegex = new RegExp(`(?:_([a-zA-Z0-9]{${TEMPLATE_CONFIG.ID_LENGTH}}))+$`);
  const cleanName = _.replace(name, uuidRegex, "");

  const safeName = _.chain(cleanName).deburr().replace(TEMPLATE_CONFIG.REGEX_SAFE_NAME, "").trim().replace(TEMPLATE_CONFIG.REGEX_SPACE, "_").value();

  const fileName = `${safeName}_${randomUUID().substring(0, TEMPLATE_CONFIG.ID_LENGTH)}${TEMPLATE_CONFIG.JSON_EXT}`;
  const filePath = path.join(templatesDir, fileName);

  const content = { folderPath: folderPath };
  fs.writeFileSync(filePath, jsonUtils.safeStringify(content, null, TEMPLATE_CONFIG.JSON_SPACE), TEMPLATE_CONFIG.UTF8);

  return { id: _.replace(fileName, TEMPLATE_CONFIG.JSON_EXT, ""), name: cleanName, createdAt: new Date().toISOString(), filePath: filePath };
}

export function deleteTemplate(id: string): boolean {
  const templatesDir = getTemplatesDirectory();
  const filePath = path.join(templatesDir, `${id}${TEMPLATE_CONFIG.JSON_EXT}`);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (e) {
      logger.error(BACKEND_MESSAGES_LOCALIZED.vi.TEMPLATE_DELETE_FAILED, e);
      return false;
    }
  }
  return false;
}

export function renameTemplate(id: string, newName: string): CapcutTemplate | null {
  const templatesDir = getTemplatesDirectory();
  const oldFilePath = path.join(templatesDir, `${id}${TEMPLATE_CONFIG.JSON_EXT}`);

  if (!fs.existsSync(oldFilePath)) return null;

  const uuidRegex = new RegExp(`(?:_([a-zA-Z0-9]{${TEMPLATE_CONFIG.ID_LENGTH}}))+$`);
  const cleanNewName = _.replace(newName, uuidRegex, "");

  const safeName = _.chain(cleanNewName).deburr().replace(TEMPLATE_CONFIG.REGEX_SAFE_NAME, "").trim().replace(TEMPLATE_CONFIG.REGEX_SPACE, "_").value();

  const newFileName = `${safeName}_${randomUUID().substring(0, TEMPLATE_CONFIG.ID_LENGTH)}${TEMPLATE_CONFIG.JSON_EXT}`;
  const newFilePath = path.join(templatesDir, newFileName);

  try {
    fs.renameSync(oldFilePath, newFilePath);
    return { id: _.replace(newFileName, TEMPLATE_CONFIG.JSON_EXT, ""), name: cleanNewName, createdAt: new Date().toISOString(), filePath: newFilePath };
  } catch (e) {
    logger.error(BACKEND_MESSAGES_LOCALIZED.vi.TEMPLATE_RENAME_FAILED, e);
    return null;
  }
}
