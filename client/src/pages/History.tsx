/**
 * History page — displays a list of previously analyzed music files
 * with status badges and links to individual analysis results.
 */

import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import KafCoreBadge from "@/components/KafCoreBadge";

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = {
    done: { label: "분석 완료", bg: "rgba(79,195,247,0.1)", border: "rgba(79,195,247,0.3)", color: "#4FC3F7" },
    analyzing: { label: "분석 중...", bg: "rgba(245,166,35,0.1)", border: "rgba(245,166,35,0.3)", color: "#F5A623" },
    pending: { label: "대기 중", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "rgba(240,237,232,0.5)" },
    error: { label: "오류", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", color: "#f87171" },
  }[status] ?? { label: status, bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "rgba(240,237,232,0.5)" };

  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color, fontFamily: "'DM Sans', sans-serif" }}
    >
      {status === "analyzing" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ background: "#F5A623", verticalAlign: "middle" }} />
      )}
      {config.label}
    </span>
  );
}

// ─── Music Card ────────────────────────────────────────────────────────────────
function MusicCard({
  id, fileName, status, bpm, keyFull, duration, moodTags, genreHints, createdAt
}: {
  id: number;
  fileName: string;
  status: string;
  bpm: number | null;
  keyFull: string | null;
  duration: string | null;
  moodTags: string[] | null;
  genreHints: string[] | null;
  createdAt: Date;
}) {
  const [, navigate] = useLocation();

  const formatDate = (d: Date) => {
    return new Date(d).toLocaleDateString("ko-KR", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const truncateName = (name: string) => {
    const base = name.replace(/\.[^/.]+$/, ""); // remove extension
    return base.length > 40 ? base.slice(0, 40) + "…" : base;
  };

  const isClickable = status === "done";

  return (
    <div
      onClick={() => isClickable && navigate(`/analysis/${id}`)}
      className="rounded-2xl overflow-hidden transition-all duration-300 group"
      style={{
        background: "rgba(22,29,46,0.75)",
        border: `1px solid ${isClickable ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.06)"}`,
        cursor: isClickable ? "pointer" : "default",
      }}
      onMouseEnter={e => {
        if (!isClickable) return;
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.35)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(245,166,35,0.08)";
      }}
      onMouseLeave={e => {
        if (!isClickable) return;
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.12)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div className="p-5">
        {/* Top row: icon + name + status */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: status === "done" ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${status === "done" ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {status === "done" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            ) : status === "analyzing" ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(245,166,35,0.6)" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,232,0.3)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className="text-base font-semibold leading-tight"
                style={{ color: "#F0EDE8", fontFamily: "'DM Sans', sans-serif" }}
                title={fileName}
              >
                {truncateName(fileName)}
              </h3>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>
              {formatDate(createdAt)}
            </p>
          </div>
        </div>

        {/* Analysis stats (only when done) */}
        {status === "done" && bpm && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "BPM", value: String(Math.round(bpm)) },
                { label: "Key", value: keyFull ?? "—" },
                { label: "Duration", value: duration ?? "—" },
              ].map((item, i) => (
                <div key={i} className="rounded-lg px-3 py-2" style={{ background: "rgba(10,14,26,0.5)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "'DM Sans', sans-serif" }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#F5A623", fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(genreHints ?? []).slice(0, 2).map((g, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)", color: "#F5A623", fontFamily: "'DM Sans', sans-serif" }}>{g}</span>
              ))}
              {(moodTags ?? []).slice(0, 2).map((m, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(79,195,247,0.06)", border: "1px solid rgba(79,195,247,0.15)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>{m}</span>
              ))}
            </div>
          </>
        )}

        {/* Arrow hint for clickable cards */}
        {isClickable && (
          <div className="mt-4 flex items-center justify-end gap-1" style={{ color: "rgba(245,166,35,0.5)" }}>
            <span className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>결과 보기</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(22,29,46,0.8)", border: "1px solid rgba(245,166,35,0.1)" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(245,166,35,0.4)" strokeWidth="1.5">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
        아직 분석된 음악이 없습니다
      </h3>
      <p className="text-sm mb-8 max-w-xs" style={{ color: "rgba(240,237,232,0.45)", fontFamily: "'DM Sans', sans-serif" }}>
        MP3 파일을 업로드하면 분석하고 프롬프트를 생성합니다
      </p>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
        style={{ background: "#F5A623", color: "#0A0E1A", fontFamily: "'DM Sans', sans-serif" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        음악 분석 시작하기
      </button>
    </div>
  );
}

// ─── Waveform Bars ─────────────────────────────────────────────────────────────
function WaveformBars({ count = 12 }: { count?: number }) {
  const heights = [30, 55, 80, 60, 90, 45, 70, 95, 50, 75, 40, 85];
  return (
    <div className="flex items-center gap-[3px]" style={{ height: "28px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{
            display: "inline-block", width: "3px", borderRadius: "2px",
            height: `${heights[i % heights.length]}%`,
            animationDelay: `${(i * 0.06).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function History() {
  const [, navigate] = useLocation();

  const { data: analyses, isLoading, refetch } = trpc.music.listAnalyses.useQuery(undefined, {
    refetchInterval: (data) => {
      // Keep polling if any item is still analyzing
      const items = data?.state?.data;
      if (Array.isArray(items) && items.some((a: { status: string }) => a.status === "analyzing" || a.status === "pending")) {
        return 4000;
      }
      return false;
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(10,14,26,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "rgba(240,237,232,0.6)", fontFamily: "'DM Sans', sans-serif" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          홈으로
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: "#F0EDE8", fontFamily: "'DM Sans', sans-serif" }}>
            Music Prompt Lab
          </span>
        </div>

        <button
          onClick={() => navigate("/#upload")}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
          style={{ background: "#F5A623", color: "#0A0E1A", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          새 분석
        </button>
      </header>

      {/* Page Title */}
      <section className="py-12 px-4" style={{ borderBottom: "1px solid rgba(245,166,35,0.06)" }}>
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="mb-3">
                <WaveformBars count={10} />
              </div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
                분석 히스토리
              </h1>
              <p className="text-sm" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                업로드하여 분석한 음악 목록 — 결과 카드를 클릭하면 상세 프롬프트를 확인할 수 있습니다
              </p>
            </div>
            {analyses && analyses.length > 0 && (
              <div
                className="shrink-0 text-xs px-3 py-1.5 rounded-full"
                style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.2)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}
              >
                총 {analyses.length}곡
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 px-4">
        <div className="container max-w-4xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 animate-pulse"
                  style={{ background: "rgba(22,29,46,0.5)", height: "140px" }}
                />
              ))}
            </div>
          ) : !analyses || analyses.length === 0 ? (
            <EmptyState onUpload={() => navigate("/")} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyses.map((analysis) => (
                <MusicCard
                  key={analysis.id}
                  id={analysis.id}
                  fileName={analysis.fileName}
                  status={analysis.status}
                  bpm={analysis.bpm}
                  keyFull={analysis.keyFull}
                  duration={analysis.duration}
                  moodTags={analysis.moodTags as string[] | null}
                  genreHints={analysis.genreHints as string[] | null}
                  createdAt={analysis.createdAt}
                />
              ))}
            </div>
          )}

          {/* Refresh button */}
          {analyses && analyses.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-colors"
                style={{ color: "rgba(240,237,232,0.4)", border: "1px solid rgba(240,237,232,0.08)", fontFamily: "'DM Sans', sans-serif" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                새로고침
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4" style={{ borderTop: "1px solid rgba(245,166,35,0.06)", background: "rgba(10,14,26,0.6)" }}>
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-xs" style={{ color: "rgba(240,237,232,0.25)", fontFamily: "'DM Sans', sans-serif" }}>
            Kaf-MusicAnalysis
          </p>
          <p className="text-xs" style={{ color: "rgba(240,237,232,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
            © 2025
          </p>
        </div>
      </footer>

      {/* KafCore Brand Badge */}
      <KafCoreBadge />
    </div>
  );
}