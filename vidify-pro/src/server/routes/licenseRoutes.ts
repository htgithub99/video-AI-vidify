import { Router, Request, Response } from 'express';
import { LicenseService } from '../services/licenseService.js';

const router = Router();

router.post('/validate', async (req: Request, res: Response) => {
    try {
        const { license_key } = req.body;
        
        if (!license_key) {
            return res.status(400).json({ error: 'Missing license_key' });
        }

        const licenseInfo = await LicenseService.validateKey(license_key);
        
        if (!licenseInfo) {
            return res.status(404).json({ error: 'License key not found or revoked' });
        }

        res.json({ success: true, data: licenseInfo });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
