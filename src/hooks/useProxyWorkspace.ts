import { SOURCE_TEXT_WORKSPACE, SOURCE_TEXT_SAVED, SOURCE_TEXT_PUT, SOURCE_TEXT_ERROR, SOURCE_TEXT_PENDING_DRAFT_NOT_AVAILABLE, SOURCE_TEXT_BEFOREUNLOAD, SOURCE_TEXT_PAGEHIDE, SOURCE_TEXT_SAVING } from "../constants/sourceText.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestProxyApi } from "../services/proxyApi";
import { delayAsync } from "../lib/asyncUtils";
import { emptyProxyWorkspace, nextProxyRevision, PROXY_WORKSPACE_MARKER, restoreProxyWorkspace, workspaceNeedsRecovery } from "../lib/proxyWorkspace";
import type { ProxyWorkspaceSnapshot, ProxyWorkspaceState } from "../types/proxy";
const readSnapshot = () => requestProxyApi<ProxyWorkspaceSnapshot | null>(SOURCE_TEXT_WORKSPACE);
function readRevision(): number {
  try {
    const value = Number(localStorage.getItem(PROXY_WORKSPACE_MARKER));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}
function writeRevision(value: number): void {
  try {
    localStorage.setItem(PROXY_WORKSPACE_MARKER, String(value));
  } catch {}
}
export function useProxyWorkspace() {
  const [workspace, setWorkspace] = useState<ProxyWorkspaceState>(emptyProxyWorkspace);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"saved" | "saving" | "error">(SOURCE_TEXT_SAVED);
  const [recoveryError, setRecoveryError] = useState(false);
  const latest = useRef<ProxyWorkspaceSnapshot | null>(null);
  const revision = useRef(readRevision());
  const savedRevision = useRef(0);
  const lastJson = useRef("");
  const alive = useRef(false);
  const recoveryGeneration = useRef(0);
  const persist = useCallback(async (keepalive = false) => {
    const snapshot = latest.current;
    if (!snapshot || snapshot.revision <= savedRevision.current) return;
    try {
      const body = JSON.stringify(snapshot);
      if (keepalive && new TextEncoder().encode(body).length > 60000) return;
      await requestProxyApi<number>(SOURCE_TEXT_WORKSPACE, SOURCE_TEXT_PUT, snapshot, keepalive);
      savedRevision.current = Math.max(savedRevision.current, snapshot.revision);
      if (alive.current && latest.current?.revision === snapshot.revision) setStatus(SOURCE_TEXT_SAVED);
    } catch {
      if (alive.current) setStatus(SOURCE_TEXT_ERROR);
    }
  }, []);
  const recover = useCallback(async () => {
    const generation = ++recoveryGeneration.current;
    setRecoveryError(false);
    try {
      const expected = readRevision();
      let snapshot = await readSnapshot();
      for (let attempt = 0; workspaceNeedsRecovery(snapshot, expected) && attempt < 20 && alive.current; attempt++) {
        await delayAsync(500);
        snapshot = await readSnapshot();
      }
      if (!alive.current || generation !== recoveryGeneration.current) return;
      if (workspaceNeedsRecovery(snapshot, expected)) throw new Error(SOURCE_TEXT_PENDING_DRAFT_NOT_AVAILABLE);
      const restored = restoreProxyWorkspace(snapshot?.state);
      lastJson.current = JSON.stringify(restored);
      revision.current = Math.max(expected, snapshot?.revision || 0);
      savedRevision.current = revision.current;
      setWorkspace(restored);
      setReady(true);
    } catch {
      if (alive.current && generation === recoveryGeneration.current) setRecoveryError(true);
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void recover();
    const protectPendingDraft = (event: BeforeUnloadEvent) => {
      if (latest.current && latest.current.revision > savedRevision.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const flush = () => {
      void persist(true);
    };
    window.addEventListener(SOURCE_TEXT_BEFOREUNLOAD, protectPendingDraft);
    window.addEventListener(SOURCE_TEXT_PAGEHIDE, flush);
    return () => {
      alive.current = false;
      recoveryGeneration.current++;
      window.removeEventListener(SOURCE_TEXT_BEFOREUNLOAD, protectPendingDraft);
      window.removeEventListener(SOURCE_TEXT_PAGEHIDE, flush);
      void persist();
    };
  }, [persist, recover]);
  useEffect(() => {
    if (!ready) return;
    const json = JSON.stringify(workspace);
    if (json === lastJson.current) return;
    lastJson.current = json;
    revision.current = nextProxyRevision(Math.max(revision.current, readRevision()));
    latest.current = { revision: revision.current, state: workspace };
    writeRevision(revision.current);
    setStatus(SOURCE_TEXT_SAVING);
    const timer = setTimeout(() => {
      void persist();
    }, 600);
    return () => clearTimeout(timer);
  }, [workspace, ready, persist]);
  const update = useCallback(<K extends keyof ProxyWorkspaceState>(key: K, value: ProxyWorkspaceState[K] | ((current: ProxyWorkspaceState[K]) => ProxyWorkspaceState[K])) => {
    setWorkspace((current) => {
      const next = typeof value === "function" ? (value as (previous: ProxyWorkspaceState[K]) => ProxyWorkspaceState[K])(current[key]) : value;
      return next === current[key] ? current : { ...current, [key]: next };
    });
  }, []);
  return { workspace, update, ready, status, recoveryError, recover, retrySave: () => persist() };
}
