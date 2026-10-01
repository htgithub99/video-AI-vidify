import { useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Copy,
  Film,
  Layers,
  Music2,
  Shuffle,
  Sparkles,
  Square,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import {
  WORKFLOW_ACTIVITY_CONFIG,
  WORKFLOW_ACTIVITY_EVENT,
  WORKFLOW_ACTIVITY_TEXT,
} from "../constants/workflowActivity";
import {
  clearWorkflowActivities,
  getWorkflowActivities,
  subscribeWorkflowActivity,
  WorkflowActivity,
  WorkflowArea,
  WorkflowEvent,
} from "../services/workflowActivity";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";

interface WorkflowActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: (typeof WORKFLOW_ACTIVITY_CONFIG.LANGUAGES)[keyof typeof WORKFLOW_ACTIVITY_CONFIG.LANGUAGES];
}

type StatusFilterType =
  (typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS)[keyof typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS];
type StatusType =
  (typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS)[keyof typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS];

const getEventStatusType = (event: WorkflowEvent): StatusType => {
  if (
    event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done) ||
    event === WORKFLOW_ACTIVITY_EVENT.musicSave ||
    event === WORKFLOW_ACTIVITY_EVENT.flowFolder ||
    event === WORKFLOW_ACTIVITY_EVENT.flowReference
  ) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success;
  }

  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail)) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail;
  }

  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.stop)) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.stop;
  }

  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start)) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.running;
  }

  return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.info;
};

const getEventStatusMeta = (
  event: WorkflowEvent,
  t: (typeof WORKFLOW_ACTIVITY_TEXT)[keyof typeof WORKFLOW_ACTIVITY_TEXT],
) => {
  const statusType = getEventStatusType(event);

  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail) {
    return {
      statusType,
      label: t.statuses.error,
      cardClass:
        "border-l-4 border-l-rose-500 border-rose-500/50 bg-gradient-to-r from-rose-950/60 via-slate-900/90 to-slate-900/90 hover:border-rose-500/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/20",
      avatarClass: "bg-rose-500/25 text-rose-300 border border-rose-400/50",
      statusBadgeClass: "bg-rose-500/25 text-rose-200 border border-rose-400/50 font-bold",
      titleClass: "text-rose-200 font-bold text-xs sm:text-[13px]",
      icon: <XCircle className={cn("w-3.5 h-3.5 text-rose-400 shrink-0")} />,
    };
  }

  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success) {
    return {
      statusType,
      label: t.statuses.success,
      cardClass:
        "border-l-4 border-l-emerald-400 border-emerald-500/40 bg-gradient-to-r from-emerald-950/50 via-slate-900/90 to-slate-900/90 hover:border-emerald-500/70 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/20",
      avatarClass: "bg-emerald-500/25 text-emerald-300 border border-emerald-400/50",
      statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold",
      titleClass: "text-emerald-200 font-bold text-xs sm:text-[13px]",
      icon: <CheckCircle2 className={cn("w-3.5 h-3.5 text-emerald-300 shrink-0")} />,
    };
  }

  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.running) {
    return {
      statusType,
      label: t.statuses.running,
      cardClass:
        "border-l-4 border-l-sky-400 border-sky-500/40 bg-gradient-to-r from-sky-950/50 via-slate-900/90 to-slate-900/90 hover:border-sky-500/70 shadow-sm shadow-sky-950/30 ring-1 ring-sky-500/20",
      avatarClass: "bg-sky-500/25 text-sky-300 border border-sky-400/50",
      statusBadgeClass: "bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold",
      titleClass: "text-sky-200 font-bold text-xs sm:text-[13px]",
      icon: <Sparkles className={cn("w-3.5 h-3.5 text-sky-300 shrink-0 animate-spin")} />,
    };
  }

  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.stop) {
    return {
      statusType,
      label: t.statuses.stopped,
      cardClass:
        "border-l-4 border-l-amber-400 border-amber-500/40 bg-gradient-to-r from-amber-950/50 via-slate-900/90 to-slate-900/90 hover:border-amber-500/70 shadow-sm shadow-amber-950/30 ring-1 ring-amber-500/20",
      avatarClass: "bg-amber-500/25 text-amber-300 border border-amber-400/50",
      statusBadgeClass: "bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold",
      titleClass: "text-amber-200 font-bold text-xs sm:text-[13px]",
      icon: <Square className={cn("w-3 h-3 text-amber-300 shrink-0")} />,
    };
  }

  return {
    statusType,
    label: t.statuses.info,
    cardClass:
      "border-l-4 border-l-purple-400 border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-slate-900/90 hover:border-purple-500/60 ring-1 ring-purple-500/20",
    avatarClass: "bg-purple-500/25 text-purple-300 border border-purple-400/50",
    statusBadgeClass: "bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold",
    titleClass: "text-purple-200 font-bold text-xs sm:text-[13px]",
    icon: <Copy className={cn("w-3 h-3 text-purple-300 shrink-0")} />,
  };
};

