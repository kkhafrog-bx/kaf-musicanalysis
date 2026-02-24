import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserLLMSettings, upsertUserLLMSettings } from "../llmConfig";

export const settingsRouter = router({
  /**
   * 사용자의 LLM 설정 조회
   */
  getLLMSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await getUserLLMSettings(ctx.user.id);
    return {
      provider: settings?.provider || "manus",
      apiKey: settings?.apiKey ? "***" : null, // 보안: 키는 마스킹
      openaiModel: settings?.openaiModel || "gpt-3.5-turbo",
      googleModel: settings?.googleModel || "gemini-pro",
    };
  }),

  /**
   * 사용자의 LLM 설정 저장
   */
  setLLMSettings: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["manus", "openai", "google"]),
        apiKey: z.string().optional(),
        openaiModel: z.string().optional(),
        googleModel: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertUserLLMSettings(
        ctx.user.id,
        input.provider,
        input.apiKey,
        input.openaiModel,
        input.googleModel
      );
      return { success: true };
    }),
});
