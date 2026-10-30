import { StudioHeader, StudioPage, StudioCanvas, StudioCard, StudioInput, StudioSelect, StudioTextarea } from "../../../components/ui/Studio.js";
import { useClipboardFeedback } from "../../../hooks/useClipboardFeedback.js";
import { CLIPBOARD_FEEDBACK } from "../../../constants/clipboardFeedback.js";
import { recordWorkflowActivity } from "../../../services/workflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT } from "../../../constants/workflowActivity";
import {
  SOURCE_TEMPLATE_OPEN_2,
  SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400_3,
  SOURCE_TEXT_BG_WHITE_20_TEXT_WHITE_BORDER_WHITE,
  SOURCE_TEXT_TEXT_PURPLE_100,
  SOURCE_TEXT_TEXT_PURPLE_100_HOVER_TEXT_WHITE,
  SOURCE_TEXT_BORDER_WHITE_20_TEXT_PURPLE_100,
  SOURCE_TEXT_TEXT_10PX_FONT_BOLD_TEXT_WHITE_FLEX,
  SOURCE_TEXT_TEXT_WHITE_TRANSLATE_X_0_5,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_10,
  SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_2,
  SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_3,
  SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_4,
  SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_5,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5,
  SOURCE_TEXT_W_8_H_8_ROUNDED_XL_BG,
  SOURCE_TEXT_W_4_H_4,
  SOURCE_TEXT_MIN_W_0_TEXT_LEFT,
  SOURCE_TEXT_TEXT_SM_FONT_BLACK_TRACKING_WIDER_TEXT,
  SOURCE_TEXT_TEXT_10PX_FONT_MEDIUM_TEXT_SLATE_400_2,
  SOURCE_TEXT_CAP_NHAT_CAU_HINH_KET_NOI_PROXY,
  SOURCE_TEXT_THEM_CAU_HINH_PROXY_MOI_VAO_HE,
  SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN,
  SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT,
  SOURCE_TEXT_TEXT_PINK_400_FONT_BLACK,
  SOURCE_BROWSER_TEXT_SYMBOL,
  SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_MONO_2,
  SOURCE_TEXT_TEN_GOI_NHO,
  SOURCE_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_3,
  SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS_2,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_11,
  SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS_3,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_2,
  SOURCE_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_4,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_12,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_13,
  SOURCE_TEXT_TUY_CHON,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_14,
  SOURCE_TEXT_TEXT_10PX_TEXT_EMERALD_400_FONT_SEMIBOLD,
  SOURCE_TEXT_W_3_H_3,
  SOURCE_TEXT_DA_LUU_BAO_MAT,
  SOURCE_TEXT_OPACITY_40_CURSOR_NOT_ALLOWED,
  SOURCE_TEXT_ABSOLUTE_RIGHT_2_5_TOP_1_2,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_ENTER,
  SOURCE_TEXT_SYMBOL_52,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_3,
  SOURCE_TEXT_BORDER_PINK_500_50_BG_GRADIENT_TO,
  SOURCE_TEXT_BORDER_SLATE_800_80_BG_SLATE_900,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN,
  SOURCE_TEXT_W_8_H_8_ROUNDED_LG_FLEX,
  SOURCE_TEXT_BG_PINK_500_20_TEXT_PINK_300,
  SOURCE_TEXT_BG_SLATE_800_TEXT_SLATE_400,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_TRANSITION_COLORS,
  SOURCE_TEXT_TEXT_PINK_200,
  SOURCE_TEXT_TEXT_SLATE_200,
  SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400,
  SOURCE_TEXT_MAT_KHAU_HIEN_TAI_SE_BI_XOA,
  SOURCE_TEXT_DE_TRONG_O_MAT_KHAU_O_TREN,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_SHRINK_0,
  SOURCE_TEXT_CHECKBOX,
  SOURCE_TEXT_SR_ONLY,
  SOURCE_TEXT_SWITCH,
  SOURCE_TEXT_TOGGLE_SWITCH_SELECT_NONE_FOCUS_OUTLINE_NONE,
  SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600,
  SOURCE_TEXT_BG_SLATE_800_BORDER_BORDER_SLATE_700,
  SOURCE_TEXT_TOGGLE_SWITCH_THUMB_SHADOW_MD_TRANSITION_TRANSFORM,
  SOURCE_TEXT_TRANSLATE_X_20PX_BG_WHITE,
  SOURCE_TEXT_TRANSLATE_X_0_BG_SLATE_300,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_15,
  SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_AMBER_500_30,
  SOURCE_TEXT_W_4_H_4_TEXT_AMBER_400_2,
  SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_ROSE_500_30_3,
  SOURCE_TEXT_W_4_H_4_TEXT_ROSE_400_2,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2,
  SOURCE_TEXT_PX_5_PY_2_5_TEXT_XS,
  SOURCE_TEXT_W_3_5_H_3_5_ANIMATE_2,
  SOURCE_TEXT_W_3_5_H_3_5_SHRINK_2,
  SOURCE_TEXT_W_3_5_H_3_5_ANIMATE_3,
  SOURCE_TEXT_GLASS_CARD_ROUNDED_2XL_BORDER_BORDER_SLATE,
  SOURCE_TEXT_W_FULL_ROUNDED_XL_BORDER_BORDER_SLATE,
  SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP,
  SOURCE_TEXT_BORDER_PURPLE_500_50_BG_GRADIENT_TO,
  SOURCE_TEXT_VI,
  SOURCE_TEXT_EN,
  SOURCE_TEXT_SELECTEDID,
  SOURCE_TEXT_QUERY,
  SOURCE_TEXT_FORM,
  SOURCE_TEXT_EDITOR,
  SOURCE_TEXT_IMPORTOPEN,
  SOURCE_TEXT_IMPORTTEXT,
  SOURCE_TEXT_ALL,
  SOURCE_TEXT_VISIBLE,
  SOURCE_TEXT_CHECK,
  SOURCE_TEMPLATE_CHECK,
  SOURCE_TEXT_POST,
  SOURCE_TEMPLATE_SYMBOL_76,
  SOURCE_TEXT_PUT,
  SOURCE_TEXT_IMPORT,
  SOURCE_TEXT_127_0_0_1_8080_ALICE_PASSWORD123,
  SOURCE_TEXT_OK,
  SOURCE_TEXT_CLOSED,
  SOURCE_TEXT_ERROR,
  SOURCE_TEMPLATE_SYMBOL_77,
  SOURCE_TEXT_OPEN,
  SOURCE_TEXT_ISSUES,
  SOURCE_TEXT_OPENING,
  SOURCE_TEXT_CLOSING,
  SOURCE_TEMPLATE_OPEN,
  SOURCE_TEXT_CREATION_WORKSPACE_W_FULL_H_FULL_FLEX,
  SOURCE_TEXT_ALERT,
  SOURCE_TEXT_TEXT_SM_TEXT_ROSE_300_FONT_BOLD,
  SOURCE_TEXT_UNSTYLED,
  SOURCE_TEXT_W_7_H_7_ANIMATE_SPIN_TEXT,
  SOURCE_TEXT_STATUS,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_300,
  SOURCE_TEXT_W_5_H_5,
  SOURCE_TEXT_MIN_W_0,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP,
  SOURCE_TEXT_W_2_5_H_2_5_TEXT,
  SOURCE_TEXT_PX_2_PY_0_5_ROUNDED_FULL_2,
  SOURCE_TEXT_ANTI_DETECT_ISOLATED,
  SOURCE_TEXT_PX_3_5_PY_2,
  SOURCE_TEXT_W_4_H_4_TEXT_PURPLE_400,
  SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400,
  SOURCE_TEXT_P_2,
  SOURCE_TEXT_W_3_5_H_3_5,
  SOURCE_TEXT_GRID_GRID_COLS_2_LG_GRID_COLS,
  SOURCE_TEXT_TEXT_PURPLE_400,
  SOURCE_TEXT_BG_PURPLE_500_10_BORDER_PURPLE_500,
  SOURCE_TEXT_HO_SO_DA_LUU_AN_TOAN,
  SOURCE_TEXT_TEXT_EMERALD_400,
  SOURCE_TEXT_BG_EMERALD_500_10_BORDER_EMERALD_500,
  SOURCE_TEXT_KET_NOI_HOAT_DONG_TOT,
  SOURCE_TEXT_TEXT_CYAN_400,
  SOURCE_TEXT_BG_CYAN_500_10_BORDER_CYAN_500,
  SOURCE_TEXT_TRINH_DUYET_DANG_MO,
  SOURCE_TEXT_TEXT_AMBER_400,
  SOURCE_TEXT_BG_AMBER_500_10_BORDER_AMBER_500,
  SOURCE_TEXT_CHUA_TEST_HOAC_LOI,
  SOURCE_TEXT_P_4_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN,
  SOURCE_TEXT_TEXT_11PX_FONT_BOLD_TEXT_SLATE_400,
  SOURCE_TEXT_TEXT_XL_SM_TEXT_2XL_FONT_BLACK,
  SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_MONO,
  SOURCE_TEXT_W_10_H_10_ROUNDED_XL_BORDER,
  SOURCE_TEXT_ABSOLUTE_TOP_1_RIGHT_1_W_2,
  SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_ROSE_500_30,
  SOURCE_TEXT_P_16_FLEX_FLEX_COL_ITEMS_CENTER,
  SOURCE_TEXT_W_8_H_8_ANIMATE_SPIN_TEXT,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_400,
  SOURCE_TEXT_GRID_GRID_COLS_1_LG_GRID_COLS,
  SOURCE_TEXT_LG_COL_SPAN_5_P_4_SM,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2,
  SOURCE_TEXT_TEXT_SM_FONT_BLACK_UPPERCASE_TRACKING_WIDER,
  SOURCE_TEXT_PX_2_PY_0_2_ROUNDED_FULL,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_P_1,
  SOURCE_TEXT_FLEX_1_PY_1_PX_2_ROUNDED,
  SOURCE_TEXT_BG_PURPLE_600_20_TEXT_PURPLE_300,
  SOURCE_TEXT_TEXT_SLATE_400_HOVER_TEXT_SLATE_200,
  SOURCE_TEXT_ML_1_OPACITY_60_TEXT_9PX_FONT,
  SOURCE_TEXT_SYMBOL_47,
  SOURCE_TEXT_SYMBOL_12,
  SOURCE_TEXT_RELATIVE,
  SOURCE_TEXT_ABSOLUTE_LEFT_3_TOP_3_W_4,
  SOURCE_TEXT_PL_9_PR_8_TEXT_XS,
  SOURCE_TEXT_ABSOLUTE_RIGHT_2_5_TOP_2_5,
  SOURCE_TEXT_FLEX_1_MIN_H_360PX_MAX_H,
  SOURCE_TEXT_GROUP_RELATIVE_ROUNDED_XL_BORDER_P_3,
  SOURCE_TEXT_BORDER_PURPLE_500_60_BG_GRADIENT_TO,
  SOURCE_TEXT_BORDER_SLATE_800_90_BG_SLATE_955,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W,
  SOURCE_TEXT_TEXT_XS_FONT_BLACK_TRUNCATE,
  SOURCE_TEXT_TEXT_PURPLE_200,
  SOURCE_TEXT_TEXT_SLATE_100_GROUP_HOVER_TEXT_PURPLE,
  SOURCE_TEXT_PX_1_5_PY_0_2_ROUNDED,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_2,
  SOURCE_TEXT_FONT_MONO_TEXT_11PX_TEXT_SLATE_400,
  SOURCE_TEMPLATE_SYMBOL_78,
  SOURCE_TEXT_P_1_ROUNDED_MD_BG_SLATE_800,
  SOURCE_TEXT_W_3_H_3_TEXT_EMERALD_400,
  SOURCE_TEXT_MT_2_5_PT_2_BORDER_T,
  SOURCE_TEXT_TEXT_10PX_FONT_BOLD_TEXT_CYAN_300,
  SOURCE_TEXT_W_1_5_H_1_5_ROUNDED,
  SOURCE_TEXT_TEXT_SLATE_500_FLEX_ITEMS_CENTER_GAP,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_TEXT_SLATE,
  SOURCE_TEXT_AUTH,
  SOURCE_TEXT_W_3_5_H_3_5_TRANSITION,
  SOURCE_TEXT_TEXT_SLATE_600,
  SOURCE_TEXT_FLEX_1_FLEX_FLEX_COL_ITEMS_CENTER,
  SOURCE_TEXT_W_9_H_9_TEXT_SLATE_600,
  SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_500_MT_1,
  SOURCE_TEXT_THU_TIM_KIEM_VOI_TU_KHOA_KHAC,
  SOURCE_TEXT_MT_4_FLEX_ITEMS_CENTER_JUSTIFY_CENTER,
  SOURCE_TEXT_MT_3,
  SOURCE_TEXT_LG_COL_SPAN_7_P_5_SM,
  SOURCE_TEXT_H_FULL_FLEX_1_FLEX_FLEX_COL,
  SOURCE_TEXT_ABSOLUTE_TOP_0_RIGHT_0_W_64,
  SOURCE_TEXT_SPACE_Y_5,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_3,
  SOURCE_TEXT_W_10_H_10_ROUNDED_XL_BG,
  SOURCE_TEXT_TEXT_SM_SM_TEXT_BASE_FONT_BLACK,
  SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_MT_0,
  SOURCE_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS,
  SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT,
  SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400_LEADING_RELAXED,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_2,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_3,
  SOURCE_TEXT_P_3_5_ROUNDED_XL_BG_SLATE,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_SLATE,
  SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400_2,
  SOURCE_TEXT_TEXT_SLATE_400_PL_6_LEADING_RELAXED,
  SOURCE_TEXT_MT_6_PT_4_BORDER_T_BORDER,
  SOURCE_TEXT_PX_4_PY_2,
  SOURCE_TEXT_H_FULL_FLEX_1_FLEX_FLEX_COL_2,
  SOURCE_TEXT_FLEX_FLEX_COL_SM_FLEX_ROW_SM,
  SOURCE_TEXT_TEXT_10PX_UPPERCASE_TRACKING_WIDEST_TEXT_PURPLE,
  SOURCE_TEXT_PX_1_5_PY_0_2_ROUNDED_2,
  SOURCE_TEXT_TEXT_LG_SM_TEXT_XL_FONT_BLACK,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MT_1,
  SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_FONT_MONO,
  SOURCE_TEXT_SELECTED_HOST,
  SOURCE_TEXT_P_1_ROUNDED_MD_BG_SLATE_800_2,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP_2,
  SOURCE_TEXT_BORDER_ROSE_500_30_BG_ROSE_500,
  SOURCE_TEXT_ROUNDED_2XL_BORDER_BORDER_PURPLE_500_30,
  SOURCE_TEXT_W_4_H_4_TEXT_CYAN_400,
  SOURCE_TEXT_TEXT_XS_FONT_BLACK_UPPERCASE_TRACKING_WIDER,
  SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_FLEX,
  SOURCE_TEXT_PX_4_PY_2_5_TEXT_XS,
  SOURCE_TEXT_BROWSER,
  SOURCE_TEXT_W_3_5_H_3_5_ML,
  SOURCE_TEXT_PX_3_5_PY_2_5,
  SOURCE_TEXT_YOUTUBE,
  SOURCE_TEXT_W_4_H_4_TEXT_ROSE_400,
  SOURCE_TEXT_STUDIO,
  SOURCE_TEXT_W_4_H_4_TEXT_AMBER_400,
  SOURCE_TEXT_BORDER_ROSE_500_40_BG_ROSE_500,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEMPLATE_CLOSE,
  SOURCE_TEXT_W_3_5_H_3_5_ANIMATE,
  SOURCE_TEXT_TEXT_11PX_TEXT_AMBER_300_90_FONT,
  SOURCE_TEXT_GRID_GRID_COLS_2_SM_GRID_COLS,
  SOURCE_TEXT_ROUNDED_XL_BG_SLATE_950_70_BORDER,
  SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_BOLD,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_1,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_FONT_MONO_TEXT,
  SOURCE_TEXT_SYMBOL_48,
  SOURCE_TEXT_IP,
  SOURCE_TEXT_P_1_TEXT_SLATE_500_HOVER_TEXT,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_FONT_MONO_MT,
  SOURCE_TEXT_TEXT_SLATE_400,
  SOURCE_TEXT_TEXT_ROSE_400,
  SOURCE_TEMPLATE_MS,
  SOURCE_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200,
  SOURCE_TEXT_EN_US,
  SOURCE_TEXT_VI_VN,
  SOURCE_TEXT_2_DIGIT,
  SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_ROSE_500_30_2,
  SOURCE_TEXT_W_4_H_4_SHRINK_0_TEXT,
  SOURCE_TEXT_SPACE_Y_0_5,
  SOURCE_TEXT_FONT_BOLD,
  SOURCE_TEXT_LEADING_RELAXED_OPACITY_90,
  SOURCE_TEXT_ROUNDED_XL_BG_SLATE_950_60_BORDER,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_TEXT_XS,
  SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_300,
  SOURCE_TEXT_TEXT_11PX_FONT_MONO_TEXT_SLATE_500,
  SOURCE_TEXT_GRID_GRID_COLS_2_SM_GRID_COLS_2,
  SOURCE_TEXT_P_2_5_ROUNDED_LG_BG_SLATE,
  SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_FONT,
  SOURCE_TEXT_HOST,
  SOURCE_TEXT_FONT_MONO_TEXT_SLATE_200_TRUNCATE_BLOCK,
  SOURCE_TEXT_PORT,
  SOURCE_TEXT_P_2_5_ROUNDED_LG_BG_SLATE_2,
  SOURCE_TEXT_USER_2,
  SOURCE_TEXT_PT_2_BORDER_T_BORDER_SLATE_800,
  SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_BOLD_2,
  SOURCE_TEXT_TEXT_XS_TEXT_SLATE_300_WHITESPACE_PRE,
  SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED,
  SOURCE_TEXT_PT_2_BORDER_T_BORDER_SLATE_800_2,
  SOURCE_TEXT_TEXT_ROSE_300,
  SOURCE_TEXT_SAVING,
  SOURCE_TEXT_TEXT_PURPLE_300,
  SOURCE_TEXT_TEXT_SLATE_500,
  SOURCE_TEXT_SAVED,
  SOURCE_TEXT_PY_0_5_PX_2_TEXT_10PX,
  SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_4,
  SOURCE_TEXT_W_3_5_H_3_5_SHRINK,
  SOURCE_TEXT_XL,
  SOURCE_TEXT_SPACE_Y_4,
  SOURCE_TEXT_YOUTUBE_STUDIO_01,
  SOURCE_BROWSER_TEXT_HTTP,
  SOURCE_TEXT_HTTP_2,
  SOURCE_TEXT_HTTPS_2,
  SOURCE_TEXT_HTTPS_3,
  SOURCE_TEXT_SOCKS5,
  SOURCE_TEXT_SOCKS5_2,
  SOURCE_TEXT_PROXY_EXAMPLE_COM,
  SOURCE_TEXT_NUMBER,
  SOURCE_TEXT_8080,
  SOURCE_TEXT_OFF,
  SOURCE_TEXT_NEW_PASSWORD,
  SOURCE_TEXT_TEXT,
  SOURCE_TEXT_PASSWORD,
  SOURCE_TEXT_PR_11,
  SOURCE_TEXT_SYMBOL_49,
  SOURCE_TEXT_TEXT_XS_TEXT_ROSE_300_FONT_BOLD,
  SOURCE_TEXT_FLEX_JUSTIFY_END_GAP_2_PT_2,
  SOURCE_TEXT_SUBMIT,
  SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED_2,
  SOURCE_TEXT_TEXT_11PX_FONT_BOLD_TEXT_PURPLE_400,
  SOURCE_TEXT_FONT_MONO_TEXT_XS_CUSTOM_SCROLLBAR,
  SOURCE_TEXT_127_0_0_1_8080_USERNAME_PASSWORD,
  SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_OVERFLOW,
  SOURCE_TEXT_P_3_BG_SLATE_900_TEXT_XS,
  SOURCE_TEXT_FONT_MONO,
  SOURCE_TEXT_SYMBOL_50,
  SOURCE_TEXT_MAX_H_48_OVERFLOW_Y_AUTO_CUSTOM,
  SOURCE_TEXT_P_3_TEXT_XS_TEXT_SLATE_500,
  SOURCE_TEXT_P_2_5_TEXT_11PX_FLEX_GAP,
  SOURCE_TEXT_TEXT_SLATE_500_SHRINK_0_W_14,
  SOURCE_TEXT_BREAK_ALL_FLEX_1,
  SOURCE_TEXT_TEXT_ROSE_300_FONT_SEMIBOLD,
  SOURCE_TEXT_TEXT_SLATE_300,
  SOURCE_TEMPLATE_SYMBOL_80,
  SOURCE_TEMPLATE_SYMBOL_75,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_3,
  SOURCE_TEXT_W_3_5_H_3_5_TEXT_4,
  SOURCE_TEXT_P_3_ROUNDED_XL_BG_SLATE_950,
  SOURCE_TEXT_TEXT_SM_FONT_BOLD_TEXT_SLATE_100,
  SOURCE_TEXT_TEXT_XS_FONT_MONO_TEXT_SLATE_400,
  SOURCE_TEXT_BORDER_ROSE_500_40_BG_ROSE_500_2,
  SOURCE_TEXT_DELETE,
  SOURCE_TEXT_DELETE_2,
} from "../../../constants/sourceText.js";
import { requestProxyApi as api } from "../services/proxyApi";
import { ProxyConnectionBadge } from "./ProxyConnectionBadge";
import { getErrorMessage } from "../../../utils/errorUtils";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Activity, AlertTriangle, ArrowUpRight, Check, CheckCircle2, ChevronRight, Clapperboard, Copy, Download, Eye, EyeOff, FileText, Globe, KeyRound, Layers, Monitor, Pencil, Play, Plus, RefreshCw, Search, Shield, ShieldCheck, Sparkles, Trash2, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PROXY_TEXTS } from "../../../constants/proxy";
import { parseProxyImport, proxyServer, validateProxyInput } from "../../../lib/proxyValidation";
import type { ProxyCheck, ProxyInput, ProxyOpenResult, ProxyProfile } from "../../../types/proxy";
import type { Lang } from "../../../lib/lang";
import { cn } from "../../../lib/utils";
import { emptyProxyForm } from "../lib/proxyWorkspace";
import { useProxyWorkspace } from "../hooks/useProxyWorkspace";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
const emptyForm = emptyProxyForm;
const panelClass = SOURCE_TEXT_GLASS_CARD_ROUNDED_2XL_BORDER_BORDER_SLATE;
const controlClass = SOURCE_TEXT_W_FULL_ROUNDED_XL_BORDER_BORDER_SLATE;
const actionBtnClass = SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP;
const primaryBtnClass = SOURCE_TEXT_BORDER_PURPLE_500_50_BG_GRADIENT_TO;
export default function ProxyManager({ currentLang = SOURCE_TEXT_VI }: { currentLang?: Lang }) {
  const t = PROXY_TEXTS[currentLang === SOURCE_TEXT_EN ? SOURCE_TEXT_EN : SOURCE_TEXT_VI];
  const [profiles, setProfiles] = useState<ProxyProfile[]>([]);
  const { workspace, update, ready: workspaceReady, status: draftStatus, recoveryError, recover, retrySave } = useProxyWorkspace();
  const { selectedId, query, form, editor, importOpen, importText } = workspace;
  const setSelectedId = useCallback((value: string | null | ((id: string | null) => string | null)) => update(SOURCE_TEXT_SELECTEDID, value), [update]);
  const setQuery = (value: string) => update(SOURCE_TEXT_QUERY, value);
  const setForm = (value: ProxyInput) => update(SOURCE_TEXT_FORM, value);
  const setEditor = (value: typeof editor) => update(SOURCE_TEXT_EDITOR, value);
  const setImportOpen = (value: boolean) => update(SOURCE_TEXT_IMPORTOPEN, value);
  const setImportText = (value: string) => update(SOURCE_TEXT_IMPORTTEXT, value);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pending, setPending] = useState<Record<string, string>>({});
  const locks = useRef(new Set<string>());
  const mounted = useRef(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [importError, setImportError] = useState("");
  const [deleteProfile, setDeleteProfile] = useState<ProxyProfile | null>(null);
  const { copiedKey, copyText } = useClipboardFeedback({ duration: CLIPBOARD_FEEDBACK.SHORT_DURATION_MS, language: currentLang });
  const [filterTab, setFilterTab] = useState<"all" | "ok" | "open" | "issues">(SOURCE_TEXT_ALL);
  const refreshSequence = useRef(0);
  const handleCopy = (text: string, key: string) => {
    void copyText(text, key, t.copied);
  };
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const data = await api<ProxyProfile[]>();
    if (!mounted.current || sequence !== refreshSequence.current) return;
    setProfiles(data);
    if (workspaceReady) setSelectedId((id) => (data.some((profile) => profile.id === id) ? id : data[0]?.id || null));
    setLoadError("");
  }, [workspaceReady, setSelectedId]);
  useEffect(() => {
    mounted.current = true;
    refresh()
      .catch(() => {
        if (mounted.current) setLoadError(t.loadError);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    const timer = setInterval(() => {
      if (document.visibilityState === SOURCE_TEXT_VISIBLE) {
        refresh().catch(() => {
          if (mounted.current) setLoadError(t.loadError);
        });
      }
    }, 5000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [refresh, t.loadError]);
  const run = async (id: string, operation: string, task: () => Promise<void>) => {
    if (locks.current.has(id)) return;
    locks.current.add(id);
    setPending((state) => ({ ...state, [id]: operation }));
    const events =
      operation === SOURCE_TEXT_CHECK
        ? [WORKFLOW_ACTIVITY_EVENT.proxyCheckStart, WORKFLOW_ACTIVITY_EVENT.proxyCheckDone, WORKFLOW_ACTIVITY_EVENT.proxyCheckFail]
        : operation === SOURCE_TEXT_CLOSE_2
          ? [WORKFLOW_ACTIVITY_EVENT.proxyCloseStart, WORKFLOW_ACTIVITY_EVENT.proxyCloseDone, WORKFLOW_ACTIVITY_EVENT.proxyCloseFail]
          : operation === SOURCE_TEXT_DELETE
            ? [WORKFLOW_ACTIVITY_EVENT.proxyDeleteStart, WORKFLOW_ACTIVITY_EVENT.proxyDeleteDone, WORKFLOW_ACTIVITY_EVENT.proxyDeleteFail]
            : [WORKFLOW_ACTIVITY_EVENT.proxyOpenStart, WORKFLOW_ACTIVITY_EVENT.proxyOpenDone, WORKFLOW_ACTIVITY_EVENT.proxyOpenFail];
    const detail = profiles.find((profile) => profile.id === id)?.name || id;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, events[0], undefined, detail);
    try {
      await task();
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, events[1], undefined, detail);
    } catch (error) {
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, events[2], undefined, detail);
      if (mounted.current) toast.error(getErrorMessage(error, t.loadError));
    } finally {
      await refresh().catch(() => {
        if (mounted.current) setLoadError(t.loadError);
      });
      locks.current.delete(id);
      if (mounted.current) {
        setPending((state) => {
          const next = { ...state };
          delete next[id];
          return next;
        });
      }
    }
  };
  const check = (id: string) =>
    run(id, SOURCE_TEXT_CHECK, async () => {
      const result = await api<ProxyCheck>(SOURCE_TEMPLATE_CHECK(`${id}`), SOURCE_TEXT_POST);
      if (result.status !== SOURCE_TEXT_OK) throw new Error(result.error || t.loadError);
    });
  const checkAll = async () => {
    if (checkingAll) return;
    setCheckingAll(true);
    const queue = profiles.map((profile) => profile.id);
    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, async () => {
        let id: string | undefined;
        while (mounted.current && (id = queue.shift())) await check(id);
      }),
    );
    if (mounted.current) setCheckingAll(false);
  };
  const openEditor = (profile?: ProxyProfile) => {
    setForm(profile ? { name: profile.name, protocol: profile.protocol, host: profile.host, port: profile.port, username: profile.username, notes: profile.notes, password: "" } : emptyForm());
    setEditor(profile ? { id: profile.id, hasPassword: profile.hasPassword } : {});
    setFormError("");
    setShowPassword(false);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, WORKFLOW_ACTIVITY_EVENT.proxySaveStart);
    try {
      const input = validateProxyInput(form);
      const saved = await api<ProxyProfile>(editor?.id ? SOURCE_TEMPLATE_SYMBOL_76(`${editor.id}`) : "", editor?.id ? SOURCE_TEXT_PUT : SOURCE_TEXT_POST, input);
      await refresh();
      setSelectedId(saved.id);
      setEditor(null);
      setForm(emptyForm());
      toast.success(t.saved);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, WORKFLOW_ACTIVITY_EVENT.proxySaveDone, 1, saved.name);
    } catch (error) {
      setFormError(getErrorMessage(error, t.loadError));
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, WORKFLOW_ACTIVITY_EVENT.proxySaveFail);
    } finally {
      setSaving(false);
    }
  };
  const importRows = parseProxyImport(importText);
  const validCount = importRows.filter((row) => row.input).length;
  const importList = async () => {
    if (saving || !validCount || validCount !== importRows.length || validCount > 200) return;
    setSaving(true);
    setImportError("");
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, WORKFLOW_ACTIVITY_EVENT.proxyImportStart, validCount);
    try {
      const saved = await api<ProxyProfile[]>(SOURCE_TEXT_IMPORT, SOURCE_TEXT_POST, { proxies: importRows.map((row) => row.input) });
      await refresh();
      setSelectedId(saved[0]?.id || null);
      setImportOpen(false);
      setImportText("");
      toast.success(t.imported);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, WORKFLOW_ACTIVITY_EVENT.proxyImportDone, saved.length);
    } catch (error) {
      setImportError(getErrorMessage(error, t.loadError));
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.proxy, WORKFLOW_ACTIVITY_EVENT.proxyImportFail, validCount);
    } finally {
      setSaving(false);
    }
  };
  const handlePasteSampleImport = () => {
    setImportText(SOURCE_TEXT_127_0_0_1_8080_ALICE_PASSWORD123);
    setImportError("");
  };
  const selected = profiles.find((profile) => profile.id === selectedId);
  const counts = useMemo(() => ({ total: profiles.length, ok: profiles.filter((p) => p.check?.status === SOURCE_TEXT_OK).length, open: profiles.filter((p) => p.session !== SOURCE_TEXT_CLOSED).length, issues: profiles.filter((p) => p.check?.status === SOURCE_TEXT_ERROR || !p.check).length }), [profiles]);
  const visible = useMemo(() => {
    const searchTrimmed = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      const matchSearch = SOURCE_TEMPLATE_SYMBOL_77(`${profile.name}`, `${profile.host}`, `${profile.notes}`).toLowerCase().includes(searchTrimmed);
      if (!matchSearch) return false;
      if (filterTab === SOURCE_TEXT_OK) return profile.check?.status === SOURCE_TEXT_OK;
      if (filterTab === SOURCE_TEXT_OPEN) return profile.session !== SOURCE_TEXT_CLOSED;
      if (filterTab === SOURCE_TEXT_ISSUES) return profile.check?.status === SOURCE_TEXT_ERROR || !profile.check;
      return true;
    });
  }, [profiles, query, filterTab]);
  const sessionText = (profile: ProxyProfile) => ({ closed: t.closed, opening: t.opening, open: t.openSession, closing: t.closing })[profile.session];
  const locked = selected ? Boolean(pending[selected.id]) || selected.session === SOURCE_TEXT_OPENING || selected.session === SOURCE_TEXT_CLOSING : false;
  const launch = (destination: string) =>
    selected &&
    run(selected.id, SOURCE_TEMPLATE_OPEN_2(`${destination}`), async () => {
      const result = await api<ProxyOpenResult>(SOURCE_TEMPLATE_OPEN(`${selected.id}`), SOURCE_TEXT_POST, { destination });
      if (mounted.current) {
        if (result?.warning) toast.warning(result.warning, { duration: 10000 });
        else toast.success(t.opened);
      }
    });
  if (!workspaceReady) {
    return (
      <StudioPage className={SOURCE_TEXT_CREATION_WORKSPACE_W_FULL_H_FULL_FLEX}>
        {recoveryError ? (
          <>
            <p role={SOURCE_TEXT_ALERT} className={SOURCE_TEXT_TEXT_SM_TEXT_ROSE_300_FONT_BOLD}>
              {t.recoveryError}
            </p>
            <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} onClick={recover}>
              {t.retry}
            </Button>
          </>
        ) : (
          <>
            <Sparkles className={SOURCE_TEXT_W_7_H_7_ANIMATE_SPIN_TEXT} />
            <p role={SOURCE_TEXT_STATUS} className={SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_300}>
              {t.recovering}
            </p>
          </>
        )}
      </StudioPage>
    );
  }
  return (
    <StudioPage>
      <StudioCanvas>
        <StudioHeader
          icon={Globe}
          title={<>{t.title}</>}
          description={<>{t.subtitle}</>}
          badge={<>{t.badge}</>}
          actions={
            <>
              <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP}>
                <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, primaryBtnClass, SOURCE_TEXT_PX_3_5_PY_2)} onClick={() => openEditor()}>
                  <Plus className={SOURCE_TEXT_W_4_H_4} />
                  <span>{t.add}</span>
                </Button>
                <Button
                  variant={SOURCE_TEXT_UNSTYLED}
                  className={actionBtnClass}
                  onClick={() => {
                    setImportOpen(true);
                    setImportError("");
                  }}>
                  <Download className={SOURCE_TEXT_W_4_H_4_TEXT_PURPLE_400} />
                  <span>{t.import}</span>
                </Button>
                <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} disabled={checkingAll || !profiles.length} onClick={checkAll}>
                  {checkingAll ? <Sparkles className={SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400_3} /> : <RefreshCw className={SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400} />}
                  <span>{t.checkAll}</span>
                </Button>
                <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, SOURCE_TEXT_P_2)} aria-label={t.refresh} onClick={() => refresh().catch(() => setLoadError(t.loadError))}>
                  <RefreshCw className={SOURCE_TEXT_W_3_5_H_3_5} />
                </Button>
              </div>
            </>
          }>
          <span className={SOURCE_TEXT_PX_2_PY_0_5_ROUNDED_FULL_2}>{SOURCE_TEXT_ANTI_DETECT_ISOLATED}</span>
        </StudioHeader>
        <div className={SOURCE_TEXT_GRID_GRID_COLS_2_LG_GRID_COLS}>
          {[
            { label: t.total, value: counts.total, icon: Globe, color: SOURCE_TEXT_TEXT_PURPLE_400, bg: SOURCE_TEXT_BG_PURPLE_500_10_BORDER_PURPLE_500, desc: SOURCE_TEXT_HO_SO_DA_LUU_AN_TOAN },
            { label: t.healthy, value: counts.ok, icon: ShieldCheck, color: SOURCE_TEXT_TEXT_EMERALD_400, bg: SOURCE_TEXT_BG_EMERALD_500_10_BORDER_EMERALD_500, desc: SOURCE_TEXT_KET_NOI_HOAT_DONG_TOT },
            { label: t.sessions, value: counts.open, icon: Monitor, color: SOURCE_TEXT_TEXT_CYAN_400, bg: SOURCE_TEXT_BG_CYAN_500_10_BORDER_CYAN_500, desc: SOURCE_TEXT_TRINH_DUYET_DANG_MO, hasPulse: counts.open > 0 },
            { label: t.issues, value: counts.issues, icon: AlertTriangle, color: SOURCE_TEXT_TEXT_AMBER_400, bg: SOURCE_TEXT_BG_AMBER_500_10_BORDER_AMBER_500, desc: SOURCE_TEXT_CHUA_TEST_HOAC_LOI },
          ].map((item) => (
            <StudioCard key={item.label} className={cn(panelClass, SOURCE_TEXT_P_4_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
              <div className={SOURCE_TEXT_MIN_W_0}>
                <p className={SOURCE_TEXT_TEXT_11PX_FONT_BOLD_TEXT_SLATE_400}>{item.label}</p>
                <p className={SOURCE_TEXT_TEXT_XL_SM_TEXT_2XL_FONT_BLACK}>{item.value}</p>
                <p className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_MONO}>{item.desc}</p>
              </div>
              <div className={cn(SOURCE_TEXT_W_10_H_10_ROUNDED_XL_BORDER, item.bg, item.color)}>
                <item.icon className={SOURCE_TEXT_W_5_H_5} />
                {item.hasPulse && <span className={SOURCE_TEXT_ABSOLUTE_TOP_1_RIGHT_1_W_2} />}
              </div>
            </StudioCard>
          ))}
        </div>
        {loadError && (
          <div role={SOURCE_TEXT_ALERT} className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_ROSE_500_30}>
            <span>{loadError}</span>
            <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} onClick={() => refresh().catch(() => setLoadError(t.loadError))}>
              {t.retry}
            </Button>
          </div>
        )}
        {loading ? (
          <StudioCard className={cn(panelClass, SOURCE_TEXT_P_16_FLEX_FLEX_COL_ITEMS_CENTER)}>
            <Sparkles aria-label={t.working} className={SOURCE_TEXT_W_8_H_8_ANIMATE_SPIN_TEXT} />
            <p className={SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_400}>{t.working}</p>
          </StudioCard>
        ) : (
          <div className={SOURCE_TEXT_GRID_GRID_COLS_1_LG_GRID_COLS}>
            <section className={cn(panelClass, SOURCE_TEXT_LG_COL_SPAN_5_P_4_SM)}>
              <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
                  <h2 className={SOURCE_TEXT_TEXT_SM_FONT_BLACK_UPPERCASE_TRACKING_WIDER}>
                    <Layers className={SOURCE_TEXT_W_3_5_H_3_5_TEXT} />
                    <span>{t.list}</span>
                  </h2>
                  <span className={SOURCE_TEXT_PX_2_PY_0_2_ROUNDED_FULL}>{visible.length}</span>
                </div>
              </div>
              <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_P_1}>
                {[
                  { key: SOURCE_TEXT_ALL, label: t.all, count: counts.total },
                  { key: SOURCE_TEXT_OK, label: t.filterOk, count: counts.ok },
                  { key: SOURCE_TEXT_OPEN, label: t.filterOpen, count: counts.open },
                  { key: SOURCE_TEXT_ISSUES, label: t.filterError, count: counts.issues },
                ].map((tab) => (
                  <Button key={tab.key} variant={SOURCE_TEXT_UNSTYLED} onClick={() => setFilterTab(tab.key as typeof filterTab)} className={cn(SOURCE_TEXT_FLEX_1_PY_1_PX_2_ROUNDED, filterTab === tab.key ? SOURCE_TEXT_BG_PURPLE_600_20_TEXT_PURPLE_300 : SOURCE_TEXT_TEXT_SLATE_400_HOVER_TEXT_SLATE_200)}>
                    <span>{tab.label}</span>
                    <span className={SOURCE_TEXT_ML_1_OPACITY_60_TEXT_9PX_FONT}>
                      {SOURCE_TEXT_SYMBOL_47}
                      {tab.count}
                      {SOURCE_TEXT_SYMBOL_12}
                    </span>
                  </Button>
                ))}
              </div>
              <div className={SOURCE_TEXT_RELATIVE}>
                <Search className={SOURCE_TEXT_ABSOLUTE_LEFT_3_TOP_3_W_4} />
                <StudioInput aria-label={t.search} placeholder={t.search} value={query} onChange={(event) => setQuery(event.target.value)} className={cn(controlClass, SOURCE_TEXT_PL_9_PR_8_TEXT_XS)} />
                {query && (
                  <Button variant={SOURCE_TEXT_UNSTYLED} onClick={() => setQuery("")} className={SOURCE_TEXT_ABSOLUTE_RIGHT_2_5_TOP_2_5}>
                    <X className={SOURCE_TEXT_W_3_5_H_3_5} />
                  </Button>
                )}
              </div>
              <div className={SOURCE_TEXT_FLEX_1_MIN_H_360PX_MAX_H}>
                {visible.map((profile) => {
                  const isSelected = selectedId === profile.id;
                  const serverStr = proxyServer(profile);
                  const isSessionActive = profile.session !== SOURCE_TEXT_CLOSED;
                  return (
                    <div key={profile.id} onClick={() => setSelectedId(profile.id)} className={cn(SOURCE_TEXT_GROUP_RELATIVE_ROUNDED_XL_BORDER_P_3, isSelected ? SOURCE_TEXT_BORDER_PURPLE_500_60_BG_GRADIENT_TO : SOURCE_TEXT_BORDER_SLATE_800_90_BG_SLATE_955)}>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                        <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W}>
                          <span className={cn(SOURCE_TEXT_TEXT_XS_FONT_BLACK_TRUNCATE, isSelected ? SOURCE_TEXT_TEXT_PURPLE_200 : SOURCE_TEXT_TEXT_SLATE_100_GROUP_HOVER_TEXT_PURPLE)}>{profile.name}</span>
                          <span className={cn(SOURCE_TEXT_PX_1_5_PY_0_2_ROUNDED, isSelected && SOURCE_TEXT_BG_WHITE_20_TEXT_WHITE_BORDER_WHITE)}>{profile.protocol}</span>
                        </div>
                        {<ProxyConnectionBadge profile={profile} checking={pending[profile.id] === SOURCE_TEXT_CHECK} texts={t} />}
                      </div>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_2}>
                        <span className={cn(SOURCE_TEXT_FONT_MONO_TEXT_11PX_TEXT_SLATE_400, isSelected && SOURCE_TEXT_TEXT_PURPLE_100)}>{serverStr}</span>
                        <Button
                          variant={SOURCE_TEXT_UNSTYLED}
                          type={SOURCE_TEXT_BUTTON}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(SOURCE_TEMPLATE_SYMBOL_78(`${profile.host}`, `${profile.port}`), profile.id);
                          }}
                          title={t.copyHostPort}
                          className={cn(SOURCE_TEXT_P_1_ROUNDED_MD_BG_SLATE_800, isSelected && SOURCE_TEXT_TEXT_PURPLE_100_HOVER_TEXT_WHITE)}>
                          {copiedKey === profile.id ? <Check className={SOURCE_TEXT_W_3_H_3_TEXT_EMERALD_400} /> : <Copy className={SOURCE_TEXT_W_3_H_3} />}
                        </Button>
                      </div>
                      <div className={cn(SOURCE_TEXT_MT_2_5_PT_2_BORDER_T, isSelected && SOURCE_TEXT_BORDER_WHITE_20_TEXT_PURPLE_100)}>
                        <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
                          {isSessionActive ? (
                            <span className={isSelected ? SOURCE_TEXT_TEXT_10PX_FONT_BOLD_TEXT_WHITE_FLEX : SOURCE_TEXT_TEXT_10PX_FONT_BOLD_TEXT_CYAN_300}>
                              <span className={SOURCE_TEXT_W_1_5_H_1_5_ROUNDED} />
                              <Monitor className={SOURCE_TEXT_W_3_H_3} />
                              {sessionText(profile)}
                            </span>
                          ) : (
                            <span className={cn(SOURCE_TEXT_TEXT_SLATE_500_FLEX_ITEMS_CENTER_GAP, isSelected && SOURCE_TEXT_TEXT_PURPLE_100)}>
                              <Monitor className={SOURCE_TEXT_W_3_H_3} />
                              {t.closed}
                            </span>
                          )}
                          {(profile.username || profile.hasPassword) && (
                            <span className={cn(SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_TEXT_SLATE, isSelected && SOURCE_TEXT_TEXT_PURPLE_100)} title={t.hasAuth}>
                              <KeyRound className={SOURCE_TEXT_W_2_5_H_2_5_TEXT} />
                              <span>{profile.username || SOURCE_TEXT_AUTH}</span>
                            </span>
                          )}
                        </div>
                        <ChevronRight className={cn(SOURCE_TEXT_W_3_5_H_3_5_TRANSITION, isSelected ? SOURCE_TEXT_TEXT_WHITE_TRANSLATE_X_0_5 : SOURCE_TEXT_TEXT_SLATE_600)} />
                      </div>
                    </div>
                  );
                })}
                {!visible.length && (
                  <div className={SOURCE_TEXT_FLEX_1_FLEX_FLEX_COL_ITEMS_CENTER}>
                    <Globe className={SOURCE_TEXT_W_9_H_9_TEXT_SLATE_600} />
                    <p className={SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_300}>{profiles.length ? t.noMatch : t.empty}</p>
                    <p className={SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_500_MT_1}>{profiles.length ? SOURCE_TEXT_THU_TIM_KIEM_VOI_TU_KHOA_KHAC : t.emptyHint}</p>
                    {!profiles.length ? (
                      <div className={SOURCE_TEXT_MT_4_FLEX_ITEMS_CENTER_JUSTIFY_CENTER}>
                        <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, primaryBtnClass)} onClick={() => openEditor()}>
                          <Plus className={SOURCE_TEXT_W_3_5_H_3_5} />
                          <span>{t.add}</span>
                        </Button>
                        <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} onClick={() => setImportOpen(true)}>
                          <Download className={SOURCE_TEXT_W_3_5_H_3_5_TEXT} />
                          <span>{t.import}</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant={SOURCE_TEXT_UNSTYLED}
                        className={cn(actionBtnClass, SOURCE_TEXT_MT_3)}
                        onClick={() => {
                          setQuery("");
                          setFilterTab(SOURCE_TEXT_ALL);
                        }}>
                        {t.refresh}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </section>
            <section className={cn(panelClass, SOURCE_TEXT_LG_COL_SPAN_7_P_5_SM)}>
              {!selected ? (
                <div className={SOURCE_TEXT_H_FULL_FLEX_1_FLEX_FLEX_COL}>
                  <div className={SOURCE_TEXT_ABSOLUTE_TOP_0_RIGHT_0_W_64} />
                  <div className={SOURCE_TEXT_SPACE_Y_5}>
                    <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_3}>
                      <div className={SOURCE_TEXT_W_10_H_10_ROUNDED_XL_BG}>
                        <Shield className={SOURCE_TEXT_W_5_H_5} />
                      </div>
                      <div>
                        <h2 className={SOURCE_TEXT_TEXT_SM_SM_TEXT_BASE_FONT_BLACK}>{t.hubTitle}</h2>
                        <p className={SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_MT_0}>{t.hubDesc}</p>
                      </div>
                    </div>
                    <div className={SOURCE_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS}>
                      <div className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG}>
                        <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT}>
                          <Plus className={SOURCE_TEXT_W_3_5_H_3_5} />
                          <span>{t.step1Title}</span>
                        </div>
                        <p className={SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400_LEADING_RELAXED}>{t.step1Desc}</p>
                      </div>
                      <div className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG}>
                        <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_2}>
                          <Activity className={SOURCE_TEXT_W_3_5_H_3_5} />
                          <span>{t.step2Title}</span>
                        </div>
                        <p className={SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400_LEADING_RELAXED}>{t.step2Desc}</p>
                      </div>
                      <div className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG}>
                        <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_3}>
                          <Monitor className={SOURCE_TEXT_W_3_5_H_3_5} />
                          <span>{t.step3Title}</span>
                        </div>
                        <p className={SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400_LEADING_RELAXED}>{t.step3Desc}</p>
                      </div>
                    </div>
                    <div className={SOURCE_TEXT_P_3_5_ROUNDED_XL_BG_SLATE}>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_SLATE}>
                        <ShieldCheck className={SOURCE_TEXT_W_4_H_4_TEXT_EMERALD_400_2} />
                        <span>{t.networkHint}</span>
                      </div>
                      <p className={SOURCE_TEXT_TEXT_SLATE_400_PL_6_LEADING_RELAXED}>{t.browserHint}</p>
                    </div>
                  </div>
                  <div className={SOURCE_TEXT_MT_6_PT_4_BORDER_T_BORDER}>
                    <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, primaryBtnClass, SOURCE_TEXT_PX_4_PY_2)} onClick={() => openEditor()}>
                      <Plus className={SOURCE_TEXT_W_4_H_4} />
                      <span>{t.quickAdd}</span>
                    </Button>
                    <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} onClick={() => setImportOpen(true)}>
                      <Download className={SOURCE_TEXT_W_4_H_4_TEXT_PURPLE_400} />
                      <span>{t.import}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={SOURCE_TEXT_H_FULL_FLEX_1_FLEX_FLEX_COL_2}>
                  <div className={SOURCE_TEXT_FLEX_FLEX_COL_SM_FLEX_ROW_SM}>
                    <div className={SOURCE_TEXT_MIN_W_0}>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP}>
                        <span className={SOURCE_TEXT_TEXT_10PX_UPPERCASE_TRACKING_WIDEST_TEXT_PURPLE}>{t.detail}</span>
                        <span className={SOURCE_TEXT_PX_1_5_PY_0_2_ROUNDED_2}>{selected.protocol}</span>
                      </div>
                      <h2 className={SOURCE_TEXT_TEXT_LG_SM_TEXT_XL_FONT_BLACK}>{selected.name}</h2>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MT_1}>
                        <p className={SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_FONT_MONO}>{proxyServer(selected)}</p>
                        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => handleCopy(SOURCE_TEMPLATE_SYMBOL_78(`${selected.host}`, `${selected.port}`), SOURCE_TEXT_SELECTED_HOST)} title={t.copyHostPort} className={SOURCE_TEXT_P_1_ROUNDED_MD_BG_SLATE_800_2}>
                          {copiedKey === SOURCE_TEXT_SELECTED_HOST ? <Check className={SOURCE_TEXT_W_3_H_3_TEXT_EMERALD_400} /> : <Copy className={SOURCE_TEXT_W_3_H_3} />}
                        </Button>
                      </div>
                    </div>
                    <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP_2}>
                      {<ProxyConnectionBadge profile={selected} checking={pending[selected.id] === SOURCE_TEXT_CHECK} texts={t} />}
                      <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} disabled={locked} onClick={() => check(selected.id)} title={t.check}>
                        {pending[selected.id] === SOURCE_TEXT_CHECK ? <Sparkles className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_10} /> : <Activity className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_2} />}
                        <span>{pending[selected.id] === SOURCE_TEXT_CHECK ? t.checking : t.check}</span>
                      </Button>
                      <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} disabled={locked || selected.session !== SOURCE_TEXT_CLOSED} onClick={() => openEditor(selected)} title={selected.session !== SOURCE_TEXT_CLOSED ? t.busyHint : t.edit}>
                        <Pencil className={SOURCE_TEXT_W_3_5_H_3_5} />
                        <span>{t.edit}</span>
                      </Button>
                      <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, SOURCE_TEXT_BORDER_ROSE_500_30_BG_ROSE_500)} disabled={locked || selected.session !== SOURCE_TEXT_CLOSED} onClick={() => setDeleteProfile(selected)} title={selected.session !== SOURCE_TEXT_CLOSED ? t.busyHint : t.remove}>
                        <Trash2 className={SOURCE_TEXT_W_3_5_H_3_5} />
                        <span>{t.remove}</span>
                      </Button>
                    </div>
                  </div>
                  <StudioCard className={SOURCE_TEXT_ROUNDED_2XL_BORDER_BORDER_PURPLE_500_30}>
                    <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
                        <Monitor className={SOURCE_TEXT_W_4_H_4_TEXT_CYAN_400} />
                        <h3 className={SOURCE_TEXT_TEXT_XS_FONT_BLACK_UPPERCASE_TRACKING_WIDER}>{t.launchTitle}</h3>
                      </div>
                      {selected.session !== SOURCE_TEXT_CLOSED && (
                        <span className={SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5}>
                          <span className={SOURCE_TEXT_W_1_5_H_1_5_ROUNDED} />
                          <span>{sessionText(selected)}</span>
                        </span>
                      )}
                    </div>
                    <p className={SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400}>{t.launchDesc}</p>
                    <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_FLEX}>
                      <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, primaryBtnClass, SOURCE_TEXT_PX_4_PY_2_5_TEXT_XS)} disabled={locked} onClick={() => launch(SOURCE_TEXT_BROWSER)}>
                        {pending[selected.id] === SOURCE_TEMPLATE_OPEN_2(`${SOURCE_TEXT_BROWSER}`) || pending[selected.id] === SOURCE_TEXT_OPEN ? <Sparkles className={SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_2} /> : <Monitor className={SOURCE_TEXT_W_4_H_4} />}
                        <span>{pending[selected.id] === SOURCE_TEMPLATE_OPEN_2(`${SOURCE_TEXT_BROWSER}`) || pending[selected.id] === SOURCE_TEXT_OPEN ? t.working : t.open}</span>
                        {!(pending[selected.id] === SOURCE_TEMPLATE_OPEN_2(`${SOURCE_TEXT_BROWSER}`) || pending[selected.id] === SOURCE_TEXT_OPEN) && <ArrowUpRight className={SOURCE_TEXT_W_3_5_H_3_5_ML} />}
                      </Button>
                      <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, SOURCE_TEXT_PX_3_5_PY_2_5)} disabled={locked} onClick={() => launch(SOURCE_TEXT_YOUTUBE)}>
                        {pending[selected.id] === SOURCE_TEMPLATE_OPEN_2(`${SOURCE_TEXT_YOUTUBE}`) ? <Sparkles className={SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_3} /> : <Play className={SOURCE_TEXT_W_4_H_4_TEXT_ROSE_400} />}
                        <span>{pending[selected.id] === SOURCE_TEMPLATE_OPEN_2(`${SOURCE_TEXT_YOUTUBE}`) ? t.working : t.youtube}</span>
                      </Button>
                      <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, SOURCE_TEXT_PX_3_5_PY_2_5)} disabled={locked} onClick={() => launch(SOURCE_TEXT_STUDIO)}>
                        {pending[selected.id] === SOURCE_TEMPLATE_OPEN_2(`${SOURCE_TEXT_STUDIO}`) ? <Sparkles className={SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_4} /> : <Clapperboard className={SOURCE_TEXT_W_4_H_4_TEXT_AMBER_400} />}
                        <span>{pending[selected.id] === SOURCE_TEMPLATE_OPEN_2(`${SOURCE_TEXT_STUDIO}`) ? t.working : t.studio}</span>
                      </Button>
                      {selected.session === SOURCE_TEXT_OPEN && (
                        <Button
                          variant={SOURCE_TEXT_UNSTYLED}
                          className={cn(actionBtnClass, SOURCE_TEXT_BORDER_ROSE_500_40_BG_ROSE_500)}
                          disabled={locked}
                          onClick={() =>
                            run(selected.id, SOURCE_TEXT_CLOSE_2, async () => {
                              await api(SOURCE_TEMPLATE_CLOSE(`${selected.id}`), SOURCE_TEXT_POST);
                              if (mounted.current) toast.success(t.sessionClosed);
                            })
                          }>
                          {pending[selected.id] === SOURCE_TEXT_CLOSE_2 ? <Sparkles className={SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_5} /> : <X className={SOURCE_TEXT_W_4_H_4} />}
                          <span>{pending[selected.id] === SOURCE_TEXT_CLOSE_2 ? t.working : t.close}</span>
                        </Button>
                      )}
                    </div>
                    {selected.session !== SOURCE_TEXT_CLOSED && <p className={SOURCE_TEXT_TEXT_11PX_TEXT_AMBER_300_90_FONT}>{t.busyHint}</p>}
                  </StudioCard>
                  <div className={SOURCE_TEXT_GRID_GRID_COLS_2_SM_GRID_COLS}>
                    <div className={SOURCE_TEXT_ROUNDED_XL_BG_SLATE_950_70_BORDER}>
                      <p className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_BOLD}>{t.ip}</p>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_1}>
                        <p className={SOURCE_TEXT_TEXT_XS_FONT_BOLD_FONT_MONO_TEXT}>{selected.check?.ip || SOURCE_TEXT_SYMBOL_48}</p>
                        {selected.check?.ip && (
                          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => handleCopy(selected.check!.ip!, SOURCE_TEXT_IP)} title={t.copyIp} className={SOURCE_TEXT_P_1_TEXT_SLATE_500_HOVER_TEXT}>
                            {copiedKey === SOURCE_TEXT_IP ? <Check className={SOURCE_TEXT_W_3_H_3_TEXT_EMERALD_400} /> : <Copy className={SOURCE_TEXT_W_3_H_3} />}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className={SOURCE_TEXT_ROUNDED_XL_BG_SLATE_950_70_BORDER}>
                      <p className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_BOLD}>{t.latency}</p>
                      <p className={cn(SOURCE_TEXT_TEXT_XS_FONT_BOLD_FONT_MONO_MT, selected.check?.latencyMs === undefined ? SOURCE_TEXT_TEXT_SLATE_400 : selected.check.latencyMs < 300 ? SOURCE_TEXT_TEXT_EMERALD_400 : selected.check.latencyMs < 800 ? SOURCE_TEXT_TEXT_AMBER_400 : SOURCE_TEXT_TEXT_ROSE_400)}>
                        {selected.check?.latencyMs !== undefined ? SOURCE_TEMPLATE_MS(`${selected.check.latencyMs}`) : SOURCE_TEXT_SYMBOL_48}
                      </p>
                    </div>
                    <div className={SOURCE_TEXT_ROUNDED_XL_BG_SLATE_950_70_BORDER}>
                      <p className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_BOLD}>{t.checkedAt}</p>
                      <p className={SOURCE_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200}>{selected.check?.checkedAt ? new Date(selected.check.checkedAt).toLocaleTimeString(currentLang === SOURCE_TEXT_EN ? SOURCE_TEXT_EN_US : SOURCE_TEXT_VI_VN, { hour: SOURCE_TEXT_2_DIGIT, minute: SOURCE_TEXT_2_DIGIT }) : t.never}</p>
                    </div>
                    <div className={SOURCE_TEXT_ROUNDED_XL_BG_SLATE_950_70_BORDER}>
                      <p className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_BOLD}>{t.auth}</p>
                      <p className={SOURCE_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200}>{selected.username || selected.hasPassword ? t.hasAuth : t.noAuth}</p>
                    </div>
                  </div>
                  {selected.check?.error && (
                    <div role={SOURCE_TEXT_ALERT} className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_ROSE_500_30_2}>
                      <AlertTriangle className={SOURCE_TEXT_W_4_H_4_SHRINK_0_TEXT} />
                      <div className={SOURCE_TEXT_SPACE_Y_0_5}>
                        <p className={SOURCE_TEXT_FONT_BOLD}>{t.failed}</p>
                        <p className={SOURCE_TEXT_LEADING_RELAXED_OPACITY_90}>{selected.check.error}</p>
                      </div>
                    </div>
                  )}
                  <div className={SOURCE_TEXT_ROUNDED_XL_BG_SLATE_950_60_BORDER}>
                    <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_TEXT_XS}>
                      <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
                        <KeyRound className={SOURCE_TEXT_W_3_5_H_3_5_TEXT} />
                        <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_300}>{t.securityTitle}</span>
                      </div>
                      <span className={SOURCE_TEXT_TEXT_11PX_FONT_MONO_TEXT_SLATE_500}>{selected.hasPassword ? t.savedPassword : t.noAuth}</span>
                    </div>
                    <div className={SOURCE_TEXT_GRID_GRID_COLS_2_SM_GRID_COLS_2}>
                      <div className={SOURCE_TEXT_P_2_5_ROUNDED_LG_BG_SLATE}>
                        <span className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_FONT}>{SOURCE_TEXT_HOST}</span>
                        <span className={SOURCE_TEXT_FONT_MONO_TEXT_SLATE_200_TRUNCATE_BLOCK}>{selected.host}</span>
                      </div>
                      <div className={SOURCE_TEXT_P_2_5_ROUNDED_LG_BG_SLATE}>
                        <span className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_FONT}>{SOURCE_TEXT_PORT}</span>
                        <span className={SOURCE_TEXT_FONT_MONO_TEXT_SLATE_200_TRUNCATE_BLOCK}>{selected.port}</span>
                      </div>
                      <div className={SOURCE_TEXT_P_2_5_ROUNDED_LG_BG_SLATE_2}>
                        <span className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_FONT}>{SOURCE_TEXT_USER_2}</span>
                        <span className={SOURCE_TEXT_FONT_MONO_TEXT_SLATE_200_TRUNCATE_BLOCK}>{selected.username || SOURCE_TEXT_SYMBOL_48}</span>
                      </div>
                    </div>
                    {selected.notes && (
                      <div className={SOURCE_TEXT_PT_2_BORDER_T_BORDER_SLATE_800}>
                        <p className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_BOLD_2}>{t.notes}</p>
                        <p className={SOURCE_TEXT_TEXT_XS_TEXT_SLATE_300_WHITESPACE_PRE}>{selected.notes}</p>
                      </div>
                    )}
                  </div>
                  <p className={SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED}>{t.browserHint}</p>
                </div>
              )}
            </section>
          </div>
        )}
        <div className={SOURCE_TEXT_PT_2_BORDER_T_BORDER_SLATE_800_2}>
          <div role={SOURCE_TEXT_STATUS} className={cn(SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2, draftStatus === SOURCE_TEXT_ERROR ? SOURCE_TEXT_TEXT_ROSE_300 : draftStatus === SOURCE_TEXT_SAVING ? SOURCE_TEXT_TEXT_PURPLE_300 : SOURCE_TEXT_TEXT_SLATE_500)}>
            {draftStatus === SOURCE_TEXT_SAVING ? <Sparkles className={SOURCE_TEXT_W_3_5_H_3_5_ANIMATE} /> : <ShieldCheck className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_2} />}
            <span>{draftStatus === SOURCE_TEXT_SAVED ? t.draftSaved : draftStatus === SOURCE_TEXT_SAVING ? t.draftSaving : t.draftError}</span>
            {draftStatus === SOURCE_TEXT_ERROR && (
              <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, SOURCE_TEXT_PY_0_5_PX_2_TEXT_10PX)} onClick={retrySave}>
                {t.retry}
              </Button>
            )}
          </div>
          <p className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_4}>
            <ShieldCheck className={SOURCE_TEXT_W_3_5_H_3_5_SHRINK} />
            <span>{t.networkHint}</span>
          </p>
        </div>
      </StudioCanvas>
      <Modal
        isOpen={editor !== null}
        onClose={() => {
          if (!saving) {
            setEditor(null);
            setForm(emptyForm());
          }
        }}
        title={
          <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5}>
            <div className={SOURCE_TEXT_W_8_H_8_ROUNDED_XL_BG}>{editor?.id ? <Pencil className={SOURCE_TEXT_W_4_H_4} /> : <Plus className={SOURCE_TEXT_W_4_H_4} />}</div>
            <div className={SOURCE_TEXT_MIN_W_0_TEXT_LEFT}>
              <span className={SOURCE_TEXT_TEXT_SM_FONT_BLACK_TRACKING_WIDER_TEXT}>{editor?.id ? t.editTitle : t.add}</span>
              <p className={SOURCE_TEXT_TEXT_10PX_FONT_MEDIUM_TEXT_SLATE_400_2}>{editor?.id ? SOURCE_TEXT_CAP_NHAT_CAU_HINH_KET_NOI_PROXY : SOURCE_TEXT_THEM_CAU_HINH_PROXY_MOI_VAO_HE}</p>
            </div>
          </div>
        }
        maxWidth={SOURCE_TEXT_XL}>
        <form onSubmit={save} className={SOURCE_TEXT_SPACE_Y_4}>
          <label className={SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS}>
            <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS}>
                <Globe className={SOURCE_TEXT_W_3_5_H_3_5_TEXT} />
                <span>{t.name}</span>
                <span className={SOURCE_TEXT_TEXT_PINK_400_FONT_BLACK}>{SOURCE_BROWSER_TEXT_SYMBOL}</span>
              </span>
              <span className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_MONO_2}>{SOURCE_TEXT_TEN_GOI_NHO}</span>
            </div>
            <StudioInput autoFocus required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={controlClass} placeholder={SOURCE_TEXT_YOUTUBE_STUDIO_01} />
          </label>
          <div className={SOURCE_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_3}>
            <label className={SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS_2}>
              <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS}>
                <Layers className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_11} />
                <span>{t.protocol}</span>
                <span className={SOURCE_TEXT_TEXT_PINK_400_FONT_BLACK}>{SOURCE_BROWSER_TEXT_SYMBOL}</span>
              </span>
              <StudioSelect className={controlClass} value={form.protocol} onChange={(event) => setForm({ ...form, protocol: event.target.value as ProxyInput["protocol"] })}>
                <option value={SOURCE_BROWSER_TEXT_HTTP}>{SOURCE_TEXT_HTTP_2}</option>
                <option value={SOURCE_TEXT_HTTPS_2}>{SOURCE_TEXT_HTTPS_3}</option>
                <option value={SOURCE_TEXT_SOCKS5}>{SOURCE_TEXT_SOCKS5_2}</option>
              </StudioSelect>
            </label>
            <label className={SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS_3}>
              <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS}>
                <Monitor className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_2} />
                <span>{t.host}</span>
                <span className={SOURCE_TEXT_TEXT_PINK_400_FONT_BLACK}>{SOURCE_BROWSER_TEXT_SYMBOL}</span>
              </span>
              <StudioInput required maxLength={253} className={controlClass} value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} placeholder={SOURCE_TEXT_PROXY_EXAMPLE_COM} />
            </label>
          </div>
          <div className={SOURCE_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_4}>
            <label className={SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS}>
              <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS}>
                <Activity className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_12} />
                <span>{t.port}</span>
                <span className={SOURCE_TEXT_TEXT_PINK_400_FONT_BLACK}>{SOURCE_BROWSER_TEXT_SYMBOL}</span>
              </span>
              <StudioInput required type={SOURCE_TEXT_NUMBER} min={1} max={65535} className={controlClass} value={form.port || ""} onChange={(event) => setForm({ ...form, port: Number(event.target.value) })} placeholder={SOURCE_TEXT_8080} />
            </label>
            <label className={SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS}>
              <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS}>
                  <KeyRound className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_13} />
                  <span>{t.username}</span>
                </span>
                <span className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_MONO_2}>{SOURCE_TEXT_TUY_CHON}</span>
              </div>
              <StudioInput autoComplete={SOURCE_TEXT_OFF} maxLength={512} className={controlClass} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder={t.optional} />
            </label>
          </div>
          <label className={SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS}>
            <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS}>
                <Shield className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_14} />
                <span>{t.password}</span>
              </span>
              {editor?.hasPassword && !form.clearPassword && (
                <span className={SOURCE_TEXT_TEXT_10PX_TEXT_EMERALD_400_FONT_SEMIBOLD}>
                  <ShieldCheck className={SOURCE_TEXT_W_3_H_3} />
                  <span>{SOURCE_TEXT_DA_LUU_BAO_MAT}</span>
                </span>
              )}
            </div>
            <div className={SOURCE_TEXT_RELATIVE}>
              <StudioInput
                autoComplete={SOURCE_TEXT_NEW_PASSWORD}
                type={showPassword ? SOURCE_TEXT_TEXT : SOURCE_TEXT_PASSWORD}
                disabled={form.clearPassword}
                maxLength={2048}
                className={cn(controlClass, SOURCE_TEXT_PR_11, form.clearPassword && SOURCE_TEXT_OPACITY_40_CURSOR_NOT_ALLOWED)}
                value={form.password || ""}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder={editor?.hasPassword ? t.savedPassword : SOURCE_TEXT_SYMBOL_49}
              />
              <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} aria-label={showPassword ? t.hidePassword : t.showPassword} onClick={() => setShowPassword(!showPassword)} className={SOURCE_TEXT_ABSOLUTE_RIGHT_2_5_TOP_1_2}>
                {showPassword ? <EyeOff className={SOURCE_TEXT_W_4_H_4} /> : <Eye className={SOURCE_TEXT_W_4_H_4} />}
              </Button>
            </div>
          </label>
          {editor?.hasPassword && (
            <div
              role={SOURCE_TEXT_BUTTON}
              tabIndex={0}
              onClick={() => setForm({ ...form, clearPassword: !form.clearPassword, password: "" })}
              onKeyDown={(e) => {
                if (e.key === SOURCE_TEXT_ENTER || e.key === SOURCE_TEXT_SYMBOL_52) {
                  e.preventDefault();
                  setForm({ ...form, clearPassword: !form.clearPassword, password: "" });
                }
              }}
              className={cn(SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_3, form.clearPassword ? SOURCE_TEXT_BORDER_PINK_500_50_BG_GRADIENT_TO : SOURCE_TEXT_BORDER_SLATE_800_80_BG_SLATE_900)}>
              <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN}>
                <div className={cn(SOURCE_TEXT_W_8_H_8_ROUNDED_LG_FLEX, form.clearPassword ? SOURCE_TEXT_BG_PINK_500_20_TEXT_PINK_300 : SOURCE_TEXT_BG_SLATE_800_TEXT_SLATE_400)}>
                  <KeyRound className={SOURCE_TEXT_W_4_H_4} />
                </div>
                <div className={SOURCE_TEXT_MIN_W_0_TEXT_LEFT}>
                  <p className={cn(SOURCE_TEXT_TEXT_XS_FONT_BOLD_TRANSITION_COLORS, form.clearPassword ? SOURCE_TEXT_TEXT_PINK_200 : SOURCE_TEXT_TEXT_SLATE_200)}>{t.clearPassword}</p>
                  <p className={SOURCE_TEXT_TEXT_11PX_TEXT_SLATE_400}>{form.clearPassword ? SOURCE_TEXT_MAT_KHAU_HIEN_TAI_SE_BI_XOA : SOURCE_TEXT_DE_TRONG_O_MAT_KHAU_O_TREN}</p>
                </div>
              </div>
              <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_SHRINK_0}>
                <StudioInput type={SOURCE_TEXT_CHECKBOX} className={SOURCE_TEXT_SR_ONLY} checked={Boolean(form.clearPassword)} onChange={(e) => setForm({ ...form, clearPassword: e.target.checked, password: "" })} tabIndex={-1} />
                <button
                  type={SOURCE_TEXT_BUTTON}
                  role={SOURCE_TEXT_SWITCH}
                  aria-checked={Boolean(form.clearPassword)}
                  aria-label={t.clearPassword}
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm({ ...form, clearPassword: !form.clearPassword, password: "" });
                  }}
                  className={cn(SOURCE_TEXT_TOGGLE_SWITCH_SELECT_NONE_FOCUS_OUTLINE_NONE, form.clearPassword ? SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600 : SOURCE_TEXT_BG_SLATE_800_BORDER_BORDER_SLATE_700)}>
                  <span aria-hidden={true} className={cn(SOURCE_TEXT_TOGGLE_SWITCH_THUMB_SHADOW_MD_TRANSITION_TRANSFORM, form.clearPassword ? SOURCE_TEXT_TRANSLATE_X_20PX_BG_WHITE : SOURCE_TEXT_TRANSLATE_X_0_BG_SLATE_300)} />
                </button>
              </div>
            </div>
          )}
          <label className={SOURCE_TEXT_BLOCK_SPACE_Y_1_5_TEXT_XS}>
            <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200_FLEX_ITEMS}>
                <FileText className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_15} />
                <span>{t.notes}</span>
              </span>
              <span className={SOURCE_TEXT_TEXT_10PX_TEXT_SLATE_500_FONT_MONO_2}>{SOURCE_TEXT_TUY_CHON}</span>
            </div>
            <StudioTextarea maxLength={2000} rows={3} className={controlClass} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={t.notesPlaceholder} />
          </label>
          {form.protocol === SOURCE_TEXT_SOCKS5 && (
            <div className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_AMBER_500_30}>
              <AlertTriangle className={SOURCE_TEXT_W_4_H_4_TEXT_AMBER_400_2} />
              <span>{t.socksHint}</span>
            </div>
          )}
          {formError && (
            <div role={SOURCE_TEXT_ALERT} className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_ROSE_500_30_3}>
              <AlertTriangle className={SOURCE_TEXT_W_4_H_4_TEXT_ROSE_400_2} />
              <span>{formError}</span>
            </div>
          )}
          <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2}>
            <Button
              variant={SOURCE_TEXT_UNSTYLED}
              type={SOURCE_TEXT_BUTTON}
              className={actionBtnClass}
              disabled={saving}
              onClick={() => {
                setEditor(null);
                setForm(emptyForm());
              }}>
              {t.cancel}
            </Button>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_SUBMIT} className={cn(actionBtnClass, primaryBtnClass, SOURCE_TEXT_PX_5_PY_2_5_TEXT_XS)} disabled={saving}>
              {saving ? <Sparkles className={SOURCE_TEXT_W_3_5_H_3_5_ANIMATE_2} /> : <Check className={SOURCE_TEXT_W_3_5_H_3_5_SHRINK_2} />}
              <span>{t.save}</span>
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={importOpen}
        onClose={() => {
          if (!saving) {
            setImportOpen(false);
            setImportText("");
          }
        }}
        title={t.import}
        maxWidth={SOURCE_TEXT_XL}>
        <div className={SOURCE_TEXT_SPACE_Y_4}>
          <div className={SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
            <p className={SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED_2}>{t.importHint}</p>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handlePasteSampleImport} className={SOURCE_TEXT_TEXT_11PX_FONT_BOLD_TEXT_PURPLE_400}>
              {t.sampleImport}
            </Button>
          </div>
          <StudioTextarea
            aria-label={t.import}
            rows={6}
            spellCheck={false}
            autoComplete={SOURCE_TEXT_OFF}
            className={cn(controlClass, SOURCE_TEXT_FONT_MONO_TEXT_XS_CUSTOM_SCROLLBAR)}
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportError("");
            }}
            placeholder={SOURCE_TEXT_127_0_0_1_8080_USERNAME_PASSWORD}
          />
          <div className={SOURCE_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_OVERFLOW}>
            <div className={SOURCE_TEXT_P_3_BG_SLATE_900_TEXT_XS}>
              <span>{t.preview}</span>
              <span className={SOURCE_TEXT_FONT_MONO}>
                <span className={SOURCE_TEXT_TEXT_EMERALD_400}>
                  {validCount} {t.valid}
                </span>
                {SOURCE_TEXT_SYMBOL_52}
                {SOURCE_TEXT_SYMBOL_50}
                <span className={SOURCE_TEXT_TEXT_ROSE_400}>
                  {importRows.length - validCount} {t.invalid}
                </span>
              </span>
            </div>
            <div className={SOURCE_TEXT_MAX_H_48_OVERFLOW_Y_AUTO_CUSTOM}>
              {!importRows.length && <p className={SOURCE_TEXT_P_3_TEXT_XS_TEXT_SLATE_500}>{t.importEmpty}</p>}
              {importRows.map((row) => (
                <div key={row.line} className={SOURCE_TEXT_P_2_5_TEXT_11PX_FLEX_GAP}>
                  <span className={SOURCE_TEXT_TEXT_SLATE_500_SHRINK_0_W_14}>
                    {t.line} {row.line}
                  </span>
                  <span className={cn(SOURCE_TEXT_BREAK_ALL_FLEX_1, row.error ? SOURCE_TEXT_TEXT_ROSE_300_FONT_SEMIBOLD : SOURCE_TEXT_TEXT_SLATE_300)}>{row.error || (row.input && SOURCE_TEMPLATE_SYMBOL_75(`${proxyServer(row.input)}`, `${row.input.username ? SOURCE_TEMPLATE_SYMBOL_80(`${row.input.username}`) : ""}`))}</span>
                  {row.error ? <XCircle className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_3} /> : <CheckCircle2 className={SOURCE_TEXT_W_3_5_H_3_5_TEXT_4} />}
                </div>
              ))}
            </div>
          </div>
          {importRows.length > 200 && (
            <p role={SOURCE_TEXT_ALERT} className={SOURCE_TEXT_TEXT_XS_TEXT_ROSE_300_FONT_BOLD}>
              {t.importTooMany}
            </p>
          )}
          {importError && (
            <p role={SOURCE_TEXT_ALERT} className={SOURCE_TEXT_TEXT_XS_TEXT_ROSE_300_FONT_BOLD}>
              {importError}
            </p>
          )}
          <div className={SOURCE_TEXT_FLEX_JUSTIFY_END_GAP_2_PT_2}>
            <Button
              variant={SOURCE_TEXT_UNSTYLED}
              className={actionBtnClass}
              disabled={saving}
              onClick={() => {
                setImportOpen(false);
                setImportText("");
              }}>
              {t.cancel}
            </Button>
            <Button variant={SOURCE_TEXT_UNSTYLED} className={cn(actionBtnClass, primaryBtnClass)} disabled={saving || !validCount || validCount !== importRows.length || validCount > 200} onClick={importList}>
              {saving && <Sparkles className={SOURCE_TEXT_W_3_5_H_3_5_ANIMATE_3} />}
              <span>{t.importConfirm}</span>
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={Boolean(deleteProfile)}
        onClose={() => {
          if (!deleteProfile || !pending[deleteProfile.id]) setDeleteProfile(null);
        }}
        title={t.deleteTitle}>
        <div className={SOURCE_TEXT_SPACE_Y_4}>
          <div className={SOURCE_TEXT_P_3_ROUNDED_XL_BG_SLATE_950}>
            <p className={SOURCE_TEXT_TEXT_SM_FONT_BOLD_TEXT_SLATE_100}>{deleteProfile?.name}</p>
            <p className={SOURCE_TEXT_TEXT_XS_FONT_MONO_TEXT_SLATE_400}>{deleteProfile ? proxyServer(deleteProfile) : ""}</p>
          </div>
          <p className={SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED_2}>{t.deleteHint}</p>
          <div className={SOURCE_TEXT_FLEX_JUSTIFY_END_GAP_2_PT_2}>
            <Button variant={SOURCE_TEXT_UNSTYLED} className={actionBtnClass} disabled={Boolean(deleteProfile && pending[deleteProfile.id])} onClick={() => setDeleteProfile(null)}>
              {t.cancel}
            </Button>
            <Button
              variant={SOURCE_TEXT_UNSTYLED}
              className={cn(actionBtnClass, SOURCE_TEXT_BORDER_ROSE_500_40_BG_ROSE_500_2)}
              disabled={Boolean(deleteProfile && pending[deleteProfile.id])}
              onClick={() =>
                deleteProfile &&
                run(deleteProfile.id, SOURCE_TEXT_DELETE, async () => {
                  await api(SOURCE_TEMPLATE_SYMBOL_76(`${deleteProfile.id}`), SOURCE_TEXT_DELETE_2);
                  if (mounted.current) {
                    setDeleteProfile(null);
                    toast.success(t.deleted);
                  }
                })
              }>
              <Trash2 className={SOURCE_TEXT_W_3_5_H_3_5} />
              <span>{t.remove}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </StudioPage>
  );
}
