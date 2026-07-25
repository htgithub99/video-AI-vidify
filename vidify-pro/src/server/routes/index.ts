import express from "express";
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject } from "../controllers/projectController.js";
import { getAllPresets, savePreset, deletePreset } from "../controllers/presetController.js";

const router = express.Router();

import { getVoices } from "../controllers/voiceController.js";

router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);
router.post("/projects", createProject);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

router.get("/presets", getAllPresets);
router.post("/presets", savePreset);
router.delete("/presets/:id", deletePreset);

router.get("/voices", getVoices);

export default router;

