import { Check, Copy } from "lucide-react";
import type { FC } from "react";
import * as MR from "../../../constants/motionRuntime.js";
import { Button } from "../../../components/ui/Button";
export const MotionCopyButton: FC<{ copied: boolean; onClick: () => void; title: string; className: string; iconClassName: string; copiedIconClassName: string }> = ({ copied, onClick, title, className, iconClassName, copiedIconClassName }) => (
  <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} onClick={onClick} className={className} title={title}>
    {copied ? <Check className={copiedIconClassName} /> : <Copy className={iconClassName} />}
  </Button>
);
