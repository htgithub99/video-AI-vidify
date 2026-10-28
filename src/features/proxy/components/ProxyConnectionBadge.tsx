import {
  SOURCE_TEXT_OK,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_3,
  SOURCE_TEXT_BORDER_PURPLE_500_35_BG_PURPLE_500,
  SOURCE_TEXT_BORDER_EMERALD_500_35_BG_EMERALD_500,
  SOURCE_TEXT_BORDER_ROSE_500_35_BG_ROSE_500,
  SOURCE_TEXT_BORDER_SLATE_700_BG_SLATE_800_70,
  SOURCE_TEXT_H_3_W_3,
  SOURCE_TEXT_ANIMATE_SPIN,
  SOURCE_TEMPLATE_MS_2,
  SOURCE_TEMPLATE_SYMBOL_75,
} from "../../../constants/sourceText.js";
import { Sparkles, CheckCircle2, XCircle, Clock } from "lucide-react";
import { PROXY_TEXTS } from "../../../constants/proxy";
import type { ProxyProfile } from "../../../types/proxy";
import { cn } from "../../../lib/utils";
export function ProxyConnectionBadge({ profile, checking, texts: t }: { profile: ProxyProfile; checking: boolean; texts: (typeof PROXY_TEXTS)[keyof typeof PROXY_TEXTS] }) {
  const status = profile.check?.status;
  const Icon = checking ? Sparkles : status === SOURCE_TEXT_OK ? CheckCircle2 : status === SOURCE_TEXT_ERROR ? XCircle : Clock;
  return (
    <span className={cn(SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_3, checking ? SOURCE_TEXT_BORDER_PURPLE_500_35_BG_PURPLE_500 : status === SOURCE_TEXT_OK ? SOURCE_TEXT_BORDER_EMERALD_500_35_BG_EMERALD_500 : status === SOURCE_TEXT_ERROR ? SOURCE_TEXT_BORDER_ROSE_500_35_BG_ROSE_500 : SOURCE_TEXT_BORDER_SLATE_700_BG_SLATE_800_70)}>
      <Icon className={cn(SOURCE_TEXT_H_3_W_3, checking && SOURCE_TEXT_ANIMATE_SPIN)} />
      {checking ? t.checking : status === SOURCE_TEXT_OK ? SOURCE_TEMPLATE_SYMBOL_75(`${t.ok}`, `${profile.check?.latencyMs !== undefined ? SOURCE_TEMPLATE_MS_2(`${profile.check.latencyMs}`) : ""}`) : status === SOURCE_TEXT_ERROR ? t.failed : t.unchecked}
    </span>
  );
}
