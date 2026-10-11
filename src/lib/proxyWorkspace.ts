import { SOURCE_TEXT_VIDIFY_PROXY_WORKSPACE_REVISION_V1, SOURCE_BROWSER_TEXT_HTTP, SOURCE_TEXT_HTTPS_2, SOURCE_TEXT_SOCKS5 } from "../constants/sourceText.js";
import type { ProxyInput, ProxyWorkspaceSnapshot, ProxyWorkspaceState } from "../types/proxy";
export const PROXY_WORKSPACE_MARKER = SOURCE_TEXT_VIDIFY_PROXY_WORKSPACE_REVISION_V1;
export const emptyProxyForm = (): ProxyInput => ({ name: "", protocol: SOURCE_BROWSER_TEXT_HTTP, host: "", port: 8080, username: "", password: "", notes: "" });
export const emptyProxyWorkspace = (): ProxyWorkspaceState => ({ selectedId: null, query: "", form: emptyProxyForm(), editor: null, importOpen: false, importText: "" });
export function restoreProxyWorkspace(value: unknown): ProxyWorkspaceState {
  const fallback = emptyProxyWorkspace();
  if (!value || typeof value !== "object") return fallback;
  const state = value as Partial<ProxyWorkspaceState>;
  const form = state.form && typeof state.form === "object" ? state.form : fallback.form;
  return {
    selectedId: typeof state.selectedId === "string" ? state.selectedId : null,
    query: typeof state.query === "string" ? state.query : "",
    form: {
      name: typeof form.name === "string" ? form.name : "",
      protocol: [SOURCE_BROWSER_TEXT_HTTP, SOURCE_TEXT_HTTPS_2, SOURCE_TEXT_SOCKS5].includes(form.protocol) ? form.protocol : SOURCE_BROWSER_TEXT_HTTP,
      host: typeof form.host === "string" ? form.host : "",
      port: typeof form.port === "number" ? form.port : 8080,
      username: typeof form.username === "string" ? form.username : "",
      password: typeof form.password === "string" ? form.password : "",
      clearPassword: form.clearPassword === true,
      notes: typeof form.notes === "string" ? form.notes : "",
    },
    editor: state.editor && typeof state.editor === "object" ? { ...(typeof state.editor.id === "string" ? { id: state.editor.id } : {}), hasPassword: state.editor.hasPassword === true } : null,
    importOpen: state.importOpen === true,
    importText: typeof state.importText === "string" ? state.importText : "",
  };
}
export function nextProxyRevision(previous: number, now = Date.now()): number {
  return Math.max(previous + 1, now);
}
export function workspaceNeedsRecovery(snapshot: ProxyWorkspaceSnapshot | null, expectedRevision: number): boolean {
  return expectedRevision > (snapshot?.revision || 0);
}
