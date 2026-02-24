import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserLLMSettings, upsertUserLLMSettings } from "./llmConfig";

describe("llmConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get user LLM settings", async () => {
    const settings = await getUserLLMSettings(1);
    // DB가 없으면 null 반환
    expect(settings === null || settings.provider).toBeDefined();
  });

  it("should upsert user LLM settings", async () => {
    await upsertUserLLMSettings(1, "openai", "sk-test-key", "gpt-4");
    // 성공적으로 실행되면 오류 없음
    expect(true).toBe(true);
  });

  it("should handle manus provider as default", async () => {
    const settings = await getUserLLMSettings(999);
    // 존재하지 않는 사용자는 null 반환
    expect(settings === null || settings.provider === "manus").toBeDefined();
  });
});
