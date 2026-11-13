import type { Request, Response } from "express";
import { CHROME_BACKUP as C } from "../../../../constants/chromeBackup.js";
import { AI_AVAILABILITY as A } from "../../../../constants/aiAvailability.js";
import { addBackupChrome, clearChromeAvailability, readChromeBackupSettings, removeBackupChrome, renameBackupChrome, saveChromeBackupSettings } from "../../../../server/services/chromeBackupService.js";
import { checkBackupChrome, prepareBackupChrome } from "../../../../server/services/imageGeneratorService.js";
import { refreshAiLoadSlots } from "../../../../server/services/aiLoadGate.js";
const respond = async (res: Response, work: () => unknown) => {
  try {
    res.json(await work());
  } catch (error) {
    res.status(500).json({ error: String((error as Error).message) });
  }
};
const text = (value: unknown): string | undefined => (typeof value === C.STRING ? (value as string) : undefined);
export const getChromeBackup = (_req: Request, res: Response) => respond(res, () => readChromeBackupSettings());
export const updateChromeBackup = (req: Request, res: Response) =>
  respond(res, () => {
    const body = req.body || {};
    const patch: Parameters<typeof saveChromeBackupSettings>[0] = {};
    if (typeof body.enabled === C.BOOLEAN) patch.enabled = body.enabled;
    if (typeof body.useBackup === C.BOOLEAN) patch.useBackup = body.useBackup;
    if (body.pinned === null || typeof body.pinned === C.STRING) patch.pinned = body.pinned === A.MAIN ? null : body.pinned;
    if (body.waitPolicy === A.WAIT_POLICY.WAIT || body.waitPolicy === A.WAIT_POLICY.STOP) patch.waitPolicy = body.waitPolicy;
    if (Array.isArray(body.fallbackChain)) patch.fallbackChain = body.fallbackChain;
    if (typeof body.lowSpec === C.BOOLEAN) patch.lowSpec = body.lowSpec;
    const result = Object.keys(patch).length ? saveChromeBackupSettings(patch) : readChromeBackupSettings();
    refreshAiLoadSlots();
    return result;
  });
export const prepareChromeBackup = (_req: Request, res: Response) => respond(res, () => prepareBackupChrome());
export const addChrome = (req: Request, res: Response) => respond(res, () => addBackupChrome(text(req.body?.name)));
export const renameChrome = (req: Request, res: Response) => respond(res, () => renameBackupChrome(String(req.params.id), text(req.body?.name) || C.EMPTY));
export const removeChrome = (req: Request, res: Response) => respond(res, () => removeBackupChrome(String(req.params.id)));
export const prepareChrome = (req: Request, res: Response) => respond(res, () => prepareBackupChrome(String(req.params.id)));
export const checkChrome = (req: Request, res: Response) => respond(res, () => checkBackupChrome(String(req.params.id)));
export const clearAvailability = (req: Request, res: Response) => respond(res, () => clearChromeAvailability(text(req.query.chromeId), text(req.query.provider)));
