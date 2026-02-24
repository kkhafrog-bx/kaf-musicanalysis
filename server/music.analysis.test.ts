import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock heavy dependencies
vi.mock("./db", () => ({
  createMusicAnalysis: vi.fn().mockResolvedValue(1),
  getMusicAnalysis: vi.fn().mockResolvedValue({
    id: 1,
    fileName: "test.mp3",
    status: "done",
    bpm: 80.0,
    key: "Bb",
    mode: "major",
    keyFull: "Bb Major",
    timeSignature: "4/4",
    duration: "3:57",
    energyLevel: "중간 (Medium)",
    dynamicRange: "넓음 (Wide)",
    brightness: "중간 (Balanced)",
    texture: "멜로딕 (Melodic-dominant)",
    rhythmDensity: "밀집 (Dense)",
    moodTags: ["서정적 (Lyrical)", "감성적 (Emotional)"],
    genreHints: ["Pop / Contemporary"],
    generatedPrompts: {
      universal: "Emotional pop ballad at 80 BPM in Bb major...",
      suno: "[Style Tags] pop ballad, 80 bpm...",
      udio: "Create a deeply emotional pop ballad...",
      musicgen: "Pop ballad instrumental, 80 BPM, Bb major...",
      beatoven: "Compose a cinematic emotional ballad...",
    },
    audioUrl: "https://example.com/audio.mp3",
    audioKey: "music-uploads/test.mp3",
    errorMessage: null,
    createdAt: new Date(),
  }),
  updateMusicAnalysis: vi.fn().mockResolvedValue(undefined),
  listMusicAnalyses: vi.fn().mockResolvedValue([]),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/audio.mp3" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          universal: "Universal prompt",
          suno: "Suno prompt",
          udio: "Udio prompt",
          musicgen: "MusicGen prompt",
          beatoven: "Beatoven prompt",
        }),
      },
    }],
  }),
}));

vi.mock("child_process", () => ({
  execFile: vi.fn((cmd, args, opts, cb) => {
    cb(null, JSON.stringify({
      bpm: 80.0,
      key: "Bb",
      mode: "major",
      key_full: "Bb Major",
      time_signature: "4/4",
      duration: "3:57",
      duration_sec: 237,
      sample_rate: 22050,
      energy_level: "중간 (Medium)",
      dynamic_range: "넓음 (Wide)",
      brightness: "중간 (Balanced)",
      texture: "멜로딕 (Melodic-dominant)",
      rhythm_density: "밀집 (Dense)",
      mood_tags: ["서정적 (Lyrical)", "감성적 (Emotional)"],
      genre_hints: ["Pop / Contemporary"],
      spectral_centroid_hz: 1874,
      hp_ratio: 4.889,
    }), "");
  }),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("music.getAnalysis", () => {
  it("returns analysis data for a valid ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.music.getAnalysis({ id: 1 });

    expect(result).toBeDefined();
    expect(result.status).toBe("done");
    expect(result.bpm).toBe(80.0);
    expect(result.keyFull).toBe("Bb Major");
  });
});

describe("music.listAnalyses", () => {
  it("returns an array of analyses", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.music.listAnalyses();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("music.startAnalysis input validation", () => {
  it("rejects files over 16MB", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.music.startAnalysis({
        fileName: "large.mp3",
        fileBase64: "dGVzdA==",
        mimeType: "audio/mpeg",
        fileSizeBytes: 17 * 1024 * 1024, // 17MB — over limit
      })
    ).rejects.toThrow();
  });
});
