import _ from "lodash";
import { Check, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FC } from "react";
import * as MR from "../../constants/motionRuntime.js";
import { PUPPET as P, PUPPET_KIT_API as A, PUPPET_TEXTS, PUPPET_TYPES, PUPPET_UI as UI } from "../../constants/motionPuppet.js";
import type { useMotionStudio } from "../../hooks/useMotionStudio";
import { Button } from "../ui/Button";
import { motionRequest } from "./motionApi";
import { toast } from "sonner";

type MotionStudio = ReturnType<typeof useMotionStudio>;
interface KitItem { id: string; type: string; name: string; desc: string; styleId?: string; uses?: number; updatedAt: string; source?: string; preset?: string; counts?: Record<string, number>; variants?: string[]; }

export const MotionKitLibraryPanel: FC<{ studio: MotionStudio; currentLang: string }> = ({ studio, currentLang }) => {
  const t = currentLang === MR.MOTION_TEXT_EN ? PUPPET_TEXTS.en : PUPPET_TEXTS.vi;
  const [type, setType] = useState<string>(A.TYPES_SHOWN[0]);
  const [items, setItems] = useState<KitItem[]>([]);
  const [styleOnly, setStyleOnly] = useState(true);
  const [editing, setEditing] = useState<string>(P.EMPTY);
  const [name, setName] = useState<string>(P.EMPTY);
  const [error, setError] = useState<string>(P.EMPTY);
  const current = studio.state.stylePreset || P.EMPTY;
  const [styles, setStyles] = useState<KitItem[]>([]);
  const currentId = _.find(styles, (s) => s.id === current || s.preset === current)?.id || P.EMPTY;
  const load = useCallback(async () => {
    setError(P.EMPTY);
    try {
      const st = await motionRequest<{ items: KitItem[] }>(A.URLS.LIST + A.Q_TYPE + PUPPET_TYPES.STYLE);
      setStyles(st.items || []);
      const sid = type !== PUPPET_TYPES.STYLE && styleOnly ? _.find(st.items || [], (s) => s.id === current || s.preset === current)?.id : P.EMPTY;
      const r = await motionRequest<{ items: KitItem[] }>(A.URLS.LIST + A.Q_TYPE + type + (sid ? A.Q_STYLE + sid : P.EMPTY));
      setItems(r.items || []);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }, [type, styleOnly, current]);
  useEffect(() => {
    void load();
  }, [load]);
  const remove = async (id: string) => {
    await motionRequest(A.URLS.REMOVE, { type, id }).catch((e) => setError(String(e?.message || e)));
    void load();
  };
  const seed = async (id: string) => {
    const report = await studio.seedKit(id);
    if (report) toast.success(t.LIB_SEED_DONE(report.sets, report.variants, report.props));
    void load();
  };
  const rename = async (id: string) => {
    await motionRequest(A.URLS.RENAME, { type, id, name }).catch((e) => setError(String(e?.message || e)));
    setEditing(P.EMPTY);
    void load();
  };
  return (
    <div className={UI.PANEL}>
      <div className={UI.HEAD}>
        <div className={UI.TABS}>
          {_.map(A.TYPES_SHOWN, (k) => (
            <button key={k} type={MR.MOTION_TEXT_BUTTON} className={k === type ? UI.TAB_ON : UI.TAB} onClick={() => setType(k)}>
              {t.LIB_TYPES[k] || k}
            </button>
          ))}
        </div>
        <div className={UI.CARD_ROW}>
          {type !== PUPPET_TYPES.STYLE && (
            <button type={MR.MOTION_TEXT_BUTTON} className={styleOnly ? UI.TAB_ON : UI.TAB} onClick={() => setStyleOnly(!styleOnly)}>
              {t.LIB_FILTER_STYLE}
            </button>
          )}
          <Button variant={MR.MOTION_TEXT_UNSTYLED} className={UI.BTN} onClick={() => void load()}>
            <RefreshCw className={UI.ICON} />
            {t.LIB_RELOAD}
          </Button>
        </div>
      </div>
      {error && <p className={UI.HINT}>{error}</p>}
      {!items.length ? (
        <p className={UI.HINT}>{t.LIB_EMPTY}</p>
      ) : (
        <div className={UI.GRID}>
          {_.map(items, (it) => (
            <div key={it.id} className={UI.CARD}>
              <img src={A.URLS.THUMB(type, it.id) + A.Q_V + encodeURIComponent(it.updatedAt)} alt={it.name} className={UI.CARD_IMG} loading={MR.MOTION_TEXT_LAZY} />
              <div className={UI.CARD_BODY}>
                {editing === it.id ? (
                  <div className={UI.CARD_ROW}>
                    <input className={UI.INPUT} value={name} onChange={(e) => setName(e.target.value)} />
                    <button type={MR.MOTION_TEXT_BUTTON} className={UI.ICON_BTN} title={t.LIB_SAVE} aria-label={t.LIB_SAVE} onClick={() => void rename(it.id)}>
                      <Check className={UI.ICON} />
                    </button>
                  </div>
                ) : (
                  <div className={UI.CARD_NAME} title={it.name}>
                    {it.name}
                  </div>
                )}
                <div className={UI.CARD_DESC} title={it.desc}>
                  {it.counts ? t.LIB_COUNTS(it.counts) : it.variants?.length ? t.LIB_VARIANTS(it.variants) : it.desc}
                </div>
                <div className={UI.CARD_ROW}>
                  {type === PUPPET_TYPES.STYLE &&
                    (currentId === it.id ? (
                      <span className={UI.TAB_ON}>{t.LIB_IN_USE}</span>
                    ) : (
                      <button type={MR.MOTION_TEXT_BUTTON} className={UI.TAB} onClick={() => studio.patch({ stylePreset: it.preset || it.id, styleReferences: [] })}>
                        {t.LIB_USE}
                      </button>
                    ))}
                  {type === PUPPET_TYPES.STYLE && (
                    <button type={MR.MOTION_TEXT_BUTTON} className={UI.TAB} title={t.LIB_SEED_HINT} disabled={studio.storyBusy} onClick={() => void seed(it.id)}>
                      {t.LIB_SEED}
                    </button>
                  )}
                  <button
                    type={MR.MOTION_TEXT_BUTTON}
                    className={UI.ICON_BTN}
                    title={t.LIB_RENAME}
                    aria-label={t.LIB_RENAME}
                    onClick={() => {
                      setEditing(it.id);
                      setName(it.name);
                    }}>
                    <Pencil className={UI.ICON} />
                  </button>
                  {it.source !== P.SOURCE_PRESET && (
                    <button type={MR.MOTION_TEXT_BUTTON} className={UI.ICON_BTN} title={t.LIB_REMOVE} aria-label={t.LIB_REMOVE} onClick={() => void remove(it.id)}>
                      <Trash2 className={UI.ICON} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
