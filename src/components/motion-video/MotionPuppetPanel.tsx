import _ from "lodash";
import { Grid3x3, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, type FC } from "react";
import * as MR from "../../constants/motionRuntime.js";
import { API_ROUTES } from "../../constants/apiRoutes";
import { PUPPET as P, PUPPET_KIT_API, PUPPET_TEXTS, PUPPET_TYPES, PUPPET_UI as UI } from "../../constants/motionPuppet.js";
import { collectPuppetLines } from "../../lib/motionPuppet.js";
import type { MotionSpec, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo";
import type { PuppetFrame, PuppetFrameActor } from "../../types/motionPuppet";
import { Button } from "../ui/Button";
import { genPreviewUrl, motionRequest } from "./motionApi";

interface SheetItem { t: number; text: string; file: string; }
interface Props {
  lang: string;
  script: MotionStoryScript;
  analysis: MotionStoryAnalysis | null;
  spec?: MotionSpec;
  busy: boolean;
  onFrames: (frames: Record<string, PuppetFrame>) => void;
  onRedoBeats: (beats: string[]) => void;
  onRedoPlace: (place: string) => void;
  onOpen: (url: string, title: string, text: string) => void;
  onCompile?: () => Promise<MotionSpec | undefined>;
}

const Asset: FC<{ url: string; name: string; onOpen: () => void; onRedo?: () => void; redoTitle?: string; busy?: boolean }> = ({ url, name, onOpen, onRedo, redoTitle, busy }) => (
  <div className={UI.ASSET} onClick={onOpen} title={name}>
    <img src={url} alt={name} className={UI.ASSET_IMG} loading={MR.MOTION_TEXT_LAZY} />
    <div className={UI.ASSET_NAME}>{name}</div>
    {onRedo && (
      <button
        type={MR.MOTION_TEXT_BUTTON}
        className={UI.ASSET_BTN}
        title={redoTitle}
        aria-label={redoTitle}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          onRedo();
        }}>
        <RotateCcw className={UI.ICON} />
      </button>
    )}
  </div>
);

const Pick: FC<{ value: string; list: readonly string[]; labels?: Record<string, string>; title: string; busy: boolean; empty?: string; onChange: (v: string) => void }> = ({ value, list, labels, title, busy, empty, onChange }) => (
  <select className={UI.SELECT} value={value} title={title} disabled={busy} onChange={(e) => onChange(e.target.value)}>
    {empty !== undefined && <option value={P.EMPTY}>{empty}</option>}
    {_.map(list, (v) => (
      <option key={v} value={v}>
        {labels?.[v] || v}
      </option>
    ))}
  </select>
);

