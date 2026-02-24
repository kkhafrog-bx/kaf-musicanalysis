#!/usr/bin/env python3
"""
Audio analysis script for AI Music Prompt Generator.
Usage: python3 analyze_audio.py <audio_file_path>
Output: JSON to stdout
"""

import sys
import json
import warnings
warnings.filterwarnings('ignore')

def analyze(audio_path: str) -> dict:
    import librosa
    import numpy as np

    # Load up to 90 seconds for analysis (faster)
    y, sr = librosa.load(audio_path, duration=90, offset=5)

    # ── Tempo / BPM ──────────────────────────────────────────────────────────
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(round(float(tempo), 1))

    # ── Key Estimation ────────────────────────────────────────────────────────
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    key_idx = int(np.argmax(chroma_mean))
    key = notes[key_idx]

    # Determine major/minor using Krumhansl-Schmuckler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    best_corr = -1
    best_key = key
    best_mode = "major"
    for i in range(12):
        rotated_chroma = np.roll(chroma_mean, -i)
        corr_major = float(np.corrcoef(rotated_chroma, major_profile)[0, 1])
        corr_minor = float(np.corrcoef(rotated_chroma, minor_profile)[0, 1])
        if corr_major > best_corr:
            best_corr = corr_major
            best_key = notes[i]
            best_mode = "major"
        if corr_minor > best_corr:
            best_corr = corr_minor
            best_key = notes[i]
            best_mode = "minor"

    # ── Energy & Dynamics ────────────────────────────────────────────────────
    rms = librosa.feature.rms(y=y)
    rms_mean = float(rms.mean())
    rms_std = float(rms.std())

    # Energy level classification
    if rms_mean < 0.05:
        energy_level = "낮음 (Low)"
    elif rms_mean < 0.12:
        energy_level = "중저 (Medium-Low)"
    elif rms_mean < 0.20:
        energy_level = "중간 (Medium)"
    elif rms_mean < 0.30:
        energy_level = "중고 (Medium-High)"
    else:
        energy_level = "높음 (High)"

    # Dynamic range
    dynamic_range = "넓음 (Wide)" if rms_std / (rms_mean + 1e-10) > 0.4 else "좁음 (Narrow)"

    # ── Harmonic / Percussive Ratio ───────────────────────────────────────────
    y_harmonic, y_percussive = librosa.effects.hpss(y)
    harmonic_energy = float(np.mean(y_harmonic**2))
    percussive_energy = float(np.mean(y_percussive**2))
    hp_ratio = harmonic_energy / (percussive_energy + 1e-10)

    if hp_ratio > 3.0:
        texture = "멜로딕 (Melodic-dominant)"
    elif hp_ratio > 1.0:
        texture = "균형 (Balanced)"
    else:
        texture = "리드미컬 (Rhythmic-dominant)"

    # ── Spectral Features ─────────────────────────────────────────────────────
    spectral_centroid = float(librosa.feature.spectral_centroid(y=y, sr=sr).mean())
    spectral_rolloff = float(librosa.feature.spectral_rolloff(y=y, sr=sr).mean())
    zcr = float(librosa.feature.zero_crossing_rate(y).mean())

    # Brightness classification
    if spectral_centroid < 1500:
        brightness = "어둡고 따뜻함 (Dark & Warm)"
    elif spectral_centroid < 2500:
        brightness = "중간 (Balanced)"
    elif spectral_centroid < 4000:
        brightness = "밝음 (Bright)"
    else:
        brightness = "매우 밝음 (Very Bright)"

    # ── Onset / Rhythm Density ────────────────────────────────────────────────
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_mean = float(onset_env.mean())
    onset_std = float(onset_env.std())

    if onset_mean < 0.3:
        rhythm_density = "희박 (Sparse)"
    elif onset_mean < 0.6:
        rhythm_density = "중간 (Moderate)"
    else:
        rhythm_density = "밀집 (Dense)"

    # ── Duration ─────────────────────────────────────────────────────────────
    full_y, _ = librosa.load(audio_path, sr=None)
    import soundfile as sf
    try:
        info = sf.info(audio_path)
        duration_sec = info.duration
    except Exception:
        duration_sec = len(full_y) / sr

    minutes = int(duration_sec // 60)
    seconds = int(duration_sec % 60)
    duration_str = f"{minutes}:{seconds:02d}"

    # ── MFCC (Timbre) ─────────────────────────────────────────────────────────
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=5)
    mfcc_means = [round(float(v), 2) for v in mfccs.mean(axis=1)]

    # ── Mood Inference ────────────────────────────────────────────────────────
    # Based on key, tempo, energy, harmonic ratio
    mood_tags = []
    if best_mode == "major":
        if bpm < 90:
            mood_tags.extend(["서정적 (Lyrical)", "감성적 (Emotional)", "따뜻함 (Warm)"])
        else:
            mood_tags.extend(["밝음 (Uplifting)", "에너제틱 (Energetic)"])
    else:
        if bpm < 90:
            mood_tags.extend(["우울 (Melancholic)", "어둠 (Dark)", "신비로움 (Mysterious)"])
        else:
            mood_tags.extend(["강렬함 (Intense)", "드라마틱 (Dramatic)"])

    if hp_ratio > 2.0:
        mood_tags.append("멜로딕 (Melodic)")
    if onset_mean > 0.5:
        mood_tags.append("리드미컬 (Rhythmic)")
    if rms_std / (rms_mean + 1e-10) > 0.4:
        mood_tags.append("다이내믹 (Dynamic)")

    # ── Genre Inference ───────────────────────────────────────────────────────
    genre_hints = []
    if bpm >= 120 and bpm <= 140 and percussive_energy > harmonic_energy:
        genre_hints.append("Electronic / Dance")
    if bpm >= 60 and bpm <= 100 and hp_ratio > 2.0:
        genre_hints.append("Ballad / Pop")
    if bpm >= 80 and bpm <= 100 and onset_mean > 0.4:
        genre_hints.append("Hip-Hop / R&B")
    if not genre_hints:
        genre_hints.append("Pop / Contemporary")

    # ── Time Signature Estimation ─────────────────────────────────────────────
    # Simple heuristic based on beat regularity
    beat_intervals = np.diff(librosa.frames_to_time(beat_frames, sr=sr))
    if len(beat_intervals) > 4:
        cv = float(np.std(beat_intervals) / (np.mean(beat_intervals) + 1e-10))
        time_sig = "4/4" if cv < 0.3 else "3/4 or irregular"
    else:
        time_sig = "4/4"

    return {
        "bpm": bpm,
        "key": best_key,
        "mode": best_mode,
        "key_full": f"{best_key} {best_mode.capitalize()}",
        "time_signature": time_sig,
        "duration": duration_str,
        "duration_sec": round(duration_sec, 1),
        "sample_rate": sr,
        "energy_level": energy_level,
        "dynamic_range": dynamic_range,
        "brightness": brightness,
        "texture": texture,
        "rhythm_density": rhythm_density,
        "mood_tags": mood_tags[:4],
        "genre_hints": genre_hints,
        "spectral_centroid_hz": round(spectral_centroid, 0),
        "hp_ratio": round(hp_ratio, 3),
        "rms_mean": round(rms_mean, 5),
        "onset_mean": round(onset_mean, 4),
        "mfcc_means": mfcc_means,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file path provided"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    try:
        result = analyze(audio_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
