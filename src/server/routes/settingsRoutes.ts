import express from "express";
import { getSettingsFromGAS, saveApiKeys, addGoogleAccount, updateGoogleAccountStatus } from "../controllers/settingsController.js";

const router = express.Router();

router.get("/gas-config", getSettingsFromGAS);
router.post("/api-keys", saveApiKeys);
router.post("/accounts", addGoogleAccount);
router.put("/accounts/status", updateGoogleAccountStatus);

export default router;
