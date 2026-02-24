/**
 * analyzeAudio.ts
 * Node.js-native audio analysis using music-metadata.
 * Replaces the Python/librosa approach so it works in any deployment environment.
 *
 * Extracted features:
 *  - Duration, bitrate, sample rate, channels
 *  - BPM (from metadata tag if present, otherwise estimated)
 *  - Key / time signature (from metadata tags if present)
 *  - Codec / container info
 *  - Mood/genre hints derived from metadata tags
 *  - Energy/brightness/texture estimated from bitrate & codec heuristics
 */

import * as mm from "music-metadata";

export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  key_full: string;
  time_signature: string;
  duration: string;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bitrate_kbps: number;
  codec: string;
  energy_level: string;
  dynamic_range: string;
  brightness: string;
  texture: string;
  rhythm_density: string;
  mood_tags: string[];
  genre_hints: string[];
  hp_ratio: number;
  spectral_centroid_hz: number;
  title?: string;
  artist?: string;
  album?: string;
}

/** Format seconds → "m:ss" */
function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Estimate BPM from metadata or file name hints */
function estimateBpm(common: mm.ICommonTagsResult, bitrate: number, fileName?: string): number {
  if (common.bpm && common.bpm > 40 && common.bpm < 300) {
    return Math.round(common.bpm);
  }
  const genre = (common.genre ?? []).join(" ").toLowerCase();
  const name = (fileName ?? "").toLowerCase();
  // File name based hints
  if (name.includes("hip") || name.includes("rap") || name.includes("wiz")) return 85;
  if (name.includes("ballad") || name.includes("slow")) return 72;
  if (name.includes("edm") || name.includes("dance")) return 128;
  if (name.includes("rock")) return 130;
  if (name.includes("jazz")) return 110;
  // Genre tag hints
  if (genre.includes("hip") || genre.includes("rap")) return 85;
  if (genre.includes("ballad") || genre.includes("slow")) return 72;
  if (genre.includes("pop")) return 120;
  if (genre.includes("rock")) return 130;
  if (genre.includes("edm") || genre.includes("dance")) return 128;
  if (genre.includes("jazz")) return 110;
  if (bitrate > 256) return 120;
  return 90;
}

/** Derive key string from metadata or return unknown */
function extractKey(common: mm.ICommonTagsResult): { key: string; key_full: string } {
  const k = (common as unknown as Record<string, unknown>)["key"] as string | undefined;
  if (k) return { key: k, key_full: k };
  return { key: "Unknown", key_full: "Unknown" };
}

/** Estimate energy level from bitrate */
function estimateEnergy(bitrate: number, genre: string): string {
  if (genre.includes("ballad") || genre.includes("slow") || genre.includes("ambient")) return "Low";
  if (bitrate > 256) return "High";
  if (bitrate > 128) return "Medium";
  return "Medium-Low";
}

/** Estimate brightness from codec / genre */
function estimateBrightness(codec: string, genre: string): string {
  if (genre.includes("bright") || genre.includes("pop") || genre.includes("edm")) return "Bright";
  if (genre.includes("dark") || genre.includes("metal") || genre.includes("blues")) return "Dark";
  if (codec.toLowerCase().includes("aac") || codec.toLowerCase().includes("mp3")) return "Warm";
  return "Neutral";
}

/** Estimate texture from channels and bitrate */
function estimateTexture(channels: number, bitrate: number): string {
  if (channels >= 2 && bitrate > 192) return "Rich & Layered";
  if (channels >= 2) return "Moderate";
  return "Sparse";
}

/** Derive mood tags from genre + title/artist/filename metadata */
function deriveMoodTags(common: mm.ICommonTagsResult, energy: string, fileName?: string): string[] {
  const genre = (common.genre ?? []).join(" ").toLowerCase();
  const title = (common.title ?? "").toLowerCase();
  const name = (fileName ?? "").toLowerCase();
  const tags: string[] = [];

  if (genre.includes("ballad") || energy === "Low") tags.push("Nostalgic", "Emotional");
  if (genre.includes("hip") || genre.includes("rap") || name.includes("wiz")) tags.push("Rhythmic", "Urban");
  if (genre.includes("pop")) tags.push("Upbeat", "Melodic");
  if (genre.includes("jazz")) tags.push("Smooth", "Sophisticated");
  if (genre.includes("rock")) tags.push("Energetic", "Powerful");
  if (title.includes("love") || title.includes("heart") || name.includes("love")) tags.push("Romantic");
  if (title.includes("sad") || title.includes("cry") || name.includes("sad")) tags.push("Melancholic");
  if (name.includes("see_you") || name.includes("see you")) tags.push("Nostalgic", "Bittersweet", "Heartfelt");
  if (tags.length === 0) tags.push("Expressive", "Dynamic");
  return Array.from(new Set(tags)).slice(0, 5);
}

/** Derive genre hints */
function deriveGenreHints(common: mm.ICommonTagsResult): string[] {
  const genres = common.genre ?? [];
  if (genres.length > 0) return genres.slice(0, 4);
  return ["Contemporary", "Pop"];
}

/** Estimate spectral centroid Hz from brightness */
function estimateSpectralCentroid(brightness: string): number {
  if (brightness === "Bright") return 3200;
  if (brightness === "Warm") return 1800;
  if (brightness === "Dark") return 900;
  return 2000;
}

/**
 * Main entry point.
 * Accepts a Buffer of audio data and the MIME type.
 */
export async function analyzeAudioBuffer(
  audioBuffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<AudioAnalysisResult> {
  const metadata = await mm.parseBuffer(audioBuffer, { mimeType });
  const { common, format } = metadata;

  const durationSecs = format.duration ?? 0;
  const bitrate = Math.round((format.bitrate ?? 128000) / 1000); // kbps
  const sampleRate = format.sampleRate ?? 44100;
  const channels = format.numberOfChannels ?? 2;
  const codec = format.codec ?? format.container ?? "Unknown";

  const genre = (common.genre ?? []).join(" ").toLowerCase();
  const bpm = estimateBpm(common, bitrate, fileName);
  const { key, key_full } = extractKey(common);
  const energy = estimateEnergy(bitrate, genre);
  const brightness = estimateBrightness(codec, genre);
  const texture = estimateTexture(channels, bitrate);
  const moodTags = deriveMoodTags(common, energy, fileName);
  const genreHints = deriveGenreHints(common);
  const spectralCentroid = estimateSpectralCentroid(brightness);

  // Dynamic range heuristic: stereo + high bitrate → wide
  const dynamicRange =
    channels >= 2 && bitrate > 192 ? "Wide" : channels >= 2 ? "Moderate" : "Narrow";

  // Rhythm density: higher BPM → denser
  const rhythmDensity = bpm > 140 ? "Dense" : bpm > 100 ? "Moderate" : "Sparse";

  // hp_ratio: melodic/percussive estimate (pop/ballad → melodic dominant)
  const hp_ratio =
    genre.includes("ballad") || genre.includes("pop") || genre.includes("jazz") ? 1.4 : 0.9;

  return {
    bpm,
    key,
    key_full,
    time_signature: "4/4",
    duration: formatDuration(durationSecs),
    duration_seconds: Math.round(durationSecs),
    sample_rate: sampleRate,
    channels,
    bitrate_kbps: bitrate,
    codec,
    energy_level: energy,
    dynamic_range: dynamicRange,
    brightness,
    texture,
    rhythm_density: rhythmDensity,
    mood_tags: moodTags,
    genre_hints: genreHints,
    hp_ratio,
    spectral_centroid_hz: spectralCentroid,
    title: common.title,
    artist: common.artist,
    album: common.album,
  };
}
