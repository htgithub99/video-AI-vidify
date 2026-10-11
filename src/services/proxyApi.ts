import { SOURCE_TEXT_GET, SOURCE_TEMPLATE_SYMBOL_75, SOURCE_TEXT_APPLICATION_JSON, SOURCE_TEXT_KHONG_THE_XU_LY_PROXY } from "../constants/sourceText.js";
import { PROXY_API } from "../constants/proxy";
export async function requestProxyApi<T>(suffix = "", method: string = SOURCE_TEXT_GET, body?: unknown, keepalive = false): Promise<T> {
  const response = await fetch(SOURCE_TEMPLATE_SYMBOL_75(`${PROXY_API}`, `${suffix}`), { method, ...(body === undefined ? {} : { headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: JSON.stringify(body) }), ...(keepalive ? { keepalive } : {}) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || SOURCE_TEXT_KHONG_THE_XU_LY_PROXY);
  return result.data;
}
