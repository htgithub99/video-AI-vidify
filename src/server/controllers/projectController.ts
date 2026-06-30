import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { VideoProject } from '../../types.js';
import { randomUUID } from 'crypto';

const PROJECTS_FILE = path.join(process.cwd(), 'projects.json');

import { EXTERNAL_URLS } from '../../constants/apiRoutes.js';
import { getBackendMsg } from '../../constants/messages.js';
import { appError } from '../../lib/logger.js';

function getProjects(): VideoProject[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      
      const cleaned = data.replace(/https:\/\/images\.unsplash\.com\/featured\/800x450\/\?([a-zA-Z0-9%_,\-\+]+)/g, (match, query) => {
        const decoded = decodeURIComponent(query).replace(/%2C/g, ',').replace(/\+/g, ',').replace(/,/g, ',');
        return `${EXTERNAL_URLS.LOREM_FLICKR}/800/450/${decoded}`;
      });
      return JSON.parse(cleaned);
    }
  } catch (error) {
    appError('PROJECT_READ_ERR', error);
  }
  return [];
}

function saveProjects(projects: VideoProject[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (error) {
    appError('PROJECT_WRITE_ERR', error);
  }
}

export const getAllProjects = (req: Request, res: Response) => {
  const projects = getProjects();
  res.json(projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
};

export const createProject = (req: Request, res: Response) => {
  const nowStr = new Date().toISOString();
  const newProject: VideoProject = {
    ...req.body,
    id: req.body.id || randomUUID(),
    createdAt: req.body.createdAt || nowStr,
    updatedAt: req.body.updatedAt || nowStr
  };
  const projects = getProjects();
  projects.push(newProject);
  saveProjects(projects);
  res.status(201).json(newProject);
};

export const updateProject = (req: Request, res: Response) => {
  const { id } = req.params;
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  const isVi = req.query.lang !== 'en' && req.body?.language !== 'en';

  if (index !== -1) {
    projects[index] = { ...projects[index], ...req.body, updatedAt: new Date().toISOString() };
    saveProjects(projects);
    res.json(projects[index]);
  } else {
    res.status(404).json({ error: getBackendMsg('PROJECT_NOT_FOUND', isVi) });
  }
};

export const deleteProject = (req: Request, res: Response) => {
  const { id } = req.params;
  let projects = getProjects();
  const initialLength = projects.length;
  projects = projects.filter(p => p.id !== id);
  const isVi = req.query.lang !== 'en';

  if (projects.length !== initialLength) {
    saveProjects(projects);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: getBackendMsg('PROJECT_NOT_FOUND', isVi) });
  }
};