export default function WorkflowActivityDialog({ isOpen, onClose, language }: WorkflowActivityDialogProps) {
  const entries = useSyncExternalStore(subscribeWorkflowActivity, getWorkflowActivities);
  const [filter, setFilter] = useState<WorkflowArea | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.all>(
    WORKFLOW_ACTIVITY_CONFIG.AREAS.all,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all);
  const [copiedId, setCopiedId] = useState<number | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.all | null>(null);
  const [hasCopiedAll, setHasCopiedAll] = useState(false);

  const t = WORKFLOW_ACTIVITY_TEXT[language];

  const areaFiltered =
    filter === WORKFLOW_ACTIVITY_CONFIG.AREAS.all ? entries : entries.filter((entry) => entry.area === filter);

  const shown = areaFiltered.filter((entry) => {
    if (statusFilter === WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all) return true;
    const st = getEventStatusType(entry.event);
    if (statusFilter === WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.success) {
      return st === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success;
    }
    if (statusFilter === WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.error) {
      return st === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail;
    }
    return true;
  });

  const musicCount = entries.filter((e) => e.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.music).length;
  const mixerCount = entries.filter((e) => e.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer).length;
  const flowCount = entries.filter((e) => e.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.flow).length;

  const totalSuccessCount = entries.filter(
    (e) => getEventStatusType(e.event) === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success,
  ).length;
  const totalErrorCount = entries.filter(
    (e) => getEventStatusType(e.event) === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail,
  ).length;

  const format = (entry: WorkflowActivity) => {
    const date = new Date(entry.at).toLocaleString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language]);
    const count = entry.count === undefined ? "" : ` (${entry.count})`;
    const detail = entry.detail ? ` [${entry.detail}]` : "";
    return [date, t[entry.area], `${t.events[entry.event]}${count}${detail}`].join(
      WORKFLOW_ACTIVITY_CONFIG.COPY_SEPARATOR,
    );
  };

  const copy = async (value: string, id: number | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.all) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      if (id === WORKFLOW_ACTIVITY_CONFIG.AREAS.all) {
        setHasCopiedAll(true);
        setTimeout(() => setHasCopiedAll(false), WORKFLOW_ACTIVITY_CONFIG.COPY_FEEDBACK_MS);
      } else {
        setTimeout(() => setCopiedId(null), WORKFLOW_ACTIVITY_CONFIG.COPY_FEEDBACK_MS);
      }
      toast.success(t.copied);
    } catch {
      toast.error(t.copyFailed);
    }
  };

  const areaTabs = [
    {
      id: WORKFLOW_ACTIVITY_CONFIG.AREAS.all,
      label: t.all,
      count: entries.length,
      icon: Layers,
    },
    {
      id: WORKFLOW_ACTIVITY_CONFIG.AREAS.music,
      label: t.music,
      count: musicCount,
      icon: Music2,
    },
    {
      id: WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer,
      label: t.mixer,
      count: mixerCount,
      icon: Shuffle,
    },
    {
      id: WORKFLOW_ACTIVITY_CONFIG.AREAS.flow,
      label: t.flow,
      count: flowCount,
      icon: Film,
    },
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className={cn("flex items-center gap-2.5")}>
          <div
            className={cn(
              "w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-xs shrink-0",
            )}
          >
            <ClipboardList className={cn("w-4 h-4")} />
          </div>
          <span className={cn("font-extrabold tracking-wide text-sm")}>{t.title}</span>
          {entries.length > 0 && (
            <span
              className={cn(
                "ml-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-xs",
              )}
            >
              {entries.length}
            </span>
          )}
        </div>
      }
      maxWidth={WORKFLOW_ACTIVITY_CONFIG.MODAL_MAX_WIDTH}
    >
      <div className={cn("space-y-3.5")}>
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-md",
          )}
        >
          <div
            className={cn("flex items-center gap-1.5 flex-wrap")}
            role={WORKFLOW_ACTIVITY_CONFIG.A11Y.ROLE_GROUP}
            aria-label={t.title}
          >
            {areaTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = filter === tab.id;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                  aria-pressed={isActive}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer select-none",
                    {
                      "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-md shadow-purple-600/30 scale-[1.02]":
                        isActive,
                      "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent":
                        !isActive,
                    },
                  )}
                >
                  <TabIcon className={cn("w-3.5 h-3.5 shrink-0")} />
                  <span>{tab.label}</span>
                  <span
                    className={cn("text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold", {
                      "bg-white/20 text-white": isActive,
                      "bg-slate-800 text-slate-400 border border-slate-700/60": !isActive,
                    })}
                  >
                    {tab.count}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className={cn("flex items-center gap-2.5 shrink-0")}>
            <div className={cn("relative flex items-center")}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                aria-label={t.statusFilterAriaLabel}
                className={cn(
                  "appearance-none bg-slate-955 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 outline-none hover:border-purple-500/40 focus:border-purple-500 transition-all cursor-pointer shadow-xs",
                )}
              >
                <option value={WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all} className="bg-slate-900 text-slate-100">
                  {t.statusFilter.all} ({entries.length})
                </option>
                <option value={WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.success} className="bg-slate-900 text-emerald-300">
                  ✓ {t.statusFilter.success} ({totalSuccessCount})
                </option>
                <option value={WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.error} className="bg-slate-900 text-rose-300">
                  ✕ {t.statusFilter.error} ({totalErrorCount})
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            <div className={cn("flex items-center gap-2 pl-2 border-l border-slate-800/80")}>
              <Tooltip content={t.copyAll} align="end">
                <Button
                  type="button"
                  variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                  aria-label={t.copyAll}
                  disabled={!shown.length}
                  onClick={() =>
                    void copy(
                      shown
                        .slice()
                        .reverse()
                        .map(format)
                        .join(WORKFLOW_ACTIVITY_CONFIG.COPY_NEWLINE),
                      WORKFLOW_ACTIVITY_CONFIG.AREAS.all,
                    )
                  }
                  className={cn(
                    "w-6 h-6 bg-transparent hover:bg-transparent border-0 text-slate-400 hover:text-purple-300 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed p-0 shadow-none outline-none",
                  )}
                >
                  {hasCopiedAll ? (
                    <Check className={cn("w-4 h-4 text-emerald-400")} />
                  ) : (
                    <Copy className={cn("w-4 h-4")} />
                  )}
                </Button>
              </Tooltip>

              <Tooltip content={t.clear} align="end">
                <Button
                  type="button"
                  variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                  aria-label={t.clear}
                  disabled={!entries.length}
                  onClick={clearWorkflowActivities}
                  className={cn(
                    "w-6 h-6 bg-transparent hover:bg-transparent border-0 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed p-0 shadow-none outline-none",
                  )}
                >
                  <Trash2 className={cn("w-4 h-4")} />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div
          className={cn("max-h-[min(65vh,540px)] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar")}
          role={WORKFLOW_ACTIVITY_CONFIG.A11Y.ROLE_LOG}
          aria-live={WORKFLOW_ACTIVITY_CONFIG.A11Y.ARIA_LIVE_POLITE}
        >
          {!shown.length ? (
            <div
              className={cn(
                "py-14 px-4 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40",
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/15 via-indigo-500/15 to-pink-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner",
                )}
              >
                <ClipboardList className={cn("w-6 h-6")} />
              </div>
              <div className={cn("space-y-1")}>
                <p className={cn("text-xs font-bold text-slate-100")}>{t.empty}</p>
                <p className={cn("text-[11px] text-slate-400 max-w-sm")}>{t.emptySub}</p>
              </div>
            </div>
          ) : (
            shown.map((entry) => {
              const statusMeta = getEventStatusMeta(entry.event, t);
              const isMusic = entry.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.music;
              const isMixer = entry.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer;
              const isFail = statusMeta.statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail;

              const ModuleIcon = isMusic ? Music2 : isMixer ? Shuffle : Film;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "group flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-150 backdrop-blur-md",
                    statusMeta.cardClass,
                  )}
                >
                  <div className={cn("flex items-start gap-3 min-w-0 flex-1")}>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5",
                        statusMeta.avatarClass,
                      )}
                    >
                      {statusMeta.icon}
                    </div>

                    <div className={cn("min-w-0 flex-1 space-y-1.5")}>
                      <div className={cn("flex flex-wrap items-center gap-2")}>
                        <span
                          className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border", {
                            "bg-purple-500/20 text-purple-300 border-purple-500/40": isMusic,
                            "bg-indigo-500/20 text-indigo-300 border-indigo-500/40": isMixer,
                            "bg-cyan-500/20 text-cyan-300 border-cyan-500/40": !isMusic && !isMixer,
                          })}
                        >
                          <ModuleIcon className={cn("w-3 h-3")} />
                          <span>{t[entry.area]}</span>
                        </span>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border",
                            statusMeta.statusBadgeClass,
                          )}
                        >
                          <span>{statusMeta.label}</span>
                        </span>

                        <span
                          className={cn("w-1 h-1 rounded-full bg-slate-600")}
                          aria-hidden="true"
                        />

                        <time
                          className={cn(
                            "text-[10.5px] font-mono text-slate-400 flex items-center gap-1.5",
                          )}
                          dateTime={new Date(entry.at).toISOString()}
                        >
                          <span className={cn("font-bold text-slate-200")}>
                            {new Date(entry.at).toLocaleTimeString(
                              WORKFLOW_ACTIVITY_CONFIG.LOCALES[language],
                              WORKFLOW_ACTIVITY_CONFIG.TIME_FORMAT_OPTIONS,
                            )}
                          </span>
                          <span className={cn("text-[9.5px] text-slate-500 hidden sm:inline")}>
                            {new Date(entry.at).toLocaleDateString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language])}
                          </span>
                        </time>
                      </div>

                      <div className={cn("space-y-1")}>
                        <div className={cn("flex items-center gap-2 flex-wrap")}>
                          <p className={cn("break-words leading-snug", statusMeta.titleClass)}>
                            {t.events[entry.event]}
                          </p>
                          {entry.count !== undefined && (
                            <span
                              className={cn("inline-flex items-center px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-md", {
                                "bg-rose-500/25 text-rose-300 border border-rose-500/50": isFail,
                                "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50": !isFail,
                              })}
                            >
                              {WORKFLOW_ACTIVITY_CONFIG.COUNT_PREFIX}
                              {entry.count}
                            </span>
                          )}
                        </div>

                        {entry.detail && (
                          <div
                            className={cn("p-2.5 rounded-xl text-[11px] font-mono flex items-start gap-2 leading-relaxed mt-1.5", {
                              "bg-rose-950/80 border border-rose-500/50 text-rose-200 shadow-inner": isFail,
                              "bg-slate-955/80 border border-slate-800 text-slate-300": !isFail,
                            })}
                          >
                            <AlertCircle
                              className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", {
                                "text-rose-400": isFail,
                                "text-slate-400": !isFail,
                              })}
                            />
                            <span className={cn("break-words")}>{entry.detail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Tooltip content={t.copy} align="end">
                    <Button
                      type="button"
                      variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                      aria-label={t.copy}
                      onClick={() => void copy(format(entry), entry.id)}
                      className={cn(
                        "w-6 h-6 bg-transparent hover:bg-transparent border-0 text-slate-500 hover:text-purple-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer p-0 shadow-none outline-none mt-0.5",
                      )}
                    >
                      {copiedId === entry.id ? (
                        <Check className={cn("w-3.5 h-3.5 text-emerald-400")} />
                      ) : (
                        <Copy className={cn("w-3.5 h-3.5")} />
                      )}
                    </Button>
                  </Tooltip>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
