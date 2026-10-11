export type ProxyProtocol = "http" | "https" | "socks5";
export interface ProxyInput { name: string; protocol: ProxyProtocol; host: string; port: number; username: string; password?: string; clearPassword?: boolean; notes: string; }
export interface ProxyCheck { status: "ok" | "error"; ip?: string; latencyMs?: number; checkedAt: string; error?: string; }
export interface ProxyProfile extends Omit<ProxyInput, "password" | "clearPassword"> { id: string; hasPassword: boolean; createdAt: string; updatedAt: string; check: ProxyCheck | null; session: "closed" | "opening" | "open" | "closing"; }
export interface ProxyImportRow { line: number; input?: ProxyInput; error?: string; }
export interface ProxyWorkspaceState { selectedId: string | null; query: string; form: ProxyInput; editor: { id?: string; hasPassword?: boolean; } | null; importOpen: boolean; importText: string; }
export interface ProxyWorkspaceSnapshot { revision: number; state: ProxyWorkspaceState; }
