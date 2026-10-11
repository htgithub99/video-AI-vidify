import {
  SOURCE_TEXT_CAU_HINH_PROXY_KHONG_HOP_LE,
  SOURCE_TEXT_TEN_PROXY_PHAI_CO_TU_1_DEN,
  SOURCE_TEXT_SYMBOL_15,
  SOURCE_TEXT_SYMBOL_38,
  SOURCE_TEXT_HOST_KHONG_HOP_LE_CHI_NHAP_IP,
  SOURCE_BROWSER_TEXT_HTTP,
  SOURCE_TEXT_HTTPS_2,
  SOURCE_TEXT_SOCKS5,
  SOURCE_TEXT_GIAO_THUC_PROXY_KHONG_HOP_LE,
  SOURCE_TEXT_PORT_PHAI_TU_1_DEN_65535,
  SOURCE_TEXT_THONG_TIN_XAC_THUC_HOAC_GHI_CHU,
  SOURCE_TEXT_SOCKS5_CO_XAC_THUC_CHUA_DUOC_HO,
  SOURCE_TEXT_CAN_USERNAME_KHI_SU_DUNG_MAT_KHAU,
  SOURCE_TEXT_SYMBOL_16,
  SOURCE_TEMPLATE_SYMBOL_83,
  SOURCE_TEMPLATE_SYMBOL_84,
  SOURCE_TEMPLATE_SYMBOL_85,
  SOURCE_TEXT_SYMBOL_51,
  SOURCE_TEXT_SYMBOL,
  SOURCE_TEXT_URL_PROXY_KHONG_DUOC_CHUA_DUONG_DAN,
  SOURCE_TEXT_80,
  SOURCE_TEXT_443,
  SOURCE_TEXT_1080,
  SOURCE_TEXT_DUNG_HOST_PORT_HOAC_HOST_PORT_USERNAME,
  SOURCE_TEMPLATE_PROXY,
  SOURCE_TEXT_PROXY_TRUNG_VOI_DONG_TRUOC,
  SOURCE_TEXT_DONG_KHONG_HOP_LE,
} from "../constants/sourceText.js";
import type { ProxyImportRow, ProxyInput } from "../types/proxy";
export function validateProxyInput(value: unknown): ProxyInput {
  if (!value || typeof value !== "object") throw new Error(SOURCE_TEXT_CAU_HINH_PROXY_KHONG_HOP_LE);
  const data = value as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const host = typeof data.host === "string" ? data.host.trim().replace(/^\[|\]$/g, "") : "";
  if (!name || name.length > 100) throw new Error(SOURCE_TEXT_TEN_PROXY_PHAI_CO_TU_1_DEN);
  if (!host || host.length > 253 || !/^[a-zA-Z0-9.:-]+$/.test(host) || host.startsWith(SOURCE_TEXT_SYMBOL_15) || host.includes(SOURCE_TEXT_SYMBOL_38)) throw new Error(SOURCE_TEXT_HOST_KHONG_HOP_LE_CHI_NHAP_IP);
  if (!([SOURCE_BROWSER_TEXT_HTTP, SOURCE_TEXT_HTTPS_2, SOURCE_TEXT_SOCKS5] as readonly string[]).includes(String(data.protocol))) throw new Error(SOURCE_TEXT_GIAO_THUC_PROXY_KHONG_HOP_LE);
  const port = Number(data.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(SOURCE_TEXT_PORT_PHAI_TU_1_DEN_65535);
  const username = typeof data.username === "string" ? data.username : "";
  const password = typeof data.password === "string" ? data.password : undefined;
  const notes = typeof data.notes === "string" ? data.notes.trim() : "";
  if (username.length > 512 || (password?.length || 0) > 2048 || notes.length > 2000) throw new Error(SOURCE_TEXT_THONG_TIN_XAC_THUC_HOAC_GHI_CHU);
  if (data.protocol === SOURCE_TEXT_SOCKS5 && (username || password)) throw new Error(SOURCE_TEXT_SOCKS5_CO_XAC_THUC_CHUA_DUOC_HO);
  if (password && !username) throw new Error(SOURCE_TEXT_CAN_USERNAME_KHI_SU_DUNG_MAT_KHAU);
  return { name, host, port, protocol: data.protocol as ProxyInput["protocol"], username, password, clearPassword: data.clearPassword === true, notes };
}
export function proxyServer(input: Pick<ProxyInput, "protocol" | "host" | "port">): string {
  return SOURCE_TEMPLATE_SYMBOL_84(`${input.protocol}`, `${input.host.includes(SOURCE_TEXT_SYMBOL_16) ? SOURCE_TEMPLATE_SYMBOL_83(`${input.host}`) : input.host}`, `${input.port}`);
}
export const getProxyIdentity = (input: Pick<ProxyInput, "protocol" | "host" | "port" | "username">): string => SOURCE_TEMPLATE_SYMBOL_85(`${proxyServer(input)}`, `${input.username}`);
export function parseProxyImport(text: string): ProxyImportRow[] {
  const seen = new Set<string>();
  return text
    .split(/\r?\n/)
    .map((raw, index): ProxyImportRow | null => {
      const line = raw.trim();
      if (!line) return null;
      try {
        let protocol: ProxyInput["protocol"] = SOURCE_BROWSER_TEXT_HTTP;
        let host: string,
          port: string,
          username = "",
          password = "";
        if (line.includes(SOURCE_TEXT_SYMBOL_51)) {
          const url = new URL(line);
          if ((url.pathname && url.pathname !== SOURCE_TEXT_SYMBOL) || url.search || url.hash) throw new Error(SOURCE_TEXT_URL_PROXY_KHONG_DUOC_CHUA_DUONG_DAN);
          protocol = url.protocol.replace(SOURCE_TEXT_SYMBOL_16, "") as ProxyInput["protocol"];
          host = url.hostname;
          port = url.port || (protocol === SOURCE_BROWSER_TEXT_HTTP ? SOURCE_TEXT_80 : protocol === SOURCE_TEXT_HTTPS_2 ? SOURCE_TEXT_443 : SOURCE_TEXT_1080);
          username = decodeURIComponent(url.username);
          password = decodeURIComponent(url.password);
        } else {
          const match = line.match(/^(\[[^\]]+\]|[^:]+):(\d+)(?::([^:]+):(.*))?$/);
          if (!match) throw new Error(SOURCE_TEXT_DUNG_HOST_PORT_HOAC_HOST_PORT_USERNAME);
          [, host, port, username = "", password = ""] = match;
        }
        const input = validateProxyInput({ name: SOURCE_TEMPLATE_PROXY(`${index + 1}`), protocol, host, port, username, password, notes: "" });
        const key = getProxyIdentity(input);
        if (seen.has(key)) throw new Error(SOURCE_TEXT_PROXY_TRUNG_VOI_DONG_TRUOC);
        seen.add(key);
        return { line: index + 1, input };
      } catch (error) {
        return { line: index + 1, error: error instanceof Error ? error.message : SOURCE_TEXT_DONG_KHONG_HOP_LE };
      }
    })
    .filter((row): row is ProxyImportRow => row !== null);
}
