import {
  SOURCE_TEXT_HTTP,
  SOURCE_TEXT_HTTPS,
  SOURCE_TEXT_SOCKS5_3,
  SOURCE_TEXT_GIAO_THUC_PROXY_KHONG_DUOC_HO_TRO,
  SOURCE_TEXT_127_0_0_1,
  SOURCE_TEXT_REQUESTFAILED,
  SOURCE_TEXT_RELAY_REQUEST_FAILED,
  SOURCE_TEXT_TUNNELCONNECTFAILED,
  SOURCE_TEXT_RELAY_TUNNEL_FAILED,
  SOURCE_TEMPLATE_HTTP_127_0_0_1,
  SOURCE_TEXT_RELAY_READY,
  SOURCE_TEMPLATE_USER_DATA_DIR_2,
  SOURCE_TEMPLATE_PROXY_SERVER,
  SOURCE_TEXT_DNS_PREFETCH_DISABLE,
  SOURCE_TEXT_DISABLE_BACKGROUND_MODE,
  SOURCE_TEXT_NO_FIRST_RUN,
  SOURCE_TEXT_NO_DEFAULT_BROWSER_CHECK,
  SOURCE_TEXT_NEW_WINDOW,
  SOURCE_TEXT_WIN32,
  SOURCE_TEXT_GOOGLE_CHROME_APPLICATION_CHROME_EXE,
  SOURCE_TEXT_PROGRAMFILES_X86,
  SOURCE_TEXT_DARWIN,
  SOURCE_TEXT_APPLICATIONS_GOOGLE_CHROME_APP_CONTENTS_MACOS_GOOGLE,
  SOURCE_TEXT_USR_BIN_GOOGLE_CHROME,
  SOURCE_TEXT_USR_BIN_GOOGLE_CHROME_STABLE,
  SOURCE_TEXT_CHUA_TIM_THAY_GOOGLE_CHROME_HAY_CAI,
  SOURCE_TEXT_SPAWN,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_SIGTERM,
  SOURCE_TEXT_TASKKILL_EXE,
  SOURCE_TEXT_PID,
  SOURCE_TEXT_T_2,
  SOURCE_TEXT_F_2,
  SOURCE_TEXT_IGNORE,
  SOURCE_TEXT_EXIT,
  SOURCE_TEXT_ROUTE,
  SOURCE_TEXT_ROUTE_VERIFY_START,
  SOURCE_TEXT_HTTPS_API_IPIFY_ORG_FORMAT_JSON,
  SOURCE_TEXT_PROXY_TRA_VE_IP_KHONG_HOP_LE,
  SOURCE_TEXT_ROUTE_VERIFIED,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_LAUNCH,
  SOURCE_TEXT_LAUNCH_START,
  SOURCE_TEXT_MANUAL_CHROME,
  SOURCE_TEXT_CHROME_EXITED,
  SOURCE_TEXT_RELAY_CLOSE_FAILED,
  SOURCE_TEXT_CHROME_FAILED,
  SOURCE_TEXT_CHROME_DA_THOAT_KHI_MO_HO_SO,
  SOURCE_TEXT_PHIEN_CHROME_DA_DONG_HAY_MO_LAI,
  SOURCE_TEXT_CHROME_OPEN_FAILED,
  SOURCE_TEXT_LAUNCH_READY,
  SOURCE_TEXT_NATIVE_OPEN_FAILED,
  SOURCE_TEXT_PROXY_TU_CHOI_XAC_THUC_KIEM_TRA_2,
  SOURCE_TEXT_KET_NOI_QUA_PROXY_HET_THOI_GIAN,
  SOURCE_TEXT_KIEM_TRA_KET_NOI_VA_CAU_HINH,
  SOURCE_TEMPLATE_KHONG_XAC_MINH_DUOC_IP_QUA_PROXY,
} from "../../constants/sourceText.js";
import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { readProxyExitIp, isProxyTimeout } from "./proxyNetwork.js";
import { getErrorMessage } from "../../utils/errorUtils.js";
import { PROXY_NETWORK_ARGS } from "../../constants/proxy.js";
import { delayAsync } from "../../lib/asyncUtils.js";
import path from "node:path";
import { request, type LaunchOptions } from "playwright";
import { Server } from "proxy-chain";
import { createProxyDiagnostics } from "./proxyDiagnostics.js";
type Diagnostics = ReturnType<typeof createProxyDiagnostics>;
export class NativeProxyRouteError extends Error {}
export interface NativeProxySession extends EventEmitter { ip: string; open(url: string): Promise<void>; close(): Promise<void>; }
export type NativeProxyBrowserFactory = (profilePath: string, proxy: NonNullable<LaunchOptions["proxy"]>, url: string, diagnostics: Diagnostics) => Promise<NativeProxySession>;
export async function startProxyRelay(proxy: NonNullable<LaunchOptions["proxy"]>, diagnostics?: Diagnostics) {
  const upstream = new URL(proxy.server);
  if (!([SOURCE_TEXT_HTTP, SOURCE_TEXT_HTTPS, SOURCE_TEXT_SOCKS5_3] as readonly string[]).includes(upstream.protocol)) throw new Error(SOURCE_TEXT_GIAO_THUC_PROXY_KHONG_DUOC_HO_TRO);
  if (proxy.username) upstream.username = proxy.username;
  if (proxy.password) upstream.password = proxy.password;
  diagnostics?.protect(proxy.username, proxy.password);
  const relay = new Server({
    host: SOURCE_TEXT_127_0_0_1,
    port: 0,
    verbose: false,
    prepareRequestFunction: () => ({ upstreamProxyUrl: upstream.href, requestAuthentication: false }),
  });
  relay.on(SOURCE_TEXT_REQUESTFAILED, ({ error }) => diagnostics?.event(SOURCE_TEXT_RELAY_REQUEST_FAILED, {}, error));
  relay.on(SOURCE_TEXT_TUNNELCONNECTFAILED, ({ response }) => diagnostics?.event(SOURCE_TEXT_RELAY_TUNNEL_FAILED, { httpStatus: response?.statusCode }));
  await relay.listen();
  const server = SOURCE_TEMPLATE_HTTP_127_0_0_1(`${relay.port}`);
  diagnostics?.event(SOURCE_TEXT_RELAY_READY, { server, upstream: proxy.server });
  return { server, close: () => relay.close(true) };
}
export function nativeProxyChromeArgs(profilePath: string, relay: string, url: string): string[] {
  return [SOURCE_TEMPLATE_USER_DATA_DIR_2(`${profilePath}`), SOURCE_TEMPLATE_PROXY_SERVER(`${relay}`), ...PROXY_NETWORK_ARGS, SOURCE_TEXT_DNS_PREFETCH_DISABLE, SOURCE_TEXT_DISABLE_BACKGROUND_MODE, SOURCE_TEXT_NO_FIRST_RUN, SOURCE_TEXT_NO_DEFAULT_BROWSER_CHECK, SOURCE_TEXT_NEW_WINDOW, url];
}
export function findNativeChrome(): string {
  const candidates =
    process.platform === SOURCE_TEXT_WIN32
      ? [process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, SOURCE_TEXT_GOOGLE_CHROME_APPLICATION_CHROME_EXE), process.env[SOURCE_TEXT_PROGRAMFILES_X86] && path.join(process.env[SOURCE_TEXT_PROGRAMFILES_X86]!, SOURCE_TEXT_GOOGLE_CHROME_APPLICATION_CHROME_EXE), process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, SOURCE_TEXT_GOOGLE_CHROME_APPLICATION_CHROME_EXE)]
      : process.platform === SOURCE_TEXT_DARWIN
        ? [SOURCE_TEXT_APPLICATIONS_GOOGLE_CHROME_APP_CONTENTS_MACOS_GOOGLE]
        : [SOURCE_TEXT_USR_BIN_GOOGLE_CHROME, SOURCE_TEXT_USR_BIN_GOOGLE_CHROME_STABLE];
  const executable = candidates.find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
  if (!executable) throw new Error(SOURCE_TEXT_CHUA_TIM_THAY_GOOGLE_CHROME_HAY_CAI);
  return executable;
}
async function waitForSpawn(child: ChildProcess): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    child.once(SOURCE_TEXT_SPAWN, resolve);
    child.once(SOURCE_TEXT_ERROR, reject);
  });
}
export async function stopNativeChrome(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
  if (process.platform !== SOURCE_TEXT_WIN32) {
    child.kill(SOURCE_TEXT_SIGTERM);
    return;
  }
  const stop = (force: boolean) =>
    new Promise<void>((resolve) => {
      const command = spawn(SOURCE_TEXT_TASKKILL_EXE, [SOURCE_TEXT_PID, String(child.pid), SOURCE_TEXT_T_2, ...(force ? [SOURCE_TEXT_F_2] : [])], { windowsHide: true, stdio: SOURCE_TEXT_IGNORE });
      command.once(SOURCE_TEXT_ERROR, () => resolve());
      command.once(SOURCE_TEXT_EXIT, () => resolve());
    });
  await stop(false);
  if (child.exitCode === null && child.signalCode === null) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(done, 3000);
      function done() {
        clearTimeout(timer);
        child.removeListener(SOURCE_TEXT_EXIT, done);
        resolve();
      }
      child.once(SOURCE_TEXT_EXIT, done);
    });
    if (child.exitCode === null && child.signalCode === null) await stop(true);
  }
}
export const launchNativeProxyBrowser: NativeProxyBrowserFactory = async (profilePath, proxy, url, diagnostics) => {
  const executable = findNativeChrome();
  await mkdir(profilePath, { recursive: true });
  const relay = await startProxyRelay(proxy, diagnostics);
  let child: ChildProcess | undefined;
  let phase: string = SOURCE_TEXT_ROUTE;
  try {
    diagnostics.event(SOURCE_TEXT_ROUTE_VERIFY_START);
    const client = await request.newContext({ proxy: { server: relay.server } });
    let ip: string;
    try {
      const response = await client.get(SOURCE_TEXT_HTTPS_API_IPIFY_ORG_FORMAT_JSON, { timeout: 20000 });
      ip = await readProxyExitIp(response, SOURCE_TEXT_PROXY_TRA_VE_IP_KHONG_HOP_LE);
    } finally {
      await client.dispose();
    }
    diagnostics.event(SOURCE_TEXT_ROUTE_VERIFIED, { ip });
    const session = new EventEmitter() as NativeProxySession;
    session.ip = ip;
    let closed = false;
    let cleanup: Promise<void> | undefined;
    const closeRelay = () =>
      (cleanup ||= relay.close().finally(() => {
        closed = true;
        session.emit(SOURCE_TEXT_CLOSE_2);
      }));
    const args = nativeProxyChromeArgs(profilePath, relay.server, url);
    phase = SOURCE_TEXT_LAUNCH;
    diagnostics.event(SOURCE_TEXT_LAUNCH_START, { mode: SOURCE_TEXT_MANUAL_CHROME, executable, proxy: proxy.server, http2: false, quic: false });
    child = spawn(executable, args, { windowsHide: false, stdio: SOURCE_TEXT_IGNORE });
    child.once(SOURCE_TEXT_EXIT, (code) => {
      diagnostics.event(SOURCE_TEXT_CHROME_EXITED, { code });
      void closeRelay().catch((error) => diagnostics.event(SOURCE_TEXT_RELAY_CLOSE_FAILED, {}, error));
    });
    child.on(SOURCE_TEXT_ERROR, (error) => diagnostics.event(SOURCE_TEXT_CHROME_FAILED, {}, error));
    await waitForSpawn(child);
    await delayAsync(750);
    if (closed || child.exitCode !== null || child.signalCode !== null) throw new Error(SOURCE_TEXT_CHROME_DA_THOAT_KHI_MO_HO_SO);
    const browserProcess = child;
    session.open = async (destination) => {
      if (closed || browserProcess.exitCode !== null || browserProcess.signalCode !== null) throw new Error(SOURCE_TEXT_PHIEN_CHROME_DA_DONG_HAY_MO_LAI);
      const tabProcess = spawn(executable, nativeProxyChromeArgs(profilePath, relay.server, destination), { windowsHide: false, stdio: SOURCE_TEXT_IGNORE });
      tabProcess.on(SOURCE_TEXT_ERROR, (error) => diagnostics.event(SOURCE_TEXT_CHROME_OPEN_FAILED, {}, error));
      await waitForSpawn(tabProcess);
    };
    session.close = async () => {
      try {
        await closeRelay();
      } finally {
        await stopNativeChrome(browserProcess);
      }
    };
    diagnostics.event(SOURCE_TEXT_LAUNCH_READY, { mode: SOURCE_TEXT_MANUAL_CHROME, pid: browserProcess.pid });
    return session;
  } catch (error) {
    diagnostics.event(SOURCE_TEXT_NATIVE_OPEN_FAILED, {}, error);
    await relay.close().catch(() => {});
    if (child) await stopNativeChrome(child);
    if (phase === SOURCE_TEXT_ROUTE) {
      const message = getErrorMessage(error, "");
      const reason = /407|597|auth|credentials/i.test(message) ? SOURCE_TEXT_PROXY_TU_CHOI_XAC_THUC_KIEM_TRA_2 : isProxyTimeout(error) ? SOURCE_TEXT_KET_NOI_QUA_PROXY_HET_THOI_GIAN : SOURCE_TEXT_KIEM_TRA_KET_NOI_VA_CAU_HINH;
      throw new NativeProxyRouteError(SOURCE_TEMPLATE_KHONG_XAC_MINH_DUOC_IP_QUA_PROXY(`${reason}`));
    }
    throw error;
  }
};
