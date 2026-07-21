import express from "express";
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject } from "../controllers/projectController.js";

const router = express.Router();

import { getVoices } from "../controllers/voiceController.js";

router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);
router.post("/projects", createProject);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

router.get("/voices", getVoices);

import settingsRoutes from "./settingsRoutes.js";
router.use("/settings", settingsRoutes);

export default router;
