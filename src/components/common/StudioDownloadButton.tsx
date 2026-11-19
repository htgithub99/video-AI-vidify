import { FC } from "react";
import { Download, Loader2 } from "lucide-react";
import { STUDIO_DOWNLOAD as D, STUDIO_DOWNLOAD_TEXT } from "../../constants/studioTheme.js";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
import { SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText.js";
type StudioDownloadButtonProps = { onClick: () => void; busy?: boolean; disabled?: boolean; title?: string; className?: string };
const downloadText = () => (document.documentElement.lang === "en" ? STUDIO_DOWNLOAD_TEXT.en : STUDIO_DOWNLOAD_TEXT.vi);
export const StudioDownloadButton: FC<StudioDownloadButtonProps> = ({ onClick, busy = false, disabled = false, title, className }) => {
  const text = downloadText();
  const body = (
    <>
      {busy ? <Loader2 className={D.SPIN} /> : <Download className={D.ICON} />}
      <span>{busy ? text.BUSY : text.LABEL}</span>
    </>
  );
  return (
    <Button variant={SOURCE_TEXT_UNSTYLED} type="button" onClick={onClick} disabled={disabled || busy} title={title ?? text.LABEL} className={cn(D.BUTTON, className)}>
      {body}
    </Button>
  );
};
