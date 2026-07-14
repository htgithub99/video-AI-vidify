import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getDataDirectory } from "./paths.js";
import _ from "lodash";
import { logger } from "../../lib/logger.js";
import { TEMPLATE_CONFIG } from "../../constants/index.js";
import { BACKEND_MESSAGES_LOCALIZED } from "../../constants/messages.js";

export interface CapcutTemplate {
  id: string;
  name: string;
  createdAt: string;
  filePath: string;
}

export function getTemplatesDirectory(): string {
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
      templates.push({
        id: file.replace(TEMPLATE_CONFIG.JSON_EXT, ""),
        name: file.replace(TEMPLATE_CONFIG.JSON_EXT, ""),
        createdAt: stat.birthtime.toISOString(),
        filePath: filePath,
      });
    }
  }

  // Sort by creation time descending
  return _.orderBy(templates, [TEMPLATE_CONFIG.SORT_FIELD_CREATED_AT], [TEMPLATE_CONFIG.SORT_ORDER_DESC]);
}

export function saveTemplate(name: string, content: any): CapcutTemplate {
  const templatesDir = getTemplatesDirectory();
  
  // Normalize name to be a valid filename
  const safeName = name
    .normalize("NFD")
    .replace(TEMPLATE_CONFIG.REGEX_NFD, "")
    .replace(TEMPLATE_CONFIG.REGEX_SAFE_NAME, "")
    .trim()
    .replace(TEMPLATE_CONFIG.REGEX_SPACE, "_");

  const fileName = `${safeName}_${randomUUID().substring(0, TEMPLATE_CONFIG.ID_LENGTH)}${TEMPLATE_CONFIG.JSON_EXT}`;
  const filePath = path.join(templatesDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(content, null, TEMPLATE_CONFIG.JSON_SPACE), TEMPLATE_CONFIG.UTF8);

  return {
    id: fileName.replace(TEMPLATE_CONFIG.JSON_EXT, ""),
    name: name,
    createdAt: new Date().toISOString(),
    filePath: filePath,
  };
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

  const safeName = _.chain(newName)
    .deburr()
    .replace(TEMPLATE_CONFIG.REGEX_SAFE_NAME, "")
    .trim()
    .replace(TEMPLATE_CONFIG.REGEX_SPACE, "_")
    .value();

  const newFileName = `${safeName}_${randomUUID().substring(0, TEMPLATE_CONFIG.ID_LENGTH)}${TEMPLATE_CONFIG.JSON_EXT}`;
  const newFilePath = path.join(templatesDir, newFileName);

  try {
    fs.renameSync(oldFilePath, newFilePath);
    return {
      id: newFileName.replace(TEMPLATE_CONFIG.JSON_EXT, ""),
      name: newName,
      createdAt: fs.statSync(newFilePath).birthtime.toISOString(),
      filePath: newFilePath,
    };
  } catch (e) {
    logger.error(BACKEND_MESSAGES_LOCALIZED.vi.TEMPLATE_RENAME_FAILED, e);
    return null;
  }
}
