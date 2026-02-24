/**
 * AnalysisResult page — displays real-time analysis status and final results
 * for a user-uploaded audio file.
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Waveform Bars ─────────────────────────────────────────────────────────────
function WaveformBars({ count = 20, active = true }: { count?: number; active?: boolean }) {
  const heights = [30, 55, 80, 60, 90, 45, 70, 95, 50, 75, 40, 85, 65, 50, 78, 42, 68, 88, 55, 35];
  return (
    <div className="flex items-center gap-[3px]" style={{ height: "32px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={active ? "wave-bar" : ""}
          style={{
            display: "inline-block",
            width: "3px",
            borderRadius: "2px",
            height: `${heights[i % heights.length]}%`,
            background: active ? "#F5A623" : "rgba(245,166,35,0.3)",
            animationDelay: active ? `${(i * 0.06).toFixed(2)}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ─── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("클립보드에 복사되었습니다!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
      style={{
        background: copied ? "rgba(79,195,247,0.15)" : "rgba(245,166,35,0.1)",
        border: `1px solid ${copied ? "rgba(79,195,247,0.3)" : "rgba(245,166,35,0.25)"}`,
        color: copied ? "#4FC3F7" : "#F5A623",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {copied ? (
        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>복사됨!</>
      ) : (
        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>프롬프트 복사</>
      )}
    </button>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color = "amber" }: { label: string; value: string; unit?: string; color?: "amber" | "blue" }) {
  const borderColor = color === "amber" ? "rgba(245,166,35,0.2)" : "rgba(79,195,247,0.2)";
  const valueColor = color === "amber" ? "#F5A623" : "#4FC3F7";
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(22,29,46,0.8)", border: `1px solid ${borderColor}` }}>
      <p className="text-xs font-medium mb-1" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: valueColor, fontFamily: "'Playfair Display', serif" }}>
        {value}
        {unit && <span className="text-sm font-normal ml-1" style={{ color: "rgba(240,237,232,0.5)" }}>{unit}</span>}
      </p>
    </div>
  );
}

// ─── Prompt Card ───────────────────────────────────────────────────────────────
function PromptCard({ title, subtitle, platform, prompt }: { title: string; subtitle: string; platform: string; prompt: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(22,29,46,0.75)", border: "1px solid rgba(245,166,35,0.12)" }}>
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(245,166,35,0.08)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-0.5" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>{title}</h3>
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>
          </div>
          <span className="shrink-0 text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.25)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>
            {platform}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(10,14,26,0.6)", borderLeft: "3px solid rgba(245,166,35,0.4)" }}>
          <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#F0EDE8", fontFamily: "'JetBrains Mono', monospace" }}>
            {prompt}
          </pre>
        </div>
        <div className="flex justify-end">
          <CopyButton text={prompt} />
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function AnalyzingSkeleton({ fileName }: { fileName: string }) {
  const steps = [
    { label: "오디오 파일 로딩", done: true },
    { label: "BPM & 조성 분석", done: true },
    { label: "감성 & 분위기 추출", done: true },
    { label: "AI 프롬프트 생성 중...", done: false },
  ];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0A0E1A" }}>
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <WaveformBars count={24} active={true} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
          음악 분석 중
        </h2>
        <p className="text-sm mb-8" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
          {fileName}
        </p>
        <div className="space-y-3 text-left">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(22,29,46,0.7)", border: `1px solid ${step.done ? "rgba(245,166,35,0.2)" : "rgba(79,195,247,0.2)"}` }}>
              {step.done ? (
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(245,166,35,0.2)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin shrink-0" style={{ borderColor: "#4FC3F7", borderTopColor: "transparent" }} />
              )}
              <span className="text-sm" style={{ color: step.done ? "rgba(240,237,232,0.7)" : "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>{step.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-6" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
          약 30~60초 소요됩니다
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalysisResult() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const analysisId = parseInt(params.id ?? "0");
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const { data: analysis, error } = trpc.music.getAnalysis.useQuery(
    { id: analysisId },
    {
      enabled: !!analysisId,
      refetchInterval: pollingEnabled ? 3000 : false,
    }
  );

  useEffect(() => {
    if (analysis?.status === "done" || analysis?.status === "error") {
      setPollingEnabled(false);
      if (analysis.status === "error") {
        toast.error(`분석 실패: ${analysis.errorMessage ?? "알 수 없는 오류"}`);
      }
    }
  }, [analysis?.status]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "#F0EDE8" }}>분석 결과를 불러올 수 없습니다.</p>
          <button onClick={() => navigate("/")} className="px-6 py-2 rounded-xl text-sm font-semibold" style={{ background: "#F5A623", color: "#0A0E1A" }}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!analysis || analysis.status === "pending" || analysis.status === "analyzing") {
    return <AnalyzingSkeleton fileName={analysis?.fileName ?? "분석 중..."} />;
  }

  if (analysis.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="text-center max-w-md px-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>분석 중 오류가 발생했습니다</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
            {analysis.errorMessage ?? "알 수 없는 오류가 발생했습니다."}
          </p>
          <button onClick={() => navigate("/")} className="px-6 py-2 rounded-xl text-sm font-semibold" style={{ background: "#F5A623", color: "#0A0E1A" }}>
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  // ── Done: Render Results ──────────────────────────────────────────────────────
  const prompts = analysis.generatedPrompts as Record<string, string> | null;
  const moodTags = analysis.moodTags as string[] | null;
  const genreHints = analysis.genreHints as string[] | null;

  const promptCards = prompts ? [
    { key: "universal", title: "범용 마스터 프롬프트", subtitle: "모든 AI 음악 플랫폼에서 사용 가능한 종합 프롬프트", platform: "Universal" },
    { key: "suno", title: "Suno AI 전용 프롬프트", subtitle: "Suno AI 스타일 태그 문법에 최적화", platform: "Suno AI" },
    { key: "udio", title: "Udio / Stable Audio 프롬프트", subtitle: "자연어 기반 생성 방식에 최적화", platform: "Udio / Stable Audio" },
    { key: "musicgen", title: "MusicGen / AudioCraft 프롬프트", subtitle: "Meta MusicGen 모델에 최적화된 기술적 프롬프트", platform: "MusicGen" },
    { key: "beatoven", title: "Beatoven.ai / AIVA 프롬프트", subtitle: "감성 기반 AI 작곡 플랫폼에 최적화", platform: "Beatoven / AIVA" },
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between" style={{ background: "rgba(10,14,26,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm transition-colors" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "'DM Sans', sans-serif" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          홈으로
        </button>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: "#F0EDE8", fontFamily: "'DM Sans', sans-serif" }}>AI Music Prompt Lab</span>
        </div>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.2)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>
          분석 완료
        </span>
      </header>

      {/* Hero */}
      <section className="py-14 px-4" style={{ borderBottom: "1px solid rgba(245,166,35,0.06)" }}>
        <div className="container max-w-4xl mx-auto">
          <div className="mb-3">
            <WaveformBars count={16} active={false} />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
            {analysis.fileName}
          </h1>
          <p className="text-base italic mb-6" style={{ color: "#F5A623", fontFamily: "'Playfair Display', serif" }}>
            — AI 음악 분석 리포트
          </p>
          <div className="flex flex-wrap gap-2">
            {(genreHints ?? []).map((g, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623", fontFamily: "'DM Sans', sans-serif" }}>{g}</span>
            ))}
            {(moodTags ?? []).map((m, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(79,195,247,0.08)", border: "1px solid rgba(79,195,247,0.2)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis Stats */}
      <section className="py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>음악 분석 리포트</h2>

          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>기본 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard label="템포 (BPM)" value={analysis.bpm ? String(Math.round(analysis.bpm)) : "—"} unit="BPM" color="amber" />
            <StatCard label="조성 (Key)" value={analysis.key ?? "—"} unit={analysis.mode ?? ""} color="amber" />
            <StatCard label="박자" value={analysis.timeSignature ?? "4/4"} unit="Time" color="blue" />
            <StatCard label="재생 시간" value={analysis.duration ?? "—"} color="blue" />
            <StatCard label="에너지" value={analysis.energyLevel?.split(" ")[0] ?? "—"} color="amber" />
            <StatCard label="다이내믹" value={analysis.dynamicRange?.split(" ")[0] ?? "—"} color="blue" />
          </div>

          <div style={{ height: "1px", background: "rgba(245,166,35,0.1)", marginBottom: "2rem" }} />

          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>사운드 특성</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            {[
              { label: "밝기 (Brightness)", value: analysis.brightness ?? "—" },
              { label: "텍스처 (Texture)", value: analysis.texture ?? "—" },
              { label: "리듬 밀도", value: analysis.rhythmDensity ?? "—" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "rgba(22,29,46,0.7)", border: "1px solid rgba(245,166,35,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{item.label}</p>
                <p className="text-sm font-semibold" style={{ color: "#F0EDE8", fontFamily: "'DM Sans', sans-serif" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prompts */}
      {promptCards.length > 0 && (
        <section className="py-12 px-4" style={{ background: "rgba(10,14,26,0.5)" }}>
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>AI 음악 생성 프롬프트</h2>
            <p className="text-sm mb-8" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
              플랫폼별 최적화된 5종 전문 프롬프트 — 복사하여 즉시 사용 가능
            </p>
            <div className="flex flex-col gap-5">
              {promptCards.map((card) => (
                <PromptCard
                  key={card.key}
                  title={card.title}
                  subtitle={card.subtitle}
                  platform={card.platform}
                  prompt={prompts?.[card.key] ?? ""}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 px-4" style={{ borderTop: "1px solid rgba(245,166,35,0.08)", background: "rgba(10,14,26,0.8)" }}>
        <div className="container max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-semibold" style={{ color: "#F5A623", fontFamily: "'Playfair Display', serif" }}>
            See You Again — AI Music Prompt Lab
          </p>
          <button onClick={() => navigate("/")} className="text-xs px-4 py-2 rounded-lg transition-colors" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623", fontFamily: "'DM Sans', sans-serif" }}>
            다른 음악 분석하기
          </button>
        </div>
      </footer>
    </div>
  );
}
