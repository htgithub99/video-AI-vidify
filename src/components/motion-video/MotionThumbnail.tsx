import _ from "lodash";
import type { FC, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { MOTION_TEXT_200PX } from "../../constants/motionRuntime.js";
export const MotionThumbnail: FC<{ load: () => Promise<string>; deps: unknown[]; alt: string; className?: string; imageClassName?: string; placeholder: ReactNode; lazy?: boolean; imageLoading?: "lazy" | "eager"; draggable?: boolean }> = ({ load, deps, alt, className, imageClassName, placeholder, lazy = false, imageLoading, draggable }) => {
  const holder = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    setSrc("");
    let cancelled = false;
    const fetchThumbnail = () =>
      load()
        .then((url) => !cancelled && setSrc(url))
        .catch(_.noop);
    let observer: IntersectionObserver | undefined;
    if (lazy) {
      const element = holder.current;
      if (!element) return;
      observer = new IntersectionObserver(
        (entries) => {
          if (_.some(entries, (entry) => entry.isIntersecting)) {
            observer?.disconnect();
            void fetchThumbnail();
          }
        },
        { rootMargin: MOTION_TEXT_200PX },
      );
      observer.observe(element);
    } else void fetchThumbnail();
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, deps);
  return (
    <div ref={holder} className={className}>
      {src ? <img src={src} alt={alt} className={imageClassName} loading={imageLoading} draggable={draggable} /> : placeholder}
    </div>
  );
};
