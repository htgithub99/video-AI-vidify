import { MEDIA_FORMAT as C } from "../constants/mediaFormat.js";
export const formatMediaFileSize = (bytes?: number): string => {
  const size = Number(bytes) || 0;
  if (size <= 0) return C.ZERO_SIZE;
  return size >= C.BYTES_PER_GB ? (size / C.BYTES_PER_GB).toFixed(2) + C.GIGABYTES : (size / C.BYTES_PER_MB).toFixed(1) + C.MEGABYTES;
};
