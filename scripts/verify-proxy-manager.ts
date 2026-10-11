import {
  SOURCE_TEXT_VIDIFY_PROXY_TEST,
  SOURCE_TEXT_TEST_PASSWORD_123,
  SOURCE_TEXT_PROXY_EXAMPLE_COM_8080_ALICE_P_A,
  SOURCE_TEXT_P_A_SS,
  SOURCE_TEXT_P_SS,
  SOURCE_TEXT_HTTP_1_1080,
  SOURCE_TEXT_HTTP_EVIL,
  SOURCE_TEXT_SOCKS5,
  SOURCE_TEXT_NET_ERR_PROXY_CONNECTION_FAILED,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_YOUTUBE_01,
  SOURCE_BROWSER_TEXT_HTTP,
  SOURCE_TEXT_127_0_0_1,
  SOURCE_TEXT_ALICE,
  SOURCE_TEXT_SEPARATE_PROFILE,
  SOURCE_TEXT_PASSWORD,
  SOURCE_TEXT_ENCRYPTEDPASSWORD,
  SOURCE_TEXT_RENAMED,
  SOURCE_TEXT_STUDIO,
  SOURCE_TEXT_HTTP_127_0_0_1_8080,
  SOURCE_TEXT_OPEN,
  SOURCE_TEXT_YOUTUBE,
  SOURCE_TEXT_REUSE_THE_SAME_RUNNING_PROFILE,
  SOURCE_TEXT_BROWSER,
  SOURCE_TEXT_KEEP_LOGIN_DIRECTORY_ON_REOPEN,
  SOURCE_TEXT_YOUTUBE_02,
  SOURCE_TEXT_127_0_0_2,
  SOURCE_TEXT_BROKEN,
  SOURCE_TEXT_CLOSED,
  SOURCE_TEXT_HTTPS_EVIL_EXAMPLE,
  SOURCE_TEXT_NEW_EXAMPLE,
  SOURCE_TEXT_INVALID_IMPORTS_MUST_NOT_PARTIALLY_SAVE,
  SOURCE_TEXT_IMPORT_ONE_EXAMPLE,
  SOURCE_TEXT_IMPORT_TWO_EXAMPLE,
  SOURCE_TEXT_UNSAVED_DRAFT,
  SOURCE_TEMPLATE_DRAFT_EXAMPLE_8080_ALICE,
  SOURCE_TEXT_LATEST_QUERY,
  SOURCE_TEXT_STALE_QUERY,
  SOURCE_TEXT_LATE_REQUESTS_CANNOT_OVERWRITE_A_NEWER_DRAFT,
  SOURCE_TEXT_PROXY_SQLITE,
  SOURCE_TEXT_SQLITE_MUST_NOT_CONTAIN_PLAINTEXT_PASSWORDS,
  SOURCE_TEXT_DRAFT_EXAMPLE,
  SOURCE_TEXT_SENSITIVE_BULK_DRAFTS_MUST_BE_ENCRYPTED_AS,
  SOURCE_TEXT_PASS_VALIDATION_IMPORT_ATOMICITY_ENCRYPTED_WORKSPACE_RECOVERY,
  SOURCE_TEXT_BASIC_REALM_PROXY_TEST,
  SOURCE_TEXT_CONNECT,
  SOURCE_TEXT_HTTP_1_1_407_PROXY_AUTHENTICATION_REQUIRED,
  SOURCE_TEXT_NETWORK,
  SOURCE_TEXT_REJECTING_PROXY,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_CHROMIUM_MUST_SEND_CONNECT_THROUGH_CONFIGURED_PROXY,
  SOURCE_TEXT_PASS_REAL_CHROMIUM_PROXY_ROUTING_AND_NO,
} from "../src/constants/sourceText.js";
import assert from "node:assert/strict";
import { mkdtemp, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { EventEmitter } from "node:events";
import http from "node:http";
import { chromium, type BrowserContext, type LaunchOptions } from "playwright";
import { ProxyService } from "../src/server/services/proxyService";
import { transformProxySecret } from "../src/server/services/proxySecretStore";
import { parseProxyImport, proxyServer, validateProxyInput } from "../src/lib/proxyValidation";
import { emptyProxyWorkspace, nextProxyRevision, restoreProxyWorkspace, workspaceNeedsRecovery } from "../src/lib/proxyWorkspace";
const directory = await mkdtemp(path.join(os.tmpdir(), SOURCE_TEXT_VIDIFY_PROXY_TEST));
const secret = SOURCE_TEXT_TEST_PASSWORD_123;
const protectedValue = await transformProxySecret(secret);
assert.notEqual(protectedValue, secret);
assert.equal(await transformProxySecret(protectedValue, true), secret);
assert.equal(await transformProxySecret(""), "");
const parsed = parseProxyImport(SOURCE_TEXT_PROXY_EXAMPLE_COM_8080_ALICE_P_A);
assert.equal(parsed[0].input?.password, SOURCE_TEXT_P_A_SS);
assert.equal(parsed[1].input?.password, SOURCE_TEXT_P_SS);
assert.equal(proxyServer(parsed[2].input!), SOURCE_TEXT_HTTP_1_1080);
assert.ok(parsed[3].error);
assert.ok(parsed[4].error);
assert.throws(() => validateProxyInput({ ...parsed[0].input, port: 65536 }));
assert.throws(() => validateProxyInput({ ...parsed[0].input, host: SOURCE_TEXT_HTTP_EVIL }));
assert.throws(() => validateProxyInput({ ...parsed[0].input, protocol: SOURCE_TEXT_SOCKS5 }));
let failNavigation = false;
const launches: { profilePath: string; options: LaunchOptions; }[] = [];
const contexts: (BrowserContext & { closed: boolean; })[] = [];
const engine = {
  ...chromium,
  launchPersistentContext: async (profilePath: string, options: LaunchOptions) => {
    launches.push({ profilePath, options });
    const emitter = new EventEmitter();
    const context = Object.assign(emitter, {
      closed: false,
      pages: () => [],
      newPage: async () => ({
        goto: async () => {
          if (failNavigation) throw new Error(SOURCE_TEXT_NET_ERR_PROXY_CONNECTION_FAILED);
        },
        close: async () => {},
        bringToFront: async () => {},
      }),
      close: async () => {
        context.closed = true;
        emitter.emit(SOURCE_TEXT_CLOSE_2);
      },
    }) as unknown as BrowserContext & { closed: boolean; };
    contexts.push(context);
    return context;
  },
} as unknown as Pick<typeof chromium, "launch" | "launchPersistentContext">;
const service = new ProxyService(directory, transformProxySecret, engine);
try {
  const input = { name: SOURCE_TEXT_YOUTUBE_01, protocol: SOURCE_BROWSER_TEXT_HTTP, host: SOURCE_TEXT_127_0_0_1, port: 8080, username: SOURCE_TEXT_ALICE, password: secret, notes: SOURCE_TEXT_SEPARATE_PROFILE };
  const profile = await service.save(input);
  assert.equal(profile.hasPassword, true);
  assert.equal(SOURCE_TEXT_PASSWORD in profile, false);
  assert.equal(SOURCE_TEXT_ENCRYPTEDPASSWORD in profile, false);
  assert.equal(JSON.stringify(await service.list()).includes(secret), false);
  const saved = await service.save({ ...input, password: "", name: SOURCE_TEXT_RENAMED }, profile.id);
  assert.equal(saved.hasPassword, true);
  await service.openSession(profile.id, SOURCE_TEXT_STUDIO);
  assert.equal(launches[0].options.proxy?.password, secret);
  assert.equal(launches[0].options.proxy?.server, SOURCE_TEXT_HTTP_127_0_0_1_8080);
  assert.equal((await service.list())[0].session, SOURCE_TEXT_OPEN);
  await assert.rejects(service.save(input, profile.id), /Đóng phiên/);
  await assert.rejects(service.remove(profile.id), /Đóng phiên/);
  await service.openSession(profile.id, SOURCE_TEXT_YOUTUBE);
  assert.equal(launches.length, 1, SOURCE_TEXT_REUSE_THE_SAME_RUNNING_PROFILE);
  await service.closeSession(profile.id);
  assert.equal(contexts[0].closed, true);
  await service.openSession(profile.id, SOURCE_TEXT_BROWSER);
  assert.equal(launches[0].profilePath, launches[1].profilePath, SOURCE_TEXT_KEEP_LOGIN_DIRECTORY_ON_REOPEN);
  const second = await service.save({ ...input, name: SOURCE_TEXT_YOUTUBE_02, host: SOURCE_TEXT_127_0_0_2, password: "" });
  await service.openSession(second.id, SOURCE_TEXT_BROWSER);
  assert.notEqual(launches[1].profilePath, launches[2].profilePath);
  assert.equal((await service.list()).filter((item) => item.session === SOURCE_TEXT_OPEN).length, 2);
  failNavigation = true;
  const third = await service.save({ ...input, name: SOURCE_TEXT_BROKEN, port: 9999, password: "" });
  await assert.rejects(service.openSession(third.id, SOURCE_TEXT_BROWSER), /Không thể kết nối/);
  assert.equal(contexts[3].closed, true);
  assert.equal((await service.list()).find((item) => item.id === third.id)?.session, SOURCE_TEXT_CLOSED);
  await assert.rejects(service.openSession(third.id, SOURCE_TEXT_HTTPS_EVIL_EXAMPLE), /không hợp lệ/);
  await service.closeSession(profile.id);
  await service.save({ ...input, username: "", password: "", clearPassword: true }, profile.id);
  assert.equal((await service.list()).find((item) => item.id === profile.id)?.hasPassword, false);
  const before = (await service.list()).length;
  await assert.rejects(
    service.import([
      { ...input, host: SOURCE_TEXT_NEW_EXAMPLE, password: "" },
      { ...input, port: 0 },
    ]),
    /Port/,
  );
  assert.equal((await service.list()).length, before, SOURCE_TEXT_INVALID_IMPORTS_MUST_NOT_PARTIALLY_SAVE);
  await assert.rejects(service.import([{ ...input, username: "", password: "" }]), /trùng/);
  const imported = await service.import([
    { ...input, host: SOURCE_TEXT_IMPORT_ONE_EXAMPLE, password: "" },
    { ...input, host: SOURCE_TEXT_IMPORT_TWO_EXAMPLE, password: "" },
  ]);
  assert.equal(imported.length, 2);
  await service.remove(imported[0].id);
  const workspace = { ...emptyProxyWorkspace(), selectedId: profile.id, query: SOURCE_TEXT_RENAMED, editor: {}, form: { ...emptyProxyWorkspace().form, name: SOURCE_TEXT_UNSAVED_DRAFT, password: secret }, importOpen: true, importText: SOURCE_TEMPLATE_DRAFT_EXAMPLE_8080_ALICE(`${secret}`) };
  await service.saveWorkspace({ revision: 100, state: workspace });
  assert.deepEqual((await service.readWorkspace())?.state, workspace);
  await Promise.all([service.saveWorkspace({ revision: 102, state: { ...workspace, query: SOURCE_TEXT_LATEST_QUERY } }), service.saveWorkspace({ revision: 101, state: { ...workspace, query: SOURCE_TEXT_STALE_QUERY } })]);
  assert.equal((await service.readWorkspace())?.state.query, SOURCE_TEXT_LATEST_QUERY, SOURCE_TEXT_LATE_REQUESTS_CANNOT_OVERWRITE_A_NEWER_DRAFT);
  assert.equal((await service.readWorkspace())?.revision, 102);
  assert.equal(nextProxyRevision(100, 90), 101);
  assert.equal(workspaceNeedsRecovery(await service.readWorkspace(), 102), false);
  assert.equal(workspaceNeedsRecovery(null, 102), true);
  assert.deepEqual(restoreProxyWorkspace(null), emptyProxyWorkspace());
  assert.equal(restoreProxyWorkspace(workspace).form.password, secret);
  assert.equal(restoreProxyWorkspace(workspace).importText, workspace.importText);
  await service.shutdown();
  assert.equal(
    (await service.list()).every((item) => item.session === SOURCE_TEXT_CLOSED),
    true,
  );
  await service.dispose();
  const restarted = new ProxyService(directory);
  assert.equal((await restarted.list()).length, before + 1);
  assert.equal((await restarted.readWorkspace())?.state.form.password, secret);
  assert.equal((await restarted.readWorkspace())?.state.query, SOURCE_TEXT_LATEST_QUERY);
  await restarted.dispose();
  const dbBytes = await readFile(path.join(directory, SOURCE_TEXT_PROXY_SQLITE));
  assert.equal(dbBytes.includes(Buffer.from(secret)), false, SOURCE_TEXT_SQLITE_MUST_NOT_CONTAIN_PLAINTEXT_PASSWORDS);
  assert.equal(dbBytes.includes(Buffer.from(SOURCE_TEXT_DRAFT_EXAMPLE)), false, SOURCE_TEXT_SENSITIVE_BULK_DRAFTS_MUST_BE_ENCRYPTED_AS);
  process.stdout.write(SOURCE_TEXT_PASS_VALIDATION_IMPORT_ATOMICITY_ENCRYPTED_WORKSPACE_RECOVERY);
} finally {
  await service.dispose();
}
const rejectingProxy = http.createServer((_req, res) => {
  res.writeHead(407, { "Proxy-Authenticate": SOURCE_TEXT_BASIC_REALM_PROXY_TEST });
  res.end();
});
let connections = 0;
rejectingProxy.on(SOURCE_TEXT_CONNECT, (_req, socket) => {
  connections++;
  socket.end(SOURCE_TEXT_HTTP_1_1_407_PROXY_AUTHENTICATION_REQUIRED);
});
await new Promise<void>((resolve) => rejectingProxy.listen(0, SOURCE_TEXT_127_0_0_1, resolve));
const address = rejectingProxy.address();
assert.ok(address && typeof address !== "string");
const networkDirectory = path.join(directory, SOURCE_TEXT_NETWORK);
await mkdir(networkDirectory);
const networkService = new ProxyService(networkDirectory);
try {
  const profile = await networkService.save({ name: SOURCE_TEXT_REJECTING_PROXY, protocol: SOURCE_BROWSER_TEXT_HTTP, host: SOURCE_TEXT_127_0_0_1, port: address.port, username: "", password: "", notes: "" });
  const result = await networkService.check(profile.id);
  assert.equal(result.status, SOURCE_TEXT_ERROR);
  assert.equal(result.ip, undefined);
  assert.ok(connections > 0, SOURCE_TEXT_CHROMIUM_MUST_SEND_CONNECT_THROUGH_CONFIGURED_PROXY);
  assert.equal((await networkService.list())[0].check?.status, SOURCE_TEXT_ERROR);
  process.stdout.write(SOURCE_TEXT_PASS_REAL_CHROMIUM_PROXY_ROUTING_AND_NO);
} finally {
  await networkService.dispose();
  await new Promise<void>((resolve) => rejectingProxy.close(() => resolve()));
}
