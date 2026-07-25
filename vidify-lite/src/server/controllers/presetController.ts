import { Request, Response } from "express";
import { getPresetsFromDb, savePresetToDb, deletePresetFromDb } from "../utils/db.js";
import { appError } from "../../lib/logger.js";
import { randomUUID } from "crypto";
import _ from "lodash";
import { HttpStatus } from "../../constants/enums.js";
import { BACKEND_MESSAGES } from "../../constants/messages.js";
import { PRESET_CONSTANTS } from "../../constants/texts.js";

export const getAllPresets = async (req: Request, res: Response) => {
  try {
    const presets = await getPresetsFromDb();
    res.status(HttpStatus.OK).json(presets);
  } catch (error: any) {
    appError(BACKEND_MESSAGES.ERROR_GET_PRESETS, error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: _.get(error, "message", BACKEND_MESSAGES.ERROR_GET_PRESETS) });
  }
};

export const savePreset = async (req: Request, res: Response) => {
  try {
    const name = _.trim(_.get(req.body, "name", ""));
    const id = _.get(req.body, "id");
    const config = _.get(req.body, "config", {});

    if (_.isEmpty(name)) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: BACKEND_MESSAGES.PRESET_NAME_REQUIRED });
      return;
    }

    const presetData = {
      id: id || `${PRESET_CONSTANTS.ID_PREFIX}${randomUUID()}`,
      name,
      config,
    };

    const saved = await savePresetToDb(presetData);
    res.status(HttpStatus.CREATED).json(saved);
  } catch (error: any) {
    appError(BACKEND_MESSAGES.ERROR_SAVE_PRESET, error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: _.get(error, "message", BACKEND_MESSAGES.ERROR_SAVE_PRESET) });
  }
};

export const deletePreset = async (req: Request, res: Response) => {
  try {
    const id = _.get(req.params, "id", "");
    if (_.isEmpty(id)) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: BACKEND_MESSAGES.PRESET_ID_REQUIRED });
      return;
    }

    const deleted = await deletePresetFromDb(id);
    if (deleted) {
      res.status(HttpStatus.OK).json({ success: true });
    } else {
      res.status(HttpStatus.NOT_FOUND).json({ error: BACKEND_MESSAGES.PRESET_NOT_FOUND });
    }
  } catch (error: any) {
    appError(BACKEND_MESSAGES.ERROR_DELETE_PRESET, error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: _.get(error, "message", BACKEND_MESSAGES.ERROR_DELETE_PRESET) });
  }
};
