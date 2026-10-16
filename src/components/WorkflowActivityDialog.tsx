import { StudioSelect } from "./ui/Studio.js";
import {
  SOURCE_TEMPLATE_SYMBOL_170,
  SOURCE_TEMPLATE_SYMBOL_28,
  SOURCE_TEMPLATE_SYMBOL_29,
  SOURCE_TEXT_ACTIVITY_COUNT,
  SOURCE_TEXT_ACTIVITY_TAB,
  SOURCE_TEXT_BG_AMBER_500_20_TEXT_AMBER,
  SOURCE_TEXT_BG_AMBER_500_25_TEXT_AMBER,
  SOURCE_TEXT_BG_CYAN_500_20_TEXT_CYAN_300,
  SOURCE_TEXT_BG_EMERALD_500_15_TEXT_EMERALD_200_BORDER,
  SOURCE_TEXT_BG_EMERALD_500_20_TEXT_EMERALD,
  SOURCE_TEXT_BG_EMERALD_500_25_TEXT_EMERALD,
  SOURCE_TEXT_BG_EMERALD_500_25_TEXT_EMERALD_300,
  SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA,
  SOURCE_TEXT_BG_INDIGO_500_20_TEXT_INDIGO_300,
  SOURCE_TEXT_BG_PURPLE_500_20_TEXT_PURPLE,
  SOURCE_TEXT_BG_PURPLE_500_20_TEXT_PURPLE_300,
  SOURCE_TEXT_BG_PURPLE_500_25_TEXT_PURPLE,
  SOURCE_TEXT_BG_PURPLE_600_20_TEXT_PURPLE_200_BORDER,
  SOURCE_TEXT_BG_ROSE_500_15_TEXT_ROSE_200_BORDER,
  SOURCE_TEXT_BG_ROSE_500_25_TEXT_ROSE,
  SOURCE_TEXT_BG_ROSE_500_25_TEXT_ROSE_2,
  SOURCE_TEXT_BG_ROSE_500_25_TEXT_ROSE_300,
  SOURCE_TEXT_BG_ROSE_950_80_BORDER_BORDER_ROSE,
  SOURCE_TEXT_BG_SKY_500_20_TEXT_SKY,
  SOURCE_TEXT_BG_SKY_500_25_TEXT_SKY,
  SOURCE_TEXT_BG_SLATE_800_TEXT_SLATE_400_BORDER,
  SOURCE_TEXT_BG_SLATE_900_80_BORDER_SLATE_800_TEXT,
  SOURCE_TEXT_BG_SLATE_955_80_BORDER_BORDER_SLATE,
  SOURCE_TEXT_BG_WHITE_10,
  SOURCE_TEXT_BG_WHITE_20_TEXT_WHITE,
  SOURCE_TEXT_BORDER_L_4_BORDER_L_AMBER,
  SOURCE_TEXT_BORDER_L_4_BORDER_L_EMERALD,
  SOURCE_TEXT_BORDER_L_4_BORDER_L_PURPLE,
  SOURCE_TEXT_BORDER_L_4_BORDER_L_ROSE,
  SOURCE_TEXT_BORDER_L_4_BORDER_L_SKY,
  SOURCE_TEXT_BREAK_WORDS,
  SOURCE_TEXT_BREAK_WORDS_LEADING_SNUG,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_END,
  SOURCE_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_GAP_2,
  SOURCE_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_FLEX,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP,
  SOURCE_TEXT_FLEX_ITEMS_START_GAP_3_MIN_W,
  SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200,
  SOURCE_TEXT_FONT_EXTRABOLD_TRACKING_WIDE_TEXT_SM,
  SOURCE_TEXT_GROUP_FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP,
  SOURCE_TEXT_HIDDEN_SM_INLINE,
  SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_4,
  SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_PX_2,
  SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_PX_2_PY,
  SOURCE_TEXT_MAX_H_MIN_65VH_540PX_OVERFLOW_Y,
  SOURCE_TEXT_MIN_W_0_FLEX_1_SPACE_Y,
  SOURCE_TEXT_ML_1_TEXT_10PX_FONT_MONO_FONT,
  SOURCE_TEXT_P_1_ROUNDED_2XL_BG_SLATE_900_90,
  SOURCE_TEXT_P_2_5_ROUNDED_XL_TEXT_11PX,
  SOURCE_TEXT_PX_2_5_PY_1_5_ROUNDED_LG,
  SOURCE_TEXT_PX_2_5_PY_1_5_ROUNDED_LG_2,
  SOURCE_TEXT_PY_14_PX_4_FLEX_FLEX_COL,
  SOURCE_TEXT_SPACE_Y_1,
  SOURCE_TEXT_SPACE_Y_3_5,
  SOURCE_TEXT_SR_ONLY,
  SOURCE_TEXT_STATUS_BUTTON,
  SOURCE_TEXT_TEXT_10_5PX_FONT_MONO_TEXT_SLATE,
  SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400_MAX_W,
  SOURCE_TEXT_TEXT_9_5PX_TEXT_SLATE_500_HIDDEN,
  SOURCE_TEXT_TEXT_AMBER_200_FONT_BOLD_TEXT,
  SOURCE_TEXT_TEXT_EMERALD_200_FONT_BOLD_TEXT,
  SOURCE_TEXT_TEXT_EMERALD_400,
  SOURCE_TEXT_TEXT_PURPLE_200_FONT_BOLD_TEXT,
  SOURCE_TEXT_TEXT_ROSE_200_FONT_BOLD_TEXT,
  SOURCE_TEXT_TEXT_ROSE_400,
  SOURCE_TEXT_TEXT_SKY_200_FONT_BOLD_TEXT,
  SOURCE_TEXT_TEXT_SLATE_400,
  SOURCE_TEXT_TEXT_SLATE_400_HOVER_TEXT_SLATE_100,
  SOURCE_TEXT_TEXT_SLATE_500,
  SOURCE_TEXT_TEXT_WHITE,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_100,
  SOURCE_TEXT_TRUE,
  SOURCE_TEXT_W_1_H_1_ROUNDED_FULL_BG,
  SOURCE_TEXT_W_12_H_12_ROUNDED_2XL_BG_2,
  SOURCE_TEXT_W_3_5_H_3_5,
  SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3,
  SOURCE_TEXT_W_3_5_H_3_5_SHRINK_4,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_15,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_16,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_17,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_2,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_3,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_ROSE,
  SOURCE_TEXT_W_3_H_3,
  SOURCE_TEXT_W_3_H_3_TEXT_AMBER_300,
  SOURCE_TEXT_W_3_H_3_TEXT_PURPLE_300,
  SOURCE_TEXT_W_4_H_4,
  SOURCE_TEXT_W_6_H_6,
  SOURCE_TEXT_W_6_H_6_BG_TRANSPARENT_HOVER_3,
  SOURCE_TEXT_W_8_H_8_ROUNDED_XL_BG_2,
  SOURCE_TEXT_W_8_H_8_ROUNDED_XL_FLEX,
} from "../constants/sourceText.js";
import _ from "lodash";
import { useState, useSyncExternalStore } from "react";
import { AlertCircle, Check, CheckCircle2, ClipboardList, Copy, Globe, Video, Film, Layers, Music2, Shuffle, Sparkles, Square, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_TEXT } from "../constants/workflowActivity";
import { getEventStatusType, summarizeWorkflowActivities, clearWorkflowActivities, getWorkflowActivities, subscribeWorkflowActivity, WorkflowActivity, WorkflowArea, WorkflowEvent } from "../services/workflowActivity";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
interface WorkflowActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: (typeof WORKFLOW_ACTIVITY_CONFIG.LANGUAGES)[keyof typeof WORKFLOW_ACTIVITY_CONFIG.LANGUAGES];
}
type StatusFilterType = (typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS)[keyof typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS];
const getEventStatusMeta = (event: WorkflowEvent, t: (typeof WORKFLOW_ACTIVITY_TEXT)[keyof typeof WORKFLOW_ACTIVITY_TEXT]) => {
  const statusType = getEventStatusType(event);
  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail) {
    return {
      statusType,
      label: t.statuses.error,
      cardClass: SOURCE_TEXT_BORDER_L_4_BORDER_L_ROSE,
      avatarClass: SOURCE_TEXT_BG_ROSE_500_25_TEXT_ROSE,
      statusBadgeClass: SOURCE_TEXT_BG_ROSE_500_25_TEXT_ROSE_2,
      titleClass: SOURCE_TEXT_TEXT_ROSE_200_FONT_BOLD_TEXT,
      icon: <XCircle className={cn(SOURCE_TEXT_W_3_5_H_3_5_TEXT_3)} />,
    };
  }
  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success) {
    return {
      statusType,
      label: t.statuses.success,
      cardClass: SOURCE_TEXT_BORDER_L_4_BORDER_L_EMERALD,
      avatarClass: SOURCE_TEXT_BG_EMERALD_500_25_TEXT_EMERALD,
      statusBadgeClass: SOURCE_TEXT_BG_EMERALD_500_20_TEXT_EMERALD,
      titleClass: SOURCE_TEXT_TEXT_EMERALD_200_FONT_BOLD_TEXT,
      icon: <CheckCircle2 className={cn(SOURCE_TEXT_W_3_5_H_3_5_TEXT_16)} />,
    };
  }
  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.running) {
    return {
      statusType,
      label: t.statuses.running,
      cardClass: SOURCE_TEXT_BORDER_L_4_BORDER_L_SKY,
      avatarClass: SOURCE_TEXT_BG_SKY_500_25_TEXT_SKY,
      statusBadgeClass: SOURCE_TEXT_BG_SKY_500_20_TEXT_SKY,
      titleClass: SOURCE_TEXT_TEXT_SKY_200_FONT_BOLD_TEXT,
      icon: <Sparkles className={cn(SOURCE_TEXT_W_3_5_H_3_5_TEXT_17)} />,
    };
  }
  if (statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.stop) {
    return {
      statusType,
      label: t.statuses.stopped,
      cardClass: SOURCE_TEXT_BORDER_L_4_BORDER_L_AMBER,
      avatarClass: SOURCE_TEXT_BG_AMBER_500_25_TEXT_AMBER,
      statusBadgeClass: SOURCE_TEXT_BG_AMBER_500_20_TEXT_AMBER,
      titleClass: SOURCE_TEXT_TEXT_AMBER_200_FONT_BOLD_TEXT,
      icon: <Square className={cn(SOURCE_TEXT_W_3_H_3_TEXT_AMBER_300)} />,
    };
  }
  return {
    statusType,
    label: t.statuses.info,
    cardClass: SOURCE_TEXT_BORDER_L_4_BORDER_L_PURPLE,
    avatarClass: SOURCE_TEXT_BG_PURPLE_500_25_TEXT_PURPLE,
    statusBadgeClass: SOURCE_TEXT_BG_PURPLE_500_20_TEXT_PURPLE,
    titleClass: SOURCE_TEXT_TEXT_PURPLE_200_FONT_BOLD_TEXT,
    icon: <Copy className={cn(SOURCE_TEXT_W_3_H_3_TEXT_PURPLE_300)} />,
  };
};
const WORKFLOW_AREA_ICONS = { [WORKFLOW_ACTIVITY_CONFIG.AREAS.music]: Music2, [WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer]: Shuffle, [WORKFLOW_ACTIVITY_CONFIG.AREAS.flow]: Film, [WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy]: Globe, [WORKFLOW_ACTIVITY_CONFIG.AREAS.motion]: Video } as const;
export default function WorkflowActivityDialog({ isOpen, onClose, language }: WorkflowActivityDialogProps) {
  const entries = useSyncExternalStore(subscribeWorkflowActivity, getWorkflowActivities);
  const [filter, setFilter] = useState<WorkflowArea | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.all>(WORKFLOW_ACTIVITY_CONFIG.AREAS.all);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all);
  const [copiedId, setCopiedId] = useState<number | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.all | null>(null);
  const [hasCopiedAll, setHasCopiedAll] = useState(false);
  const t = WORKFLOW_ACTIVITY_TEXT[language];
  const areaFiltered = filter === WORKFLOW_ACTIVITY_CONFIG.AREAS.all ? entries : _.filter(entries, (entry) => entry.area === filter);
  const shown = _.filter(areaFiltered, (entry) => {
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
  const summary = summarizeWorkflowActivities(entries);
  const format = (entry: WorkflowActivity) => {
    const date = new Date(entry.at).toLocaleString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language]);
    const count = entry.count === undefined ? "" : SOURCE_TEMPLATE_SYMBOL_28(`${entry.count}`);
    const detail = entry.detail ? SOURCE_TEMPLATE_SYMBOL_29(`${entry.detail}`) : "";
    return [date, t[entry.area], SOURCE_TEMPLATE_SYMBOL_170(`${t.events[entry.event]}`, `${count}`, `${detail}`)].join(WORKFLOW_ACTIVITY_CONFIG.COPY_SEPARATOR);
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
    { id: WORKFLOW_ACTIVITY_CONFIG.AREAS.all, label: t.all, count: entries.length, icon: Layers },
    { id: WORKFLOW_ACTIVITY_CONFIG.AREAS.music, label: t.music, count: summary.areas[WORKFLOW_ACTIVITY_CONFIG.AREAS.music], icon: WORKFLOW_AREA_ICONS[WORKFLOW_ACTIVITY_CONFIG.AREAS.music] },
    { id: WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer, label: t.mixer, count: summary.areas[WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer], icon: WORKFLOW_AREA_ICONS[WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer] },
    { id: WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, label: t.flow, count: summary.areas[WORKFLOW_ACTIVITY_CONFIG.AREAS.flow], icon: WORKFLOW_AREA_ICONS[WORKFLOW_ACTIVITY_CONFIG.AREAS.flow] },
    { id: WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, label: t.proxy, count: summary.areas[WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy], icon: WORKFLOW_AREA_ICONS[WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy] },
    { id: WORKFLOW_ACTIVITY_CONFIG.AREAS.motion, label: t.motion, count: summary.areas[WORKFLOW_ACTIVITY_CONFIG.AREAS.motion], icon: WORKFLOW_AREA_ICONS[WORKFLOW_ACTIVITY_CONFIG.AREAS.motion] },
  ] as const;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className={cn(SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5)}>
          <div className={cn(SOURCE_TEXT_W_8_H_8_ROUNDED_XL_BG_2)}>
            <ClipboardList className={cn(SOURCE_TEXT_W_4_H_4)} />
          </div>
          <span className={cn(SOURCE_TEXT_FONT_EXTRABOLD_TRACKING_WIDE_TEXT_SM)}>{t.title}</span>
          {entries.length > 0 && <span className={cn(SOURCE_TEXT_ML_1_TEXT_10PX_FONT_MONO_FONT)}>{entries.length}</span>}
        </div>
      }
      maxWidth={WORKFLOW_ACTIVITY_CONFIG.MODAL_MAX_WIDTH}>
      <div className={cn(SOURCE_TEXT_SPACE_Y_3_5)}>
        <div className={SOURCE_TEXT_P_1_ROUNDED_2XL_BG_SLATE_900_90} role={WORKFLOW_ACTIVITY_CONFIG.A11Y.ROLE_GROUP} aria-label={t.title}>
          {_.map(areaTabs, (tab) => {
            const TabIcon = tab.icon;
            const isActive = filter === tab.id;
            return (
              <Button key={tab.id} type={SOURCE_TEXT_BUTTON} variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED} aria-pressed={isActive} onClick={() => setFilter(tab.id)} className={cn(SOURCE_TEXT_ACTIVITY_TAB, isActive ? SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA : SOURCE_TEXT_TEXT_SLATE_400_HOVER_TEXT_SLATE_100)}>
                <TabIcon className={cn(SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3, isActive ? SOURCE_TEXT_TEXT_WHITE : SOURCE_TEXT_TEXT_SLATE_400)} />
                <span>{tab.label}</span>
                <span className={cn(SOURCE_TEXT_ACTIVITY_COUNT, isActive ? SOURCE_TEXT_BG_WHITE_20_TEXT_WHITE : SOURCE_TEXT_BG_SLATE_800_TEXT_SLATE_400_BORDER)}>{tab.count}</span>
              </Button>
            );
          })}
        </div>
        <div className={SOURCE_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP}>
          <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_FLEX}>
            {[
              {
                id: WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all,
                label: t.statusFilter.all,
                count: entries.length,
                icon: null,
                iconClass: "",
                activeClass: SOURCE_TEXT_BG_PURPLE_600_20_TEXT_PURPLE_200_BORDER,
              },
              {
                id: WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.success,
                label: t.statusFilter.success,
                count: summary.success,
                icon: CheckCircle2,
                iconClass: SOURCE_TEXT_TEXT_EMERALD_400,
                activeClass: SOURCE_TEXT_BG_EMERALD_500_15_TEXT_EMERALD_200_BORDER,
              },
              {
                id: WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.error,
                label: t.statusFilter.error,
                count: summary.fail,
                icon: XCircle,
                iconClass: SOURCE_TEXT_TEXT_ROSE_400,
                activeClass: SOURCE_TEXT_BG_ROSE_500_15_TEXT_ROSE_200_BORDER,
              },
            ].map((st) => {
              const isActive = statusFilter === st.id;
              const Icon = st.icon;
              return (
                <Button key={st.id} type={SOURCE_TEXT_BUTTON} variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED} onClick={() => setStatusFilter(st.id as StatusFilterType)} className={cn(SOURCE_TEXT_STATUS_BUTTON, isActive ? st.activeClass : SOURCE_TEXT_BG_SLATE_900_80_BORDER_SLATE_800_TEXT)}>
                  {Icon && <Icon className={cn(SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3, st.iconClass)} />}
                  <span>{st.label}</span>
                  <span className={cn("text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold", isActive ? SOURCE_TEXT_BG_WHITE_10 : SOURCE_TEXT_TEXT_SLATE_500)}>{st.count}</span>
                </Button>
              );
            })}
            <StudioSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)} aria-label={t.statusFilterAriaLabel} className={SOURCE_TEXT_SR_ONLY}>
              <option value={WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.all}>{t.statusFilter.all}</option>
              <option value={WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.success}>{t.statusFilter.success}</option>
              <option value={WORKFLOW_ACTIVITY_CONFIG.STATUS_FILTER_KEYS.error}>{t.statusFilter.error}</option>
            </StudioSelect>
          </div>
          <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
            <Tooltip content={t.copyAll} align={SOURCE_TEXT_END}>
              <Button type={SOURCE_TEXT_BUTTON} variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED} aria-label={t.copyAll} disabled={!shown.length} onClick={() => void copy(_.map(_.slice(shown).reverse(), format).join(WORKFLOW_ACTIVITY_CONFIG.COPY_NEWLINE), WORKFLOW_ACTIVITY_CONFIG.AREAS.all)} className={SOURCE_TEXT_PX_2_5_PY_1_5_ROUNDED_LG}>
                {hasCopiedAll ? <Check className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_2} /> : <Copy className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_15} />}
                <span className={SOURCE_TEXT_HIDDEN_SM_INLINE}>{hasCopiedAll ? t.copied : t.copyAll}</span>
              </Button>
            </Tooltip>
            <Tooltip content={t.clear} align={SOURCE_TEXT_END}>
              <Button type={SOURCE_TEXT_BUTTON} variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED} aria-label={t.clear} disabled={!entries.length} onClick={clearWorkflowActivities} className={SOURCE_TEXT_PX_2_5_PY_1_5_ROUNDED_LG_2}>
                <Trash2 className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_ROSE} />
                <span className={SOURCE_TEXT_HIDDEN_SM_INLINE}>{t.clear}</span>
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className={cn(SOURCE_TEXT_MAX_H_MIN_65VH_540PX_OVERFLOW_Y)} role={WORKFLOW_ACTIVITY_CONFIG.A11Y.ROLE_LOG} aria-live={WORKFLOW_ACTIVITY_CONFIG.A11Y.ARIA_LIVE_POLITE}>
          {!shown.length ? (
            <div className={cn(SOURCE_TEXT_PY_14_PX_4_FLEX_FLEX_COL)}>
              <div className={cn(SOURCE_TEXT_W_12_H_12_ROUNDED_2XL_BG_2)}>
                <ClipboardList className={cn(SOURCE_TEXT_W_6_H_6)} />
              </div>
              <div className={cn(SOURCE_TEXT_SPACE_Y_1)}>
                <p className={cn(SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_100)}>{t.empty}</p>
                <p className={cn(SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400_MAX_W)}>{t.emptySub}</p>
              </div>
            </div>
          ) : (
            _.map(shown, (entry) => {
              const statusMeta = getEventStatusMeta(entry.event, t);
              const isMusic = entry.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.music;
              const isMixer = entry.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer;
              const isFail = statusMeta.statusType === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail;
              const ModuleIcon = WORKFLOW_AREA_ICONS[entry.area];
              return (
                <div key={entry.id} className={cn(SOURCE_TEXT_GROUP_FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP, statusMeta.cardClass)}>
                  <div className={cn(SOURCE_TEXT_FLEX_ITEMS_START_GAP_3_MIN_W)}>
                    <div className={cn(SOURCE_TEXT_W_8_H_8_ROUNDED_XL_FLEX, statusMeta.avatarClass)}>{statusMeta.icon}</div>
                    <div className={cn(SOURCE_TEXT_MIN_W_0_FLEX_1_SPACE_Y)}>
                      <div className={cn(SOURCE_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_GAP_2)}>
                        <span className={cn(SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_4, { [SOURCE_TEXT_BG_PURPLE_500_20_TEXT_PURPLE_300]: isMusic, [SOURCE_TEXT_BG_INDIGO_500_20_TEXT_INDIGO_300]: isMixer, [SOURCE_TEXT_BG_CYAN_500_20_TEXT_CYAN_300]: !isMusic && !isMixer })}>
                          <ModuleIcon className={cn(SOURCE_TEXT_W_3_H_3)} />
                          <span>{t[entry.area]}</span>
                        </span>
                        <span className={cn(SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_PX_2, statusMeta.statusBadgeClass)}>
                          <span>{statusMeta.label}</span>
                        </span>
                        <span className={cn(SOURCE_TEXT_W_1_H_1_ROUNDED_FULL_BG)} aria-hidden={SOURCE_TEXT_TRUE} />
                        <time className={cn(SOURCE_TEXT_TEXT_10_5PX_FONT_MONO_TEXT_SLATE)} dateTime={new Date(entry.at).toISOString()}>
                          <span className={cn(SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200)}>{new Date(entry.at).toLocaleTimeString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language], WORKFLOW_ACTIVITY_CONFIG.TIME_FORMAT_OPTIONS)}</span>
                          <span className={cn(SOURCE_TEXT_TEXT_9_5PX_TEXT_SLATE_500_HIDDEN)}>{new Date(entry.at).toLocaleDateString(WORKFLOW_ACTIVITY_CONFIG.LOCALES[language])}</span>
                        </time>
                      </div>
                      <div className={cn(SOURCE_TEXT_SPACE_Y_1)}>
                        <div className={cn(SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP)}>
                          <p className={cn(SOURCE_TEXT_BREAK_WORDS_LEADING_SNUG, statusMeta.titleClass)}>{t.events[entry.event]}</p>
                          {entry.count !== undefined && (
                            <span className={cn(SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_PX_2_PY, { [SOURCE_TEXT_BG_ROSE_500_25_TEXT_ROSE_300]: isFail, [SOURCE_TEXT_BG_EMERALD_500_25_TEXT_EMERALD_300]: !isFail })}>
                              {WORKFLOW_ACTIVITY_CONFIG.COUNT_PREFIX}
                              {entry.count}
                            </span>
                          )}
                        </div>
                        {entry.detail && (
                          <div className={cn(SOURCE_TEXT_P_2_5_ROUNDED_XL_TEXT_11PX, { [SOURCE_TEXT_BG_ROSE_950_80_BORDER_BORDER_ROSE]: isFail, [SOURCE_TEXT_BG_SLATE_955_80_BORDER_BORDER_SLATE]: !isFail })}>
                            <AlertCircle className={cn(SOURCE_TEXT_W_3_5_H_3_5_SHRINK_4, { [SOURCE_TEXT_TEXT_ROSE_400]: isFail, [SOURCE_TEXT_TEXT_SLATE_400]: !isFail })} />
                            <span className={cn(SOURCE_TEXT_BREAK_WORDS)}>{entry.detail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Tooltip content={t.copy} align={SOURCE_TEXT_END}>
                    <Button type={SOURCE_TEXT_BUTTON} variant={WORKFLOW_ACTIVITY_CONFIG.BUTTON_VARIANT_UNSTYLED} aria-label={t.copy} onClick={() => void copy(format(entry), entry.id)} className={cn(SOURCE_TEXT_W_6_H_6_BG_TRANSPARENT_HOVER_3)}>
                      {copiedId === entry.id ? <Check className={cn(SOURCE_TEXT_W_3_5_H_3_5_TEXT_2)} /> : <Copy className={cn(SOURCE_TEXT_W_3_5_H_3_5)} />}
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
