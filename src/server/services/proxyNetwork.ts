import { SOURCE_TEMPLATE_HTTP_2, SOURCE_TEXT_INVALID_IP_RESPONSE } from "../../constants/sourceText.js";
import { isIP } from "node:net";
import { getErrorMessage } from "../../utils/errorUtils.js";
type IpResponse = { ok(): boolean; status(): number; json(): Promise<{ ip?: unknown }> };
export async function readProxyExitIp(response: IpResponse | null | undefined, invalidMessage: string = SOURCE_TEXT_INVALID_IP_RESPONSE): Promise<string> {
  if (!response?.ok()) throw new Error(SOURCE_TEMPLATE_HTTP_2(`${response?.status()}`));
  const data = await response.json();
  if (typeof data.ip !== "string" || !isIP(data.ip)) throw new Error(invalidMessage);
  return data.ip;
}
export const isProxyTimeout = (error: unknown): boolean => /timeout|timed out/i.test(getErrorMessage(error, ""));
