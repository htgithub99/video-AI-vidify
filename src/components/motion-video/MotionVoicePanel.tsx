import { StudioCard, StudioSelect, StudioInput } from "../ui/Studio.js";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Mic, Mic2, Music, Pencil, Plus, Radio, RotateCcw, Search, Sparkles, Star, Trash2, Upload, Volume2, X } from "lucide-react";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_VOICE, MOTION_VOICE_PATTERNS, MOTION_VOICE_AUDIO, MOTION_VOICE_FILTER as F, MOTION_VOICE_PANEL_TEXT as P, MOTION_VOICE_CHANNEL_TEXT, MOTION_VOICE_LIBRARY as L, MOTION_VOICE_PANEL_STYLES as S } from "../../constants/motionVoice.js";
import type { MotionStudio } from "../../hooks/useMotionStudio.js";
import type { Lang } from "../../lib/lang.js";
import { getMotionErrorMessage } from "../../lib/motionUtils.js";
import { motionLanguageCode, motionVoiceMatchesFilter, motionVoiceSpeaks } from "../../lib/motionVoice.js";
import { cn } from "../../lib/utils";
import type { MotionVoiceChannel, MotionVoiceGroup, MotionVoicePreset } from "../../types/motionVideo.js";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { MotionVoicePreviewButton } from "./MotionVoicePreviewButton.js";
import { ActionBtn, StepHeader } from "./MotionControls.js";
import { formatBytes, motionRequest, readFileBase64 } from "./motionApi";
import { VoiceSelectionDialog, type Voice } from "../VoiceSelectionDialog";
type Draft = { id?: string; name: string; narratorVoiceId: string; roleVoices: Partial<Record<MotionVoiceGroup, string>> };
type VoiceFilter = (typeof F)[keyof typeof F];
const emptyDraft = (voiceId: string = MR.MOTION_TEXT_EMPTY): Draft => ({
  name: MR.MOTION_TEXT_EMPTY,
  narratorVoiceId: voiceId,
  roleVoices: {},
});
export const MotionVoicePanel: FC<{ studio: MotionStudio; currentLang: Lang }> = ({ studio, currentLang }) => {
  const t = MOTION_VOICE_CHANNEL_TEXT[currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI];
  const [voices, setVoices] = useState<MotionVoicePreset[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [makeDefaultDraft, setMakeDefaultDraft] = useState(false);
  const [busy, setBusy] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [previewText, setPreviewText] = useState<string>(MOTION_VOICE.PREVIEW_TEXT);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(MR.MOTION_TEXT_EMPTY);
  const [filter, setFilter] = useState<VoiceFilter>(F.ALL);
  const [showUpload, setShowUpload] = useState(false);
  const [showAi33, setShowAi33] = useState(false);
  const [sample, setSample] = useState<{ file: File | null; name: string; gender: string; age: string }>({
    file: null,
    name: MR.MOTION_TEXT_EMPTY,
    gender: MR.MOTION_TEXT_MALE,
    age: MOTION_VOICE.ADULT,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { channels, defaultId } = studio.voiceChannels;
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);
  const loadVoices = useCallback(async () => {
    try {
      const data = await motionRequest<{ voices: MotionVoicePreset[] }>(MOTION_VOICE.VOICES_URL);
      setVoices(data.voices || []);
    } catch (error) {
      toast.error(getMotionErrorMessage(error));
    }
  }, []);
  useEffect(() => {
    void loadVoices();
    void studio.reloadVoiceChannels();
  }, []);
  const voicesById = useMemo(() => new Map(voices.map((voice) => [voice.id, voice])), [voices]);
  const voiceItem = useCallback((id?: string) => (id ? voicesById.get(id) : undefined), [voicesById]);
  const voiceName = useCallback((id?: string) => voiceItem(id)?.name || id || MR.MOTION_TEXT_EMPTY, [voiceItem]);
  const ageLabel = (age?: string) => (age === MR.MOTION_TEXT_CHILD ? t.AGE_CHILD : age === MR.MOTION_TEXT_SENIOR ? t.AGE_SENIOR : t.AGE_ADULT);
  const genderLabel = (gender?: string) => (gender === MR.MOTION_TEXT_FEMALE ? t.FEMALE : gender === MR.MOTION_TEXT_MALE ? t.MALE : MR.MOTION_TEXT_EMPTY);
  const voiceSourceLabel = (voice: MotionVoicePreset): string => (voice.source === L.AI33_SOURCE ? t.AI33 : voice.custom ? t.CUSTOM : MR.MOTION_TEXT_EMPTY);
  const sortedVoices = useMemo(() => _.sortBy(voices, [(voice) => (voice.custom ? 0 : 1), (voice) => voice.name]), [voices]);
  const filteredVoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedVoices.filter((voice) => {
      if (!motionVoiceMatchesFilter(voice, filter)) return false;
      if (q) {
        const nameMatch = voice.name.toLowerCase().includes(q);
        const descMatch = (voice.description || MR.MOTION_TEXT_EMPTY).toLowerCase().includes(q);
        const idMatch = voice.id.toLowerCase().includes(q);
        return nameMatch || descMatch || idMatch;
      }
      return true;
    });
  }, [sortedVoices, filter, searchQuery]);
  const counts = useMemo(() => Object.fromEntries(Object.values(F).map((key) => [key, voices.filter((voice) => motionVoiceMatchesFilter(voice, key)).length])) as Record<VoiceFilter, number>, [voices]);
  const testPresets = useMemo(
    () => [
      { label: t.PRESET_SENTENCE_DEFAULT, text: MOTION_VOICE.PREVIEW_TEXT },
      { label: t.PRESET_SENTENCE_STORY_LABEL, text: t.PRESET_SENTENCE_STORY },
      { label: t.PRESET_SENTENCE_DRAMA_LABEL, text: t.PRESET_SENTENCE_DRAMA },
      { label: t.PRESET_SENTENCE_DIALOG_LABEL, text: t.PRESET_SENTENCE_DIALOG },
    ],
    [t],
  );
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
  const preview = useCallback(
    (voice: string) => {
      if (playingId === voice) {
        stopAudio();
        return;
      }
      stopAudio();
      void run(voice, async () => {
        const preset = voices.find((item) => item.id === voice);
        const sample = previewText || MOTION_VOICE.PREVIEW_TEXT;
        const data = await motionRequest<{ base64: string }>(L.PREVIEW_URL, {
          voice,
          text: sample === MOTION_VOICE.PREVIEW_TEXT && preset && !motionVoiceSpeaks(preset, MR.MOTION_TEXT_VI) ? MOTION_VOICE.PREVIEW_TEXT_EN : sample,
        });
        const audio = new Audio(MOTION_VOICE_AUDIO.MIME_PREFIX + data.base64);
        audioRef.current = audio;
        audio.onplay = () => setPlayingId(voice);
        audio.onended = () => {
          setPlayingId((curr) => (curr === voice ? null : curr));
          audioRef.current = null;
        };
        audio.onerror = () => {
          setPlayingId((curr) => (curr === voice ? null : curr));
          audioRef.current = null;
        };
        audio.onpause = () => {
          setPlayingId((curr) => (curr === voice ? null : curr));
        };
        await audio.play();
      });
    },
    [playingId, previewText, stopAudio, voices],
  );
  const saveChannel = () =>
    draft &&
    run(L.CHANNELS_URL, async () => {
      await motionRequest(L.CHANNELS_URL, { channel: draft, makeDefault: makeDefaultDraft || !defaultId });
      await studio.reloadVoiceChannels();
      setDraft(null);
      setMakeDefaultDraft(false);
      toast.success(t.SAVED);
    });
  const openNewChannelModal = () => {
    setDraft(emptyDraft(sortedVoices[0]?.id));
    setMakeDefaultDraft(!channels.length);
  };
  const openEditChannelModal = (channel: MotionVoiceChannel) => {
    setDraft({
      id: channel.id,
      name: channel.name,
      narratorVoiceId: channel.narratorVoiceId,
      roleVoices: { ...(channel.roleVoices || {}) },
    });
    setMakeDefaultDraft(channel.id === defaultId);
  };
  const setDefault = (channel: MotionVoiceChannel) =>
    run(channel.id, async () => {
      await motionRequest(L.CHANNELS_URL, { channel, makeDefault: true });
      await studio.reloadVoiceChannels();
    });
  const removeChannel = (channel: MotionVoiceChannel) =>
    run(channel.id, async () => {
      await motionRequest(L.CHANNEL_DELETE_URL, { id: channel.id });
      await studio.reloadVoiceChannels();
      toast.success(t.DELETED);
    });
  const train = () =>
    sample.file &&
    run(MOTION_VOICE.REFERENCE_URL, async () => {
      const base64 = await readFileBase64(sample.file!);
      const data = await motionRequest<{ voice: MotionVoicePreset }>(MOTION_VOICE.REFERENCE_URL, {
        base64,
        name: sample.name || sample.file!.name.replace(MOTION_VOICE_PATTERNS.FILE_EXTENSION, MR.MOTION_TEXT_EMPTY),
        gender: sample.gender,
        age: sample.age,
      });
      await loadVoices();
      setSample({ ...sample, file: null, name: MR.MOTION_TEXT_EMPTY });
      setShowUpload(false);
      toast.success(t.TRAINED);
      if (data.voice?.id) void preview(data.voice.id);
    });
  const rename = () =>
    editing &&
    run(editing.id, async () => {
      await motionRequest(L.META_URL, { id: editing.id, name: editing.name });
      setEditing(null);
      await loadVoices();
    });
  const addAi33 = (voice: Voice) =>
    run(L.AI33_SOURCE, async () => {
      const data = await motionRequest<{ voice: MotionVoicePreset }>(L.AI33_URL, { voice });
      setShowAi33(false);
      await loadVoices();
      setFilter(F.AI33);
      toast.success(t.AI33_ADDED(data.voice?.name || voice.name));
      if (data.voice?.id) void preview(data.voice.id);
    });
  const removeVoice = (voice: MotionVoicePreset) =>
    run(voice.id, async () => {
      await motionRequest(L.REMOVE_URL, { id: voice.id });
      await loadVoices();
      toast.success(t.DELETED);
    });
  const voiceSelect = (value: string, onChange: (value: string) => void, allowAuto: boolean) => (
    <StudioSelect value={value} onChange={(event) => onChange(event.target.value)} className={S.SELECT}>
      {allowAuto ? <option value={MR.MOTION_TEXT_EMPTY}>{t.AUTO}</option> : null}
      {_.map(sortedVoices, (voice) => (
        <option key={voice.id} value={voice.id}>
          {_.compact([voice.name, genderLabel(voice.gender), ageLabel(voice.age), voiceSourceLabel(voice)]).join(MR.MOTION_TEXT_SYMBOL_41)}
        </option>
      ))}
    </StudioSelect>
  );
  return (
    <div className={S.CONTAINER}>
      <StudioCard className={S.HEADER_CARD}>
        <div className={S.HEADER_GLOW} />
        <div className={S.HEADER_GRID}>
          <div className={S.HEADER_COPY}>
            <div className={S.HEADER_TITLE_ROW}>
              <div className={S.HEADER_ICON_FRAME}>
                <div className={S.HEADER_ICON_INNER}>
                  <Volume2 className={S.ICON_PURPLE} />
                </div>
              </div>
              <h1 className={S.HEADER_TITLE}>{t.OVERVIEW_TITLE}</h1>
            </div>
            <p className={S.HEADER_SUBTITLE}>{t.OVERVIEW_SUB}</p>
          </div>
          <div className={S.HEADER_STATS}>
            <div className={S.STAT_BADGE}>
              <Mic2 className={S.ICON_SMALL_PURPLE} />
              <span>
                {t.TOTAL_VOICES}
                {MR.MOTION_TEXT_SYMBOL_21}
                <b className={S.STAT_COUNT}>{voices.length}</b>
              </span>
              <span className={S.STAT_DETAIL}>
                {MR.MOTION_TEXT_SYMBOL_23}
                {counts.preset}
                {MR.MOTION_TEXT_SYMBOL_13}
                {t.PRESET.toLowerCase()}
                {MR.MOTION_TEXT_SYMBOL_14}
                {counts.custom}
                {MR.MOTION_TEXT_SYMBOL_13}
                {t.CUSTOM.toLowerCase()}
                {MR.MOTION_TEXT_SYMBOL_7}
              </span>
            </div>
            <div className={defaultId ? S.STAT_BADGE_ACTIVE : S.STAT_BADGE}>
              <Radio className={S.ICON_SMALL_PINK} />
              <span>
                {t.TOTAL_CHANNELS}
                {MR.MOTION_TEXT_SYMBOL_21}
                <b className={S.STAT_COUNT}>{channels.length}</b>
              </span>
              {defaultId && (
                <span className={S.DEFAULT_CHANNEL_BADGE}>
                  {P.STAR}
                  {voiceName(channels.find((c) => c.id === defaultId)?.name)}
                </span>
              )}
            </div>
          </div>
        </div>
      </StudioCard>
      <div className={S.GRID}>
        <div className={S.COL_CHANNELS}>
          <StudioCard className={S.CARD}>
            <StepHeader
              n={MR.MOTION_TEXT_EMPTY + 1}
              icon={Radio}
              title={t.CHANNELS}
              badge={String(channels.length)}
              right={
                <ActionBtn icon={Plus} variant={MR.MOTION_TEXT_PRIMARY} onClick={openNewChannelModal} disabled={!voices.length}>
                  {t.NEW_CHANNEL}
                </ActionBtn>
              }
            />
            <p className={S.HINT}>{t.CHANNELS_HINT}</p>
            {channels.length ? (
              <div className={S.LIST}>
                {_.map(channels, (channel) => {
                  const isDefault = channel.id === defaultId;
                  const narrator = voiceItem(channel.narratorVoiceId);
                  const assignedRoles = _.compact(
                    _.map(L.GROUPS, (group) =>
                      channel.roleVoices?.[group]
                        ? {
                            group,
                            label: t.GROUPS[group],
                            voiceName: voiceName(channel.roleVoices[group]),
                          }
                        : null,
                    ),
                  );
                  return (
                    <div key={channel.id} className={isDefault ? S.CHANNEL_CARD_ACTIVE : S.CHANNEL_CARD}>
                      <div className={S.ROW_BETWEEN}>
                        <div className={S.ROW_TRUNCATED}>
                          <Radio className={cn(S.ICON_CHANNEL, isDefault ? S.TEXT_ACTIVE : S.TEXT_MUTED)} />
                          <span className={S.CHANNEL_NAME}>{channel.name}</span>
                          {isDefault && (
                            <span className={S.BADGE}>
                              <Star className={S.ICON_DEFAULT} />
                              {t.DEFAULT}
                            </span>
                          )}
                        </div>
                        <div className={S.CHANNEL_ACTIONS}>
                          {!isDefault && (
                            <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.SET_DEFAULT} disabled={!!busy} onClick={() => setDefault(channel)} className={S.ICON_BTN}>
                              <Star className={S.ICON} />
                            </Button>
                          )}
                          <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.RENAME} disabled={!!busy} onClick={() => openEditChannelModal(channel)} className={S.ICON_BTN}>
                            <Pencil className={S.ICON} />
                          </Button>
                          <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.DELETE} disabled={!!busy} onClick={() => removeChannel(channel)} className={S.ICON_BTN_DANGER}>
                            <Trash2 className={S.ICON} />
                          </Button>
                        </div>
                      </div>
                      <StudioCard className={S.NARRATOR_CARD}>
                        <div className={S.NARRATOR_ROW}>
                          <div className={S.NARRATOR_ICON_FRAME}>
                            <Mic className={S.ICON_SMALL_LIGHT} />
                          </div>
                          <div className={S.TRUNCATED}>
                            <div className={S.NARRATOR_LABEL}>{t.NARRATOR}</div>
                            <div className={S.ROLE_ROW}>
                              <span className={S.NARRATOR_NAME}>{voiceName(channel.narratorVoiceId)}</span>
                              {narrator && (
                                <span className={S.NARRATOR_TRAITS}>
                                  {MR.MOTION_TEXT_SYMBOL_23}
                                  {_.compact([genderLabel(narrator.gender), ageLabel(narrator.age)]).join(MR.MOTION_TEXT_SYMBOL_14)}
                                  {MR.MOTION_TEXT_SYMBOL_7}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <MotionVoicePreviewButton voiceId={channel.narratorVoiceId} playingId={playingId} busyId={busy} playLabel={t.PREVIEW} stopLabel={t.STOP_PREVIEW} onPreview={preview} />
                      </StudioCard>
                      <div className={S.ROLE_SECTION}>
                        <div className={S.ROLE_LABEL}>{t.ROLE_VOICES}</div>
                        {assignedRoles.length > 0 ? (
                          <div className={S.ROLE_ROW}>
                            {_.map(assignedRoles, (role) => (
                              <span key={role.group} className={S.ROLE_CHIP}>
                                <span className={S.ROLE_CHIP_LABEL}>
                                  {role.label}
                                  {MR.MOTION_TEXT_SYMBOL_39}
                                </span>
                                <span className={S.ROLE_CHIP_VOICE}>{role.voiceName}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className={S.AUTO_ROLES}>{t.AI_AUTO_ROLES}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={S.EMPTY}>
                <Radio className={S.EMPTY_ICON} />
                <p className={S.EMPTY_CHANNEL_HINT}>{t.EMPTY_CHANNELS}</p>
                <ActionBtn icon={Plus} variant={MR.MOTION_TEXT_PRIMARY} onClick={openNewChannelModal} disabled={!voices.length}>
                  {t.NEW_CHANNEL}
                </ActionBtn>
              </div>
            )}
          </StudioCard>
        </div>
        <div className={S.COL_LIBRARY}>
          <StudioCard className={S.CARD}>
            <StepHeader
              n={MR.MOTION_TEXT_EMPTY + 2}
              icon={Mic2}
              title={t.LIBRARY}
              badge={String(voices.length)}
              right={
                <div className={S.INLINE_ROW}>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setShowAi33(true)} disabled={busy === L.AI33_SOURCE} title={t.ADD_AI33_HINT} className={cn(S.UPLOAD_TOGGLE, S.UPLOAD_TOGGLE_INACTIVE)}>
                    <Volume2 className={S.ICON_SMALL_PURPLE} />
                    <span>{t.ADD_AI33}</span>
                  </Button>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setShowUpload(!showUpload)} className={cn(S.UPLOAD_TOGGLE, showUpload ? S.UPLOAD_TOGGLE_ACTIVE : S.UPLOAD_TOGGLE_INACTIVE)}>
                    <Upload className={S.ICON_SMALL_PURPLE} />
                    <span>{t.CREATE_VOICE_BTN}</span>
                    {showUpload ? <ChevronUp className={S.ICON_COLLAPSE} /> : <ChevronDown className={S.ICON_COLLAPSE} />}
                  </Button>
                </div>
              }
            />
            <p className={S.HINT}>{t.LIBRARY_HINT}</p>
            {showUpload && (
              <div className={S.CARD_ACCENT}>
                <div className={S.UPLOAD_HEADER}>
                  <div className={S.INLINE_ROW}>
                    <Sparkles className={S.ICON_PURPLE} />
                    <span className={S.UPLOAD_TITLE}>{t.ADD_VOICE}</span>
                  </div>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setShowUpload(false)} className={S.ICON_BTN}>
                    <X className={S.ICON} />
                  </Button>
                </div>
                <StudioInput
                  type={MR.MOTION_TEXT_FILE}
                  ref={fileInputRef}
                  accept={MOTION_VOICE_AUDIO.ACCEPT}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setSample({
                      ...sample,
                      file,
                      name: sample.name || (file ? file.name.replace(MOTION_VOICE_PATTERNS.FILE_EXTENSION, MR.MOTION_TEXT_EMPTY) : MR.MOTION_TEXT_EMPTY),
                    });
                  }}
                  className={S.HIDDEN}
                />
                <div onClick={() => fileInputRef.current?.click()} className={sample.file ? S.DROPZONE_SELECTED : S.DROPZONE}>
                  {sample.file ? (
                    <div className={S.SAMPLE_ROW}>
                      <div className={S.SAMPLE_DETAIL_ROW}>
                        <div className={S.SAMPLE_ICON_FRAME}>
                          <Music className={S.ICON_SAMPLE} />
                        </div>
                        <div className={S.SAMPLE_COPY}>
                          <div className={S.SAMPLE_NAME}>{sample.file.name}</div>
                          <div className={S.SAMPLE_SIZE}>
                            {formatBytes(sample.file.size)}
                            {P.DOT}
                            {t.FILE_SELECTED}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={MR.MOTION_TEXT_UNSTYLED}
                        type={MR.MOTION_TEXT_BUTTON}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className={S.CHANGE_FILE_BUTTON}>
                        {t.CHANGE_FILE}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className={S.DROPZONE_ICON_FRAME}>
                        <Upload className={S.ICON_UPLOAD} />
                      </div>
                      <div className={S.DROPZONE_HINT}>{t.DROP_FILE_HINT}</div>
                      <p className={S.HINT}>{t.SAMPLE}</p>
                    </>
                  )}
                </div>
                <div className={S.FIELDS_3}>
                  <label className={S.FIELD}>
                    <span className={S.LABEL}>{t.VOICE_NAME}</span>
                    <StudioInput value={sample.name} onChange={(event) => setSample({ ...sample, name: event.target.value })} maxLength={L.NAME_MAX} placeholder={t.VOICE_NAME_PLACEHOLDER} className={S.INPUT} />
                  </label>
                  <label className={S.FIELD}>
                    <span className={S.LABEL}>{t.GENDER}</span>
                    <StudioSelect value={sample.gender} onChange={(event) => setSample({ ...sample, gender: event.target.value })} className={S.SELECT}>
                      <option value={MR.MOTION_TEXT_MALE}>{t.MALE}</option>
                      <option value={MR.MOTION_TEXT_FEMALE}>{t.FEMALE}</option>
                    </StudioSelect>
                  </label>
                  <label className={S.FIELD}>
                    <span className={S.LABEL}>{t.AGE}</span>
                    <StudioSelect value={sample.age} onChange={(event) => setSample({ ...sample, age: event.target.value })} className={S.SELECT}>
                      <option value={MOTION_VOICE.ADULT}>{t.AGE_ADULT}</option>
                      <option value={MR.MOTION_TEXT_CHILD}>{t.AGE_CHILD}</option>
                      <option value={MR.MOTION_TEXT_SENIOR}>{t.AGE_SENIOR}</option>
                    </StudioSelect>
                  </label>
                </div>
                {busy === MOTION_VOICE.REFERENCE_URL && (
                  <div className={S.BUSY}>
                    <Sparkles className={S.ICON_TRAINING} />
                    <span>{t.TRAINING}</span>
                  </div>
                )}
                <div className={S.ACTIONS}>
                  <ActionBtn icon={Upload} busy={busy === MOTION_VOICE.REFERENCE_URL} disabled={!sample.file || !!busy} onClick={() => void train()}>
                    {t.TRAIN}
                  </ActionBtn>
                </div>
              </div>
            )}
            <div className={S.PREVIEW_CARD}>
              <div className={S.ROW_BETWEEN}>
                <div className={S.INLINE_ROW_SMALL}>
                  <Volume2 className={S.ICON_SMALL_PURPLE} />
                  <span className={S.LABEL}>{t.PREVIEW_TEXT}</span>
                </div>
                {previewText && (
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.RESET_PREVIEW} onClick={() => setPreviewText(MOTION_VOICE.PREVIEW_TEXT)} className={S.PREVIEW_RESET}>
                    <RotateCcw className={S.ICON_TINY} />
                    <span>{t.RESET_PREVIEW}</span>
                  </Button>
                )}
              </div>
              <div className={S.INPUT_WRAPPER}>
                <StudioInput value={previewText} onChange={(event) => setPreviewText(event.target.value)} placeholder={MOTION_VOICE.PREVIEW_TEXT} className={cn(S.INPUT, S.INPUT_CLEAR_PADDING)} />
                {previewText && (
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setPreviewText(MR.MOTION_TEXT_EMPTY)} className={S.PREVIEW_CLEAR}>
                    <X className={S.ICON_CLEAR} />
                  </Button>
                )}
              </div>
              <div className={S.PRESET_ROW}>
                <span className={S.STAT_DETAIL}>{t.TEST_SENTENCES}</span>
                {_.map(testPresets, (preset) => (
                  <Button key={preset.label} variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setPreviewText(preset.text)} className={cn(S.PRESET_CHIP, previewText === preset.text ? S.PRESET_CHIP_ACTIVE : S.PRESET_CHIP_INACTIVE)}>
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className={S.FILTER_SECTION}>
              <div className={S.FILTER_ROW}>
                <div className={S.SEARCH_WRAPPER}>
                  <Search className={S.ICON_SEARCH} />
                  <StudioInput value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.SEARCH_PLACEHOLDER} className={cn(S.INPUT, S.SEARCH_PADDING)} />
                  {searchQuery && (
                    <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setSearchQuery(MR.MOTION_TEXT_EMPTY)} className={S.SEARCH_CLEAR}>
                      <X className={S.ICON_CLEAR} />
                    </Button>
                  )}
                </div>
                <div className={S.ROLE_ROW}>
                  {(
                    [
                      { id: F.ALL, label: P.FILTER_LABEL(t.FILTER_ALL, counts.all) },
                      { id: F.PRESET, label: P.FILTER_LABEL(t.FILTER_PRESET, counts.preset) },
                      { id: F.CUSTOM, label: P.FILTER_LABEL(t.FILTER_CUSTOM, counts.custom) },
                      { id: F.AI33, label: P.FILTER_LABEL(t.FILTER_AI33, counts.ai33) },
                      { id: F.MALE, label: P.FILTER_LABEL(t.FILTER_MALE, counts.male) },
                      { id: F.FEMALE, label: P.FILTER_LABEL(t.FILTER_FEMALE, counts.female) },
                    ] as const
                  ).map((item) => (
                    <Button key={item.id} variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setFilter(item.id)} className={cn(S.FILTER_CHIP, filter === item.id ? S.FILTER_CHIP_ACTIVE : S.FILTER_CHIP_INACTIVE)}>
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            {filteredVoices.length ? (
              <div className={S.LIST}>
                {_.map(filteredVoices, (voice) => {
                  const isPlaying = playingId === voice.id;
                  const isMale = voice.gender === MR.MOTION_TEXT_MALE;
                  const isPreset = motionVoiceMatchesFilter(voice, F.PRESET);
                  return (
                    <div key={voice.id} className={isPlaying ? S.ITEM_ACTIVE : S.ITEM}>
                      <MotionVoicePreviewButton voiceId={voice.id} playingId={playingId} busyId={busy} playLabel={t.PREVIEW} stopLabel={t.STOP_PREVIEW} onPreview={preview} />
                      <div className={S.ITEM_MAIN}>
                        {editing?.id === voice.id ? (
                          <div className={S.INLINE_ROW}>
                            <StudioInput value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} maxLength={L.NAME_MAX} className={cn(S.INPUT, S.RENAME_PADDING)} autoFocus />
                            <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.SAVED} disabled={!!busy || !editing.name.trim()} onClick={() => rename()} className={S.ICON_BTN}>
                              <Check className={S.ICON_CONFIRM} />
                            </Button>
                            <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.CANCEL} onClick={() => setEditing(null)} className={S.ICON_BTN}>
                              <X className={S.ICON_CANCEL} />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className={S.ROW}>
                              <span className={S.ITEM_TITLE}>{voice.name}</span>
                              <span className={isPreset ? S.BADGE_MUTED : S.BADGE}>{voiceSourceLabel(voice) || t.PRESET}</span>
                              {voice.gender && <span className={isMale ? S.BADGE_GENDER_MALE : S.BADGE_GENDER_FEMALE}>{genderLabel(voice.gender)}</span>}
                              {voice.age && <span className={S.AGE_BADGE}>{ageLabel(voice.age)}</span>}
                              {voice.language && <span className={S.AGE_BADGE}>{motionLanguageCode(voice.language).toUpperCase()}</span>}
                            </div>
                            {voice.description && <div className={S.ITEM_SUB}>{voice.description}</div>}
                          </>
                        )}
                      </div>
                      {isPlaying && (
                        <div className={S.EQUALIZER}>
                          <span className={S.EQUALIZER_LEFT} />
                          <span className={S.EQUALIZER_CENTER} />
                          <span className={S.EQUALIZER_RIGHT} />
                        </div>
                      )}
                      {!isPreset && !editing && (
                        <div className={S.VOICE_ACTIONS}>
                          <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.RENAME} disabled={!!busy} onClick={() => setEditing({ id: voice.id, name: voice.name })} className={S.ICON_BTN}>
                            <Pencil className={S.ICON} />
                          </Button>
                          <Button variant={MR.MOTION_TEXT_UNSTYLED} title={t.DELETE} disabled={!!busy} onClick={() => removeVoice(voice)} className={S.ICON_BTN_DANGER}>
                            <Trash2 className={S.ICON} />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={S.EMPTY}>
                <Mic2 className={S.EMPTY_ICON} />
                <p className={S.EMPTY_VOICE_HINT}>{t.NO_VOICE_MATCH}</p>
                {(searchQuery || filter !== F.ALL) && (
                  <Button
                    variant={MR.MOTION_TEXT_UNSTYLED}
                    onClick={() => {
                      setSearchQuery(MR.MOTION_TEXT_EMPTY);
                      setFilter(F.ALL);
                    }}
                    className={S.FILTER_RESET}>
                    {t.RESET_FILTER}
                  </Button>
                )}
              </div>
            )}
          </StudioCard>
        </div>
      </div>
      <Modal isOpen={Boolean(draft)} onClose={() => setDraft(null)} title={draft?.id ? t.EDIT_CHANNEL_MODAL_TITLE : t.CREATE_CHANNEL_MODAL_TITLE} maxWidth={P.MODAL_WIDTH}>
        {draft && (
          <div className={S.MODAL_BODY}>
            <label className={S.FIELD}>
              <span className={S.LABEL}>{t.CHANNEL_NAME}</span>
              <StudioInput value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} maxLength={L.NAME_MAX} placeholder={t.CHANNEL_NAME_PLACEHOLDER} className={S.INPUT} autoFocus />
            </label>
            <label className={S.FIELD}>
              <span className={S.LABEL}>{t.NARRATOR}</span>
              <div className={S.INLINE_ROW}>
                <div className={S.SELECT_WRAPPER}>{voiceSelect(draft.narratorVoiceId, (narratorVoiceId) => setDraft({ ...draft, narratorVoiceId }), false)}</div>
                <MotionVoicePreviewButton voiceId={draft.narratorVoiceId} playingId={playingId} busyId={busy} playLabel={t.PREVIEW} stopLabel={t.STOP_PREVIEW} onPreview={preview} />
              </div>
            </label>
            <div className={S.MODAL_ROLES}>
              <div className={S.MODAL_ROLE_HEADER}>
                <span className={S.LABEL}>{t.ROLE_VOICES}</span>
                <p className={S.HINT}>{t.ROLE_VOICES_HINT}</p>
              </div>
              <div className={S.FIELDS_2}>
                {_.map(L.GROUPS, (group) => (
                  <label key={group} className={S.FIELD}>
                    <span className={S.MODAL_ROLE_LABEL}>{t.GROUPS[group]}</span>
                    {voiceSelect(draft.roleVoices[group] || MR.MOTION_TEXT_EMPTY, (id) => setDraft({ ...draft, roleVoices: { ...draft.roleVoices, [group]: id || undefined } }), true)}
                  </label>
                ))}
              </div>
            </div>
            <div className={S.DEFAULT_SECTION}>
              <label className={S.DEFAULT_LABEL}>
                <StudioInput type={MR.MOTION_TEXT_CHECKBOX} checked={makeDefaultDraft} onChange={(e) => setMakeDefaultDraft(e.target.checked)} className={S.DEFAULT_CHECKBOX} />
                <span className={S.DEFAULT_TEXT}>{t.SET_DEFAULT}</span>
              </label>
            </div>
            <div className={S.ACTIONS}>
              <ActionBtn icon={X} variant={P.SECONDARY} onClick={() => setDraft(null)}>
                {t.CANCEL}
              </ActionBtn>
              <ActionBtn icon={Check} busy={busy === L.CHANNELS_URL} disabled={!draft.name.trim() || !draft.narratorVoiceId} onClick={saveChannel}>
                {t.SAVE}
              </ActionBtn>
            </div>
          </div>
        )}
      </Modal>
      <VoiceSelectionDialog isOpen={showAi33} onClose={() => setShowAi33(false)} onSelectVoice={addAi33} currentLang={currentLang === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI} favoriteVoices={[]} onToggleFavoriteVoice={_.noop} persistenceScope={L.AI33_SCOPE} />
    </div>
  );
};
