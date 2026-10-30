import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CLIPBOARD_FEEDBACK as C } from "../constants/clipboardFeedback.js";
import type { Lang } from "../lib/lang.js";
export const useClipboardFeedback = <Key extends string | number = string>({ duration = C.DURATION_MS, language = C.LANGUAGE }: { duration?: number; language?: Lang } = {}) => {
  const [copiedKey, setCopiedKey] = useState<Key | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);
  const copyText = async (text: string, key: Key, message: string, onCopied?: () => void): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      if (!activeRef.current) return false;
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      setCopiedKey(key);
      toast.success(message);
      onCopied?.();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setCopiedKey(null);
      }, duration);
      return true;
    } catch {
      if (activeRef.current) toast.error(C.UI[language].FAILED);
      return false;
    }
  };
  return { copiedKey, copyText };
};
