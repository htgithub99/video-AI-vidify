import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { StudioCard } from "../../../components/ui/Studio.js";
import { Button } from "../../../components/ui/Button.js";
import { ToggleIndicator } from "../../../components/common/ToggleIndicator.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { cn } from "../../../lib/utils.js";
import { CHROME_BACKUP as C } from "../../../constants/chromeBackup.js";
export const ChromeBackupSettings = ({ language }: { language: string }) => {
  const lang = language === C.EN ? C.EN : C.VI;
  const [settings, setSettings] = useState<{ enabled: boolean; useBackup?: boolean; ready: boolean; active: boolean; switching: boolean; error?: string }>();
  const [busy, setBusy] = useState(false);
  const request = async (url = C.API as string, init?: RequestInit) => {
    setBusy(true);
    try {
      const response = await fetch(url, init);
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || response.statusText);
      setSettings(value);
    } catch (error) {
      toast.error(String((error as Error).message));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void request();
  }, []);
  const enabled = settings?.enabled === true;
  const useBackup = settings?.useBackup === true;
  const dotClassName = settings?.active ? C.UI.DOT_ACTIVE : settings?.ready ? C.UI.DOT_READY : C.UI.DOT_MISSING;
  return (
    <StudioCard className={C.UI.CARD}>
      <div className={C.UI.HEADER}>
        <div className={C.UI.HEADER_INFO}>
          <div className={C.UI.ICON_BOX}>
            <Globe className={C.UI.ICON} />
          </div>
          <div>
            <h3 className={C.UI.TITLE}>{C.TITLE[lang]}</h3>
            <p className={C.UI.SUBTITLE}>{C.SUBTITLE[lang]}</p>
          </div>
        </div>
        <div className={C.UI.HEADER_RIGHT}>
          <p role={C.UI.STATUS_ROLE} className={C.UI.STATUS}>
            <span className={cn(C.UI.DOT, dotClassName)} />
            <span>{settings ? (settings.active ? C.ACTIVE[lang] : settings.ready ? C.READY[lang] : C.MISSING[lang]) : C.UI.LOADING}</span>
          </p>
          <div className={C.UI.ACTIONS}>
            <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} disabled={busy || !settings || (settings.active && !settings.useBackup) || settings.switching} onClick={() => void request(C.PREPARE_API, { method: C.UI.POST })}>
              {C.PREPARE[lang]}
            </Button>
            <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} disabled={busy} onClick={() => void request()}>
              {C.CHECK[lang]}
            </Button>
          </div>
        </div>
      </div>
      <div className={C.UI.GRID}>
        <Button variant={C.UI.UNSTYLED} role={C.UI.SWITCH} aria-checked={enabled} aria-label={C.LABEL[lang]} disabled={busy || !settings || settings.switching} onClick={() => void request(C.API, { method: C.UI.PUT, headers: C.UI.JSON_HEADERS, body: stringifyJson({ enabled: !enabled }) })} className={cn(C.UI.TOGGLE, enabled && C.UI.TOGGLE_ACTIVE)}>
          <span className={C.UI.TOGGLE_CONTENT}>
            <span className={C.UI.LABEL}>{C.LABEL[lang]}</span>
            <span className={C.UI.DESCRIPTION}>{C.DESCRIPTION[lang]}</span>
          </span>
          <ToggleIndicator checked={enabled} />
        </Button>
        <Button variant={C.UI.UNSTYLED} role={C.UI.SWITCH} aria-checked={useBackup} aria-label={C.FORCE_LABEL[lang]} disabled={busy || !settings || settings.switching} onClick={() => void request(C.API, { method: C.UI.PUT, headers: C.UI.JSON_HEADERS, body: stringifyJson({ useBackup: !useBackup }) })} className={cn(C.UI.TOGGLE, useBackup && C.UI.TOGGLE_ACTIVE)}>
          <span className={C.UI.TOGGLE_CONTENT}>
            <span className={C.UI.LABEL}>{C.FORCE_LABEL[lang]}</span>
            <span className={C.UI.DESCRIPTION}>{C.FORCE_DESCRIPTION[lang]}</span>
          </span>
          <ToggleIndicator checked={useBackup} />
        </Button>
      </div>
      {settings?.error && (
        <p role={C.UI.ALERT_ROLE} className={C.UI.ERROR}>
          {settings.error}
        </p>
      )}
    </StudioCard>
  );
};
