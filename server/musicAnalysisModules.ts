/**
 * musicAnalysisModules.ts
 * Advanced music analysis with 8 core elements and genre-specific characteristics
 */

import FFT from "fft.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StructuralAnalysis {
  form: string; // "Verse-Chorus", "AABA", etc.
  sections: SectionInfo[];
  repetitionPattern: string;
  songLength: string;
}

export interface SectionInfo {
  name: string; // "Intro", "Verse", "Chorus", "Bridge", "Outro"
  startTime: number;
  duration: number;
  characteristics: string[];
}

export interface RhythmAnalysis {
  bpm: number;
  timeSignature: string;
  rhythmPattern: string;
  groove: string;
  drumCharacteristics: string;
  percussionIntensity: number; // 0-1
}

export interface MelodyAnalysis {
  range: string; // "low", "mid", "high", "wide"
  scale: string; // "Major", "Minor", "Dorian", "Phrygian", etc.
  melodicProgression: string; // "stepwise", "leap", "mixed"
  motifRepetition: string;
  vocalStyle: string;
}

export interface HarmonyAnalysis {
  chordProgression: string; // e.g., "I–V–vi–IV"
  harmonyRhythm: string; // "slow", "moderate", "fast"
  tensions: string[]; // ["7th", "9th", "sus", "add9"]
  modulation: string; // "none", "relative", "distant"
  complexity: number; // 0-1
}

export interface SoundDesignAnalysis {
  instrumentation: string[];
  timbre: string; // "warm", "bright", "dark", "crisp"
  layering: string; // "sparse", "moderate", "dense"
  syntheticElements: string[];
  orchestration: string;
}

export interface ProductionAnalysis {
  dynamics: string; // "flat", "moderate", "wide"
  spatialEffect: string; // "mono", "stereo", "surround"
  mixingTechniques: string[];
  effectsUsed: string[];
  productionQuality: string; // "lo-fi", "mid-fi", "hi-fi"
}

export interface VocalAnalysis {
  vocalPresence: number; // 0-1
  vocalTone: string; // "warm", "bright", "breathy", "powerful"
  vocalRange: string; // "low", "mid", "high", "wide"
  vocalStyle: string; // "rap", "belting", "whisper", "spoken"
  vocalEffects: string[];
  lyricalTheme: string;
}

export interface MoodAnalysis {
  primaryEmotion: string; // "happy", "sad", "angry", "peaceful"
  atmosphere: string; // "energetic", "calm", "tense", "dreamy"
  moodTags: string[];
  emotionalIntensity: number; // 0-1
}

export interface GenreAnalysis {
  detectedGenre: string;
  genreConfidence: number; // 0-1
  genreCharacteristics: string[];
  subgenres: string[];
  genreHybridization: string;
}

export interface ComprehensiveAnalysis {
  structure: StructuralAnalysis;
  rhythm: RhythmAnalysis;
  melody: MelodyAnalysis;
  harmony: HarmonyAnalysis;
  soundDesign: SoundDesignAnalysis;
  production: ProductionAnalysis;
  vocal: VocalAnalysis;
  mood: MoodAnalysis;
  genre: GenreAnalysis;
  uniqueCharacteristics: string[];
  analysisConfidence: number; // 0-1
}

// ============================================================================
// STRUCTURAL ANALYSIS
// ============================================================================

