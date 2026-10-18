import fs from "node:fs";
import { MOTION_STYLE_VERIFICATION_TEXTS as ST, MOTION_STYLE_VERIFICATION_FORMATS as SF } from "../motionStyleVerificationTexts.ts";
export const readMotionStyleFixture = (name: string): any => JSON.parse(fs.readFileSync(SF.FIXTURE_FILE(name), ST.UTF8));
