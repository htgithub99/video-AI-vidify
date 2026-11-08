import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { StudioCard } from "../../../components/ui/Studio.js";
import { Button } from "../../../components/ui/Button.js";
import { ToggleIndicator } from "../../../components/common/ToggleIndicator.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
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
  return (
    <StudioCard className={C.UI.CARD}>
      <h3 className={C.UI.TITLE}>
        <Globe className={C.UI.ICON} />
        {C.TITLE[lang]}
      </h3>
      <Button variant={C.UI.UNSTYLED} role={C.UI.SWITCH} aria-checked={settings?.enabled === true} aria-label={C.LABEL[lang]} disabled={busy || !settings || settings.switching} onClick={() => void request(C.API, { method: C.UI.PUT, headers: C.UI.JSON_HEADERS, body: stringifyJson({ enabled: !settings?.enabled }) })} className={C.UI.TOGGLE}>
        <span className={C.UI.LABEL}>{C.LABEL[lang]}</span>
        <ToggleIndicator checked={settings?.enabled === true} />
      </Button>
      <p className={C.UI.DESCRIPTION}>{C.DESCRIPTION[lang]}</p>
      <Button variant={C.UI.UNSTYLED} role={C.UI.SWITCH} aria-checked={settings?.useBackup === true} aria-label={C.FORCE_LABEL[lang]} disabled={busy || !settings || settings.switching} onClick={() => void request(C.API, { method: C.UI.PUT, headers: C.UI.JSON_HEADERS, body: stringifyJson({ useBackup: !settings?.useBackup }) })} className={C.UI.TOGGLE}>
        <span className={C.UI.LABEL}>{C.FORCE_LABEL[lang]}</span>
        <ToggleIndicator checked={settings?.useBackup === true} />
      </Button>
      <p className={C.UI.DESCRIPTION}>{C.FORCE_DESCRIPTION[lang]}</p>
      <p role={C.UI.STATUS_ROLE} className={C.UI.STATUS}>
        {settings ? (settings.active ? C.ACTIVE[lang] : settings.ready ? C.READY[lang] : C.MISSING[lang]) : C.UI.LOADING}
      </p>
      {settings?.error && (
        <p role={C.UI.ALERT_ROLE} className={C.UI.ERROR}>
          {settings.error}
        </p>
      )}
      <div className={C.UI.ACTIONS}>
        <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} disabled={busy || !settings || (settings.active && !settings.useBackup) || settings.switching} onClick={() => void request(C.PREPARE_API, { method: C.UI.POST })}>
          {C.PREPARE[lang]}
        </Button>
        <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} disabled={busy} onClick={() => void request()}>
          {C.CHECK[lang]}
        </Button>
      </div>
    </StudioCard>
  );
};
