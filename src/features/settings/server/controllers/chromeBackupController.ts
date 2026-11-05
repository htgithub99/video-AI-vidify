import type { Request, Response } from "express";
import { readChromeBackupSettings, saveChromeBackupSettings } from "../../../../server/services/chromeBackupService.js";
import { checkBackupChrome, prepareBackupChrome } from "../../../../server/services/imageGeneratorService.js";
export const getChromeBackup = async (_req: Request, res: Response) => {
  try {
    res.json(await checkBackupChrome());
  } catch (error) {
    res.status(500).json({ error: String((error as Error).message) });
  }
};
export const updateChromeBackup = (req: Request, res: Response) => {
  try {
    if (typeof req.body?.enabled !== "boolean") return res.status(400).json(readChromeBackupSettings());
    res.json(saveChromeBackupSettings({ enabled: req.body.enabled }));
  } catch (error) {
    res.status(500).json({ error: String((error as Error).message) });
  }
};
export const prepareChromeBackup = async (_req: Request, res: Response) => {
  try {
    res.json(await prepareBackupChrome());
  } catch (error) {
    res.status(500).json({ error: String((error as Error).message) });
  }
};
