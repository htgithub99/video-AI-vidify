import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import { ensureMotionSfxLibrary } from "../src/features/motion/server/services/motionSfxLibraryService.ts";
const assets = await ensureMotionSfxLibrary(process.argv[2]);
process.stdout.write(JSON.stringify({ uniqueAudio: assets.length, sourceFiles: assets.reduce((sum, asset) => sum + asset.sources.length, 0), classified: assets.filter((asset) => asset.kinds.length).length }) + VT.EMPTY);
