import type { StorageJunkGroup } from "../constants/storage.js";
export interface StorageJunkItem {
  path: string;
  bytes: number;
}
export interface StorageJunkGroupInfo {
  group: StorageJunkGroup;
  bytes: number;
  count: number;
  items: StorageJunkItem[];
}
export interface StorageJunkReport {
  storageDir: string;
  totalBytes: number;
  groups: StorageJunkGroupInfo[];
}
export interface StorageCleanResult {
  freedBytes: number;
  removed: number;
  failed: string[];
  recycled: boolean;
}
