import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { llmSettings, LLMSettings } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

/**
 * 사용자의 LLM 설정 조회
 */
export async function getUserLLMSettings(userId: number): Promise<LLMSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(llmSettings)
    .where(eq(llmSettings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * 사용자의 LLM 설정 저장 또는 업데이트
 */
export async function upsertUserLLMSettings(
  userId: number,
  provider: "manus" | "openai" | "google",
  apiKey?: string,
  openaiModel?: string,
  googleModel?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getUserLLMSettings(userId);

  if (existing) {
    await db
      .update(llmSettings)
      .set({
        provider,
        apiKey: apiKey || existing.apiKey,
        openaiModel: openaiModel || existing.openaiModel,
        googleModel: googleModel || existing.googleModel,
        updatedAt: new Date(),
      })
      .where(eq(llmSettings.userId, userId));
  } else {
    await db.insert(llmSettings).values({
      userId,
      provider,
      apiKey,
      openaiModel: openaiModel || "gpt-3.5-turbo",
      googleModel: googleModel || "gemini-pro",
    });
  }
}

/**
 * 선택된 LLM으로 텍스트 생성
 */
export async function generateWithSelectedLLM(
  userId: number,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  responseFormat?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  }
): Promise<string> {
  const settings = await getUserLLMSettings(userId);

  // 기본값: Manus 내장 LLM 사용
  if (!settings || settings.provider === "manus") {
    const response = await invokeLLM({
      messages,
      response_format: responseFormat,
    });
    const content = response.choices[0]?.message.content;
    return typeof content === "string" ? content : "";
  }

  // OpenAI 사용
  if (settings.provider === "openai" && settings.apiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.openaiModel || "gpt-3.5-turbo",
        messages,
        response_format: responseFormat,
      }),
    });

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message.content;
    return typeof content === "string" ? content : "";
  }

  // Google Gemini 사용
  if (settings.provider === "google" && settings.apiKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${settings.googleModel}:generateContent?key=${settings.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        }),
      }
    );

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const text = data.candidates[0]?.content.parts[0]?.text;
    return typeof text === "string" ? text : "";
  }

  throw new Error("No valid LLM configuration found");
}