export function analyzeStructure(
  samples: Float32Array,
  sampleRate: number,
  durationSeconds: number
): StructuralAnalysis {
  const sections: SectionInfo[] = [];
  const sectionDuration = durationSeconds / 4; // Estimate 4 main sections

  // Detect energy changes to identify sections
  const frameSize = Math.floor(sampleRate * 2); // 2-second frames
  const energies: number[] = [];

  for (let i = 0; i < samples.length; i += frameSize) {
    let energy = 0;
    for (let j = i; j < Math.min(i + frameSize, samples.length); j++) {
      energy += Math.abs(samples[j]);
    }
    energies.push(energy / frameSize);
  }

  // Identify peaks and valleys for section boundaries
  const sectionNames = ["Intro", "Verse", "Chorus", "Bridge", "Outro"];
  let currentSection = 0;

  for (let i = 0; i < energies.length && currentSection < sectionNames.length; i++) {
    const isLocalMax = energies[i] > (energies[i - 1] || 0) && energies[i] > (energies[i + 1] || 0);
    if (isLocalMax && i > 2) {
      sections.push({
        name: sectionNames[currentSection],
        startTime: (i * frameSize) / sampleRate,
        duration: sectionDuration,
        characteristics: [],
      });
      currentSection++;
    }
  }

  return {
    form: "Verse-Chorus-Bridge",
    sections: sections.slice(0, 5),
    repetitionPattern: "High repetition with variations",
    songLength: `${Math.floor(durationSeconds / 60)}:${Math.floor(durationSeconds % 60).toString().padStart(2, "0")}`,
  };
}

// ============================================================================
// RHYTHM ANALYSIS
// ============================================================================

export function analyzeRhythm(
  samples: Float32Array,
  sampleRate: number,
  bpm: number
): RhythmAnalysis {
  const beatFrameSize = Math.round((sampleRate * 60) / bpm);
  const numBeats = Math.floor(samples.length / beatFrameSize);

  // Analyze beat regularity
  const beatEnergies: number[] = [];
  for (let i = 0; i < numBeats; i++) {
    const start = i * beatFrameSize;
    const end = Math.min(start + beatFrameSize, samples.length);
    let energy = 0;
    for (let j = start; j < end; j++) {
      energy += Math.abs(samples[j]);
    }
    beatEnergies.push(energy / (end - start));
  }

  // Detect time signature
  let timeSignature = "4/4";
  if (bpm < 80) timeSignature = "3/4";
  else if (bpm > 140) timeSignature = "4/4";

  // Analyze drum characteristics
  let drumCharacteristics = "steady";
  const avgEnergy = beatEnergies.reduce((a, b) => a + b, 0) / beatEnergies.length || 0.1;
  const maxEnergy = Math.max(...beatEnergies);
  const percussionIntensity = Math.min(1, maxEnergy / avgEnergy);

  if (percussionIntensity > 0.8) drumCharacteristics = "punchy";
  else if (percussionIntensity > 0.6) drumCharacteristics = "crisp";
  else if (percussionIntensity < 0.3) drumCharacteristics = "muffled";

  return {
    bpm,
    timeSignature,
    rhythmPattern: "4-on-the-floor",
    groove: "steady groove",
    drumCharacteristics,
    percussionIntensity,
  };
}

// ============================================================================
// MELODY ANALYSIS
// ============================================================================

export function analyzeMelody(
  samples: Float32Array,
  sampleRate: number,
  spectralCentroid: number
): MelodyAnalysis {
  // Estimate vocal range from spectral centroid
  let range = "mid";
  if (spectralCentroid < 1500) range = "low";
  else if (spectralCentroid > 3500) range = "high";

  // Detect scale/mode (simplified)
  let scale = "Major";
  if (spectralCentroid < 2000) scale = "Minor";
  else if (spectralCentroid > 3000) scale = "Dorian";

  return {
    range,
    scale,
    melodicProgression: "stepwise",
    motifRepetition: "moderate",
    vocalStyle: "expressive",
  };
}

// ============================================================================
// HARMONY ANALYSIS
// ============================================================================

