/** Identify supported raster image bytes before accepting a provider download. */
export const getDownloadedImageMimeType = (buffer: Buffer): string | undefined => {
  if (buffer.length < 12) return undefined;
  if (buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  const gif = buffer.toString("ascii", 0, 6);
  if (gif === "GIF87a" || gif === "GIF89a") return "image/gif";
  return undefined;
};
