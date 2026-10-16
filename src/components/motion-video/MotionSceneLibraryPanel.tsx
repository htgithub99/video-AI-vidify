import { StudioCard, StudioHeader, StudioInput, StudioLoadingState, StudioTextarea } from "../ui/Studio.js";
import { Pagination } from "../ui/Pagination.js";
import { STUDIO_PAGINATION_TEXT } from "../../constants/studioTheme.js";
import { getPagination } from "../../lib/pagination.js";
import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import * as SRT from "../../constants/sourceText.js";
import { MotionDetailRow } from "./MotionDetailRow.js";
import { MotionSceneFilterChip } from "./MotionSceneFilterChip.js";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { toast } from "sonner";
import { Box, Building2, Car, Check, ChevronLeft, ChevronRight, Download, Eye, FolderOpen, Images, Library, MapPin, Package, Pencil, Plus, RefreshCw, Repeat, Search, Sparkles, Trash2, TreePine, Upload, Users, Wand2, X } from "lucide-react";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_SCENE_LIBRARY as C, MOTION_SCENE_LIBRARY_STYLES as S, MOTION_SCENE_LIBRARY_TEXT } from "../../constants/motionSceneLibrary.js";
import { MOTION_SCENE_GROUPS, MOTION_SCENE_TYPES, motionSceneType, type MotionSceneGroup } from "../../constants/motionSceneCatalog.js";
import type { MotionStudio } from "../../hooks/useMotionStudio.js";
import type { Lang } from "../../lib/lang.js";
import { getMotionErrorMessage } from "../../lib/motionUtils.js";
import { motionSceneAiExecution } from "../../lib/motionSceneAi.js";
import { cn } from "../../lib/utils";
import { MotionJobStatus, type MotionSceneAsset, type MotionSceneCustomItem, type MotionSceneLibraryList, type MotionSceneStyleSet, type MotionStoryJobState, type MotionStyleReference } from "../../types/motionVideo.js";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ActionBtn, MotionSelectField } from "./MotionControls.js";
import { motionRequest } from "./motionApi";
const STYLES_TAB = C.STYLES_FOLDER;
type LibraryTab = MotionSceneGroup | typeof STYLES_TAB;
const ALL = SRT.SOURCE_BROWSER_TEXT_SYMBOL;
const POLL_MS = 2000;
const LOG_LINES = 14;
const STYLE_THUMBS = 4;
const CLEAR_CONFIRM_MS = 4000;
const TIMES = [XRT.NIGHT, XRT.DUSK, XRT.DAWN, SRT.SOURCE_TEXT_DAY, XRT.OVERCAST, XRT.INTERIOR, XRT.INTERIOR_DARK] as const;
const GROUP_CONFIG: Record<MotionSceneGroup, { icon: typeof Box; color: string; badgeBg: string }> = {
  character: { icon: Users, color: S.TEXT_PURPLE_400, badgeBg: S.BG_PURPLE_500_15_BORDER_PURPLE_500_30_TEXT_PURPLE_300 },
  location: { icon: MapPin, color: S.TEXT_EMERALD_400, badgeBg: S.BG_EMERALD_500_15_BORDER_EMERALD_500_30_TEXT_EMERALD_300 },
  vehicle: { icon: Car, color: S.TEXT_SKY_400, badgeBg: S.BG_SKY_500_15_BORDER_SKY_500_30_TEXT_SKY_300 },
  tree: { icon: TreePine, color: S.TEXT_GREEN_400, badgeBg: S.BG_GREEN_500_15_BORDER_GREEN_500_30_TEXT_GREEN_300 },
  building: { icon: Building2, color: S.TEXT_AMBER_400, badgeBg: S.BG_AMBER_500_15_BORDER_AMBER_500_30_TEXT_AMBER_300 },
  prop: { icon: Package, color: S.TEXT_ORANGE_400, badgeBg: S.BG_ORANGE_500_15_BORDER_ORANGE_500_30_TEXT_ORANGE_300 },
};
const ACTIVE = [MotionJobStatus.RENDERING, MotionJobStatus.QUEUED, MotionJobStatus.PREPARING];
const textOf = (lang: Lang) => MOTION_SCENE_LIBRARY_TEXT[lang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI];
const groupOf = (item: MotionSceneAsset): MotionSceneGroup => motionSceneType(item.type)?.group || (item.kind === C.KIND_CHARACTER ? C.KIND_CHARACTER : item.kind === C.KIND_LOCATION ? C.KIND_LOCATION : (C.KIND_PROP as MotionSceneGroup));
const typeLabel = (id: string | undefined, lang: Lang): string => {
  const type = motionSceneType(id);
  return type ? (lang === MR.MOTION_TEXT_EN ? type.en : type.vi) : MR.MOTION_TEXT_EMPTY;
};
const styleLabel = (key: string, styles: MotionSceneStyleSet[], t: ReturnType<typeof textOf>): string => {
  const style = styles.find((entry) => entry.key === key);
  if (style) return style.name + C.TEXT.SEP + (style.drawingMode === MR.MOTION_TEXT_2D ? t.MODE_2D : t.MODE_3D);
  if (key.startsWith(C.STYLE_SHARED)) return t.SHARED_STYLE + C.TEXT.SEP + (key.endsWith(MR.MOTION_TEXT_2D) ? t.MODE_2D : t.MODE_3D);
  if (key.startsWith(C.STYLE_PLAIN)) return t.PLAIN_STYLE + C.TEXT.SEP + (key.endsWith(MR.MOTION_TEXT_2D) ? t.MODE_2D : t.MODE_3D);
  return key;
};
const useSceneLibrary = () => {
  const [data, setData] = useState<MotionSceneLibraryList>({ items: [], styles: [] });
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const reload = useCallback(async (showLoading = true) => {
    const id = ++requestId.current;
    if (showLoading) setLoading(true);
    try {
      const result = await motionRequest<MotionSceneLibraryList>(C.URLS.LIST);
      if (id === requestId.current) setData({ items: result.items || [], styles: result.styles || [], base: result.base, pending: result.pending });
    } catch (error) {
      if (id === requestId.current) toast.error(getMotionErrorMessage(error));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    return () => {
      requestId.current++;
    };
  }, [reload]);
  return { data, reload, loading };
};
const applyStyleSet = async (studio: MotionStudio, style: MotionSceneStyleSet, t: ReturnType<typeof textOf>): Promise<void> => {
  const result = await motionRequest<{ references: MotionStyleReference[] }>(C.URLS.STYLE + encodeURIComponent(style.key));
  studio.patch({ styleReferences: result.references || [], drawingMode: style.drawingMode });
  toast.success(t.STYLE_APPLIED);
};
export const MotionStyleSetPicker: FC<{ studio: MotionStudio; currentLang: Lang; disabled?: boolean }> = ({ studio, currentLang, disabled }) => {
  const t = textOf(currentLang);
  const { data } = useSceneLibrary();
  const sets = data.styles.filter((style) => style.images.length);
  if (!sets.length) return null;
  return (
    <MotionSelectField
      label={t.STYLE_SET_LABEL}
      title={t.PICK_STYLE}
      className={cn(MR.MOTION_TEXT_W_FULL_PX_3_PY_2_ROUNDED_XL, MR.MOTION_TEXT_H_42PX_CURSOR_POINTER)}
      value={MR.MOTION_TEXT_EMPTY}
      disabled={disabled}
      onChange={(event) => {
        const style = sets.find((entry) => entry.key === event.target.value);
        if (style) void applyStyleSet(studio, style, t).catch((error) => toast.error(getMotionErrorMessage(error)));
      }}>
      <option value={MR.MOTION_TEXT_EMPTY}>{t.PICK_STYLE}</option>
      {sets.map((style) => (
        <option key={style.key} value={style.key}>
          {styleLabel(style.key, sets, t) + C.TEXT.SEP + style.images.length + C.TEXT.SPACE + t.IMAGES}
        </option>
      ))}
    </MotionSelectField>
  );
};
const emptyDraft = (): MotionSceneCustomItem => ({
  group: C.KIND_CHARACTER,
  type: MOTION_SCENE_TYPES[0].id,
  name: MR.MOTION_TEXT_EMPTY,
  description: MR.MOTION_TEXT_EMPTY,
  gender: MR.MOTION_TEXT_MALE,
  time: TIMES[0],
  interior: false,
});
export const MotionSceneLibraryPanel: FC<{ studio: MotionStudio; currentLang: Lang }> = ({ studio, currentLang }) => {
  const t = textOf(currentLang);
  const { data, reload, loading } = useSceneLibrary();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<LibraryTab>(C.KIND_CHARACTER);
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [styleFilter, setStyleFilter] = useState<string>(ALL);
  const [searchQuery, setSearchQuery] = useState<string>(XRT.EMPTY);
  const [editing, setEditing] = useState<{ id: string; name: string; style?: boolean } | null>(null);
  const [busy, setBusy] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [job, setJob] = useState<MotionStoryJobState | null>(null);
  const [draft, setDraft] = useState<MotionSceneCustomItem>(emptyDraft());
  const [queue, setQueue] = useState<MotionSceneCustomItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<MotionSceneAsset | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const chipsContainerRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    [],
  );
  const counts = useMemo(() => _.countBy(data.items, groupOf), [data.items]);
  const totalAssetsCount = useMemo(() => data.items.length, [data.items]);
  const styleKeys = useMemo(() => _.uniq(data.items.map((item) => item.styleKey)), [data.items]);
  const groupItems = useMemo(() => data.items.filter((item) => groupOf(item) === tab && (styleFilter === ALL || item.styleKey === styleFilter)), [data.items, tab, styleFilter]);
  const typeCounts = useMemo(() => _.countBy(groupItems, (item) => item.type || ALL), [groupItems]);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = groupItems.filter((item) => {
      const matchType = typeFilter === ALL || item.type === typeFilter;
      if (!matchType) return false;
      if (!normalizedQuery) return true;
      const nameMatch = item.name?.toLowerCase().includes(normalizedQuery);
      const descMatch = item.description?.toLowerCase().includes(normalizedQuery);
      const label = typeLabel(item.type, currentLang).toLowerCase();
      const typeMatch = (item.type?.toLowerCase() || XRT.EMPTY).includes(normalizedQuery) || label.includes(normalizedQuery);
      const tagMatch = item.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      return Boolean(nameMatch || descMatch || typeMatch || tagMatch);
    });
    return _.orderBy(filtered, [(item) => item.type || MR.MOTION_TEXT_EMPTY, (item) => item.name]);
  }, [groupItems, typeFilter, normalizedQuery, currentLang]);
  const visibleStyles = useMemo(() => {
    if (!normalizedQuery) return data.styles;
    return data.styles.filter((style) => style.name.toLowerCase().includes(normalizedQuery) || style.key.toLowerCase().includes(normalizedQuery));
  }, [data.styles, normalizedQuery]);
  const totalItems = tab === STYLES_TAB ? visibleStyles.length : visible.length;
  const { page: currentPage, pageCount, start: pageStart, end: pageEnd } = getPagination(totalItems, page, C.PAGE_SIZE);
  const pageItems = visible.slice(pageStart, pageEnd);
  const pageStyles = visibleStyles.slice(pageStart, pageEnd);
  useEffect(() => {
    setPage(1);
  }, [tab, typeFilter, styleFilter, normalizedQuery]);
  useEffect(() => {
    setPage((value) => Math.min(value, pageCount));
  }, [pageCount]);
  const seeding = !!job && ACTIVE.includes(job.status);
  const basePending = data.pending?.[studio.state.drawingMode];
  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    try {
      await task();
    } catch (error) {
      toast.error(getMotionErrorMessage(error));
    } finally {
      setBusy(MR.MOTION_TEXT_EMPTY);
    }
  };
  const poll = useCallback(
    (id: string) => {
      timer.current = setTimeout(async () => {
        try {
          const result = await motionRequest<{ job: MotionStoryJobState }>(C.URLS.STATUS + id);
          setJob(result.job);
          void reload(false);
          if (ACTIVE.includes(result.job.status)) return poll(id);
          if (result.job.status === MotionJobStatus.COMPLETED) toast.success(t.SEED_DONE);
          else if (result.job.error) toast.error(result.job.error);
        } catch (error) {
          toast.error(getMotionErrorMessage(error));
        }
      }, POLL_MS);
    },
    [reload, t.SEED_DONE],
  );
  const startSeed = (body: Record<string, unknown>, url: string = C.URLS.SEED) =>
    run(url, async () => {
      const state = studio.state;
      const result = await motionRequest<{ job: MotionStoryJobState }>(url, {
        ...body,
        styleReferences: state.styleReferences,
        drawingMode: state.drawingMode,
        characterMotion: state.characterMotion,
        aiExecution: motionSceneAiExecution(state),
      });
      setJob(result.job);
      poll(result.job.id);
    });
  const uploadPack = async (file: File | undefined) => {
    if (!file) return;
    let pack: unknown;
    try {
      pack = JSON.parse(await file.text());
    } catch {
      return void toast.error(t.FILE_INVALID);
    }
    await startSeed({ pack }, C.URLS.IMPORT);
  };
  const clearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimer.current = setTimeout(() => setConfirmClear(false), CLEAR_CONFIRM_MS);
      return;
    }
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setConfirmClear(false);
    void run(C.URLS.CLEAR, async () => {
      await motionRequest(C.URLS.CLEAR, {});
      setTypeFilter(ALL);
      setStyleFilter(ALL);
      toast.success(t.CLEARED);
      await reload();
    });
  };
  const exportLibrary = () => window.location.assign(styleFilter === ALL ? C.URLS.EXPORT : C.URLS.EXPORT_STYLE + encodeURIComponent(styleFilter));
  const remove = (item: MotionSceneAsset) =>
    run(item.id, async () => {
      await motionRequest(C.URLS.REMOVE, { id: item.id });
      toast.success(t.DELETED);
      if (previewItem?.id === item.id) setPreviewItem(null);
      await reload();
    });
  const removeStyle = (style: MotionSceneStyleSet) =>
    run(style.key, async () => {
      await motionRequest(C.URLS.STYLE_REMOVE, { key: style.key });
      toast.success(t.DELETED);
      await reload();
    });
  const rename = () =>
    editing &&
    run(editing.id, async () => {
      await motionRequest(editing.style ? C.URLS.STYLE_RENAME : C.URLS.RENAME, editing.style ? { key: editing.id, name: editing.name } : { id: editing.id, name: editing.name });
      if (previewItem && previewItem.id === editing.id) {
        setPreviewItem({ ...previewItem, name: editing.name });
      }
      setEditing(null);
      toast.success(t.RENAMED);
      await reload();
    });
  const draftTypes = MOTION_SCENE_TYPES.filter((type) => type.group === draft.group);
  const addDraft = () => {
    if (!draft.name.trim() || !draft.description.trim()) return void toast.error(C.ERRORS.NAME_REQUIRED);
    setQueue([...queue, { ...draft }]);
    setDraft({ ...draft, name: MR.MOTION_TEXT_EMPTY, description: MR.MOTION_TEXT_EMPTY });
  };
  const scrollChips = (offset: number) => {
    if (chipsContainerRef.current) {
      chipsContainerRef.current.scrollBy({ left: offset, behavior: SRT.SOURCE_TEXT_SMOOTH });
    }
  };
  const tabs: { id: LibraryTab; label: string; icon: typeof Box; count: number; color: string }[] = [
    ...MOTION_SCENE_GROUPS.map((group) => ({
      id: group as LibraryTab,
      label: t.GROUPS[group],
      icon: GROUP_CONFIG[group].icon,
      count: counts[group] || 0,
      color: GROUP_CONFIG[group].color,
    })),
    { id: STYLES_TAB, label: t.STYLES, icon: Images, count: data.styles.length, color: S.TEXT_PINK_400 },
  ];
  return (
    <div className={S.CONTAINER}>
      <StudioCard className={S.HERO}>
        <div className={S.ABSOLUTE_INSET_X_0_TOP_PX_H_PX_BG_GRADIENT_TO_R_FROM_TRANSPARENT_VIA_PURPLE_500_50_T} />
        <StudioHeader
          icon={Library}
          title={<>{t.TITLE}</>}
          description={<>{t.SEED_SUB}</>}
          badge={<>{t.TOTAL_ITEMS(totalAssetsCount)}</>}
          actions={
            <>
              <div className={S.FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP_SHRINK_0}>
                <StudioInput
                  ref={fileInput}
                  type={C.TEXT.FILE}
                  accept={C.TEXT.JSON_ACCEPT}
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = MR.MOTION_TEXT_EMPTY;
                    void uploadPack(file);
                  }}
                />
                <ActionBtn icon={Wand2} className={S.BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA_PINK_600_TO_INDIGO_600_HOVER_OPACITY_95_TEXT_WH} onClick={() => setShowAddModal(true)}>
                  {t.AI_TOGGLE}
                </ActionBtn>
                <ActionBtn icon={Upload} variant={C.TEXT.SECONDARY} busy={seeding} disabled={seeding || studio.storyBusy} onClick={() => fileInput.current?.click()} className={S.TEXT_XS_PX_3_5_PY_2}>
                  {seeding ? t.SEED_RUNNING : t.UPLOAD}
                </ActionBtn>
                <ActionBtn icon={Package} variant={C.TEXT.SECONDARY} disabled={seeding || studio.storyBusy || basePending === 0} title={basePending === 0 ? t.BUILTIN_DONE : basePending ? t.BUILTIN_PENDING(basePending) : undefined} onClick={() => void startSeed({}, C.URLS.IMPORT)} className={S.TEXT_XS_PX_3_5_PY_2}>
                  {t.BUILTIN}
                </ActionBtn>
                <div className={S.FLEX_ITEMS_CENTER_GAP_1_PL_1_SM_BORDER_L_SM_BORDER_SLATE_800_80_SM_PL_2}>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.W_8_H_8_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_SKY_300_TRANSITIO} disabled={!data.items.length} onClick={exportLibrary} title={t.EXPORT}>
                    <Download className={S.W_4_H_4} />
                  </Button>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.W_8_H_8_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_PURPLE_300_TRANSI} onClick={() => void reload()} disabled={loading} title={t.REFRESH}>
                    <RefreshCw className={S.W_4_H_4} />
                  </Button>
                  <Button
                    variant={MR.MOTION_TEXT_UNSTYLED}
                    disabled={seeding || (!data.items.length && !data.styles.length)}
                    onClick={clearAll}
                    className={cn(S.TRANSITION_COLORS_TEXT_XS_FONT_MEDIUM_FLEX_ITEMS_CENTER_CURSOR_POINTER_BG_TRANSPAREN, confirmClear ? S.PX_2_PY_1_TEXT_ROSE_400_ANIMATE_PULSE_GAP_1 : S.W_8_H_8_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_ROSE_400)}
                    title={confirmClear ? t.CLEAR_CONFIRM : t.CLEAR}>
                    <Trash2 className={S.W_4_H_4} />
                    {confirmClear && <span>{t.CLEAR_CONFIRM}</span>}
                  </Button>
                </div>
              </div>
            </>
          }>
          <span className={S.TEXT_11PX_PX_2_PY_0_5_ROUNDED_MD_FONT_MONO_FONT_SEMIBOLD_BG_SLATE_800_TEXT_SLATE_300}>{studio.state.drawingMode === MR.MOTION_TEXT_2D ? t.MODE_2D : t.MODE_3D}</span>
        </StudioHeader>
        {job && (
          <div className={S.PT_3_BORDER_T_BORDER_SLATE_800_80_SPACE_Y_2}>
            <div className={S.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_TEXT_XS_TEXT_PURPLE_300_FONT_MEDIUM}>
              <span className={S.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className={S.W_4_H_4_TEXT_PURPLE_400_ANIMATE_SPIN} />
                {t.SEED_RUNNING}
              </span>
              <span className={S.FONT_MONO}>
                {Math.round((job.progress || 0) * 100)}
                {SRT.SOURCE_TEXT_SYMBOL_8}
              </span>
            </div>
            <div className={S.PROGRESS}>
              <div className={S.PROGRESS_BAR} style={{ width: XRT.PERCENTAGE(Math.round((job.progress || 0) * 100)) }} />
            </div>
            {job.log && job.log.length > 0 && (
              <div className={S.LOG}>
                {_.takeRight(job.log, LOG_LINES).map((line, index) => (
                  <div key={index} className={S.FLEX_ITEMS_START_GAP_1_5}>
                    <span className={S.TEXT_SLATE_600}>{XRT.LOG_PREFIX}</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </StudioCard>
      <StudioCard className={S.CARD} aria-busy={loading}>
        <div className={S.FLEX_FLEX_COL_LG_FLEX_ROW_LG_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_4_PB_2_BORDER_B_BORDER}>
          <div className={S.TABS_CONTAINER}>
            {tabs.map(({ id, label, icon: Icon, count, color }) => {
              const active = tab === id;
              return (
                <Button
                  key={id}
                  variant={MR.MOTION_TEXT_UNSTYLED}
                  className={active ? S.TAB_ACTIVE : S.TAB}
                  onClick={() => {
                    setTab(id);
                    setTypeFilter(ALL);
                    setSearchQuery(XRT.EMPTY);
                  }}>
                  <Icon className={cn(S.W_4_H_4_SHRINK_0, active ? S.TEXT_WHITE : color)} />
                  <span>{label}</span>
                  <span className={cn(S.PX_2_PY_0_5_ROUNDED_FULL_TEXT_10PX_FONT_MONO_FONT_BOLD, active ? S.BG_BLACK_25_TEXT_WHITE : S.BG_SLATE_900_BORDER_BORDER_SLATE_800_TEXT_SLATE_400)}>{count}</span>
                </Button>
              );
            })}
          </div>
          {tab !== STYLES_TAB && styleKeys.length > 1 && (
            <MotionSelectField
              label={
                <>
                  {t.STYLE_FILTER}
                  {SRT.SOURCE_TEXT_SYMBOL_16}
                </>
              }
              wrapperClassName={S.FLEX_ITEMS_CENTER_GAP_2_SHRINK_0}
              labelClassName={S.TEXT_XS_TEXT_SLATE_400}
              className={S.SELECT}
              value={styleFilter}
              onChange={(event) => setStyleFilter(event.target.value)}>
              <option value={ALL}>{t.ALL_STYLES}</option>
              {styleKeys.map((key) => (
                <option key={key} value={key}>
                  {styleLabel(key, data.styles, t)}
                </option>
              ))}
            </MotionSelectField>
          )}
        </div>
        <div className={S.SPACE_Y_3}>
          <div className={S.FLEX_FLEX_COL_SM_FLEX_ROW_ITEMS_STRETCH_SM_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3}>
            <div className={S.RELATIVE_FLEX_1_MAX_W_MD}>
              <Search className={S.W_4_H_4_TEXT_SLATE_500_ABSOLUTE_LEFT_3_5_TOP_1_2_TRANSLATE_Y_1_2_POINTER_EVENTS_NONE} />
              <StudioInput type={SRT.SOURCE_TEXT_TEXT} className={cn(S.INPUT, S.PL_10_PR_9)} placeholder={t.SEARCH_PLACEHOLDER} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              {searchQuery && (
                <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.ABSOLUTE_RIGHT_2_5_TOP_1_2_TRANSLATE_Y_1_2_TEXT_SLATE_400_HOVER_TEXT_WHITE_P_1_ROUND} onClick={() => setSearchQuery(XRT.EMPTY)} title={t.CLEAR_SEARCH}>
                  <X className={S.ICON} />
                </Button>
              )}
            </div>
            {tab !== STYLES_TAB && _.size(typeCounts) > 0 && (
              <MotionSelectField
                label={
                  <>
                    {t.TYPE}
                    {SRT.SOURCE_TEXT_SYMBOL_16}
                  </>
                }
                wrapperClassName={S.FLEX_ITEMS_CENTER_GAP_2_SHRINK_0}
                labelClassName={S.TEXT_XS_TEXT_SLATE_400_HIDDEN_MD_INLINE}
                className={S.SELECT}
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}>
                <option value={ALL}>
                  {t.ALL_TYPES} {SRT.SOURCE_TEXT_SYMBOL_11}
                  {groupItems.length}
                  {SRT.SOURCE_TEXT_SYMBOL_12}
                </option>
                {MOTION_SCENE_TYPES.filter((type) => typeCounts[type.id]).map((type) => (
                  <option key={type.id} value={type.id}>
                    {typeLabel(type.id, currentLang)} {SRT.SOURCE_TEXT_SYMBOL_11}
                    {typeCounts[type.id]}
                    {SRT.SOURCE_TEXT_SYMBOL_12}
                  </option>
                ))}
              </MotionSelectField>
            )}
          </div>
          {tab !== STYLES_TAB && _.size(typeCounts) > 0 && (
            <div className={S.RELATIVE_FLEX_ITEMS_CENTER_GAP_1_GROUP_CAROUSEL}>
              <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => scrollChips(-200)} className={S.HIDDEN_SM_FLEX_W_7_H_7_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_PURPLE} title={t.SCROLL_LEFT}>
                <ChevronLeft className={S.W_4_H_4} />
              </Button>
              <div ref={chipsContainerRef} className={S.FLEX_ITEMS_CENTER_GAP_2_OVERFLOW_X_AUTO_PY_1_SCROLLBAR_NONE_SCROLL_SMOOTH_W_FULL_PX}>
                <MotionSceneFilterChip active={typeFilter === ALL} label={t.ALL_TYPES} count={groupItems.length} onClick={() => setTypeFilter(ALL)} />
                {MOTION_SCENE_TYPES.filter((type) => typeCounts[type.id]).map((type) => (
                  <MotionSceneFilterChip key={type.id} active={typeFilter === type.id} label={typeLabel(type.id, currentLang)} count={typeCounts[type.id]} onClick={() => setTypeFilter(type.id)} />
                ))}
              </div>
              <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => scrollChips(200)} className={S.HIDDEN_SM_FLEX_W_7_H_7_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_PURPLE} title={t.SCROLL_RIGHT}>
                <ChevronRight className={S.W_4_H_4} />
              </Button>
            </div>
          )}
        </div>
        {loading ? (
          <StudioLoadingState title={t.LOADING} description={t.LOADING_HINT} />
        ) : tab === STYLES_TAB ? (
          visibleStyles.length ? (
            <div className={S.GRID}>
              {pageStyles.map((style) => (
                <div key={style.key} className={S.ITEM}>
                  <div className={S.STYLE_STRIP}>
                    {_.range(Math.min(style.images.length, STYLE_THUMBS)).map((index) => (
                      <img key={index} className={S.STYLE_THUMB} src={C.URLS.STYLE_THUMB + encodeURIComponent(style.key) + C.TEXT.INDEX_QUERY + index} alt={style.name} loading={MR.MOTION_TEXT_LAZY} />
                    ))}
                  </div>
                  <div className={S.ITEM_BODY}>
                    {editing?.id === style.key ? (
                      <div className={S.ROW}>
                        <StudioInput className={S.INPUT} value={editing.name} autoFocus onChange={(event) => setEditing({ ...editing, name: event.target.value })} onKeyDown={(event) => event.key === C.TEXT.ENTER && void rename()} />
                        <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.ICON_BTN} onClick={() => void rename()} title={t.SAVE}>
                          <Check className={S.ICON} />
                        </Button>
                        <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.ICON_BTN} onClick={() => setEditing(null)} title={t.CANCEL}>
                          <X className={S.ICON} />
                        </Button>
                      </div>
                    ) : (
                      <div className={S.ITEM_NAME} title={style.name}>
                        {style.name}
                      </div>
                    )}
                    <div className={S.ITEM_META}>{styleLabel(style.key, data.styles, t) + C.TEXT.SEP + style.images.length + C.TEXT.SPACE + t.IMAGES}</div>
                    <div className={S.ITEM_ACTIONS}>
                      {style.images.length > 0 && (
                        <ActionBtn icon={Check} variant={C.TEXT.SECONDARY} disabled={studio.storyBusy} onClick={() => void run(style.key, () => applyStyleSet(studio, style, t))} className={S.MR_AUTO_TEXT_11PX_PY_1_PX_2_5}>
                          {t.USE_STYLE}
                        </ActionBtn>
                      )}
                      <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.W_6_H_6_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_SKY_400_TRANSITIO} title={t.RENAME} onClick={() => setEditing({ id: style.key, name: style.name, style: true })}>
                        <Pencil className={S.ICON} />
                      </Button>
                      <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.W_6_H_6_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_ROSE_400_TRANSITI} title={t.DELETE} disabled={busy === style.key} onClick={() => void removeStyle(style)}>
                        <Trash2 className={S.ICON} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={S.PY_12_TEXT_CENTER_SPACE_Y_3}>
              <Images className={S.W_10_H_10_TEXT_SLATE_600_MX_AUTO} />
              <p className={S.TEXT_SM_TEXT_SLATE_400}>{searchQuery ? t.NO_RESULTS : t.NO_STYLE}</p>
            </div>
          )
        ) : visible.length ? (
          <div className={S.GRID}>
            {pageItems.map((item) => {
              const itemTypeStr = typeLabel(item.type, currentLang);
              const isCharacter = item.kind === C.KIND_CHARACTER;
              const isLocation = item.kind === C.KIND_LOCATION;
              return (
                <div key={item.id} className={S.ITEM}>
                  <div className={cn(S.THUMB_WRAPPER, isCharacter ? S.ASPECT_SQUARE_BG_SLATE_950 : isLocation ? S.ASPECT_VIDEO_BG_SLATE_950 : S.ASPECT_4_3_BG_SLATE_950)} onClick={() => setPreviewItem(item)} title={t.PREVIEW}>
                    {item.thumb ? <img className={isCharacter ? S.THUMB_SQUARE : isLocation ? S.THUMB : S.THUMB_PROP} src={C.URLS.THUMB + encodeURIComponent(item.id)} alt={item.name} loading={MR.MOTION_TEXT_LAZY} /> : <div className={S.THUMB_EMPTY}>{item.kind === C.KIND_PROP ? (item.size || []).join(C.TEXT.TIMES) : item.name}</div>}
                  </div>
                  <div className={S.P_3_FLEX_1_FLEX_FLEX_COL_JUSTIFY_BETWEEN_SPACE_Y_2}>
                    <div className={S.SPACE_Y_1}>
                      <div className={S.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_1_TEXT_10PX}>
                        <span className={S.FONT_SEMIBOLD_TEXT_PURPLE_400_TRUNCATE_TRACKING_WIDE}>{itemTypeStr || item.kind}</span>
                        {item.from && (
                          <span className={S.TEXT_SLATE_500_TRUNCATE_MAX_W_80PX} title={item.from}>
                            {item.from}
                          </span>
                        )}
                      </div>
                      {editing?.id === item.id ? (
                        <div className={S.ROW}>
                          <StudioInput className={S.INPUT} value={editing.name} autoFocus onChange={(event) => setEditing({ ...editing, name: event.target.value })} onKeyDown={(event) => event.key === C.TEXT.ENTER && void rename()} />
                          <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.ICON_BTN} onClick={() => void rename()} title={t.SAVE}>
                            <Check className={S.ICON} />
                          </Button>
                          <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.ICON_BTN} onClick={() => setEditing(null)} title={t.CANCEL}>
                            <X className={S.ICON} />
                          </Button>
                        </div>
                      ) : (
                        <h3 className={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_TRUNCATE_GROUP_HOVER_TEXT_PURPLE_300_TRANSITION} title={item.name}>
                          {item.name}
                        </h3>
                      )}
                      <p className={S.TEXT_11PX_TEXT_SLATE_400_TRUNCATE} title={item.description || item.role}>
                        {item.description || item.role || item.time || SRT.SOURCE_TEXT_SYMBOL_48}
                      </p>
                    </div>
                    <div className={S.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_PT_1_5_BORDER_T_BORDER_SLATE_800_60_MT_AUTO}>
                      <span className={S.FLEX_ITEMS_CENTER_GAP_1_FONT_MONO_TEXT_10PX_TEXT_SLATE_400}>
                        <Repeat className={S.W_3_H_3_TEXT_PURPLE_400_80} />
                        {(item.uses || 0) + C.TEXT.SPACE + t.USES}
                      </span>
                      <div className={S.FLEX_ITEMS_CENTER_GAP_1_5}>
                        <Button
                          variant={MR.MOTION_TEXT_UNSTYLED}
                          className={S.W_6_H_6_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_PURPLE_400_TRANSI}
                          title={t.PREVIEW}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                          }}>
                          <Eye className={S.ICON} />
                        </Button>
                        <Button
                          variant={MR.MOTION_TEXT_UNSTYLED}
                          className={S.W_6_H_6_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_SKY_400_TRANSITIO}
                          title={t.RENAME}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing({ id: item.id, name: item.name });
                          }}>
                          <Pencil className={S.ICON} />
                        </Button>
                        <Button
                          variant={MR.MOTION_TEXT_UNSTYLED}
                          className={S.W_6_H_6_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_ROSE_400_TRANSITI}
                          title={t.DELETE}
                          disabled={busy === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void remove(item);
                          }}>
                          <Trash2 className={S.ICON} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={S.PY_16_TEXT_CENTER_SPACE_Y_4}>
            <div className={S.W_14_H_14_ROUNDED_3XL_BG_SLATE_900_BORDER_BORDER_SLATE_800_FLEX_ITEMS_CENTER_JUSTIFY}>
              <FolderOpen className={S.W_7_H_7} />
            </div>
            <div className={S.SPACE_Y_1}>
              <p className={S.TEXT_SM_FONT_SEMIBOLD_TEXT_SLATE_300}>{searchQuery ? t.NO_RESULTS : t.EMPTY}</p>
              {searchQuery && (
                <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.TEXT_XS_TEXT_PURPLE_400_HOVER_TEXT_PURPLE_300_UNDERLINE_FONT_MEDIUM} onClick={() => setSearchQuery(XRT.EMPTY)}>
                  {t.CLEAR_SEARCH}
                </Button>
              )}
            </div>
          </div>
        )}
        {!loading && <Pagination page={currentPage} pageSize={C.PAGE_SIZE} total={totalItems} onChange={setPage} texts={STUDIO_PAGINATION_TEXT[currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI]} />}
      </StudioCard>
      {previewItem && (
        <Modal isOpen={Boolean(previewItem)} onClose={() => setPreviewItem(null)} title={previewItem.name} maxWidth={S.MAX_W_3XL}>
          <div className={S.SPACE_Y_5}>
            <div className={S.GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_5_ITEMS_START}>
              <div className={S.RELATIVE_ROUNDED_2XL_OVERFLOW_HIDDEN_BG_SLATE_950_BORDER_BORDER_SLATE_800_FLEX_ITEMS}>
                {previewItem.thumb ? <img src={C.URLS.THUMB + encodeURIComponent(previewItem.id)} alt={previewItem.name} className={S.MAX_H_380PX_W_AUTO_MAX_W_FULL_OBJECT_CONTAIN_ROUNDED_XL} /> : <div className={S.TEXT_SM_TEXT_SLATE_500_FONT_MONO}>{previewItem.kind === C.KIND_PROP ? (previewItem.size || []).join(C.TEXT.TIMES) : previewItem.name}</div>}
              </div>
              <div className={S.SPACE_Y_3_5}>
                <div className={S.SPACE_Y_1}>
                  <div className={S.TEXT_11PX_FONT_SEMIBOLD_TEXT_PURPLE_400_UPPERCASE_TRACKING_WIDER}>{t.ITEM_INFO}</div>
                  <h3 className={S.TEXT_BASE_FONT_BOLD_TEXT_WHITE_FLEX_ITEMS_CENTER_GAP_2}>{previewItem.name}</h3>
                </div>
                <div className={S.ROUNDED_XL_BORDER_BORDER_SLATE_800_80_BG_SLATE_950_60_P_3_5_SPACE_Y_2_TEXT_XS}>
                  <MotionDetailRow
                    className={S.FLEX_JUSTIFY_BETWEEN_PY_1_BORDER_B_BORDER_SLATE_800_60}
                    labelClassName={S.TEXT_SLATE_400}
                    valueClassName={S.FONT_SEMIBOLD_TEXT_SLATE_200_UPPERCASE}
                    label={
                      <>
                        {t.GROUP}
                        {SRT.SOURCE_TEXT_SYMBOL_16}
                      </>
                    }>
                    {t.GROUPS[groupOf(previewItem)]}
                  </MotionDetailRow>
                  <MotionDetailRow
                    className={S.FLEX_JUSTIFY_BETWEEN_PY_1_BORDER_B_BORDER_SLATE_800_60}
                    labelClassName={S.TEXT_SLATE_400}
                    valueClassName={S.FONT_SEMIBOLD_TEXT_PURPLE_300}
                    label={
                      <>
                        {t.TYPE}
                        {SRT.SOURCE_TEXT_SYMBOL_16}
                      </>
                    }>
                    {typeLabel(previewItem.type, currentLang)}
                  </MotionDetailRow>
                  {previewItem.time && (
                    <MotionDetailRow
                      className={S.FLEX_JUSTIFY_BETWEEN_PY_1_BORDER_B_BORDER_SLATE_800_60}
                      labelClassName={S.TEXT_SLATE_400}
                      valueClassName={S.FONT_MONO_TEXT_SLATE_300}
                      label={
                        <>
                          {t.TIME}
                          {SRT.SOURCE_TEXT_SYMBOL_16}
                        </>
                      }>
                      {previewItem.time}
                    </MotionDetailRow>
                  )}
                  {previewItem.from && (
                    <MotionDetailRow
                      className={S.FLEX_JUSTIFY_BETWEEN_PY_1_BORDER_B_BORDER_SLATE_800_60}
                      labelClassName={S.TEXT_SLATE_400}
                      valueClassName={S.TEXT_SLATE_300}
                      label={
                        <>
                          {t.FROM}
                          {SRT.SOURCE_TEXT_SYMBOL_16}
                        </>
                      }>
                      {previewItem.from}
                    </MotionDetailRow>
                  )}
                  <MotionDetailRow
                    className={S.FLEX_JUSTIFY_BETWEEN_PY_1}
                    labelClassName={S.TEXT_SLATE_400}
                    valueClassName={S.FONT_MONO_FONT_BOLD_TEXT_EMERALD_400}
                    label={
                      <>
                        {t.USES}
                        {SRT.SOURCE_TEXT_SYMBOL_16}
                      </>
                    }>
                    {previewItem.uses || 0}
                  </MotionDetailRow>
                </div>
                <div className={S.SPACE_Y_1}>
                  <span className={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300}>
                    {t.DESCRIPTION}
                    {SRT.SOURCE_TEXT_SYMBOL_16}
                  </span>
                  <div className={S.P_3_ROUNDED_XL_BG_SLATE_955_BORDER_BORDER_SLATE_800_TEXT_XS_TEXT_SLATE_300_LEADING_R}>{previewItem.description || t.DESCRIPTION_EMPTY}</div>
                </div>
                <div className={S.FLEX_ITEMS_CENTER_GAP_2_PT_2_JUSTIFY_END}>
                  <ActionBtn
                    icon={Pencil}
                    variant={C.TEXT.SECONDARY}
                    onClick={() => {
                      const item = previewItem;
                      setPreviewItem(null);
                      setEditing({ id: item.id, name: item.name });
                    }}>
                    {t.RENAME}
                  </ActionBtn>
                  <ActionBtn icon={Trash2} variant={C.TEXT.DANGER} disabled={busy === previewItem.id} onClick={() => void remove(previewItem)}>
                    {t.DELETE}
                  </ActionBtn>
                  <ActionBtn icon={X} variant={C.TEXT.SECONDARY} onClick={() => setPreviewItem(null)}>
                    {t.CLOSE}
                  </ActionBtn>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t.AI_MODAL_TITLE} maxWidth={S.MAX_W_2XL}>
          <div className={S.SPACE_Y_4}>
            <p className={S.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED}>{t.AI_MODAL_SUB}</p>
            <div className={S.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_3_5}>
              <MotionSelectField
                label={t.GROUP}
                wrapperClassName={S.SPACE_Y_1}
                labelClassName={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300}
                className={S.SELECT}
                value={draft.group}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    group: event.target.value,
                    type: MOTION_SCENE_TYPES.find((type) => type.group === event.target.value)?.id || draft.type,
                  })
                }>
                {MOTION_SCENE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {t.GROUPS[group]}
                  </option>
                ))}
              </MotionSelectField>
              <MotionSelectField label={t.TYPE} wrapperClassName={S.SPACE_Y_1} labelClassName={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300} className={S.SELECT} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
                {draftTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {typeLabel(type.id, currentLang)}
                  </option>
                ))}
              </MotionSelectField>
              {draft.group === C.KIND_CHARACTER && (
                <MotionSelectField
                  label={t.GENDER}
                  wrapperClassName={S.SPACE_Y_1}
                  labelClassName={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300}
                  className={S.SELECT}
                  value={draft.gender}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      gender: event.target.value === MR.MOTION_TEXT_FEMALE ? MR.MOTION_TEXT_FEMALE : MR.MOTION_TEXT_MALE,
                    })
                  }>
                  <option value={MR.MOTION_TEXT_MALE}>{t.MALE}</option>
                  <option value={MR.MOTION_TEXT_FEMALE}>{t.FEMALE}</option>
                </MotionSelectField>
              )}
              {draft.group === C.KIND_LOCATION && (
                <>
                  <MotionSelectField label={t.TIME} wrapperClassName={S.SPACE_Y_1} labelClassName={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300} className={S.SELECT} value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })}>
                    {TIMES.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </MotionSelectField>
                  <div className={S.FLEX_ITEMS_CENTER_GAP_2_PT_6}>
                    <StudioInput type={C.TEXT.CHECKBOX} id={XRT.INTERIOR_CHECKBOX} className={S.ROUNDED_BORDER_SLATE_700_TEXT_PURPLE_600_FOCUS_RING_PURPLE_500} checked={!!draft.interior} onChange={(event) => setDraft({ ...draft, interior: event.target.checked })} />
                    <label htmlFor={XRT.INTERIOR_CHECKBOX} className={S.TEXT_XS_TEXT_SLATE_300_FONT_MEDIUM_CURSOR_POINTER}>
                      {t.INTERIOR}
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className={S.SPACE_Y_1}>
              <label className={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300}>{t.NAME}</label>
              <StudioInput className={S.INPUT} placeholder={t.NAME} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </div>
            <div className={S.SPACE_Y_1}>
              <label className={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300}>{t.DESCRIPTION}</label>
              <StudioTextarea className={S.INPUT} placeholder={t.DESCRIPTION} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
            {queue.length > 0 && (
              <div className={S.SPACE_Y_2_PT_2_BORDER_T_BORDER_SLATE_800}>
                <div className={S.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span>
                    {t.QUEUE} {SRT.SOURCE_TEXT_SYMBOL_11}
                    {queue.length}
                    {SRT.SOURCE_TEXT_SYMBOL_12}
                  </span>
                </div>
                <div className={S.FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP_MAX_H_28_OVERFLOW_Y_AUTO_P_1}>
                  {queue.map((item, index) => (
                    <span key={index} className={S.CHIP}>
                      {item.name + C.TEXT.SEP + typeLabel(item.type, currentLang)}
                      <Button variant={MR.MOTION_TEXT_UNSTYLED} className={S.ICON_BTN} onClick={() => setQueue(queue.filter((_entry, at) => at !== index))}>
                        <X className={S.W_3_H_3} />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className={S.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_PT_4_BORDER_T_BORDER_SLATE_800}>
              <ActionBtn icon={Plus} variant={C.TEXT.SECONDARY} onClick={addDraft}>
                {t.ADD}
              </ActionBtn>
              <div className={S.FLEX_ITEMS_CENTER_GAP_2}>
                {queue.length > 0 && (
                  <ActionBtn
                    icon={Sparkles}
                    className={S.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_TEXT_WHITE_FONT_SEMIBOLD_SHADOW_LG_SHAD}
                    busy={seeding}
                    disabled={seeding || studio.storyBusy}
                    onClick={() => {
                      void startSeed({ items: queue }).then(() => {
                        setQueue([]);
                        setShowAddModal(false);
                      });
                    }}>
                    {t.DRAW_QUEUE + C.TEXT.SPACE + queue.length}
                  </ActionBtn>
                )}
                <ActionBtn icon={X} variant={C.TEXT.SECONDARY} onClick={() => setShowAddModal(false)}>
                  {t.CLOSE}
                </ActionBtn>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
