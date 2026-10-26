import motion_vieneu_texts as T
def synthesize_texts(engine, texts, voice, delivery, pauses=None, normalize=None, join=None):
    if normalize is None:
        from vieneu_utils.phonemize_text import normalize_to_chunks_v3_with_gaps
        normalize = normalize_to_chunks_v3_with_gaps
    if join is None:
        from vieneu_utils.core_utils import join_audio_chunks
        join = join_audio_chunks
    chunks, owners, boundaries = [], [], []
    for index, text in enumerate(texts):
        parts, gaps = normalize(text, max_chars=T.SPEECH_CHARS)
        boundaries.append(gaps)
        chunks.extend(parts)
        owners.extend([index] * len(parts))
    sampling = {key: value for key, value in delivery.items() if key != T.SILENCE_P}
    wavs = engine.infer_batch(chunks, voice=voice, max_chars=T.SPEECH_CHARS, **sampling) if chunks else []
    if len(wavs) != len(chunks):
        raise ValueError(T.CHUNK_COUNT_ERROR)
    grouped = [[] for _ in texts]
    for owner, wav in zip(owners, wavs):
        grouped[owner].append(wav)
    factor = delivery.get(T.SILENCE_P, T.DEFAULT_SILENCE) / T.DEFAULT_SILENCE
    wanted = {key: value * factor for key, value in T.PAUSE_DEFAULTS.items()}
    if pauses:
        for gap, field in [(T.GAP_MINOR, T.PAUSE_CLAUSE), (T.GAP_SENTENCE, T.PAUSE_SENTENCE), (T.GAP_PARAGRAPH, T.PAUSE_BEAT)]:
            value = pauses.get(field)
            if isinstance(value, (int, float)) and 0 <= value <= 2:
                wanted[gap] = float(value)
    return [join(parts, engine.sample_rate, silence_ps=[wanted.get(gap, wanted[T.GAP_SENTENCE]) for gap in gaps]) for parts, gaps in zip(grouped, boundaries)]
