import {
  SOURCE_TEMPLATE_TEST_PASSWORD,
  SOURCE_TEXT_BASE64,
  SOURCE_TEMPLATE_BASIC,
  SOURCE_TEXT_HTTP_ROUTING_CHECK_INVALID,
  SOURCE_TEXT_REPORT,
  SOURCE_TEXT_WEBDRIVER,
  SOURCE_TEXT_OK,
  SOURCE_TEXT_CONTENT_TYPE,
  SOURCE_TEXT_TEXT_HTML,
  SOURCE_TEMPLATE_HTML_BODY_SCRIPT_FETCH_REPORT_WEBDRIVER_NAVIGATOR,
  SOURCE_TEXT_127_0_0_1,
  SOURCE_TEXT_PROXY_AUTHORIZATION,
  SOURCE_TEXT_CONNECT,
  SOURCE_TEXT_HTTP_1_1_407_PROXY_AUTHENTICATION_REQUIRED_2,
  SOURCE_TEXT_HTTP_1_1_200_CONNECTION_ESTABLISHED,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEMPLATE_HTTP_127_0_0_1,
  SOURCE_TEXT_TEST_PASSWORD,
  SOURCE_TEXT_PROXY_A,
  SOURCE_TEXT_PROXY_B,
  SOURCE_TEXT_DIRECT_LEAK,
  SOURCE_TEXT_HTTP_ROUTING_CHECK_INVALID_2,
  SOURCE_TEXT_VIDIFY_NATIVE_BROWSER_TEST,
  SOURCE_TEXT_DISABLE_HTTP2,
  SOURCE_TEXT_PROXY_BYPASS_LIST_LOOPBACK,
  SOURCE_TEXT_IGNORE,
  SOURCE_TEXT_CHROME_DID_NOT_REPORT_ITS_NATIVE_BROWSER,
  SOURCE_TEXT_FALSE,
  SOURCE_TEXT_NATIVE_MANUAL_CHROME_MUST_NOT_EXPOSE_AN,
  SOURCE_TEMPLATE_HTTP_127_0_0_1_2,
  SOURCE_TEXT_REJECTING_UPSTREAM_MUST_NEVER_FALL_BACK_TO,
  SOURCE_TEXT_HTTPS_EXAMPLE_COM,
  SOURCE_TEXT_HTTPS_WWW_YOUTUBE_COM,
  SOURCE_TEXT_TEST_PROFILE,
  SOURCE_TEXT_OPEN,
  SOURCE_TEXT_PASS_REAL_NATIVE_CHROME_NO_AUTOMATION_FLAG,
} from "../src/constants/sourceText.js";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { request } from "playwright";
import { findNativeChrome, launchNativeProxyBrowser, nativeProxyChromeArgs, startProxyRelay, stopNativeChrome } from "../src/server/services/nativeProxyBrowser";
import { createProxyDiagnostics } from "../src/server/services/proxyDiagnostics";
async function upstream(marker: string) {
  let reject = false;
  let requests = 0;
  let report: ((value: string) => void) | undefined;
  const authorization = SOURCE_TEMPLATE_BASIC(`${Buffer.from(SOURCE_TEMPLATE_TEST_PASSWORD(`${marker}`)).toString(SOURCE_TEXT_BASE64)}`);
  const respond = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(req.url!, SOURCE_TEXT_HTTP_ROUTING_CHECK_INVALID);
    if (url.pathname === SOURCE_TEXT_REPORT) {
      report?.(url.searchParams.get(SOURCE_TEXT_WEBDRIVER) || "");
      res.end(SOURCE_TEXT_OK);
      return;
    }
    res.setHeader(SOURCE_TEXT_CONTENT_TYPE, SOURCE_TEXT_TEXT_HTML);
    res.end(SOURCE_TEMPLATE_HTML_BODY_SCRIPT_FETCH_REPORT_WEBDRIVER_NAVIGATOR(`${marker}`));
  };
  const origin = http.createServer(respond);
  await new Promise<void>((resolve) => origin.listen(0, SOURCE_TEXT_127_0_0_1, resolve));
  const originAddress = origin.address();
  assert.ok(originAddress && typeof originAddress !== "string");
  const tunnels = new Set<net.Socket>();
  const server = http.createServer((req, res) => {
    requests++;
    if (reject || req.headers[SOURCE_TEXT_PROXY_AUTHORIZATION] !== authorization) {
      res.writeHead(407);
      res.end();
      return;
    }
    respond(req, res);
  });
  server.on(SOURCE_TEXT_CONNECT, (req, socket, head) => {
    requests++;
    if (reject || req.headers[SOURCE_TEXT_PROXY_AUTHORIZATION] !== authorization) {
      socket.end(SOURCE_TEXT_HTTP_1_1_407_PROXY_AUTHENTICATION_REQUIRED_2);
      return;
    }
    const destination = net.connect(originAddress.port, SOURCE_TEXT_127_0_0_1, () => {
      socket.write(SOURCE_TEXT_HTTP_1_1_200_CONNECTION_ESTABLISHED);
      if (head.length) destination.write(head);
      socket.pipe(destination);
      destination.pipe(socket);
    });
    tunnels.add(destination);
    destination.on(SOURCE_TEXT_ERROR, () => socket.destroy());
    socket.on(SOURCE_TEXT_ERROR, () => destination.destroy());
    socket.on(SOURCE_TEXT_CLOSE_2, () => {
      destination.destroy();
      tunnels.delete(destination);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, SOURCE_TEXT_127_0_0_1, resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return {
    proxy: { server: SOURCE_TEMPLATE_HTTP_127_0_0_1(`${address.port}`), username: marker, password: SOURCE_TEXT_TEST_PASSWORD },
    reject: () => {
      reject = true;
    },
    requests: () => requests,
    report: () =>
      new Promise<string>((resolve) => {
        report = resolve;
      }),
    close: async () => {
      tunnels.forEach((socket) => socket.destroy());
      await new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      });
      await new Promise<void>((resolve) => {
        origin.closeAllConnections();
        origin.close(() => resolve());
      });
    },
  };
}
const first = await upstream(SOURCE_TEXT_PROXY_A);
const second = await upstream(SOURCE_TEXT_PROXY_B);
const relayA = await startProxyRelay(first.proxy);
const relayB = await startProxyRelay(second.proxy);
const clientA = await request.newContext({ proxy: { server: relayA.server } });
const clientB = await request.newContext({ proxy: { server: relayB.server } });
let directHits = 0;
const direct = http.createServer((_req, res) => {
  directHits++;
  res.end(SOURCE_TEXT_DIRECT_LEAK);
});
await new Promise<void>((resolve) => direct.listen(0, SOURCE_TEXT_127_0_0_1, resolve));
try {
  assert.match(await (await clientA.get(SOURCE_TEXT_HTTP_ROUTING_CHECK_INVALID_2)).text(), /proxy-A/);
  assert.match(await (await clientB.get(SOURCE_TEXT_HTTP_ROUTING_CHECK_INVALID_2)).text(), /proxy-B/);
  const directory = await mkdtemp(path.join(os.tmpdir(), SOURCE_TEXT_VIDIFY_NATIVE_BROWSER_TEST));
  const args = nativeProxyChromeArgs(directory, relayA.server, SOURCE_TEXT_HTTP_ROUTING_CHECK_INVALID_2);
  assert.ok(args.includes(SOURCE_TEXT_DISABLE_HTTP2));
  assert.ok(args.includes(SOURCE_TEXT_PROXY_BYPASS_LIST_LOOPBACK));
  assert.equal(
    args.some((arg) => /enable-automation|remote-debugging|no-sandbox|test-password/.test(arg)),
    false,
  );
  const browserReport = first.report();
  const chrome = spawn(findNativeChrome(), args, { windowsHide: false, stdio: SOURCE_TEXT_IGNORE });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const report = await Promise.race([
      browserReport,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(SOURCE_TEXT_CHROME_DID_NOT_REPORT_ITS_NATIVE_BROWSER)), 15000);
        chrome.once(SOURCE_TEXT_ERROR, reject);
      }),
    ]);
    assert.equal(report, SOURCE_TEXT_FALSE, SOURCE_TEXT_NATIVE_MANUAL_CHROME_MUST_NOT_EXPOSE_AN);
  } finally {
    if (timer) clearTimeout(timer);
    await stopNativeChrome(chrome);
  }
  first.reject();
  const address = direct.address();
  assert.ok(address && typeof address !== "string");
  const failure = await clientA.get(SOURCE_TEMPLATE_HTTP_127_0_0_1_2(`${address.port}`), { timeout: 5000 }).catch(() => undefined);
  assert.ok(!failure || !failure.ok());
  assert.equal(directHits, 0, SOURCE_TEXT_REJECTING_UPSTREAM_MUST_NEVER_FALL_BACK_TO);
  const httpsFailure = await clientA.get(SOURCE_TEXT_HTTPS_EXAMPLE_COM, { timeout: 5000 }).catch(() => undefined);
  assert.ok(!httpsFailure || !httpsFailure.ok());
  await assert.rejects(launchNativeProxyBrowser(directory, first.proxy, SOURCE_TEXT_HTTPS_WWW_YOUTUBE_COM, createProxyDiagnostics(directory, SOURCE_TEXT_TEST_PROFILE, SOURCE_TEXT_OPEN)), /Không xác minh được IP.*từ chối xác thực/);
  assert.ok(first.requests() > 0 && second.requests() > 0);
  process.stdout.write(SOURCE_TEXT_PASS_REAL_NATIVE_CHROME_NO_AUTOMATION_FLAG);
} finally {
  await Promise.all([clientA.dispose(), clientB.dispose()]);
  await Promise.all([relayA.close(), relayB.close()]);
  await Promise.all([first.close(), second.close()]);
  await new Promise<void>((resolve) => {
    direct.closeAllConnections();
    direct.close(() => resolve());
  });
}
