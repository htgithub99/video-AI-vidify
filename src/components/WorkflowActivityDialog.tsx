import { useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Film,
  Layers,
  Music2,
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
        "bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900/50 dark:from-rose-950/90 dark:via-rose-900/45 dark:to-slate-900/60 border-rose-500/70 hover:border-rose-500/90 border-l-[5px] border-l-rose-500 shadow-md shadow-rose-950/50 ring-1 ring-rose-500/30",
      avatarClass: "bg-rose-500/35 text-rose-200 border border-rose-400/70 ring-1 ring-rose-500/50 shadow-inner",
      statusBadgeClass: "bg-rose-500/35 text-rose-100 border border-rose-400/70 font-black tracking-wide",
      titleClass: "text-rose-100 dark:text-rose-50 font-bold text-xs sm:text-[13px]",
      icon: <XCircle className={cn("w-3.5 h-3.5 text-rose-200 stroke-[2.5]")} />,
    };
  }

  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success) {
    return {
      statusType,
      label: t.statuses.success,
      cardClass:
        "bg-gradient-to-r from-emerald-950/70 via-emerald-900/35 to-slate-900/50 dark:from-emerald-950/80 dark:via-emerald-900/40 dark:to-slate-900/60 border-emerald-500/50 hover:border-emerald-500/80 border-l-[5px] border-l-emerald-500 shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-500/20",
      avatarClass: "bg-emerald-500/30 text-emerald-200 border border-emerald-400/60 ring-1 ring-emerald-500/40 shadow-inner",
      statusBadgeClass: "bg-emerald-500/30 text-emerald-100 border border-emerald-400/60 font-black tracking-wide",
      titleClass: "text-emerald-100 dark:text-emerald-50 font-bold text-xs sm:text-[13px]",
      icon: <CheckCircle2 className={cn("w-3.5 h-3.5 text-emerald-200 stroke-[2.5]")} />,
    };
  }

  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.running) {
    return {
      statusType,
      label: t.statuses.running,
      cardClass:
        "bg-gradient-to-r from-sky-950/70 via-sky-900/35 to-slate-900/50 dark:from-sky-950/80 dark:via-sky-900/40 dark:to-slate-900/60 border-sky-500/50 hover:border-sky-500/80 border-l-[5px] border-l-sky-500 shadow-sm shadow-sky-950/40 ring-1 ring-sky-500/20",
      avatarClass: "bg-sky-500/30 text-sky-200 border border-sky-400/60 ring-1 ring-sky-500/40 shadow-inner",
      statusBadgeClass: "bg-sky-500/30 text-sky-100 border border-sky-400/60 font-black tracking-wide",
      titleClass: "text-sky-100 dark:text-sky-50 font-bold text-xs sm:text-[13px]",
      icon: <Sparkles className={cn("w-3.5 h-3.5 text-sky-200 stroke-[2.5]")} />,
    };
  }

  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.stop) {
    return {
      statusType,
      label: t.statuses.stopped,
      cardClass:
        "bg-gradient-to-r from-amber-950/70 via-amber-900/35 to-slate-900/50 dark:from-amber-950/80 dark:via-amber-900/40 dark:to-slate-900/60 border-amber-500/50 hover:border-amber-500/80 border-l-[5px] border-l-amber-500 shadow-sm shadow-amber-950/40 ring-1 ring-amber-500/20",
      avatarClass: "bg-amber-500/30 text-amber-200 border border-amber-400/60 ring-1 ring-amber-500/40 shadow-inner",
      statusBadgeClass: "bg-amber-500/30 text-amber-100 border border-amber-400/60 font-black tracking-wide",
      titleClass: "text-amber-100 dark:text-amber-50 font-bold text-xs sm:text-[13px]",
      icon: <Square className={cn("w-3 h-3 text-amber-200 stroke-[2.5]")} />,
    };
  }

  return {
    statusType,
    label: t.statuses.info,
    cardClass:
      "bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-slate-900/50 dark:from-purple-950/70 dark:via-purple-900/35 dark:to-slate-900/60 border-purple-500/40 hover:border-purple-500/70 border-l-[5px] border-l-purple-500 shadow-sm shadow-purple-950/30",
    avatarClass: "bg-purple-500/25 text-purple-200 border border-purple-400/50 ring-1 ring-purple-500/30 shadow-inner",
    statusBadgeClass: "bg-purple-500/25 text-purple-100 border border-purple-400/50 font-black tracking-wide",
    titleClass: "text-purple-100 dark:text-purple-50 font-bold text-xs sm:text-[13px]",
    icon: <Copy className={cn("w-3 h-3 text-purple-200")} />,
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
        <div className={cn("flex items-center gap-2")}>
          <div
            className={cn(
              "w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-xs shrink-0",
            )}
          >
            <ClipboardList className={cn("w-3.5 h-3.5")} />
          </div>
          <span className={cn("font-extrabold tracking-wide text-xs sm:text-sm")}>{t.title}</span>
          {entries.length > 0 && (
            <span
              className={cn(
                "ml-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/80 shadow-xs",
              )}
            >
              {entries.length}
            </span>
          )}
        </div>
      }
      maxWidth={WORKFLOW_ACTIVITY_CONFIG.MODAL_MAX_WIDTH}
    >
      <div className={cn("space-y-3")}>
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-100/80 dark:bg-[#181324]/90 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-sm",
          )}
        >
          <div
            className={cn("flex items-center gap-1 flex-wrap")}
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
                    "px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all duration-150 cursor-pointer shadow-xs",
                    {
                      "bg-rose-600 text-white shadow-rose-600/20": isActive,
                      "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800/70":
                        !isActive,
                    },
                  )}
                >
                  <TabIcon className={cn("w-3 h-3 shrink-0")} />
                  <span>{tab.label}</span>
                  <span
                    className={cn("text-[9px] font-mono px-1 py-0.2 rounded-md", {
                      "bg-white/20 text-white": isActive,
                      "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400": !isActive,
                    })}
                  >
                    {tab.count}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className={cn("flex items-center gap-1.5 shrink-0")}>
            <div className={cn("flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/80")}>
              <Button
                type="button"
                variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                onClick={() => setStatusFilter(WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                  {
                    "bg-slate-700 text-white shadow-xs": statusFilter === WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all,
                    "text-slate-400 hover:text-slate-200": statusFilter !== WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all,
                  },
                )}
              >
                {t.statusFilter.all}
              </Button>
              <Button
                type="button"
                variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                onClick={() => setStatusFilter(WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.success)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer",
                  {
                    "bg-emerald-600 text-white shadow-xs": statusFilter === WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.success,
                    "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20": statusFilter !== WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.success,
                  },
                )}
              >
                <CheckCircle2 className={cn("w-3 h-3")} />
                <span>{t.statusFilter.success}</span>
                <span className={cn("font-mono text-[9px] opacity-90")}>({totalSuccessCount})</span>
              </Button>
              <Button
                type="button"
                variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                onClick={() => setStatusFilter(WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.error)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer",
                  {
                    "bg-rose-600 text-white shadow-xs": statusFilter === WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.error,
                    "text-rose-400 hover:text-rose-300 hover:bg-rose-500/20": statusFilter !== WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.error,
                  },
                )}
              >
                <XCircle className={cn("w-3 h-3")} />
                <span>{t.statusFilter.error}</span>
                <span className={cn("font-mono text-[9px] opacity-90")}>({totalErrorCount})</span>
              </Button>
            </div>

            <div className={cn("flex items-center gap-1 pl-1 border-l border-slate-700/60")}>
              <Button
                type="button"
                variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                title={t.copyAll}
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
                  "w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                )}
              >
                {hasCopiedAll ? (
                  <Check className={cn("w-3.5 h-3.5 text-emerald-500")} />
                ) : (
                  <Copy className={cn("w-3.5 h-3.5")} />
                )}
              </Button>
              <Button
                type="button"
                variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                title={t.clear}
                aria-label={t.clear}
                disabled={!entries.length}
                onClick={clearWorkflowActivities}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-amber-500/80 hover:text-amber-400 dark:text-amber-500/80 dark:hover:text-amber-400 transition-colors active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                )}
              >
                <Trash2 className={cn("w-3.5 h-3.5")} />
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn("max-h-[min(65vh,520px)] overflow-y-auto space-y-2 pr-0.5 custom-scrollbar")}
          role={WORKFLOW_ACTIVITY_CONFIG.A11Y.ROLE_LOG}
          aria-live={WORKFLOW_ACTIVITY_CONFIG.A11Y.ARIA_LIVE_POLITE}
        >
          {!shown.length ? (
            <div
              className={cn(
                "py-12 px-4 flex flex-col items-center justify-center text-center space-y-2.5 rounded-2xl border border-dashed border-slate-300/80 dark:border-purple-500/20 bg-slate-50/50 dark:bg-[#15101d]/40",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-purple-500/10 border border-slate-300/60 dark:border-purple-500/20 flex items-center justify-center text-slate-400 dark:text-purple-300 shadow-inner",
                )}
              >
                <ClipboardList className={cn("w-5 h-5")} />
              </div>
              <div className={cn("space-y-0.5")}>
                <p className={cn("text-xs font-bold text-slate-800 dark:text-slate-200")}>{t.empty}</p>
                <p className={cn("text-[11px] text-slate-500 dark:text-slate-400 max-w-sm")}>{t.emptySub}</p>
              </div>
            </div>
          ) : (
            shown.map((entry) => {
              const statusMeta = getEventStatusMeta(entry.event, t);
              const isMusic = entry.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.music;
              const isFail = statusMeta.statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "group flex items-start justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all duration-150",
                    statusMeta.cardClass,
                  )}
                >
                  <div className={cn("flex items-start gap-2.5 min-w-0 flex-1")}>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-xs mt-0.5",
                        statusMeta.avatarClass,
                      )}
                    >
                      {statusMeta.icon}
                    </div>

                    <div className={cn("min-w-0 flex-1 space-y-1")}>
                      <div className={cn("flex flex-wrap items-center gap-1.5")}>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9.5px] font-bold border",
                            {
                              "bg-purple-500/20 text-purple-200 border-purple-400/40": isMusic,
                              "bg-cyan-500/20 text-cyan-200 border-cyan-400/40": !isMusic,
                            },
                          )}
                        >
                          {isMusic ? <Music2 className={cn("w-2.5 h-2.5")} /> : <Film className={cn("w-2.5 h-2.5")} />}
                          <span>{t[entry.area]}</span>
                        </span>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9.5px] border",
                            statusMeta.statusBadgeClass,
                          )}
                        >
                          <span>{statusMeta.label}</span>
                        </span>

                        <span
                          className={cn("w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600")}
                          aria-hidden="true"
                        />

                        <time
                          className={cn(
                            "text-[10px] font-mono text-slate-300 dark:text-slate-300 flex items-center gap-1",
                          )}
                          dateTime={new Date(entry.at).toISOString()}
                        >
                          <span className={cn("font-bold text-white")}>
                            {new Date(entry.at).toLocaleTimeString(
                              WORKFLOW_ACTIVITY_CONFIG.LOCALES[language],
                              WORKFLOW_ACTIVITY_CONFIG.TIME_FORMAT_OPTIONS,
                            )}
                          </span>
                          <span className={cn("text-[9.5px] text-slate-400 hidden sm:inline")}>
                            {new Date(entry.at).toLocaleDateString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language])}
                          </span>
                        </time>
                      </div>

                      <div className={cn("space-y-0.5")}>
                        <div className={cn("flex items-center gap-1.5 flex-wrap")}>
                          <p className={cn("break-words leading-snug", statusMeta.titleClass)}>
                            {t.events[entry.event]}
                          </p>
                          {entry.count !== undefined && (
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-md",
                                isFail
                                  ? "bg-rose-500/30 text-rose-200 border border-rose-500/50"
                                  : "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30",
                              )}
                            >
                              {WORKFLOW_ACTIVITY_CONFIG.COUNT_PREFIX}
                              {entry.count}
                            </span>
                          )}
                        </div>

                        {entry.detail && (
                          <div
                            className={cn(
                              "p-2 rounded-lg text-[11px] font-mono flex items-start gap-1.5 leading-relaxed mt-1",
                              isFail
                                ? "bg-rose-950/80 border border-rose-500/50 text-rose-200 shadow-inner ring-1 ring-rose-500/20"
                                : "bg-slate-900/60 border border-slate-800 text-slate-300",
                            )}
                          >
                            <AlertCircle className={cn("w-3 h-3 shrink-0 text-rose-400 mt-0.5")} />
                            <span className={cn("break-words font-sans")}>{entry.detail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED}
                    title={t.copy}
                    aria-label={t.copy}
                    onClick={() => void copy(format(entry), entry.id)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all shrink-0 cursor-pointer shadow-xs active:scale-90 mt-0.5",
                    )}
                  >
                    {copiedId === entry.id ? (
                      <Check className={cn("w-3 h-3 text-emerald-500")} />
                    ) : (
                      <Copy className={cn("w-3 h-3")} />
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