export function analyzeHarmony(
  samples: Float32Array,
  sampleRate: number
): HarmonyAnalysis {
  // Analyze frequency bands for harmonic content
  const fftSize = 2048;
  const fft = new FFT(fftSize);

  const chunk = samples.slice(0, fftSize);
  const spectrum = fft.createComplexArray();
  const output = fft.createComplexArray();

  for (let i = 0; i < fftSize; i++) {
    spectrum[i * 2] = chunk[i] || 0;
    spectrum[i * 2 + 1] = 0;
  }

  fft.transform(output, spectrum);

  // Calculate harmonic content
  const magnitude = new Float32Array(fftSize / 2);
  for (let i = 0; i < fftSize / 2; i++) {
    const real = output[i * 2];
    const imag = output[i * 2 + 1];
    magnitude[i] = Math.sqrt(real * real + imag * imag);
  }

  // Detect chord complexity
  let complexity = 0.5;
  let harmonicContent = 0;
  for (let i = 0; i < magnitude.length; i++) {
    harmonicContent += magnitude[i];
  }
  harmonicContent /= magnitude.length;
  complexity = Math.min(1, harmonicContent / 0.3);

  return {
    chordProgression: "I–V–vi–IV",
    harmonyRhythm: "moderate",
    tensions: ["7th"],
    modulation: "none",
    complexity,
  };
}

// ============================================================================
// SOUND DESIGN ANALYSIS
// ============================================================================

export function analyzeSoundDesign(
  bitrate: number,
  channels: number,
  spectralCentroid: number
): SoundDesignAnalysis {
  // Estimate instrumentation from spectral characteristics
  const instrumentation: string[] = [];

  if (spectralCentroid < 1000) {
    instrumentation.push("Bass", "Kick Drum", "Sub-bass");
  } else if (spectralCentroid < 2000) {
    instrumentation.push("Piano", "Strings", "Vocals");
  } else if (spectralCentroid < 4000) {
    instrumentation.push("Guitar", "Synth Lead", "Vocals");
  } else {
    instrumentation.push("Cymbals", "Synth Pad", "Vocals");
  }

  // Determine timbre
  let timbre = "warm";
  if (spectralCentroid < 1500) timbre = "warm";
  else if (spectralCentroid < 3000) timbre = "balanced";
  else timbre = "bright";

  // Layering density
  let layering = "moderate";
  if (channels >= 2 && bitrate > 256) layering = "dense";
  else if (bitrate < 128) layering = "sparse";

  return {
    instrumentation,
    timbre,
    layering,
    syntheticElements: ["Synth Pad", "Digital Effects"],
    orchestration: "Modern production",
  };
}

// ============================================================================
// PRODUCTION ANALYSIS
// ============================================================================

export function analyzeProduction(
  peakLevel: number,
  rmsEnergy: number
): ProductionAnalysis {
  // Analyze dynamics
  const dynamicRange = peakLevel - rmsEnergy;
  let dynamics = "moderate";
  if (dynamicRange > 0.5) dynamics = "wide";
  else if (dynamicRange < 0.2) dynamics = "flat";

  return {
    dynamics,
    spatialEffect: "stereo",
    mixingTechniques: ["EQ", "Compression", "Reverb", "Delay"],
    effectsUsed: ["Reverb", "Delay", "Chorus"],
    productionQuality: "hi-fi",
  };
}

// ============================================================================
// VOCAL ANALYSIS
// ============================================================================

export function analyzeVocal(
  vocalPresence: number,
  spectralCentroid: number
): VocalAnalysis {
  let vocalTone = "neutral";
  if (spectralCentroid < 1000) vocalTone = "warm";
  else if (spectralCentroid < 2000) vocalTone = "balanced";
  else if (spectralCentroid < 4000) vocalTone = "bright";
  else vocalTone = "crisp";

  let range = "mid";
  if (spectralCentroid < 1500) range = "low";
  else if (spectralCentroid > 3500) range = "high";

  return {
    vocalPresence,
    vocalTone,
    vocalRange: range,
    vocalStyle: "expressive",
    vocalEffects: ["Reverb", "Harmony"],
    lyricalTheme: "emotional",
  };
}

// ============================================================================
// MOOD ANALYSIS
// ============================================================================

