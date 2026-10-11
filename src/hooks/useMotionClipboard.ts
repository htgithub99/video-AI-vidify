import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
export const useMotionClipboard = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => { activeRef.current = false; if (timeoutRef.current !== null) clearTimeout(timeoutRef.current); };
  }, []);
  const copyText = (text: string, key: string, message: string) => { void navigator.clipboard.writeText(text).then(() => { if (!activeRef.current) return; if (timeoutRef.current !== null) clearTimeout(timeoutRef.current); setCopiedKey(key); toast.success(message); timeoutRef.current = setTimeout(() => { timeoutRef.current = null; setCopiedKey(null); }, 2000); }); };
  return { copiedKey, copyText };
};
