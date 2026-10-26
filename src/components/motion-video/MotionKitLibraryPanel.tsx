import _ from "lodash";
import { Check, ImageOff, Images, Library, LoaderCircle, MapPin, Package, Pencil, RefreshCw, Repeat2, Search, Sparkles, Trash2, Users, WandSparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { toast } from "sonner";
import * as MR from "../../constants/motionRuntime.js";
import { PUPPET as P, PUPPET_KIT_API as A, PUPPET_TEXTS, PUPPET_TYPES } from "../../constants/motionPuppet.js";
import { MOTION_KIT_LIBRARY as C, MOTION_KIT_LIBRARY_TEXTS, MOTION_KIT_LIBRARY_UI as UI } from "../../constants/motionKitLibrary.js";
import { STUDIO_PAGINATION_TEXT, STUDIO_UI as S } from "../../constants/studioTheme.js";
import type { useMotionStudio } from "../../hooks/useMotionStudio";
import { getPagination } from "../../lib/pagination.js";
import { Button } from "../ui/Button";
import { Pagination } from "../ui/Pagination.js";
import { StudioCard, StudioHeader, StudioInput, StudioLoadingState, StudioSegmentedControl, StudioSegmentButton } from "../ui/Studio.js";
import { motionRequest } from "./motionApi";
type MotionStudio = ReturnType<typeof useMotionStudio>;
interface KitItem {
  id: string;
  type: string;
  name: string;
  desc: string;
  styleId?: string;
  uses?: number;
  updatedAt: string;
  source?: string;
  preset?: string;
  counts?: Record<string, number>;
  variants?: string[];
  construction?: string;
}
const TYPE_ICONS = { [PUPPET_TYPES.STYLE]: Sparkles, [PUPPET_TYPES.CHARACTER]: Users, [PUPPET_TYPES.SET]: MapPin, [PUPPET_TYPES.PROP]: Package, [PUPPET_TYPES.SERIES]: Images };
const searchText = (value: string): string => _.deburr(value.normalize(MR.MOTION_TEXT_NFD)).toLowerCase().trim();
const KitThumbnail = ({ item, type, unavailable }: { item: KitItem; type: string; unavailable: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      {!loaded && !failed && (
        <div className={UI.IMAGE_PENDING} aria-hidden>
          <Images className={UI.IMAGE_ICON} />
        </div>
      )}
      {failed ? (
        <div className={UI.IMAGE_FAILED}>
          <ImageOff className={UI.IMAGE_ICON} />
          <span>{unavailable}</span>
        </div>
      ) : (
        <img src={A.URLS.THUMB(type, item.id) + A.Q_V + encodeURIComponent(item.updatedAt)} alt={item.name} className={UI.IMAGE} loading={MR.MOTION_TEXT_LAZY} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      )}
    </>
  );
};
export const MotionKitLibraryPanel: FC<{ studio: MotionStudio; currentLang: string }> = ({ studio, currentLang }) => {
  const lang = currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI;
  const t = PUPPET_TEXTS[lang],
    texts = MOTION_KIT_LIBRARY_TEXTS[lang];
  const [type, setType] = useState<string>(A.TYPES_SHOWN[0]);
  const [items, setItems] = useState<KitItem[]>([]);
  const [styles, setStyles] = useState<KitItem[]>([]);
  const [styleOnly, setStyleOnly] = useState(true);
  const [editing, setEditing] = useState<string>(P.EMPTY);
  const [name, setName] = useState<string>(P.EMPTY);
  const [error, setError] = useState<string>(P.EMPTY);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string>(P.EMPTY);
  const [query, setQuery] = useState<string>(P.EMPTY);
  const [page, setPage] = useState<number>(C.FIRST_PAGE);
  const request = useRef<AbortController | null>(null);
  const current = studio.state.stylePreset || P.EMPTY;
  const currentId = _.find(styles, (s) => s.id === current || s.preset === current)?.id || P.EMPTY;
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setItems([]);
    setError(P.EMPTY);
    try {
      const st = await motionRequest<{ items: KitItem[] }>(A.URLS.LIST + A.Q_TYPE + PUPPET_TYPES.STYLE, undefined, undefined, controller.signal);
      const available = st.items || [];
      const sid = type !== PUPPET_TYPES.STYLE && styleOnly ? _.find(available, (s) => s.id === current || s.preset === current)?.id : P.EMPTY;
      const r = type === PUPPET_TYPES.STYLE ? st : await motionRequest<{ items: KitItem[] }>(A.URLS.LIST + A.Q_TYPE + type + (sid ? A.Q_STYLE + encodeURIComponent(sid) : P.EMPTY), undefined, undefined, controller.signal);
      if (controller.signal.aborted) return;
      setStyles(available);
      setItems(r.items || []);
    } catch (e: unknown) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [type, styleOnly, current]);
  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, [load]);
  const filtered = useMemo(() => {
    const term = searchText(query);
    return term ? items.filter((item) => searchText(item.name + MR.MOTION_TEXT_SYMBOL_13 + item.desc).includes(term)) : items;
  }, [items, query]);
  const pagination = getPagination(filtered.length, page, C.PAGE_SIZE);
  const visible = filtered.slice(pagination.start, pagination.end);
  const busy = loading || !!pending;
  const noMatches = !!query || (styleOnly && type !== PUPPET_TYPES.STYLE && !!currentId);
  const changePage = (next: number) => {
    setPage(next);
    setEditing(P.EMPTY);
  };
  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setPending(id);
    setError(P.EMPTY);
    try {
      await action();
      setEditing(P.EMPTY);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(P.EMPTY);
    }
  };
  const rename = (id: string) => runAction(id, () => motionRequest(A.URLS.RENAME, { type, id, name: name.trim() }));
  const seed = (id: string) =>
    runAction(id, async () => {
      const report = await studio.seedKit(id);
      if (report) toast.success(t.LIB_SEED_DONE(report.sets, report.variants, report.props));
    });
  return (
    <div className={UI.ROOT}>
      <StudioHeader
        icon={Library}
        title={t.LIBRARY}
        description={texts.DESCRIPTION}
        badge={loading ? undefined : texts.COUNT(items.length)}
        actions={
          <Button type={S.BUTTON_TYPE} variant={S.SECONDARY} className={UI.BUTTON} onClick={() => void load()} disabled={busy}>
            <RefreshCw className={loading ? UI.SPIN : UI.ICON} />
            {t.LIB_RELOAD}
          </Button>
        }
      />
      <StudioCard className={UI.CONTENT} aria-busy={loading}>
        <div className={UI.TOOLBAR}>
          <div className={UI.TABS_WRAP}>
            <StudioSegmentedControl className={UI.TABS} aria-label={t.LIBRARY}>
              {A.TYPES_SHOWN.map((k) => {
                const Icon = TYPE_ICONS[k] || Package;
                return (
                  <StudioSegmentButton
                    key={k}
                    selected={k === type}
                    disabled={!!pending}
                    onClick={() => {
                      setType(k);
                      changePage(C.FIRST_PAGE);
                    }}>
                    <Icon className={UI.ICON} />
                    {t.LIB_TYPES[k] || k}
                  </StudioSegmentButton>
                );
              })}
            </StudioSegmentedControl>
          </div>
          {type !== PUPPET_TYPES.STYLE && currentId && (
            <label className={UI.FILTER}>
              <input
                type={MR.MOTION_TEXT_CHECKBOX}
                className={UI.CHECKBOX}
                checked={styleOnly}
                disabled={!!pending}
                onChange={(e) => {
                  setStyleOnly(e.target.checked);
                  changePage(C.FIRST_PAGE);
                }}
              />
              {t.LIB_FILTER_STYLE}
            </label>
          )}
        </div>
        <div className={UI.SEARCH_ROW}>
          <div className={UI.SEARCH}>
            <Search className={UI.SEARCH_ICON} />
            <StudioInput
              type={MR.MOTION_TEXT_TEXT}
              role={C.SEARCH_ROLE}
              className={UI.SEARCH_INPUT}
              value={query}
              placeholder={texts.SEARCH}
              aria-label={texts.SEARCH_LABEL}
              onChange={(e) => {
                setQuery(e.target.value);
                changePage(C.FIRST_PAGE);
              }}
            />
            {query && (
              <Button
                type={S.BUTTON_TYPE}
                variant={S.UNSTYLED}
                className={UI.SEARCH_CLEAR}
                title={texts.CLEAR_SEARCH}
                aria-label={texts.CLEAR_SEARCH}
                onClick={() => {
                  setQuery(P.EMPTY);
                  changePage(C.FIRST_PAGE);
                }}>
                <X className={UI.ICON} />
              </Button>
            )}
          </div>
          {!loading && <span className={UI.COUNT}>{texts.COUNT(filtered.length)}</span>}
        </div>
        {error && (
          <div role={C.ALERT_ROLE} className={UI.ERROR}>
            <span className={UI.ERROR_TEXT}>{error}</span>
            <Button type={S.BUTTON_TYPE} variant={S.UNSTYLED} className={UI.BUTTON} disabled={busy} onClick={() => void load()}>
              <RefreshCw className={UI.ICON} />
              {texts.RETRY}
            </Button>
          </div>
        )}
        {loading ? (
          <StudioLoadingState title={texts.LOADING} description={texts.LOADING_HINT} icon={LoaderCircle} />
        ) : error && !items.length ? (
          <div className={UI.EMPTY}>
            <Library className={UI.EMPTY_ICON} />
            <p className={UI.EMPTY_TITLE}>{texts.ERROR_TITLE}</p>
          </div>
        ) : !filtered.length ? (
          <div className={UI.EMPTY}>
            <Library className={UI.EMPTY_ICON} />
            <p className={UI.EMPTY_TITLE}>{noMatches ? texts.NO_RESULTS : texts.EMPTY_TITLE}</p>
            <p className={UI.EMPTY_HINT}>{noMatches ? texts.NO_RESULTS_HINT : texts.EMPTY_HINT}</p>
            {query && (
              <Button
                type={S.BUTTON_TYPE}
                variant={S.SECONDARY}
                className={UI.BUTTON}
                onClick={() => {
                  setQuery(P.EMPTY);
                  changePage(C.FIRST_PAGE);
                }}>
                {texts.CLEAR_SEARCH}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={UI.GRID}>
              {visible.map((it) => (
                <StudioCard key={it.id} className={UI.CARD}>
                  <div className={UI.MEDIA}>
                    <KitThumbnail key={type + it.id + it.updatedAt} item={it} type={type} unavailable={texts.IMAGE_UNAVAILABLE} />
                    <div className={UI.BADGES}>
                      {type === PUPPET_TYPES.STYLE && currentId === it.id && (
                        <span className={UI.BADGE}>
                          <Check className={UI.ICON} />
                          {t.LIB_IN_USE}
                        </span>
                      )}
                      {it.source === P.SOURCE_PRESET && <span className={UI.BADGE}>{texts.PRESET}</span>}
                      {it.construction && <span className={UI.BADGE}>{t.LIB_CONSTRUCTION[it.construction]}</span>}
                    </div>
                  </div>
                  <div className={UI.BODY}>
                    {editing === it.id ? (
                      <div className={UI.EDIT}>
                        <StudioInput
                          autoFocus
                          className={UI.EDIT_INPUT}
                          value={name}
                          maxLength={A.NAME_MAX}
                          aria-label={t.LIB_RENAME}
                          disabled={busy}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === C.ESCAPE) setEditing(P.EMPTY);
                            if (e.key === C.ENTER && name.trim() && !busy) void rename(it.id);
                          }}
                        />
                        <Button type={S.BUTTON_TYPE} variant={S.UNSTYLED} className={UI.ACTION} title={t.LIB_SAVE} aria-label={t.LIB_SAVE} disabled={busy || !name.trim()} onClick={() => void rename(it.id)}>
                          <Check className={UI.ICON} />
                        </Button>
                        <Button type={S.BUTTON_TYPE} variant={S.UNSTYLED} className={UI.ACTION} title={texts.CANCEL} aria-label={texts.CANCEL} disabled={busy} onClick={() => setEditing(P.EMPTY)}>
                          <X className={UI.ICON} />
                        </Button>
                      </div>
                    ) : (
                      <div className={UI.NAME} title={it.name}>
                        {it.name}
                      </div>
                    )}
                    <div className={UI.DESCRIPTION} title={it.desc}>
                      {it.counts ? t.LIB_COUNTS(it.counts) : it.variants?.length ? t.LIB_VARIANTS(it.variants) : it.desc}
                    </div>
                    <div className={UI.FOOTER}>
                      {type === PUPPET_TYPES.STYLE ? (
                        <Button type={S.BUTTON_TYPE} variant={currentId === it.id ? S.SECONDARY : S.PRIMARY} className={UI.BUTTON} disabled={busy || currentId === it.id} onClick={() => studio.patch({ stylePreset: it.preset || it.id, styleReferences: [] })}>
                          {currentId === it.id ? <Check className={UI.ICON} /> : <WandSparkles className={UI.ICON} />}
                          {currentId === it.id ? t.LIB_IN_USE : t.LIB_USE}
                        </Button>
                      ) : (
                        <span className={UI.META}>
                          <Repeat2 className={UI.ICON} />
                          {texts.USES(it.uses || 0)}
                        </span>
                      )}
                      <div className={UI.ACTIONS}>
                        {pending === it.id && <LoaderCircle className={UI.SPIN} />}
                        {editing !== it.id && (
                          <Button
                            type={S.BUTTON_TYPE}
                            variant={S.UNSTYLED}
                            className={UI.ACTION}
                            title={t.LIB_RENAME}
                            aria-label={t.LIB_RENAME}
                            disabled={busy}
                            onClick={() => {
                              setEditing(it.id);
                              setName(it.name);
                            }}>
                            <Pencil className={UI.ICON} />
                          </Button>
                        )}
                        {it.source !== P.SOURCE_PRESET && (
                          <Button type={S.BUTTON_TYPE} variant={S.UNSTYLED} className={UI.DELETE} title={t.LIB_REMOVE} aria-label={t.LIB_REMOVE} disabled={busy} onClick={() => void runAction(it.id, () => motionRequest(A.URLS.REMOVE, { type, id: it.id }))}>
                            <Trash2 className={UI.ICON} />
                          </Button>
                        )}
                      </div>
                    </div>
                    {type === PUPPET_TYPES.STYLE && (
                      <Button type={S.BUTTON_TYPE} variant={S.SECONDARY} className={UI.SEED} title={t.LIB_SEED_HINT} disabled={busy || studio.storyBusy} onClick={() => void seed(it.id)}>
                        <Package className={UI.ICON} />
                        {t.LIB_SEED}
                      </Button>
                    )}
                  </div>
                </StudioCard>
              ))}
            </div>
            <Pagination page={pagination.page} pageSize={C.PAGE_SIZE} total={filtered.length} onChange={changePage} texts={STUDIO_PAGINATION_TEXT[lang]} disabled={busy} />
          </>
        )}
      </StudioCard>
    </div>
  );
};
