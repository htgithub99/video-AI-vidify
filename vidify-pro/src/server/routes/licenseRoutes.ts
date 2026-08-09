import { Router, Request, Response } from "express";
import { LicenseService } from "../services/licenseService.js";
import {
  SecurityConstants,
  SecurityMessages,
} from "../../constants/security.js";
import _ from "lodash";

const router = Router();

router.post("/validate", async (req: Request, res: Response): Promise<any> => {
  try {
    const { license_key } = req.body;

    if (_.isEmpty(license_key)) {
      return res
        .status(SecurityConstants.HTTP_BAD_REQUEST)
        .json({ error: SecurityMessages.MISSING_REQUEST_INFO });
    }

    const licenseInfo = await LicenseService.validateKey(license_key);
    res.json({ success: true, data: licenseInfo });
  } catch (error: any) {
    res
      .status(SecurityConstants.HTTP_BAD_REQUEST)
      .json({ success: false, error: error.message });
  }
});

export default router;
