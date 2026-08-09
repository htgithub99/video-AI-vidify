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

const PROFILES_DIR_NAME = "google_profiles";
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
    const id = `g_profile_${i}`;
    const profilePath = path.join(profilesDir, id);
    const isLinked =
      fs.existsSync(profilePath) &&
      fs.existsSync(path.join(profilePath, "Default"));
    profiles.push({
      id,
      name: `Google Profile ${i}`,
      isLinked,
    });
  }

  return profiles;
}

export async function launchLoginBrowser(profileId: string): Promise<void> {
  const profilesDir = getProfilesDir();
  const profilePath = path.join(profilesDir, profileId);

  logger.info(`Starting interactive login session for profile: ${profileId}`);

  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  let page = _.first(context.pages());
  if (!page) {
    page = await context.newPage();
  }
  await page.goto(EXTERNAL_URLS.GOOGLE_ACCOUNTS);

  return new Promise<void>((resolve) => {
    context.on("close", () => {
      logger.info(`Interactive login browser closed for profile: ${profileId}`);
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
      logger.info(`Deleted profile directory: ${profilePath}`);
    } catch (err) {
      logger.error(`Failed to delete profile directory: ${profilePath}`, err);
      throw err;
    }
  }
}
