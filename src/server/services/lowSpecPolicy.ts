import os from "node:os";
import { AI_LOAD } from "../../constants/aiLoad.js";
import { isLowSpecMode } from "./chromeBackupService.js";
import { aiLoadBusy } from "./aiLoadGate.js";
export const machineCpus = (): number => {
  const cpus = os.cpus().length || AI_LOAD.LOW_SPEC_MIN_CPUS;
  return isLowSpecMode() && aiLoadBusy() ? Math.max(AI_LOAD.LOW_SPEC_MIN_CPUS, Math.ceil(cpus * AI_LOAD.LOW_SPEC_CPU_SHARE)) : cpus;
};
export const machineTabs = (tabs: number): number => (isLowSpecMode() ? Math.max(1, Math.min(tabs, AI_LOAD.LOW_SPEC_TABS)) : tabs);
