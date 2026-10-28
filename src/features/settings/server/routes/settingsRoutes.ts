import express from "express";
import { getSettingsFromGAS, saveApiKeys, addGoogleAccount, updateGoogleAccountStatus } from "../controllers/settingsController.js";
import { SETTINGS_API_PATHS } from "../../../../constants/apiRoutes.js";
const router = express.Router();
router.get(SETTINGS_API_PATHS.GAS_CONFIG, getSettingsFromGAS);
router.post(SETTINGS_API_PATHS.API_KEYS, saveApiKeys);
router.post(SETTINGS_API_PATHS.ACCOUNTS, addGoogleAccount);
router.put(SETTINGS_API_PATHS.ACCOUNTS_STATUS, updateGoogleAccountStatus);
export default router;
