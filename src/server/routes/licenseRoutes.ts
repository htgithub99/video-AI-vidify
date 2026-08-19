import { Router, Request, Response } from 'express';
import { LicenseService } from '../services/licenseService.js';
import { SecurityConstants, SecurityMessages } from '../../constants/security.js';
import { getResolvedLicenseKey } from '../services/apiKeyResolver.js';
import _ from 'lodash';

const router = Router();

router.get('/default-key', (req: Request, res: Response): any => {
    const key = getResolvedLicenseKey(req);
    res.json({ success: true, license_key: key || SecurityConstants.DEFAULT_LICENSE_KEY });
});

router.post('/validate', async (req: Request, res: Response): Promise<any> => {
    try {
        const licenseKey = _.trim(_.get(req.body, 'license_key')) || getResolvedLicenseKey(req);
        
        if (_.isEmpty(licenseKey)) {
            return res.status(SecurityConstants.HTTP_BAD_REQUEST).json({ error: SecurityMessages.MISSING_REQUEST_INFO });
        }

        const licenseInfo = await LicenseService.validateKey(licenseKey);
        res.json({ success: true, data: licenseInfo, license_key: licenseKey });
    } catch (error: any) {
        res.status(SecurityConstants.HTTP_BAD_REQUEST).json({ success: false, error: error.message });
    }
});

export default router;
