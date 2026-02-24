import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { createMusicAnalysis, getMusicAnalysis, updateMusicAnalysis, listMusicAnalyses } from "../db";
import { invokeLLM } from "../_core/llm";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { nanoid } from "nanoid";

const execFileAsync = promisify(execFile);

// ── Prompt Generator via LLM ──────────────────────────────────────────────────
async function generatePromptsWithLLM(analysisData: Record<string, unknown>, fileName: string): Promise<Record<string, string>> {
  const systemPrompt = `You are a world-class music composer and AI prompt engineering expert.
Given music analysis data, generate professional AI music generation prompts in English.
You must return a JSON object with exactly these 5 keys:
- "universal": A comprehensive prompt for any AI music platform
- "suno": Optimized for Suno AI (use style tags format)
- "udio": Optimized for Udio/Stable Audio (descriptive natural language)
- "musicgen": Optimized for MusicGen/AudioCraft (technical, concise)
- "beatoven": Optimized for Beatoven.ai/AIVA (emotion-driven, cinematic)

Each prompt should capture the exact mood, tempo, rhythm, instruments, vocal tone, and sound characteristics.
Make prompts detailed and immediately usable. Return only valid JSON, no markdown.`;

  const userMessage = `Analyze this music and create AI generation prompts:

File: ${fileName}
BPM: ${analysisData.bpm}
Key: ${analysisData.key_full}
Time Signature: ${analysisData.time_signature}
Duration: ${analysisData.duration}
Energy Level: ${analysisData.energy_level}
Dynamic Range: ${analysisData.dynamic_range}
Brightness: ${analysisData.brightness}
Texture: ${analysisData.texture}
Rhythm Density: ${analysisData.rhythm_density}
Mood Tags: ${(analysisData.mood_tags as string[]).join(", ")}
Genre Hints: ${(analysisData.genre_hints as string[]).join(", ")}
Harmonic/Percussive Ratio: ${analysisData.hp_ratio} (>1 = melodic dominant)
Spectral Centroid: ${analysisData.spectral_centroid_hz} Hz

Generate 5 platform-specific AI music prompts that would reproduce music with these exact characteristics.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "music_prompts",
        strict: true,
        schema: {
          type: "object",
          properties: {
            universal: { type: "string", description: "Universal prompt for any AI music platform" },
            suno: { type: "string", description: "Suno AI optimized prompt" },
            udio: { type: "string", description: "Udio/Stable Audio optimized prompt" },
            musicgen: { type: "string", description: "MusicGen/AudioCraft optimized prompt" },
            beatoven: { type: "string", description: "Beatoven.ai/AIVA optimized prompt" },
          },
          required: ["universal", "suno", "udio", "musicgen", "beatoven"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

// ── Python Analysis Runner ────────────────────────────────────────────────────
async function runPythonAnalysis(audioBuffer: Buffer, mimeType: string): Promise<Record<string, unknown>> {
  const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("wav") ? "wav" : "mp3";
  const tmpDir = join(tmpdir(), "music-analysis");
  await mkdir(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, `${nanoid()}.${ext}`);

  try {
    await writeFile(tmpFile, audioBuffer);

    const scriptPath = join(process.cwd(), "server", "analyze_audio.py");

    // Remove PYTHONHOME/PYTHONPATH that may point to a different Python version (e.g., uv-managed Python 3.13)
    // to ensure /usr/bin/python3.11 uses its own standard library correctly.
    const cleanEnv = { ...process.env };
    delete cleanEnv.PYTHONHOME;
    delete cleanEnv.PYTHONPATH;
    delete cleanEnv.NUITKA_PYTHONPATH;

    const { stdout, stderr } = await execFileAsync("/usr/bin/python3.11", [scriptPath, tmpFile], {
      timeout: 120_000,
      env: cleanEnv,
    });

    // stderr may contain harmless warnings (e.g., libmpg123 header notes).
    // Only treat as error if stdout is empty or not valid JSON.
    const trimmedOut = stdout.trim();
    if (!trimmedOut) {
      throw new Error(`Python analysis produced no output. stderr: ${stderr}`);
    }

    return JSON.parse(trimmedOut);
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
export const musicRouter = router({
  /**
   * Upload audio file (base64) and start analysis.
   * Returns analysis ID immediately; client polls for status.
   */
  startAnalysis: publicProcedure
    .input(z.object({
      fileName: z.string().max(255),
      fileBase64: z.string(), // base64-encoded audio file
      mimeType: z.string().default("audio/mpeg"),
      fileSizeBytes: z.number().max(16 * 1024 * 1024), // 16MB limit
    }))
    .mutation(async ({ input }) => {
      const { fileName, fileBase64, mimeType, fileSizeBytes } = input;

      if (fileSizeBytes > 16 * 1024 * 1024) {
        throw new Error("File size exceeds 16MB limit");
      }

      // Create DB record
      const analysisId = await createMusicAnalysis({
        fileName,
        status: "analyzing",
      });

      // Run analysis asynchronously (don't await)
      (async () => {
        try {
          const audioBuffer = Buffer.from(fileBase64, "base64");

          // Upload to S3
          const fileKey = `music-uploads/${nanoid()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { url: audioUrl } = await storagePut(fileKey, audioBuffer, mimeType);

          await updateMusicAnalysis(analysisId, { audioUrl, audioKey: fileKey });

          // Run Python analysis
          const analysisResult = await runPythonAnalysis(audioBuffer, mimeType);

          if (analysisResult.error) {
            throw new Error(String(analysisResult.error));
          }

          // Generate LLM prompts
          const generatedPrompts = await generatePromptsWithLLM(analysisResult, fileName);

          // Save results
          await updateMusicAnalysis(analysisId, {
            bpm: analysisResult.bpm as number,
            key: analysisResult.key as string,
            mode: analysisResult.mode as string,
            keyFull: analysisResult.key_full as string,
            timeSignature: analysisResult.time_signature as string,
            duration: analysisResult.duration as string,
            energyLevel: analysisResult.energy_level as string,
            dynamicRange: analysisResult.dynamic_range as string,
            brightness: analysisResult.brightness as string,
            texture: analysisResult.texture as string,
            rhythmDensity: analysisResult.rhythm_density as string,
            moodTags: analysisResult.mood_tags as string[],
            genreHints: analysisResult.genre_hints as string[],
            generatedPrompts,
            status: "done",
          });
        } catch (err) {
          console.error("[Music Analysis] Error:", err);
          await updateMusicAnalysis(analysisId, {
            status: "error",
            errorMessage: err instanceof Error ? err.message : String(err),
          });
        }
      })();

      return { analysisId };
    }),

  /**
   * Poll analysis status and result.
   */
  getAnalysis: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const analysis = await getMusicAnalysis(input.id);
      if (!analysis) throw new Error("Analysis not found");
      return analysis;
    }),

  /**
   * List recent completed analyses.
   */
  listAnalyses: publicProcedure
    .query(async () => {
      return listMusicAnalyses(20);
    }),
});