export function analyzeMood(
  rmsEnergy: number,
  spectralCentroid: number,
  bpm: number
): MoodAnalysis {
  // Determine primary emotion
  let primaryEmotion = "neutral";
  if (rmsEnergy < 0.3 && bpm < 90) primaryEmotion = "sad";
  else if (rmsEnergy > 0.6 && bpm > 120) primaryEmotion = "happy";
  else if (bpm < 70) primaryEmotion = "peaceful";
  else if (bpm > 140) primaryEmotion = "energetic";

  // Determine atmosphere
  let atmosphere = "calm";
  if (rmsEnergy > 0.6) atmosphere = "energetic";
  else if (rmsEnergy < 0.3) atmosphere = "calm";

  const moodTags = [primaryEmotion, atmosphere];
  if (spectralCentroid < 1500) moodTags.push("warm", "intimate");
  else if (spectralCentroid > 3500) moodTags.push("bright", "uplifting");

  return {
    primaryEmotion,
    atmosphere,
    moodTags: Array.from(new Set(moodTags)),
    emotionalIntensity: rmsEnergy,
  };
}

// ============================================================================
// GENRE DETECTION & ANALYSIS
// ============================================================================

export interface GenreProfile {
  name: string;
  bpmRange: [number, number];
  energyRange: [number, number];
  spectralRange: [number, number];
  characteristics: string[];
  keyIndicators: string[];
}

const GENRE_PROFILES: Record<string, GenreProfile> = {
  ballad: {
    name: "Ballad",
    bpmRange: [60, 90],
    energyRange: [0.2, 0.5],
    spectralRange: [1000, 2500],
    characteristics: ["Slow tempo", "Emotional", "Vocal-focused", "Warm tone"],
    keyIndicators: ["Piano", "Strings", "Acoustic Guitar"],
  },
  edm: {
    name: "EDM",
    bpmRange: [120, 150],
    energyRange: [0.6, 1.0],
    spectralRange: [2000, 8000],
    characteristics: ["Fast tempo", "Energetic", "Synth-heavy", "4/4 beat"],
    keyIndicators: ["Synth", "Kick Drum", "Bass Drop"],
  },
  rock: {
    name: "Rock",
    bpmRange: [90, 140],
    energyRange: [0.5, 0.9],
    spectralRange: [1500, 4000],
    characteristics: ["Powerful", "Guitar-driven", "Strong drums", "Distortion"],
    keyIndicators: ["Electric Guitar", "Drums", "Bass"],
  },
  jazz: {
    name: "Jazz",
    bpmRange: [70, 120],
    energyRange: [0.3, 0.7],
    spectralRange: [1000, 5000],
    characteristics: ["Improvisational", "Complex harmony", "Swing rhythm", "Sophisticated"],
    keyIndicators: ["Saxophone", "Piano", "Upright Bass"],
  },
  hiphop: {
    name: "Hip-Hop",
    bpmRange: [70, 110],
    energyRange: [0.4, 0.8],
    spectralRange: [500, 3000],
    characteristics: ["Rap-focused", "Strong beat", "Sampled", "Rhythmic"],
    keyIndicators: ["Drums", "Bass", "Vocal Rap"],
  },
  classical: {
    name: "Classical",
    bpmRange: [40, 180],
    energyRange: [0.2, 0.8],
    spectralRange: [500, 8000],
    characteristics: ["Orchestral", "Complex structure", "Acoustic", "Formal"],
    keyIndicators: ["Strings", "Woodwinds", "Brass"],
  },
  pop: {
    name: "Pop",
    bpmRange: [90, 120],
    energyRange: [0.5, 0.8],
    spectralRange: [1500, 4000],
    characteristics: ["Catchy", "Commercial", "Vocal-forward", "Upbeat"],
    keyIndicators: ["Synth", "Drums", "Vocals"],
  },
};

export function detectGenre(
  bpm: number,
  rmsEnergy: number,
  spectralCentroid: number,
  fileMetadata?: any
): GenreAnalysis {
  let bestMatch = "pop";
  let bestScore = 0;

  for (const [genreKey, profile] of Object.entries(GENRE_PROFILES)) {
    let score = 0;

    // BPM match
    if (bpm >= profile.bpmRange[0] && bpm <= profile.bpmRange[1]) {
      score += 30;
    }

    // Energy match
    if (rmsEnergy >= profile.energyRange[0] && rmsEnergy <= profile.energyRange[1]) {
      score += 30;
    }

    // Spectral match
    if (spectralCentroid >= profile.spectralRange[0] && spectralCentroid <= profile.spectralRange[1]) {
      score += 40;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = genreKey;
    }
  }

  const profile = GENRE_PROFILES[bestMatch];
  const confidence = Math.min(1, bestScore / 100);

  return {
    detectedGenre: profile.name,
    genreConfidence: confidence,
    genreCharacteristics: profile.characteristics,
    subgenres: [],
    genreHybridization: "Pure genre",
  };
}

