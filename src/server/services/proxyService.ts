import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import {
  SOURCE_TEXT_CHECK,
  SOURCE_TEXT_CREDENTIALS,
  SOURCE_TEXT_LAUNCH,
  SOURCE_TEXT_LAUNCH_START,
  SOURCE_TEXT_CHROMIUM,
  SOURCE_TEXT_LAUNCH_READY,
  SOURCE_TEXT_PAGE,
  SOURCE_TEXT_NAVIGATION,
  SOURCE_TEXT_NAVIGATION_START,
  SOURCE_TEXT_CHECK_SUCCESS,
  SOURCE_TEMPLATE_FAILED,
  SOURCE_TEXT_OPEN,
  SOURCE_TEXT_OPEN_START,
  SOURCE_TEXT_CHUA_CAU_HINH_PROXY_CHO_PHIEN_TRINH,
  SOURCE_TEXT_SESSION_CLOSED,
  SOURCE_TEXT_OPEN_SUCCESS,
  SOURCE_TEXT_MANUAL_CHROME,
  SOURCE_TEXT_KHOI_DONG_TRINH_DUYET_HET_THOI_GIAN,
  SOURCE_TEMPLATE_KHONG_KHOI_DONG_DUOC_TRINH_DUYET_CHO,
  SOURCE_TEMPLATE_KHONG_TAI_DUOC_TRANG_QUA_PROXY,
  SOURCE_TEXT_HTTPS_WWW_YOUTUBE_COM,
  SOURCE_TEXT_HTTPS_STUDIO_YOUTUBE_COM,
  SOURCE_TEXT_PROXY_TU_CHOI_XAC_THUC_KIEM_TRA,
  SOURCE_TEXT_KET_NOI_PROXY_HET_THOI_GIAN_CHO,
  SOURCE_TEXT_CHUA_TIM_THAY_TRINH_DUYET_HAY_CAI,
  SOURCE_TEXT_KHONG_THE_KET_NOI_QUA_PROXY_KIEM,
  SOURCE_TEXT_PROXY_SQLITE,
  SOURCE_TEXT_PRAGMA_JOURNAL_MODE_WAL_CREATE_TABLE_IF,
  SOURCE_TEXT_OPENING,
  SOURCE_TEXT_CLOSING,
  SOURCE_TEXT_CLOSED,
  SOURCE_TEXT_ID_PROXY_KHONG_HOP_LE,
  SOURCE_TEXT_SELECT_DATA_FROM_PROXY_PROFILES_WHERE_ID,
  SOURCE_TEXT_KHONG_TIM_THAY_PROXY,
  SOURCE_TEXT_INSERT_OR_REPLACE_INTO_PROXY_PROFILES_ID,
  SOURCE_TEXT_DICH_VU_PROXY_DANG_DONG,
  SOURCE_TEXT_PROXY_DANG_XU_LY_VUI_LONG_CHO,
  SOURCE_TEXT_SELECT_DATA_FROM_PROXY_PROFILES_ORDER_BY,
  SOURCE_TEXT_SELECT_REVISION_ENCRYPTED_FROM_PROXY_WORKSPACE_WHERE,
  SOURCE_TEXT_BAN_NHAP_PROXY_KHONG_HOP_LE,
  SOURCE_TEXT_BAN_NHAP_QUA_LON_HAY_CHIA_DANH,
  SOURCE_TEXT_SELECT_REVISION_FROM_PROXY_WORKSPACE_WHERE_ID,
  SOURCE_TEXT_INSERT_INTO_PROXY_WORKSPACE_ID_REVISION_ENCRYPTED,
  SOURCE_TEXT_SAVING,
  SOURCE_TEXT_DONG_PHIEN_TRINH_DUYET_TRUOC_KHI_SUA,
  SOURCE_TEXT_SOCKS5,
  SOURCE_TEXT_XOA_MAT_KHAU_DA_LUU_TRUOC_KHI,
  SOURCE_TEXT_CAN_USERNAME_HOAC_XOA_MAT_KHAU_DA,
  SOURCE_TEXT_MOI_LAN_NHAP_TU_1_DEN_200,
  SOURCE_TEXT_DANH_SACH_CO_PROXY_TRUNG_NHAU_HOAC,
  SOURCE_TEXT_SYMBOL_55,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEMPLATE_INSERT_INTO_PROXY_PROFILES_ID_DATA,
  SOURCE_TEXT_DONG_PHIEN_TRINH_DUYET_TRUOC_KHI_XOA,
  SOURCE_TEXT_DELETE_FROM_PROXY_PROFILES_WHERE_ID,
  SOURCE_TEXT_CHROME,
  SOURCE_TEXT_CHECKING,
  SOURCE_TEXT_HTTPS_API_IPIFY_ORG_FORMAT_JSON,
  SOURCE_TEXT_DOMCONTENTLOADED,
  SOURCE_TEXT_OK,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_TRANG_MO_KHONG_HOP_LE,
  SOURCE_TEXT_PROXY_BROWSER_PROFILES,
  SOURCE_TEXT_CLOSE_2,
} from "../../constants/sourceText.js";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readProxyExitIp, isProxyTimeout } from "./proxyNetwork.js";
import { getErrorMessage } from "../../utils/errorUtils.js";
import { PROXY_NETWORK_ARGS } from "../../constants/proxy.js";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import { chromium, type BrowserContext, type LaunchOptions } from "playwright";
import { getProxyIdentity, proxyServer, validateProxyInput } from "../../lib/proxyValidation.js";
import type { ProxyCheck, ProxyOpenResult, ProxyProfile, ProxyWorkspaceSnapshot } from "../../types/proxy.js";
import { getDataDirectory } from "../utils/paths.js";
import { transformProxySecret } from "./proxySecretStore.js";
import { createProxyDiagnostics } from "./proxyDiagnostics.js";
import { launchNativeProxyBrowser, NativeProxyRouteError, type NativeProxyBrowserFactory, type NativeProxySession } from "./nativeProxyBrowser.js";
type StoredProfile = Omit<ProxyProfile, "session" | "hasPassword"> & { encryptedPassword: string };
const DESTINATIONS = { browser: SOURCE_TEXT_HTTPS_WWW_YOUTUBE_COM, youtube: SOURCE_TEXT_HTTPS_WWW_YOUTUBE_COM, studio: SOURCE_TEXT_HTTPS_STUDIO_YOUTUBE_COM } as const;
export function proxyFailure(error: unknown): string {
  const message = getErrorMessage(error, "");
  if (/407|INVALID_AUTH|AUTH_UNSUPPORTED|credentials/i.test(message)) return SOURCE_TEXT_PROXY_TU_CHOI_XAC_THUC_KIEM_TRA;
  if (isProxyTimeout(error)) return SOURCE_TEXT_KET_NOI_PROXY_HET_THOI_GIAN_CHO;
  if (/Executable doesn't exist|distribution.*not found/i.test(message)) return SOURCE_TEXT_CHUA_TIM_THAY_TRINH_DUYET_HAY_CAI;
  return SOURCE_TEXT_KHONG_THE_KET_NOI_QUA_PROXY_KIEM;
}
export class ProxyService {
  private dbPromise?: Promise<Database>;
  private contexts = new Map<string, NativeProxySession>();
  private busy = new Map<string, "opening" | "closing" | "checking" | "saving">();
  private checkBrowsers = new Set<Awaited<ReturnType<typeof chromium.launch>>>();
  private stopping = false;
  private draftQueue: Promise<unknown> = Promise.resolve();
  constructor(
    private directory = getDataDirectory(),
    private secret = transformProxySecret,
    private engine: Pick<typeof chromium, "launch" | "launchPersistentContext"> = chromium,
    private openBrowser: NativeProxyBrowserFactory = launchNativeProxyBrowser,
  ) {}
  private db(): Promise<Database> {
    if (!this.dbPromise)
      this.dbPromise = (async () => {
        const db = await open({ filename: path.join(this.directory, SOURCE_TEXT_PROXY_SQLITE), driver: sqlite3.Database });
        await db.exec(SOURCE_TEXT_PRAGMA_JOURNAL_MODE_WAL_CREATE_TABLE_IF);
        return db;
      })().catch((error) => {
        this.dbPromise = undefined;
        throw error;
      });
    return this.dbPromise;
  }
  private publicProfile(stored: StoredProfile): ProxyProfile {
    const { encryptedPassword, ...profile } = stored;
    const busy = this.busy.get(stored.id);
    return { ...profile, hasPassword: Boolean(encryptedPassword), session: busy === SOURCE_TEXT_OPENING || busy === SOURCE_TEXT_CLOSING ? busy : this.contexts.has(stored.id) ? SOURCE_TEXT_OPEN : SOURCE_TEXT_CLOSED };
  }
  private async stored(id: string): Promise<StoredProfile> {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error(SOURCE_TEXT_ID_PROXY_KHONG_HOP_LE);
    const row = await (await this.db()).get(SOURCE_TEXT_SELECT_DATA_FROM_PROXY_PROFILES_WHERE_ID, id);
    if (!row) throw new Error(SOURCE_TEXT_KHONG_TIM_THAY_PROXY);
    return parseJson(row.data);
  }
  private async write(profile: StoredProfile): Promise<void> {
    await (await this.db()).run(SOURCE_TEXT_INSERT_OR_REPLACE_INTO_PROXY_PROFILES_ID, profile.id, stringifyJson(profile));
  }
  private async exclusive<T>(id: string, state: "opening" | "closing" | "checking" | "saving", task: () => Promise<T>): Promise<T> {
    if (this.stopping) throw new Error(SOURCE_TEXT_DICH_VU_PROXY_DANG_DONG);
    if (this.busy.has(id)) throw new Error(SOURCE_TEXT_PROXY_DANG_XU_LY_VUI_LONG_CHO);
    this.busy.set(id, state);
    try {
      return await task();
    } finally {
      this.busy.delete(id);
    }
  }
  async list(): Promise<ProxyProfile[]> {
    const rows = await (await this.db()).all(SOURCE_TEXT_SELECT_DATA_FROM_PROXY_PROFILES_ORDER_BY);
    return rows.map((row) => this.publicProfile(parseJson(row.data)));
  }
  async readWorkspace(): Promise<ProxyWorkspaceSnapshot | null> {
    await this.draftQueue.catch(() => {});
    const row = await (await this.db()).get(SOURCE_TEXT_SELECT_REVISION_ENCRYPTED_FROM_PROXY_WORKSPACE_WHERE);
    return row ? { revision: row.revision, state: parseJson(await this.secret(row.encrypted, true)) } : null;
  }
  async saveWorkspace(value: unknown): Promise<number> {
    const snapshot = value as ProxyWorkspaceSnapshot;
    if (!snapshot || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1 || !snapshot.state || typeof snapshot.state !== "object") throw new Error(SOURCE_TEXT_BAN_NHAP_PROXY_KHONG_HOP_LE);
    const serialized = stringifyJson(snapshot.state);
    if (Buffer.byteLength(serialized) > 512000) throw new Error(SOURCE_TEXT_BAN_NHAP_QUA_LON_HAY_CHIA_DANH);
    const task = this.draftQueue
      .catch(() => {})
      .then(async () => {
        const db = await this.db();
        const previous = await db.get(SOURCE_TEXT_SELECT_REVISION_FROM_PROXY_WORKSPACE_WHERE_ID);
        if (previous && previous.revision >= snapshot.revision) return previous.revision;
        const encrypted = await this.secret(serialized);
        await db.run(SOURCE_TEXT_INSERT_INTO_PROXY_WORKSPACE_ID_REVISION_ENCRYPTED, snapshot.revision, encrypted);
        return snapshot.revision;
      });
    this.draftQueue = task;
    return task;
  }
  async save(value: unknown, id?: string): Promise<ProxyProfile> {
    const input = validateProxyInput(value);
    const profileId = id || randomUUID();
    return this.exclusive(profileId, SOURCE_TEXT_SAVING, async () => {
      if (this.contexts.has(profileId)) throw new Error(SOURCE_TEXT_DONG_PHIEN_TRINH_DUYET_TRUOC_KHI_SUA);
      const previous = id ? await this.stored(id) : undefined;
      if (input.protocol === SOURCE_TEXT_SOCKS5 && previous?.encryptedPassword && !input.clearPassword) throw new Error(SOURCE_TEXT_XOA_MAT_KHAU_DA_LUU_TRUOC_KHI);
      const encryptedPassword = input.clearPassword ? "" : input.password ? await this.secret(input.password) : previous?.encryptedPassword || "";
      if (encryptedPassword && !input.username) throw new Error(SOURCE_TEXT_CAN_USERNAME_HOAC_XOA_MAT_KHAU_DA);
      const now = new Date().toISOString();
      const { password: _password, clearPassword: _clear, ...safeInput } = input;
      const record: StoredProfile = { ...safeInput, id: profileId, encryptedPassword, createdAt: previous?.createdAt || now, updatedAt: now, check: null };
      await this.write(record);
      return this.publicProfile(record);
    });
  }
  async import(values: unknown): Promise<ProxyProfile[]> {
    if (!Array.isArray(values) || values.length < 1 || values.length > 200) throw new Error(SOURCE_TEXT_MOI_LAN_NHAP_TU_1_DEN_200);
    const inputs = values.map(validateProxyInput);
    const existing = await this.list();
    const keys = new Set(existing.map(getProxyIdentity));
    const records: StoredProfile[] = [];
    for (const input of inputs) {
      const key = getProxyIdentity(input);
      if (keys.has(key)) throw new Error(SOURCE_TEXT_DANH_SACH_CO_PROXY_TRUNG_NHAU_HOAC);
      keys.add(key);
      const { password: _password, clearPassword: _clear, ...safeInput } = input;
      const now = new Date().toISOString();
      records.push({ ...safeInput, id: randomUUID(), encryptedPassword: input.password ? await this.secret(input.password) : "", createdAt: now, updatedAt: now, check: null });
    }
    const db = await this.db();
    await db.run(
      SOURCE_TEMPLATE_INSERT_INTO_PROXY_PROFILES_ID_DATA(`${records.map(() => SOURCE_TEXT_SYMBOL_55).join(SOURCE_TEXT_SYMBOL_4)}`),
      records.flatMap((record) => [record.id, stringifyJson(record)] as string[]),
    );
    return records.map((record) => this.publicProfile(record));
  }
  async remove(id: string): Promise<void> {
    await this.exclusive(id, SOURCE_TEXT_SAVING, async () => {
      await this.stored(id);
      if (this.contexts.has(id)) throw new Error(SOURCE_TEXT_DONG_PHIEN_TRINH_DUYET_TRUOC_KHI_XOA);
      await (await this.db()).run(SOURCE_TEXT_DELETE_FROM_PROXY_PROFILES_WHERE_ID, id);
    });
  }
  private async connection(record: StoredProfile): Promise<LaunchOptions["proxy"]> {
    return { server: proxyServer(record), ...(record.username ? { username: record.username } : {}), ...(record.encryptedPassword ? { password: await this.secret(record.encryptedPassword, true) } : {}) };
  }
  private async launch<T>(task: (channel: string | undefined) => Promise<T>): Promise<T> {
    try {
      return await task(SOURCE_TEXT_CHROME);
    } catch (error) {
      if (!/Executable doesn't exist|distribution.*not found/i.test(getErrorMessage(error, ""))) throw error;
      return task(undefined);
    }
  }
  async check(id: string): Promise<ProxyCheck> {
    return this.exclusive(id, SOURCE_TEXT_CHECKING, async () => {
      const record = await this.stored(id);
      const started = Date.now();
      const diagnostics = createProxyDiagnostics(this.directory, id, SOURCE_TEXT_CHECK);
      let stage: string = SOURCE_TEXT_CREDENTIALS;
      let context: BrowserContext | undefined;
      let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
      let result: ProxyCheck;
      try {
        const proxy = await this.connection(record);
        diagnostics.protect(proxy?.username, proxy?.password, record.encryptedPassword);
        stage = SOURCE_TEXT_LAUNCH;
        browser = await this.launch((channel) => {
          diagnostics.event(SOURCE_TEXT_LAUNCH_START, { channel: channel || SOURCE_TEXT_CHROMIUM, proxy: proxy?.server, timeoutMs: 15000, http2: false, quic: false });
          return this.engine.launch({ channel, headless: true, proxy, args: [...PROXY_NETWORK_ARGS], timeout: 15000 });
        });
        diagnostics.event(SOURCE_TEXT_LAUNCH_READY);
        this.checkBrowsers.add(browser);
        if (this.stopping) throw new Error(SOURCE_TEXT_DICH_VU_PROXY_DANG_DONG);
        stage = SOURCE_TEXT_PAGE;
        context = await browser.newContext();
        const page = await context.newPage();
        stage = SOURCE_TEXT_NAVIGATION;
        diagnostics.event(SOURCE_TEXT_NAVIGATION_START, { destination: SOURCE_TEXT_HTTPS_API_IPIFY_ORG_FORMAT_JSON, timeoutMs: 20000 });
        const response = await page.goto(SOURCE_TEXT_HTTPS_API_IPIFY_ORG_FORMAT_JSON, { timeout: 20000, waitUntil: SOURCE_TEXT_DOMCONTENTLOADED });
        const ip = await readProxyExitIp(response);
        result = { status: SOURCE_TEXT_OK, ip, latencyMs: Date.now() - started, checkedAt: new Date().toISOString() };
        diagnostics.event(SOURCE_TEXT_CHECK_SUCCESS, { ip, httpStatus: response.status() });
      } catch (error) {
        diagnostics.event(SOURCE_TEMPLATE_FAILED(`${stage}`), {}, error);
        result = { status: SOURCE_TEXT_ERROR, error: proxyFailure(error), checkedAt: new Date().toISOString() };
      } finally {
        await browser?.close().catch(() => {});
        if (browser) this.checkBrowsers.delete(browser);
      }
      record.check = result;
      await this.write(record);
      return result;
    });
  }
  async openSession(id: string, destination: string): Promise<ProxyOpenResult> {
    if (!(destination in DESTINATIONS) || !Object.hasOwn(DESTINATIONS, destination)) throw new Error(SOURCE_TEXT_TRANG_MO_KHONG_HOP_LE);
    return this.exclusive(id, SOURCE_TEXT_OPENING, async () => {
      const record = await this.stored(id);
      let context = this.contexts.get(id);
      const created = !context;
      const diagnostics = createProxyDiagnostics(this.directory, id, SOURCE_TEXT_OPEN);
      let stage: string = SOURCE_TEXT_CREDENTIALS;
      diagnostics.event(SOURCE_TEXT_OPEN_START, { destination, reused: !created, lastCheck: record.check?.status, checkedAt: record.check?.checkedAt });
      try {
        const proxy = await this.connection(record);
        if (!proxy) throw new Error(SOURCE_TEXT_CHUA_CAU_HINH_PROXY_CHO_PHIEN_TRINH);
        diagnostics.protect(proxy.username, proxy.password, record.encryptedPassword);
        if (!context) {
          stage = SOURCE_TEXT_LAUNCH;
          context = await this.openBrowser(path.join(this.directory, SOURCE_TEXT_PROXY_BROWSER_PROFILES, id), proxy, DESTINATIONS[destination as keyof typeof DESTINATIONS], diagnostics);
          if (this.stopping) throw new Error(SOURCE_TEXT_DICH_VU_PROXY_DANG_DONG);
          this.contexts.set(id, context);
          const current = context;
          context.on(SOURCE_TEXT_CLOSE_2, () => {
            diagnostics.event(SOURCE_TEXT_SESSION_CLOSED);
            if (this.contexts.get(id) === current) this.contexts.delete(id);
          });
        } else {
          stage = SOURCE_TEXT_NAVIGATION;
          await context.open(DESTINATIONS[destination as keyof typeof DESTINATIONS]);
        }
        diagnostics.event(SOURCE_TEXT_OPEN_SUCCESS, { mode: SOURCE_TEXT_MANUAL_CHROME, ip: context.ip });
        return {};
      } catch (error) {
        diagnostics.event(SOURCE_TEMPLATE_FAILED(`${stage}`), {}, error);
        if (created) {
          await context?.close().catch(() => {});
          this.contexts.delete(id);
        }
        const reason = proxyFailure(error);
        if (error instanceof NativeProxyRouteError) throw error;
        const launchReason = isProxyTimeout(error) ? SOURCE_TEXT_KHOI_DONG_TRINH_DUYET_HET_THOI_GIAN : SOURCE_TEMPLATE_KHONG_KHOI_DONG_DUOC_TRINH_DUYET_CHO(`${reason}`);
        throw new Error(stage === SOURCE_TEXT_LAUNCH ? launchReason : stage === SOURCE_TEXT_NAVIGATION ? SOURCE_TEMPLATE_KHONG_TAI_DUOC_TRANG_QUA_PROXY(`${reason}`) : reason);
      }
    });
  }
  async closeSession(id: string): Promise<void> {
    await this.exclusive(id, SOURCE_TEXT_CLOSING, async () => {
      await this.stored(id);
      await this.contexts.get(id)?.close();
      this.contexts.delete(id);
    });
  }
  async shutdown(): Promise<void> {
    this.stopping = true;
    await Promise.allSettled([...this.contexts.values(), ...this.checkBrowsers].map((context) => context.close()).concat([this.draftQueue.then(() => {})]));
    this.contexts.clear();
    this.checkBrowsers.clear();
  }
  async dispose(): Promise<void> {
    await this.shutdown();
    await this.draftQueue.catch(() => {});
    await (await this.dbPromise)?.close();
    this.dbPromise = undefined;
  }
}
let service: ProxyService | undefined;
export const getProxyService = (): ProxyService => (service ||= new ProxyService());
export const closeProxySessions = async (): Promise<void> => {
  await service?.shutdown();
};
