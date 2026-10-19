import _ from "lodash";
import { Grid3x3, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, type FC } from "react";
import * as MR from "../../constants/motionRuntime.js";
import { API_ROUTES } from "../../constants/apiRoutes";
import { MOTION_BOARD2D as B, MOTION_BOARD2D_TEXTS, MOTION_BOARD2D_UI as UI } from "../../constants/motionBoard2d.js";
import { collectBoard2dLines } from "../../lib/motionBoard2d.js";
import type { MotionBoard2dSentence, MotionSpec, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo";
import { Button } from "../ui/Button";
import { genPreviewUrl, motionRequest } from "./motionApi";

interface SheetItem { t: number; text: string; file: string; }
interface Props {
  lang: string;
  script: MotionStoryScript;
  analysis: MotionStoryAnalysis | null;
  spec?: MotionSpec;
  busy: boolean;
  onChange: (sentences: Record<string, MotionBoard2dSentence>) => void;
  onRedo: () => void;
  onOpen: (url: string, title: string, text: string) => void;
  onCompile?: () => Promise<MotionSpec | undefined>;
  onRedoPlace?: (place: string) => void;
}

export const MotionBoard2dPanel: FC<Props> = ({ lang, script, analysis, spec, busy, onChange, onRedo, onOpen, onCompile, onRedoPlace }) => {
  const t = lang === MR.MOTION_TEXT_EN ? MOTION_BOARD2D_TEXTS.en : MOTION_BOARD2D_TEXTS.vi;
  const board = script.gen?.board2d;
  const lines = useMemo(() => collectBoard2dLines(script, MR.MOTION_TEXT_SCENE), [script]);
  const names = useMemo(() => _.fromPairs(_.map(analysis?.cast || [], (c) => [c.key, c.name])), [analysis]);
  const [sheet, setSheet] = useState<SheetItem[]>(board?.sheet || []);
  useEffect(() => setSheet(board?.sheet || []), [board?.sheet]);
  const placeNames = useMemo(() => _.fromPairs(_.map(analysis?.places || [], (p) => [p.key, p.name])), [analysis]);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const sentences = board?.sentences || {};
  const update = (key: string, next: MotionBoard2dSentence) => onChange({ ...sentences, [key]: next });
  const marked = _.some(_.values(sentences), (s) => s?.redo);
  const loadSheet = async () => {
    setSheetBusy(true);
    setSheetError(MR.MOTION_TEXT_EMPTY);
    try {
      const use = spec || (onCompile ? await onCompile() : undefined);
      if (!use) {
        setSheetError(t.SHEET_NEED);
        return;
      }
      const r = await motionRequest<{ items: SheetItem[] }>(API_ROUTES.MOTION_BOARD2D_SHEET, { spec: use });
      setSheet(r.items || []);
    } catch (e: any) {
      setSheetError(String(e?.message || e));
    } finally {
      setSheetBusy(false);
    }
  };
  return (
    <div className={UI.WRAP}>
      <div className={UI.HEAD}>
        <div className={UI.TITLE}>{t.TITLE}</div>
        <div className={UI.STATS}>{t.STATS(lines.length, _.size(board?.sets || {}), (board?.props || []).length)}</div>
      </div>
      <p className={UI.HINT}>{board ? t.HINT : t.EMPTY}</p>
      {!_.isEmpty(board?.cast) && (
        <div className={UI.CHIPS} title={t.CAST_TITLE}>
          {_.map(board!.cast, (c, key) => (
            <span key={key} className={UI.CHIP}>
              <span className={UI.SWATCH} style={{ background: c.top }} />
              {names[key] || key}
              {c.ghost && <span className={UI.MUTED}>{t.GHOST}</span>}
            </span>
          ))}
        </div>
      )}
      {!_.isEmpty(board?.sets) && (
        <div className={UI.CHIPS} title={t.SETS_TITLE}>
          {_.map(board!.sets, (_id, key) => {
            const code = board!.codeSets?.[key];
            return (
              <span key={key} className={code ? UI.CHIP_CODE : UI.CHIP}>
                {placeNames[key] || key}
                <span className={UI.MUTED}>{code ? t.SET_CODE(code) : t.SET_SVG}</span>
                {onRedoPlace && (
                  <button type={MR.MOTION_TEXT_BUTTON} className={UI.ICON_BTN} title={t.SET_REDO} aria-label={t.SET_REDO} disabled={busy} onClick={() => onRedoPlace(key)}>
                    <RotateCcw className={UI.ICON} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
      <div className={UI.HEAD}>
        <Button variant={MR.MOTION_TEXT_UNSTYLED} className={UI.BTN} disabled={sheetBusy || busy} onClick={() => void loadSheet()}>
          {sheetBusy ? <Loader2 className={UI.ICON + B.SPACE + MR.MOTION_TEXT_ANIMATE_SPIN} /> : <Grid3x3 className={UI.ICON} />}
          {sheetBusy ? t.SHEET_BUSY : t.SHEET}
        </Button>
        {marked && (
          <Button variant={MR.MOTION_TEXT_UNSTYLED} className={UI.BTN} disabled={busy} onClick={onRedo}>
            <RotateCcw className={UI.ICON} />
            {t.REDO_ALL}
          </Button>
        )}
      </div>
      {sheetError && <p className={UI.HINT}>{sheetError}</p>}
      {!!sheet.length && (
        <div className={UI.SHEET}>
          {_.map(sheet, (it, i) => (
            <div key={it.file} className={UI.SHEET_CARD} onClick={() => onOpen(genPreviewUrl(it.file), String(i + 1), it.text)}>
              <img src={genPreviewUrl(it.file)} alt={it.text} className={UI.SHEET_IMG} loading={MR.MOTION_TEXT_LAZY} />
              <div className={UI.SHEET_TEXT}>{it.text}</div>
            </div>
          ))}
        </div>
      )}
      {board && (
        <div className={UI.LIST}>
          {_.map(lines, (l, i) => {
            const e = sentences[l.key];
            return (
              <div key={l.key} className={e?.redo ? UI.ROW_REDO : UI.ROW}>
                <div className={UI.ROW_HEAD}>
                  <span className={UI.INDEX}>{i + 1}</span>
                  <span className={UI.TEXT} title={l.text}>
                    {l.text}
                  </span>
                  <button type={MR.MOTION_TEXT_BUTTON} className={UI.ICON_BTN} title={t.REDO} aria-label={t.REDO} disabled={busy || !e} onClick={() => e && update(l.key, { ...e, redo: !e.redo })}>
                    <RotateCcw className={UI.ICON} />
                  </button>
                </div>
                {e ? (
                  <div className={UI.CONTROLS}>
                    <select className={UI.SELECT} value={e.mode} disabled={busy} onChange={(ev) => update(l.key, { ...e, mode: ev.target.value as MotionBoard2dSentence["mode"], kind: ev.target.value === B.MODES[1] ? e.kind || B.KINDS[2] : null })}>
                      {_.map(B.MODES, (m) => (
                        <option key={m} value={m}>
                          {t.MODE[m] || m}
                        </option>
                      ))}
                    </select>
                    {e.mode === B.MODES[1] && (
                      <select className={UI.SELECT} value={e.kind || B.KINDS[2]} title={t.KIND} disabled={busy} onChange={(ev) => update(l.key, { ...e, kind: ev.target.value })}>
                        {_.map(B.KINDS, (k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    )}
                    {e.mode === B.MODES[0] && (
                      <select className={UI.SELECT} value={e.camera || B.CAMERAS[1]} title={t.CAMERA} disabled={busy} onChange={(ev) => update(l.key, { ...e, camera: ev.target.value })}>
                        {_.map(B.CAMERAS, (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                    {e.mode === B.MODES[0] &&
                      _.map(e.actors, (a, ai) => (
                        <span key={a.cast} className={UI.ACTOR}>
                          {names[a.cast] || a.cast}
                          <select className={UI.SELECT} value={a.pose} title={t.POSE} disabled={busy} onChange={(ev) => update(l.key, { ...e, actors: _.map(e.actors, (x, xi) => (xi === ai ? { ...x, pose: ev.target.value } : x)) })}>
                            {_.map(B.POSES, (p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <select className={UI.SELECT} value={a.expression || B.EXPRESSIONS[0]} disabled={busy} onChange={(ev) => update(l.key, { ...e, actors: _.map(e.actors, (x, xi) => (xi === ai ? { ...x, expression: ev.target.value } : x)) })}>
                            {_.map(B.EXPRESSIONS, (p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </span>
                      ))}
                    {e.mode !== B.MODES[0] && !!e.objects.length && <span className={UI.ACTOR}>{_.map(e.objects, (o) => o.key + (o.count && o.count > 1 ? B.TIMES + o.count : MR.MOTION_TEXT_EMPTY)).join(B.LIST_SEP)}</span>}
                  </div>
                ) : (
                  <div className={UI.CONTROLS}>
                    <span className={UI.ACTOR}>{t.NO_ENTRY}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
