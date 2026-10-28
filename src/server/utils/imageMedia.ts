import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
export const getDownloadedImageMimeType = (buffer: Buffer): string | undefined => {
  if (buffer.length < 12) return undefined;
  if (buffer.subarray(0, 8).equals(Buffer.from(RT_SERVER.VALUE_89504E470D0A1A0A, RT_SERVER.HEX))) return RT_SERVER.IMAGE_PNG;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return RT_SERVER.IMAGE_JPEG;
  if (buffer.toString(RT_SERVER.ASCII, 0, 4) === RT_SERVER.RIFF && buffer.toString(RT_SERVER.ASCII, 8, 12) === RT_SERVER.WEBP) return RT_SERVER.IMAGE_WEBP;
  const gif = buffer.toString(RT_SERVER.ASCII, 0, 6);
  if (gif === RT_SERVER.GIF87A || gif === RT_SERVER.GIF89A) return RT_SERVER.IMAGE_GIF;
  return undefined;
};
