import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { createMusicAnalysis, getMusicAnalysis, updateMusicAnalysis, listMusicAnalyses } from "../db";
import { generateWithSelectedLLM } from "../llmConfig";
import { nanoid } from "nanoid";
import { analyzeAudioBuffer } from "../analyzeAudio";
import { advancedAnalyzeAudio } from "../advancedAudioAnalysis";

// ── Prompt Generator via LLM ──────────────────────────────────────────────────
async function generatePromptsWithLLM(analysisData: Record<string, unknown>, fileName: string): Promise<Record<string, string>> {
  const systemPrompt = `You are a world-class music composer and AI prompt engineering expert.
Given detailed music analysis data including spectral analysis, rhythm characteristics, vocal properties, and unique features, generate professional AI music generation prompts in English.
You must return a JSON object with exactly these 5 keys:
- "universal": A comprehensive prompt for any AI music platform
- "suno": Optimized for Suno AI (use style tags format)
- "udio": Optimized for Udio/Stable Audio (descriptive natural language)
- "musicgen": Optimized for MusicGen/AudioCraft (technical, concise)
- "beatoven": Optimized for Beatoven.ai/AIVA (emotion-driven, cinematic)

Each prompt MUST:
1. Capture the exact mood, tempo, rhythm, instruments, vocal tone, and sound characteristics
2. Include specific details about drum intensity, percussion characteristics, and rhythm regularity
3. Reference the spectral characteristics (bass, mid, treble presence)
4. Describe vocal tone and presence if applicable
5. Include the unique characteristics that make this song distinctive
6. Be detailed and immediately usable

Return only valid JSON, no markdown.`;

  const userMessage = `Analyze this music and create AI generation prompts:

File: ${fileName}
BPM: ${analysisData.bpm}
Key: ${analysisData.key_full}
Time Signature: ${analysisData.time_signature}
Duration: ${analysisData.duration}

=== Energy & Dynamics ===
Energy Level: ${analysisData.energy_level}
RMS Energy: ${(analysisData.rms_energy as number)?.toFixed(3) || "N/A"}
Peak Level: ${(analysisData.peak_level as number)?.toFixed(3) || "N/A"}
Dynamic Range: ${analysisData.dynamic_range}

=== Spectral Analysis ===
Brightness: ${analysisData.brightness}
Spectral Centroid: ${analysisData.spectral_centroid_hz} Hz
Spectral Spread: ${(analysisData.spectral_spread as number) || "N/A"} Hz
Bass Presence: ${(analysisData.bass_presence as number)?.toFixed(2) || "N/A"}
Mid Presence: ${(analysisData.mid_presence as number)?.toFixed(2) || "N/A"}
Treble Presence: ${(analysisData.treble_presence as number)?.toFixed(2) || "N/A"}

=== Rhythm & Percussion ===
Texture: ${analysisData.texture}
Rhythm Density: ${analysisData.rhythm_density}
Rhythm Regularity: ${(analysisData.rhythm_regularity as number)?.toFixed(2) || "N/A"}
Drum Intensity: ${(analysisData.drum_intensity as number)?.toFixed(2) || "N/A"}
Percussion Characteristics: ${analysisData.percussion_characteristics || "N/A"}

=== Harmonic Analysis ===
Harmonic/Percussive Ratio: ${analysisData.hp_ratio} (>1 = melodic dominant)
Harmonic Content: ${(analysisData.harmonic_content as number)?.toFixed(2) || "N/A"}
Percussive Content: ${(analysisData.percussive_content as number)?.toFixed(2) || "N/A"}

=== Vocal Characteristics ===
Vocal Presence: ${(analysisData.vocal_presence as number)?.toFixed(2) || "N/A"}
Vocal Tone: ${analysisData.vocal_tone || "N/A"}
Vocal Range: ${analysisData.vocal_range || "N/A"}

=== Style & Mood ===
Mood Tags: ${(analysisData.mood_tags as string[]).join(", ")}
Genre Hints: ${(analysisData.genre_hints as string[]).join(", ")}

=== Unique Characteristics ===
$${(analysisData.unique_characteristics as string[])?.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n") || "N/A"}

Generate 5 platform-specific AI music prompts that would reproduce music with THESE EXACT characteristics. Pay special attention to the unique characteristics and spectral analysis to ensure the generated music matches the original.`;

  const content = await generateWithSelectedLLM(
    0,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ]
  );
  
  // LLM 응답에서 마크다운 코드 블록 제거
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.substring(7);
    cleanedContent = cleanedContent.replace(/```$/, "");
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.substring(3);
    cleanedContent = cleanedContent.replace(/```$/, "");
  }
  cleanedContent = cleanedContent.trim();
  
  return JSON.parse(cleanedContent);
}

/// ── Router Router ────────────────────────────────────────────────────────────────────
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
    .mutation(async ({ input, ctx }) => {
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

          // Run advanced audio analysis with signal processing
          const analysisResult = await advancedAnalyzeAudio(audioBuffer, mimeType, fileName);

          // Generate LLM prompts with enhanced analysis data
          const generatedPrompts = await generatePromptsWithLLM(analysisResult as unknown as Record<string, unknown>, fileName);

          // Save results
          await updateMusicAnalysis(analysisId, {
            bpm: analysisResult.bpm,
            key: analysisResult.key,
            mode: undefined,
            keyFull: analysisResult.key_full,
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
