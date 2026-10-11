import {
  SOURCE_TEXT_LINUX,
  SOURCE_TEXT_BASIC_TEXT,
  SOURCE_TEXT_HE_DIEU_HANH_CHUA_SAN_SANG_DE,
  SOURCE_TEXT_BASE64,
  SOURCE_TEXT_WIN32,
  SOURCE_TEXT_LUU_MAT_KHAU_PROXY_CAN_BAN_ELECTRON,
  SOURCE_TEXT_UNPROTECT,
  SOURCE_TEXT_PROTECT,
  SOURCE_TEMPLATE_ADD_TYPE_ASSEMBLYNAME_SYSTEM_SECURITY_V,
  SOURCE_TEXT_POWERSHELL_EXE,
  SOURCE_TEXT_NOPROFILE,
  SOURCE_TEXT_NONINTERACTIVE,
  SOURCE_TEXT_COMMAND,
  SOURCE_TEXT_PIPE,
  SOURCE_TEXT_DATA_2,
  SOURCE_TEXT_HET_THOI_GIAN_BAO_VE_MAT_KHAU,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_KHONG_THE_MO_DICH_VU_BAO_VE,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_KHONG_THE_DOC_LUU_MAT_KHAU_BANG,
  SOURCE_TEXT_UTF8,
} from "../../constants/sourceText.js";
import { spawn } from "node:child_process";
export async function transformProxySecret(value: string, decrypt = false): Promise<string> {
  if (!value) return "";
  if (process.versions.electron) {
    const { safeStorage } = await import("electron");
    if (!safeStorage.isEncryptionAvailable() || (process.platform === SOURCE_TEXT_LINUX && safeStorage.getSelectedStorageBackend?.() === SOURCE_TEXT_BASIC_TEXT)) throw new Error(SOURCE_TEXT_HE_DIEU_HANH_CHUA_SAN_SANG_DE);
    return decrypt ? safeStorage.decryptString(Buffer.from(value, SOURCE_TEXT_BASE64)) : safeStorage.encryptString(value).toString(SOURCE_TEXT_BASE64);
  }
  if (process.platform !== SOURCE_TEXT_WIN32) throw new Error(SOURCE_TEXT_LUU_MAT_KHAU_PROXY_CAN_BAN_ELECTRON);
  const script = SOURCE_TEMPLATE_ADD_TYPE_ASSEMBLYNAME_SYSTEM_SECURITY_V(`${decrypt ? SOURCE_TEXT_UNPROTECT : SOURCE_TEXT_PROTECT}`);
  return new Promise((resolve, reject) => {
    const child = spawn(SOURCE_TEXT_POWERSHELL_EXE, [SOURCE_TEXT_NOPROFILE, SOURCE_TEXT_NONINTERACTIVE, SOURCE_TEXT_COMMAND, script], { windowsHide: true, stdio: [SOURCE_TEXT_PIPE, SOURCE_TEXT_PIPE, SOURCE_TEXT_PIPE] });
    const chunks: Buffer[] = [];
    child.stdout.on(SOURCE_TEXT_DATA_2, (chunk: Buffer) => chunks.push(chunk));
    child.stderr.resume();
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(SOURCE_TEXT_HET_THOI_GIAN_BAO_VE_MAT_KHAU));
    }, 15000);
    child.on(SOURCE_TEXT_ERROR, () => {
      clearTimeout(timer);
      reject(new Error(SOURCE_TEXT_KHONG_THE_MO_DICH_VU_BAO_VE));
    });
    child.on(SOURCE_TEXT_CLOSE_2, (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(SOURCE_TEXT_KHONG_THE_DOC_LUU_MAT_KHAU_BANG));
      const output = Buffer.concat(chunks).toString(SOURCE_TEXT_UTF8).trim();
      resolve(decrypt ? Buffer.from(output, SOURCE_TEXT_BASE64).toString(SOURCE_TEXT_UTF8) : output);
    });
    child.stdin.on(SOURCE_TEXT_ERROR, () => {});
    child.stdin.end(decrypt ? value : Buffer.from(value, SOURCE_TEXT_UTF8).toString(SOURCE_TEXT_BASE64));
  });
}
