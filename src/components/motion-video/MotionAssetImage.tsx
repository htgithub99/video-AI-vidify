import { useEffect, useState } from "react";
import { MOTION_ASSET_PREVIEW as P } from "../../constants/motionAssetPreview.js";
export const MotionAssetImage = ({ src, title, className, lang = "vi", onStatus }: { src: string; title: string; className?: string; lang?: string; onStatus?: (ready: boolean) => void }) => {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const text = P.LABEL[lang === "en" ? "en" : "vi"];
  useEffect(() => {
    setStatus("loading");
    onStatus?.(false);
  }, [src]);
  return (
    <>
      {status !== "ready" && (
        <div className={P.PLACEHOLDER} role="status">
          {status === "error" || !src ? text.error : text.loading}
        </div>
      )}
      {!!src && (
        <img
          key={src}
          src={src}
          alt={title}
          className={status === "ready" ? className : P.HIDDEN}
          onLoad={() => {
            setStatus("ready");
            onStatus?.(true);
          }}
          onError={() => {
            setStatus("error");
            onStatus?.(false);
          }}
        />
      )}
    </>
  );
};
