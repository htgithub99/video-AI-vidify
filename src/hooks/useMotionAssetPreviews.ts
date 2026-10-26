import { useEffect, useRef, useState } from "react";
import { MOTION_ASSET_PREVIEW as P } from "../constants/motionAssetPreview.js";
import type { PuppetPackSnapshot } from "../types/motionPuppet.js";
export const useMotionAssetPreviews = (pack?: PuppetPackSnapshot): Record<string, string> => {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const cache = useRef(new Map<string, { svg: string; url: string }>());
  const allocated = useRef(new Set<string>());
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const asset of Object.values(pack?.assets || {})) {
      if (!("svg" in asset) || typeof asset.svg !== "string" || !P.SVG.test(asset.svg)) continue;
      let item = cache.current.get(asset.id);
      if (!item || item.svg !== asset.svg) {
        const url = URL.createObjectURL(new Blob([asset.svg], { type: P.MIME }));
        allocated.current.add(url);
        item = { svg: asset.svg, url };
        cache.current.set(asset.id, item);
      }
      next[asset.id] = item.url;
    }
    setUrls(next);
  }, [pack?.fingerprint]);
  useEffect(
    () => () => {
      for (const url of allocated.current) URL.revokeObjectURL(url);
      allocated.current.clear();
      cache.current.clear();
    },
    [],
  );
  return urls;
};
