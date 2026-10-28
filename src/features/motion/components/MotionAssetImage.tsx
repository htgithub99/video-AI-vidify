import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { useEffect, useState } from "react";
import { MOTION_ASSET_PREVIEW as P } from "../constants/motionAssetPreview.js";
export const MotionAssetImage = ({ src, title, className, lang = RT_SHARED.VI, onStatus }: { src: string; title: string; className?: string; lang?: string; onStatus?: (ready: boolean) => void }) => {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(RT_MOTION.LOADING);
  const text = P.LABEL[lang === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI];
  useEffect(() => {
    setStatus(RT_MOTION.LOADING);
    onStatus?.(false);
  }, [src]);
  return (
    <>
      {status !== RT_SHARED.READY && (
        <div className={P.PLACEHOLDER} role={RT_MOTION.STATUS}>
          {status === RT_SHARED.ERROR || !src ? text.error : text.loading}
        </div>
      )}
      {!!src && (
        <img
          key={src}
          src={src}
          alt={title}
          className={status === RT_SHARED.READY ? className : P.HIDDEN}
          onLoad={() => {
            setStatus(RT_SHARED.READY);
            onStatus?.(true);
          }}
          onError={() => {
            setStatus(RT_SHARED.ERROR);
            onStatus?.(false);
          }}
        />
      )}
    </>
  );
};