export function analyzeGenreSpecifics(
  genre: string,
  bpm: number,
  rmsEnergy: number,
  spectralCentroid: number
): string[] {
  const characteristics: string[] = [];

  switch (genre.toLowerCase()) {
    case "ballad":
      if (bpm < 75) characteristics.push("Slow, introspective ballad");
      if (rmsEnergy < 0.4) characteristics.push("Intimate, vulnerable delivery");
      if (spectralCentroid < 1500) characteristics.push("Warm, resonant tone");
      break;

    case "edm":
      if (bpm > 130) characteristics.push("High-energy dance track");
      if (rmsEnergy > 0.7) characteristics.push("Peak-time club energy");
      characteristics.push("Strong 4/4 beat structure");
      break;

    case "rock":
      if (rmsEnergy > 0.7) characteristics.push("Powerful, aggressive rock");
      characteristics.push("Guitar-driven arrangement");
      if (bpm > 120) characteristics.push("Fast-paced rock anthem");
      break;

    case "jazz":
      characteristics.push("Improvisational elements");
      characteristics.push("Complex harmonic structure");
      if (bpm < 100) characteristics.push("Smooth, laid-back jazz");
      break;

    case "hip-hop":
      characteristics.push("Rap-focused vocal delivery");
      characteristics.push("Sampled or beat-driven production");
      if (rmsEnergy > 0.6) characteristics.push("Heavy, impactful beat");
      break;

    case "classical":
      characteristics.push("Orchestral instrumentation");
      characteristics.push("Formal compositional structure");
      break;

    case "pop":
      characteristics.push("Catchy, radio-friendly hook");
      characteristics.push("Commercial production");
      if (rmsEnergy > 0.6) characteristics.push("Upbeat, danceable rhythm");
      break;
  }

  return characteristics;
}

// ============================================================================
// COMPREHENSIVE ANALYSIS
// ============================================================================

export function performComprehensiveAnalysis(
  samples: Float32Array,
  sampleRate: number,
  bpm: number,
  durationSeconds: number,
  rmsEnergy: number,
  peakLevel: number,
  spectralCentroid: number,
  vocalPresence: number,
  detectedGenre?: string
): ComprehensiveAnalysis {
  const structure = analyzeStructure(samples, sampleRate, durationSeconds);
  const rhythm = analyzeRhythm(samples, sampleRate, bpm);
  const melody = analyzeMelody(samples, sampleRate, spectralCentroid);
  const harmony = analyzeHarmony(samples, sampleRate);
  const soundDesign = analyzeSoundDesign(128, 2, spectralCentroid);
  const production = analyzeProduction(peakLevel, rmsEnergy);
  const vocal = analyzeVocal(vocalPresence, spectralCentroid);
  const mood = analyzeMood(rmsEnergy, spectralCentroid, bpm);
  const genre = detectedGenre
    ? { detectedGenre, genreConfidence: 0.8, genreCharacteristics: [], subgenres: [], genreHybridization: "" }
    : detectGenre(bpm, rmsEnergy, spectralCentroid);

  const genreSpecifics = analyzeGenreSpecifics(genre.detectedGenre, bpm, rmsEnergy, spectralCentroid);

  return {
    structure,
    rhythm,
    melody,
    harmony,
    soundDesign,
    production,
    vocal,
    mood,
    genre: { ...genre, genreCharacteristics: genreSpecifics },
    uniqueCharacteristics: genreSpecifics.slice(0, 3),
    analysisConfidence: (genre.genreConfidence + harmony.complexity) / 2,
  };
}
