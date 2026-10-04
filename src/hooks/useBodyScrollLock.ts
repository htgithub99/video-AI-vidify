import { useEffect } from "react";
import { SOURCE_TEXT_HIDDEN } from "../constants/sourceText";
let activeLocks = 0;
let previousOverflow = "";
export const useBodyScrollLock = (isLocked: boolean): void => {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;
    if (activeLocks === 0) previousOverflow = document.body.style.overflow;
    activeLocks++;
    document.body.style.overflow = SOURCE_TEXT_HIDDEN;
    return () => {
      activeLocks--;
      if (activeLocks === 0) document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);
};