export const MotionPuppetPanel: FC<Props> = ({ lang, script, analysis, spec, busy, onFrames, onRedoBeats, onRedoPlace, onOpen, onCompile }) => {
  const t = lang === MR.MOTION_TEXT_EN ? PUPPET_TEXTS.en : PUPPET_TEXTS.vi;
  const pg = script.gen?.puppet;
  const lines = useMemo(() => collectPuppetLines(script, MR.MOTION_TEXT_SCENE), [script]);
  const names = useMemo(() => _.fromPairs(_.map(analysis?.cast || [], (c) => [c.key, c.name])), [analysis]);
  const [sheet, setSheet] = useState<SheetItem[]>(pg?.sheet || []);
  useEffect(() => setSheet(pg?.sheet || []), [pg?.sheet]);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string>(P.EMPTY);
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const frames = pg?.frames || {};
  const update = (key: string, next: PuppetFrame) => onFrames({ ...frames, [key]: next });
  const setActor = (key: string, f: PuppetFrame, i: number, patch: Partial<PuppetFrameActor>) => update(key, { ...f, actors: _.map(f.actors, (a, ai) => (ai === i ? { ...a, ...patch } : a)) });
  const loadSheet = async () => {
    setSheetBusy(true);
    setSheetError(P.EMPTY);
    try {
      const use = (onCompile ? await onCompile() : undefined) || spec;
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
  const markedBeats = _.uniq(_.map(_.filter(lines, (l) => marked[l.key]), (l) => l.beatId));
  const placeName = (k: string) => pg?.places?.[k]?.name || _.find(analysis?.places || [], { key: k })?.name || k;
  return (
    <div className={UI.WRAP}>
      <div className={UI.HEAD}>
        <div className={UI.TITLE}>{t.TITLE}</div>
        {pg && <div className={UI.STATS}>{t.STATS(_.size(frames), _.size(pg.characters), _.size(pg.sets), _.size(pg.props))}</div>}
      </div>
      <p className={UI.HINT}>{pg ? t.HINT : t.EMPTY}</p>
      {pg && !_.isEmpty(pg.characters) && (
        <div className={UI.PANEL}>
          <div className={UI.TITLE}>{t.CHARACTERS}</div>
          <div className={UI.STRIP}>
            {_.map(pg.characters, (id, key) => {
              const url = PUPPET_KIT_API.URLS.THUMB(PUPPET_TYPES.CHARACTER, id);
              return <Asset key={key} url={url} name={names[key] || key} onOpen={() => onOpen(url, names[key] || key, P.EMPTY)} />;
            })}
          </div>
        </div>
      )}
      {pg && !_.isEmpty(pg.sets) && (
        <div className={UI.PANEL}>
          <div className={UI.TITLE}>{t.SETS}</div>
          <div className={UI.STRIP}>
            {_.map(pg.sets, (id, key) => {
              const url = PUPPET_KIT_API.URLS.THUMB(PUPPET_TYPES.SET, id);
              return <Asset key={key} url={url} name={placeName(key)} busy={busy} redoTitle={t.SET_REDO} onRedo={() => onRedoPlace(key)} onOpen={() => onOpen(url, placeName(key), pg.places?.[key]?.desc || P.EMPTY)} />;
            })}
          </div>
        </div>
      )}
      {pg && !_.isEmpty(pg.props) && (
        <div className={UI.PANEL}>
          <div className={UI.TITLE}>{t.PROPS}</div>
          <div className={UI.STRIP}>
            {_.map(pg.props, (id, key) => {
              const url = PUPPET_KIT_API.URLS.THUMB(PUPPET_TYPES.PROP, id);
              return <Asset key={key} url={url} name={key} onOpen={() => onOpen(url, key, P.EMPTY)} />;
            })}
          </div>
        </div>
      )}
      {pg && (
        <div className={UI.HEAD}>
          <Button variant={MR.MOTION_TEXT_UNSTYLED} className={UI.BTN} disabled={sheetBusy || busy} onClick={() => void loadSheet()}>
            {sheetBusy ? <Loader2 className={UI.SPIN} /> : <Grid3x3 className={UI.ICON} />}
            {sheetBusy ? t.SHEET_BUSY : t.SHEET}
          </Button>
          {!!markedBeats.length && (
            <Button
              variant={MR.MOTION_TEXT_UNSTYLED}
              className={UI.BTN}
              disabled={busy}
              onClick={() => {
                onRedoBeats(markedBeats);
                setMarked({});
              }}>
              <RotateCcw className={UI.ICON} />
              {t.REDO_ALL}
            </Button>
          )}
        </div>
      )}
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
      {pg && (
        <div className={UI.LIST}>
          {_.map(lines, (l, i) => {
            const f = frames[l.key];
            return (
              <div key={l.key} className={marked[l.key] || f?.why ? UI.ROW_FIX : UI.ROW}>
                <div className={UI.ROW_HEAD}>
                  <span className={UI.INDEX}>{i + 1}</span>
                  <span className={UI.TEXT} title={l.text}>
                    {l.text}
                  </span>
                  <button type={MR.MOTION_TEXT_BUTTON} className={UI.ICON_BTN} title={t.REDO} aria-label={t.REDO} disabled={busy} onClick={() => setMarked({ ...marked, [l.key]: !marked[l.key] })}>
                    <RotateCcw className={UI.ICON} />
                  </button>
                </div>
                {f?.why && <div className={UI.WHY}>{f.why}</div>}
                {f ? (
                  <div className={UI.CONTROLS}>
                    <Pick value={f.shot} list={P.SHOTS} labels={t.SHOTS} title={t.SHOT} busy={busy} onChange={(v) => update(l.key, { ...f, shot: v })} />
                    <Pick value={f.set || P.EMPTY} list={_.keys(pg.sets)} labels={_.mapValues(pg.sets, (_id, k) => placeName(k))} title={t.SETS} busy={busy} empty={t.NONE} onChange={(v) => update(l.key, { ...f, set: v || undefined })} />
                    <Pick value={f.light || P.EMPTY} list={P.LIGHTS} title={t.LIGHT} busy={busy} empty={t.NONE} onChange={(v) => update(l.key, { ...f, light: v || null })} />
                    {(_.includes(P.SHOT_PROP, f.shot) || f.prop) && <Pick value={f.prop || P.EMPTY} list={_.keys(pg.props)} title={t.PROP} busy={busy} empty={t.NONE} onChange={(v) => update(l.key, { ...f, prop: v || null })} />}
                    {_.map(f.actors, (a, ai) => (
                      <span key={a.char} className={UI.ACTOR}>
                        {names[a.char] || a.char}
                        <Pick value={a.pose} list={P.POSES} title={t.POSE} busy={busy} onChange={(v) => setActor(l.key, f, ai, { pose: v })} />
                        <Pick value={a.expr} list={P.EXPRS} title={t.EXPR} busy={busy} onChange={(v) => setActor(l.key, f, ai, { expr: v })} />
                        <Pick value={a.face} list={P.FACES} title={t.POSE} busy={busy} onChange={(v) => setActor(l.key, f, ai, { face: v })} />
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={UI.CONTROLS}>
                    <span className={UI.ACTOR}>{t.NO_FRAME}</span>
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
