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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT, WORKFLOW_ACTIVITY_TEXT } from "../constants/workflowActivity";
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
  language: typeof WORKFLOW_ACTIVITY_CONFIG.LANGUAGES[keyof typeof WORKFLOW_ACTIVITY_CONFIG.LANGUAGES];
}

const getEventStatusMeta = (event: WorkflowEvent) => {
  if (
    event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done) ||
    event === WORKFLOW_ACTIVITY_EVENT.musicSave ||
    event === WORKFLOW_ACTIVITY_EVENT.flowFolder ||
    event === WORKFLOW_ACTIVITY_EVENT.flowReference
  ) {
    return {
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      icon: <CheckCircle2 className={cn("w-4 h-4 text-emerald-400")} />,
    };
  }

  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail)) {
    return {
      badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/25",
      icon: <AlertCircle className={cn("w-4 h-4 text-rose-400")} />,
    };
  }

  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.stop)) {
    return {
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      icon: <Square className={cn("w-3.5 h-3.5 text-amber-400")} />,
    };
  }

  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start)) {
    return {
      badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/25",
      icon: <Sparkles className={cn("w-4 h-4 text-sky-400")} />,
    };
  }

  return {
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/25",
    icon: <Copy className={cn("w-3.5 h-3.5 text-purple-400")} />,
  };
};

