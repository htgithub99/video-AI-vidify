import {
  SOURCE_TEMPLATE_DELETED_PROFILE_DIRECTORY,
  SOURCE_TEMPLATE_FAILED_TO_DELETE_PROFILE_DIRECTORY,
  SOURCE_TEMPLATE_GOOGLE_PROFILE,
  SOURCE_TEMPLATE_G_PROFILE,
  SOURCE_TEMPLATE_INTERACTIVE_LOGIN_BROWSER_CLOSED_FOR_PROFILE,
  SOURCE_TEMPLATE_STARTING_INTERACTIVE_LOGIN_SESSION_FOR_PROFILE,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_DEFAULT_2,
  SOURCE_TEXT_DISABLE_BLINK_FEATURES_AUTOMATIONCONTROLLED,
  SOURCE_TEXT_DISABLE_SETUID_SANDBOX,
  SOURCE_TEXT_GOOGLE_PROFILES,
  SOURCE_TEXT_NO_SANDBOX,
} from "../../constants/sourceText";
import path from "path";
import fs from "fs";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { getDataDirectory } from "../utils/paths.js";
import _ from "lodash";
import { logger } from "../../lib/logger.js";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
chromium.use(stealthPlugin());
export interface GoogleProfile {
  id: string;
  name: string;
  isLinked: boolean;
}
const PROFILES_DIR_NAME = SOURCE_TEXT_GOOGLE_PROFILES;
const DEFAULT_PROFILE_COUNT = 3;
function getProfilesDir(): string {
  const dataDir = getDataDirectory();
  const profilesDir = path.join(dataDir, PROFILES_DIR_NAME);
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  return profilesDir;
}
export function getProfiles(): GoogleProfile[] {
  const profilesDir = getProfilesDir();
  const profiles: GoogleProfile[] = [];
  for (let i = 1; i <= DEFAULT_PROFILE_COUNT; i++) {
    const id = SOURCE_TEMPLATE_G_PROFILE(`${i}`);
    const profilePath = path.join(profilesDir, id);
    const isLinked = fs.existsSync(profilePath) && fs.existsSync(path.join(profilePath, SOURCE_TEXT_DEFAULT_2));
    profiles.push({
      id,
      name: SOURCE_TEMPLATE_GOOGLE_PROFILE(`${i}`),
      isLinked,
    });
  }
  return profiles;
}
export async function launchLoginBrowser(profileId: string): Promise<void> {
  const profilesDir = getProfilesDir();
  const profilePath = path.join(profilesDir, profileId);
  logger.info(SOURCE_TEMPLATE_STARTING_INTERACTIVE_LOGIN_SESSION_FOR_PROFILE(`${profileId}`));
  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [SOURCE_TEXT_NO_SANDBOX, SOURCE_TEXT_DISABLE_SETUID_SANDBOX, SOURCE_TEXT_DISABLE_BLINK_FEATURES_AUTOMATIONCONTROLLED],
  });
  let page = _.first(context.pages());
  if (!page) page = await context.newPage();
  await page.goto(EXTERNAL_URLS.GOOGLE_ACCOUNTS);
  return new Promise<void>((resolve) => {
    context.on(SOURCE_TEXT_CLOSE_2, () => {
      logger.info(SOURCE_TEMPLATE_INTERACTIVE_LOGIN_BROWSER_CLOSED_FOR_PROFILE(`${profileId}`));
      resolve();
    });
  });
}
export function deleteProfile(profileId: string): void {
  const profilesDir = getProfilesDir();
  const profilePath = path.join(profilesDir, profileId);
  if (fs.existsSync(profilePath)) {
    try {
      fs.rmSync(profilePath, { recursive: true, force: true });
      logger.info(SOURCE_TEMPLATE_DELETED_PROFILE_DIRECTORY(`${profilePath}`));
    } catch (err) {
      logger.error(SOURCE_TEMPLATE_FAILED_TO_DELETE_PROFILE_DIRECTORY(`${profilePath}`), err);
      throw err;
    }
  }
}
