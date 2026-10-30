import type { ComponentProps } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "../ui/Button.js";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText.js";
type CopyButtonProps = Omit<ComponentProps<typeof Button>, "children"> & { copied?: boolean; copiedTitle?: string; iconClassName?: string; copiedIconClassName?: string };
export const CopyButton = ({ copied = false, copiedTitle, title, iconClassName, copiedIconClassName, ...props }: CopyButtonProps) => (
  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} title={copied && copiedTitle ? copiedTitle : title} aria-label={copied && copiedTitle ? copiedTitle : title} {...props}>
    {copied ? <Check className={copiedIconClassName || iconClassName} /> : <Copy className={iconClassName} />}
  </Button>
);
