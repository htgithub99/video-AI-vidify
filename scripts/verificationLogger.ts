import { appLog } from "../src/lib/logger.ts";
export const writeVerificationLog = (message: string): void => appLog(message);