export default function WorkflowActivityDialog({ isOpen, onClose, language }: WorkflowActivityDialogProps) {
  const entries = useSyncExternalStore(subscribeWorkflowActivity, getWorkflowActivities);
  const [filter, setFilter] = useState<WorkflowArea | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.all>(
    WORKFLOW_ACTIVITY_CONFIG.AREAS.all,
  );
  const [copiedId, setCopiedId] = useState<number | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.all | null>(null);
  const [hasCopiedAll, setHasCopiedAll] = useState(false);

  const t = WORKFLOW_ACTIVITY_TEXT[language];
  const shown = filter === WORKFLOW_ACTIVITY_CONFIG.AREAS.all ? entries : entries.filter((entry) => entry.area === filter);

  const musicCount = entries.filter((e) => e.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.music).length;
  const flowCount = entries.filter((e) => e.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.flow).length;

  const format = (entry: WorkflowActivity) => {
    const date = new Date(entry.at).toLocaleString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language]);
    const count = entry.count === undefined ? "" : ` (${entry.count})`;
    return [date, t[entry.area], `${t.events[entry.event]}${count}`].join(WORKFLOW_ACTIVITY_CONFIG.COPY_SEPARATOR);
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

  const tabs = [
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
        <div className={cn("flex items-center gap-2.5")}>
          <div className={cn("w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-xs shrink-0")}>
            <ClipboardList className={cn("w-4 h-4")} />
          </div>
          <span className={cn("font-extrabold tracking-wide")}>{t.title}</span>
          {entries.length > 0 && (
            <span className={cn("ml-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/80 shadow-xs")}>
              {entries.length}
            </span>
          )}
        </div>
      }
      maxWidth={WORKFLOW_ACTIVITY_CONFIG.MODAL_MAX_WIDTH}
    >
      <div className={cn("space-y-4")}>
        <div className={cn("flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-[#181324]/80 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-sm")}>
          <div className={cn("flex items-center gap-1 flex-wrap")} role="group" aria-label={t.title}>
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = filter === tab.id;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant="unstyled"
                  aria-pressed={isActive}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-xs",
                    {
                      "bg-rose-600 text-white shadow-rose-600/20": isActive,
                      "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800/70": !isActive,
                    },
                  )}
                >
                  <TabIcon className={cn("w-3.5 h-3.5 shrink-0")} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.2 rounded-md",
                      {
                        "bg-white/20 text-white": isActive,
                        "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400": !isActive,
                      },
                    )}
                  >
                    {tab.count}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className={cn("flex items-center gap-1 shrink-0")}>
            <Button
              type="button"
              variant="unstyled"
              title={t.copyAll}
              aria-label={t.copyAll}
              disabled={!shown.length}
              onClick={() =>
                void copy(
                  shown.slice().reverse().map(format).join(WORKFLOW_ACTIVITY_CONFIG.COPY_NEWLINE),
                  WORKFLOW_ACTIVITY_CONFIG.AREAS.all,
                )
              }
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed")}
            >
              {hasCopiedAll ? <Check className={cn("w-4 h-4 text-emerald-500")} /> : <Copy className={cn("w-4 h-4")} />}
            </Button>
            <Button
              type="button"
              variant="unstyled"
              title={t.clear}
              aria-label={t.clear}
              disabled={!entries.length}
              onClick={clearWorkflowActivities}
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-amber-500/80 hover:text-amber-400 dark:text-amber-500/80 dark:hover:text-amber-400 transition-colors active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed")}
            >
              <Trash2 className={cn("w-4 h-4")} />
            </Button>
          </div>
        </div>

        <div
          className={cn("max-h-[min(65vh,520px)] overflow-y-auto space-y-2 pr-0.5 custom-scrollbar")}
          role="log"
          aria-live="polite"
        >
          {!shown.length ? (
            <div className={cn("py-14 px-4 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed border-slate-300/80 dark:border-purple-500/20 bg-slate-50/50 dark:bg-[#15101d]/40")}>
              <div className={cn("w-12 h-12 rounded-2xl bg-slate-200/70 dark:bg-purple-500/10 border border-slate-300/60 dark:border-purple-500/20 flex items-center justify-center text-slate-400 dark:text-purple-300 shadow-inner")}>
                <ClipboardList className={cn("w-6 h-6")} />
              </div>
              <div className={cn("space-y-1")}>
                <p className={cn("text-sm font-bold text-slate-800 dark:text-slate-200")}>{t.empty}</p>
                <p className={cn("text-xs text-slate-500 dark:text-slate-400 max-w-sm")}>{t.emptySub}</p>
              </div>
            </div>
          ) : (
            shown.map((entry) => {
              const statusMeta = getEventStatusMeta(entry.event);
              const isMusic = entry.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.music;
              return (
                <div
                  key={entry.id}
                  className={cn("group flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#181324]/90 hover:bg-slate-50 dark:hover:bg-[#201830] border border-slate-200/90 dark:border-purple-500/15 hover:border-slate-300 dark:hover:border-purple-500/35 shadow-xs hover:shadow-sm transition-all duration-150")}
                >
                  <div className={cn("flex items-start gap-3 min-w-0 flex-1")}>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs mt-0.5",
                        statusMeta.badgeClass,
                      )}
                    >
                      {statusMeta.icon}
                    </div>

                    <div className={cn("min-w-0 flex-1 space-y-1")}>
                      <div className={cn("flex flex-wrap items-center gap-2")}>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                            {
                              "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20": isMusic,
                              "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20": !isMusic,
                            },
                          )}
                        >
                          {isMusic ? <Music2 className={cn("w-3 h-3")} /> : <Film className={cn("w-3 h-3")} />}
                          <span>{t[entry.area]}</span>
                        </span>
                        <span className={cn("w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600")} aria-hidden="true" />
                        <time
                          className={cn("text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}
                          dateTime={new Date(entry.at).toISOString()}
                        >
                          <span>
                            {new Date(entry.at).toLocaleTimeString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          <span className={cn("text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline")}>
                            {new Date(entry.at).toLocaleDateString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language])}
                          </span>
                        </time>
                      </div>

                      <div className={cn("flex items-center gap-2 flex-wrap")}>
                        <p className={cn("text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 break-words leading-relaxed")}>
                          {t.events[entry.event]}
                        </p>
                        {entry.detail && <p className={cn("text-[11px] text-rose-400/90 break-words leading-relaxed")}>{entry.detail}</p>}
                        {entry.count !== undefined && (
                          <span className={cn("inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20")}>
                            {WORKFLOW_ACTIVITY_CONFIG.COUNT_PREFIX}{entry.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="unstyled"
                    title={t.copy}
                    aria-label={t.copy}
                    onClick={() => void copy(format(entry), entry.id)}
                    className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all shrink-0 cursor-pointer shadow-xs active:scale-90")}
                  >
                    {copiedId === entry.id ? (
                      <Check className={cn("w-3.5 h-3.5 text-emerald-500")} />
                    ) : (
                      <Copy className={cn("w-3.5 h-3.5")} />
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
