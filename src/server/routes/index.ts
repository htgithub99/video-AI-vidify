import express from 'express';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';



const router = express.Router();

import { getVoices } from '../controllers/voiceController.js';


router.get('/projects', getAllProjects);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);


router.get('/voices', getVoices);

export default router;
