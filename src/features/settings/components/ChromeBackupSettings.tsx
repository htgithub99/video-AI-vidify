import { useEffect, useState, type DragEvent } from "react";
import { Bot, CheckCircle2, GripVertical, Globe, LogIn, Plus, RefreshCw, Settings2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StudioCard, StudioInput, StudioSelect } from "../../../components/ui/Studio.js";
import { Button } from "../../../components/ui/Button.js";
import { ToggleIndicator } from "../../../components/common/ToggleIndicator.js";
import { LoadingIcon } from "../../../components/common/LoadingIcon.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { cn } from "../../../lib/utils.js";
import { CHROME_BACKUP as C } from "../../../constants/chromeBackup.js";
import { CHROME_MANAGER_UI as U } from "../../../constants/chromeManagerUi.js";
import { AI_AVAILABILITY as A } from "../../../constants/aiAvailability.js";
import { CINEMATIC_CHAT_MODEL_OPTIONS } from "../../../constants/cinematicConstants.js";
import type { AiPlanningFallbackProvider } from "../../../types.js";
type ChromeItem = { id: string; name: string; ready: boolean; port?: number };
type ChainRoute = { provider: string; model: string; enabled: boolean };
type Availability = { chromeId: string; chromeName: string; provider: string; kind: string; kindLabel: string; untilText: string; notice: string };
type Task = { keys: string[]; label: string };
type Settings = { mainReady?: boolean; enabled: boolean; pinned: string | null; waitPolicy: string; activeId: string; chromes: ChromeItem[]; fallbackChain?: ChainRoute[]; switching: boolean; error?: string; availability: Availability[] };
const STATUS_ROW: Record<string, string> = { [A.KIND.QUOTA]: U.STATUS_QUOTA, [A.KIND.BLOCKED]: U.STATUS_BLOCKED, [A.KIND.LOGIN]: U.STATUS_LOGIN, [A.KIND.PLAN]: U.STATUS_PLAN, [A.KIND.ERROR]: U.STATUS_ERROR };
const STATUS_KIND: Record<string, string> = { [A.KIND.QUOTA]: U.STATUS_KIND_QUOTA, [A.KIND.BLOCKED]: U.STATUS_KIND_BLOCKED, [A.KIND.LOGIN]: U.STATUS_KIND_LOGIN, [A.KIND.PLAN]: U.STATUS_KIND_PLAN, [A.KIND.ERROR]: U.STATUS_KIND_ERROR };
export const ChromeBackupSettings = ({ language }: { language: string }) => {
  const lang = language === C.EN ? C.EN : C.VI;
  const M = C.MANAGER;
  const T = U.TEXT;
  const [settings, setSettings] = useState<Settings>();
  const [pending, setPending] = useState<Task | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const call = async (url: string = C.API, method?: string, body?: object) => {
    const response = await fetch(url, method ? { method, headers: C.UI.JSON_HEADERS, body: body ? stringifyJson(body) : undefined } : undefined);
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || response.statusText);
    setSettings(value);
  };
  const run = async (task: Task, work: () => Promise<void>) => {
    setPending(task);
    try {
      await work();
    } catch (error) {
      toast.error(String((error as Error).message));
    } finally {
      setPending(null);
    }
  };
  const send = (task: Task, url: string, method: string, body?: object) => run(task, () => call(url, method, body));
  const save = (key: string, body: object) => send({ keys: [key], label: T.ACTIVITY.SAVE[lang] }, C.API, C.UI.PUT, body);
  const isPending = (key: string) => pending?.keys.includes(key) === true;
  useEffect(() => {
    void call().catch((error: Error) => toast.error(String(error.message)));
  }, []);
  useEffect(() => {
    if (dragIndex !== null) return;
    const timer = setInterval(() => void call().catch(() => undefined), C.REFRESH_MS);
    return () => clearInterval(timer);
  }, [dragIndex]);
  const busy = pending !== null;
  const locked = busy || !settings || settings.switching;
  const activity = pending?.label || (settings?.switching ? T.ACTIVITY.SWITCHING[lang] : undefined);
  const enabled = settings?.enabled === true;
  const active = settings?.activeId || A.MAIN;
  const chromes: ChromeItem[] = settings ? [{ id: A.MAIN, name: C.MAIN_NAME, ready: settings.mainReady !== false, port: C.RESERVED_PORTS[0] }, ...(settings.chromes || [])] : [];
  const checkAll = () =>
    run({ keys: [U.KEY.ALL], label: T.ACTIVITY.CHECK[lang](chromes[0]?.name || C.MAIN_NAME) }, async () => {
      for (const chrome of chromes) {
        setPending({ keys: [U.KEY.ALL, U.KEY.CHECK(chrome.id)], label: T.ACTIVITY.CHECK[lang](chrome.name) });
        await call(C.ITEM_CHECK_API(chrome.id), C.UI.POST);
      }
    });
  const chain = settings?.fallbackChain || [];
  const saveChain = (next: ChainRoute[], provider: string) => {
    if (settings) setSettings({ ...settings, fallbackChain: next });
    void send({ keys: [U.KEY.CHAIN(provider)], label: T.ACTIVITY.CHAIN[lang] }, C.API, C.UI.PUT, { fallbackChain: next });
  };
  const dropOn = (event: DragEvent, index: number) => {
    event.preventDefault();
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === index) return;
    const next = [...chain];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    saveChain(next, moved.provider);
  };
  const modelOptions = (route: ChainRoute) => {
    const options: { value: string; label: string }[] = [...(CINEMATIC_CHAT_MODEL_OPTIONS[route.provider as AiPlanningFallbackProvider] || [])];
    if (!options.some((option) => option.value === route.model)) options.unshift({ value: route.model, label: route.model || T.SITE_DEFAULT[lang] });
    return options;
  };
  return (
    <StudioCard className={U.CARD}>
      <div className={U.HEADER}>
        <div className={U.HEADER_INFO}>
          <div className={U.HEADER_ICON}>
            <Globe className={U.HEADER_ICON_SVG} />
          </div>
          <div className={U.TOGGLE_CONTENT}>
            <h3 className={U.TITLE}>{C.TITLE[lang]}</h3>
            <p className={U.SUBTITLE}>{C.SUBTITLE[lang]}</p>
          </div>
        </div>
        <div className={U.HEADER_RIGHT}>
          {activity ? (
            <div role={C.UI.STATUS_ROLE} aria-live={U.LIVE} className={U.ACTIVITY_CHIP} title={activity}>
              <LoadingIcon className={U.SPIN} />
              <span className={U.ACTIVITY_TEXT}>{activity}</span>
            </div>
          ) : (
            <div role={C.UI.STATUS_ROLE} className={U.ACTIVE_CHIP}>
              <span className={U.LIVE_DOT} />
              {settings ? M.ACTIVE_STATUS[lang](chromes.find((chrome) => chrome.id === active)?.name || active) : C.UI.LOADING}
            </div>
          )}
          <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} disabled={busy} isLoading={isPending(U.KEY.ALL)} onClick={() => void checkAll()}>
            <RefreshCw className={U.BUTTON_ICON} />
            {C.CHECK[lang]}
          </Button>
        </div>
      </div>
      <section className={U.SECTION}>
        <div className={U.SECTION_TITLE_ROW}>
          <Settings2 className={U.SECTION_ICON} />
          <span className={U.SECTION_TITLE}>{T.RULES[lang]}</span>
        </div>
        <div className={U.RULE_GRID}>
          <Button variant={C.UI.UNSTYLED} role={C.UI.SWITCH} aria-checked={enabled} aria-label={C.LABEL[lang]} disabled={locked} onClick={() => void save(U.KEY.ENABLED, { enabled: !enabled })} className={cn(U.TOGGLE, enabled && U.TOGGLE_ACTIVE)}>
            <span className={U.TOGGLE_CONTENT}>
              <span className={U.LABEL_ROW}>
                <span className={U.LABEL}>{C.LABEL[lang]}</span>
                {isPending(U.KEY.ENABLED) && <LoadingIcon className={U.SPIN} />}
              </span>
              <span className={U.DESCRIPTION}>{C.DESCRIPTION[lang]}</span>
            </span>
            <ToggleIndicator checked={enabled} />
          </Button>
          <label className={U.FIELD}>
            <span className={U.LABEL_ROW}>
              <span className={U.LABEL}>{M.POLICY_LABEL[lang]}</span>
              {isPending(U.KEY.POLICY) && <LoadingIcon className={U.SPIN} />}
            </span>
            <StudioSelect className={U.SELECT} disabled={locked} value={settings?.waitPolicy || A.WAIT_POLICY.WAIT} onChange={(event) => void save(U.KEY.POLICY, { waitPolicy: event.target.value })}>
              <option value={A.WAIT_POLICY.WAIT}>{M.POLICY_WAIT[lang]}</option>
              <option value={A.WAIT_POLICY.STOP}>{M.POLICY_STOP[lang]}</option>
            </StudioSelect>
          </label>
          <label className={U.FIELD}>
            <span className={U.LABEL_ROW}>
              <span className={U.LABEL}>{M.PINNED_LABEL[lang]}</span>
              {isPending(U.KEY.PINNED) && <LoadingIcon className={U.SPIN} />}
            </span>
            <StudioSelect className={U.SELECT} disabled={locked} value={settings?.pinned || A.MAIN} onChange={(event) => void save(U.KEY.PINNED, { pinned: event.target.value })}>
              {chromes.map((chrome) => (
                <option key={chrome.id} value={chrome.id}>
                  {chrome.name}
                </option>
              ))}
            </StudioSelect>
          </label>
        </div>
      </section>
      <section className={U.SECTION}>
        <div className={U.SECTION_HEAD}>
          <div className={U.SECTION_TITLE_ROW}>
            <Globe className={U.SECTION_ICON} />
            <span className={U.SECTION_TITLE}>{T.CHROMES[lang]}</span>
          </div>
          <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} disabled={locked} isLoading={isPending(U.KEY.ADD)} onClick={() => void send({ keys: [U.KEY.ADD], label: T.ACTIVITY.ADD[lang] }, C.CHROMES_API, C.UI.POST, {})}>
            <Plus className={U.BUTTON_ICON} />
            {M.ADD[lang]}
          </Button>
        </div>
        <p className={U.HINT}>{T.CHROMES_HINT[lang]}</p>
        <div className={U.CHROME_GRID}>
          {chromes.map((chrome) => {
            const isMain = chrome.id === A.MAIN;
            const isActive = chrome.id === active;
            const tone = isActive ? U.TILE_ICON_ACTIVE : chrome.ready ? U.TILE_ICON_READY : U.TILE_ICON_MISSING;
            const busyTile = [U.KEY.LOGIN(chrome.id), U.KEY.CHECK(chrome.id), U.KEY.REMOVE(chrome.id), U.KEY.RENAME(chrome.id)].some(isPending);
            return (
              <div key={chrome.id} className={cn(U.TILE, isActive && U.TILE_ACTIVE)}>
                <div className={U.TILE_HEAD}>
                  <div className={cn(U.TILE_ICON, tone)}>
                    {busyTile ? <LoadingIcon className={cn(U.TILE_ICON_SVG, U.SPIN)} /> : <Globe className={U.TILE_ICON_SVG} />}
                  </div>
                  <div className={U.TILE_BODY}>
                    {isMain ? <span className={U.NAME_TEXT}>{chrome.name}</span> : <StudioInput deferred className={U.NAME_INPUT} value={chrome.name} placeholder={M.NAME_PLACEHOLDER[lang]} disabled={locked} onChange={(event) => event.target.value.trim() && void send({ keys: [U.KEY.RENAME(chrome.id)], label: T.ACTIVITY.RENAME[lang] }, C.ITEM_API(chrome.id), C.UI.PUT, { name: event.target.value })} />}
                    <div className={U.META}>
                      {isMain && <div className={cn(U.BADGE, U.BADGE_MAIN)}>{T.MAIN_BADGE[lang]}</div>}
                      {isActive && <div className={cn(U.BADGE, U.BADGE_ACTIVE)}>{M.ACTIVE_LABEL[lang]}</div>}
                      <div className={cn(U.BADGE, chrome.ready ? U.BADGE_READY : U.BADGE_MISSING)}>{chrome.ready ? M.READY_LABEL[lang] : M.MISSING_LABEL[lang]}</div>
                      {chrome.port ? <span className={U.PORT}>{T.PORT(chrome.port)}</span> : null}
                    </div>
                  </div>
                </div>
                <div className={isMain ? U.TILE_ACTIONS_MAIN : U.TILE_ACTIONS}>
                  <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} className={U.TILE_BUTTON} disabled={locked} isLoading={isPending(U.KEY.LOGIN(chrome.id))} onClick={() => void send({ keys: [U.KEY.LOGIN(chrome.id)], label: T.ACTIVITY.LOGIN[lang](chrome.name) }, C.ITEM_PREPARE_API(chrome.id), C.UI.POST)}>
                    <LogIn className={U.BUTTON_ICON} />
                    {M.LOGIN[lang]}
                  </Button>
                  <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} className={U.TILE_BUTTON} disabled={busy} isLoading={isPending(U.KEY.CHECK(chrome.id))} onClick={() => void send({ keys: [U.KEY.CHECK(chrome.id)], label: T.ACTIVITY.CHECK[lang](chrome.name) }, C.ITEM_CHECK_API(chrome.id), C.UI.POST)}>
                    <RefreshCw className={U.BUTTON_ICON} />
                    {C.CHECK[lang]}
                  </Button>
                  {!isMain && (
                    <Button variant={C.UI.DANGER} size={C.UI.SMALL} className={U.TILE_BUTTON} disabled={locked || isActive} isLoading={isPending(U.KEY.REMOVE(chrome.id))} title={M.REMOVE[lang]} aria-label={M.REMOVE[lang]} onClick={() => window.confirm(M.CONFIRM_REMOVE[lang]) && void send({ keys: [U.KEY.REMOVE(chrome.id)], label: T.ACTIVITY.REMOVE[lang](chrome.name) }, C.ITEM_API(chrome.id), C.DELETE)}>
                      <Trash2 className={U.BUTTON_ICON} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className={U.SECTION}>
        <div className={U.SECTION_TITLE_ROW}>
          <Bot className={U.SECTION_ICON} />
          <span className={U.SECTION_TITLE}>{T.CHAIN[lang]}</span>
        </div>
        <p className={U.HINT}>{T.CHAIN_HINT[lang]}</p>
        <div className={U.CHAIN}>
          {chain.map((route, index) => (
            <div
              key={route.provider}
              draggable={!locked}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = U.DRAG_EFFECT;
                event.dataTransfer.setData(U.DRAG_TYPE, route.provider);
                setDragIndex(index);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (overIndex !== index) setOverIndex(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDrop={(event) => dropOn(event, index)}
              className={cn(U.CHAIN_ROW, dragIndex === index && U.CHAIN_DRAGGING, overIndex === index && dragIndex !== index && U.CHAIN_OVER, !route.enabled && U.CHAIN_OFF)}
            >
              <span className={U.HANDLE} title={T.DRAG[lang]}>
                {isPending(U.KEY.CHAIN(route.provider)) ? <LoadingIcon className={cn(U.HANDLE_ICON, U.SPIN)} /> : <GripVertical className={U.HANDLE_ICON} />}
              </span>
              <div className={U.ORDER}>{index + 1}</div>
              <span className={U.PROVIDER}>{C.PROVIDER_LABEL[route.provider] || route.provider}</span>
              <StudioSelect className={U.MODEL} disabled={locked || !route.enabled} value={route.model} onChange={(event) => saveChain(chain.map((item) => (item.provider === route.provider ? { ...item, model: event.target.value } : item)), route.provider)}>
                {modelOptions(route).map((option) => (
                  <option key={option.value || U.SITE_DEFAULT} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </StudioSelect>
              <Button variant={C.UI.UNSTYLED} role={C.UI.SWITCH} aria-checked={route.enabled} aria-label={route.enabled ? T.ON[lang] : T.OFF[lang]} disabled={locked} onClick={() => saveChain(chain.map((item) => (item.provider === route.provider ? { ...item, enabled: !item.enabled } : item)), route.provider)}>
                <ToggleIndicator checked={route.enabled} />
              </Button>
            </div>
          ))}
        </div>
      </section>
      <section className={U.SECTION}>
        <div className={U.SECTION_TITLE_ROW}>
          <ShieldAlert className={U.SECTION_ICON} />
          <span className={U.SECTION_TITLE}>{M.STATUS_TITLE[lang]}</span>
        </div>
        {!settings?.availability?.length ? (
          <p className={U.EMPTY}>
            <CheckCircle2 className={U.EMPTY_ICON} />
            {M.STATUS_EMPTY[lang]}
          </p>
        ) : (
          <div className={U.STATUS_LIST}>
            {settings.availability.map((entry) => (
              <div key={entry.chromeId + entry.provider} className={cn(U.STATUS_ROW, STATUS_ROW[entry.kind])}>
                <div className={U.STATUS_MAIN}>
                  <span className={U.STATUS_TITLE}>
                    {C.PROVIDER_LABEL[entry.provider] || entry.provider}
                    {U.STATUS_SEP}
                    {entry.chromeName}
                  </span>
                  <span className={cn(U.STATUS_KIND, STATUS_KIND[entry.kind])}>{M.UNTIL_TEXT[lang](entry.kindLabel, entry.untilText)}</span>
                  <span className={U.STATUS_NOTICE} title={entry.notice}>
                    {entry.notice}
                  </span>
                </div>
                <Button variant={C.UI.SECONDARY} size={C.UI.SMALL} disabled={busy} isLoading={isPending(U.KEY.REOPEN(entry.chromeId, entry.provider))} onClick={() => void send({ keys: [U.KEY.REOPEN(entry.chromeId, entry.provider)], label: T.ACTIVITY.REOPEN[lang](C.PROVIDER_LABEL[entry.provider] || entry.provider) }, C.AVAILABILITY_CLEAR_API(entry.chromeId, entry.provider), C.DELETE)}>
                  {M.REOPEN[lang]}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
      {settings?.error && (
        <p role={C.UI.ALERT_ROLE} className={U.ERROR}>
          {settings.error}
        </p>
      )}
    </StudioCard>
  );
};
