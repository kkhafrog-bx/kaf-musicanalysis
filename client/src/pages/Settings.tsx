import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Settings() {
  const [provider, setProvider] = useState<"manus" | "openai" | "google">("manus");
  const [apiKey, setApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-3.5-turbo");
  const [googleModel, setGoogleModel] = useState("gemini-pro");
  const [loading, setLoading] = useState(false);

  // 기존 설정 조회
  const { data: settings, isLoading: isLoadingSettings } = trpc.settings.getLLMSettings.useQuery();

  useEffect(() => {
    if (settings) {
      setProvider(settings.provider as "manus" | "openai" | "google");
      setOpenaiModel(settings.openaiModel || "gpt-3.5-turbo");
      setGoogleModel(settings.googleModel || "gemini-pro");
    }
  }, [settings]);

  // 설정 저장
  const saveMutation = trpc.settings.setLLMSettings.useMutation({
    onSuccess: () => {
      toast.success("LLM 설정이 저장되었습니다.");
    },
    onError: (error) => {
      toast.error(`저장 실패: ${error.message}`);
    },
  });

  const handleSave = async () => {
    if (provider !== "manus" && !apiKey) {
      toast.error("API 키를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await saveMutation.mutateAsync({
        provider,
        apiKey: apiKey || undefined,
        openaiModel,
        googleModel,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <p style={{ color: "#F0EDE8" }}>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(10,14,26,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(245,166,35,0.1)",
        }}
      >
        <h1 className="text-lg font-semibold" style={{ color: "#F0EDE8" }}>
          LLM 설정
        </h1>
      </header>

      {/* Content */}
      <div className="container py-12">
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(22,29,46,0.75)",
            border: "1px solid rgba(245,166,35,0.12)",
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#F0EDE8" }}>
            음악 분석에 사용할 LLM 선택
          </h2>

          {/* Provider Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3" style={{ color: "#F5A623" }}>
              LLM 제공자
            </label>
            <div className="flex gap-4">
              {["manus", "openai", "google"].map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="provider"
                    value={p}
                    checked={provider === p}
                    onChange={(e) => setProvider(e.target.value as "manus" | "openai" | "google")}
                    className="w-4 h-4"
                  />
                  <span style={{ color: "#F0EDE8" }}>
                    {p === "manus" ? "Manus (기본)" : p === "openai" ? "OpenAI" : "Google Gemini"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          {provider !== "manus" && (
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3" style={{ color: "#F5A623" }}>
                API 키
              </label>
              <input
                type="password"
                placeholder={`${provider === "openai" ? "sk-" : "AIza"}...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  color: "#F0EDE8",
                }}
              />
              <p className="text-xs mt-2" style={{ color: "rgba(240,237,232,0.5)" }}>
                {provider === "openai"
                  ? "https://platform.openai.com/api-keys에서 API 키를 생성하세요."
                  : "https://aistudio.google.com/app/apikey에서 API 키를 생성하세요."}
              </p>
            </div>
          )}

          {/* Model Selection */}
          {provider === "openai" && (
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3" style={{ color: "#F5A623" }}>
                OpenAI 모델
              </label>
              <select
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  color: "#F0EDE8",
                }}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (빠르고 저렴)</option>
                <option value="gpt-4">GPT-4 (더 정확함)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (균형)</option>
              </select>
            </div>
          )}

          {provider === "google" && (
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3" style={{ color: "#F5A623" }}>
                Google 모델
              </label>
              <select
                value={googleModel}
                onChange={(e) => setGoogleModel(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  color: "#F0EDE8",
                }}
              >
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-pro-vision">Gemini Pro Vision</option>
              </select>
            </div>
          )}

          {/* Info Box */}
          <div
            className="rounded-lg p-4 mb-8"
            style={{
              background: "rgba(79,195,247,0.1)",
              border: "1px solid rgba(79,195,247,0.2)",
            }}
          >
            <p className="text-sm" style={{ color: "#4FC3F7" }}>
              <strong>ℹ️ 정보:</strong> Manus를 선택하면 Manus 플랫폼의 내장 LLM을 사용하여 크레딧을 소모합니다.
              OpenAI 또는 Google을 선택하면 해당 서비스의 API 키를 사용하여 비용이 청구됩니다.
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{
              background: "#F5A623",
              color: "#0A0E1A",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "저장 중..." : "설정 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
