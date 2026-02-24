/**
 * DESIGN: Dark Cinematic Music Studio
 * Colors: Navy Deep (#0A0E1A) bg, Amber Gold (#F5A623) primary, Ice Blue (#4FC3F7) secondary
 * Fonts: Playfair Display (headings), DM Sans (body), JetBrains Mono (prompts)
 * Layout: Full-page scroll with sticky header, hero section, analysis grid, prompt cards
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import KafCoreBadge from "@/components/KafCoreBadge";

// ─── Waveform Animation Component ─────────────────────────────────────────────
function WaveformBars({ count = 20, className = "" }: { count?: number; className?: string }) {
  const heights = [30, 55, 80, 60, 90, 45, 70, 95, 50, 75, 40, 85, 65, 50, 78, 42, 68, 88, 55, 35];
  return (
    <div className={`flex items-center gap-[3px] ${className}`} style={{ height: "40px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{
            height: `${heights[i % heights.length]}%`,
            animationDelay: `${(i * 0.06).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
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
      className="copy-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          복사됨!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ─── Section Wrapper with fade-in ─────────────────────────────────────────────
function Section({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color = "amber" }: { label: string; value: string; unit?: string; color?: "amber" | "blue" }) {
  const borderColor = color === "amber" ? "rgba(245,166,35,0.2)" : "rgba(79,195,247,0.2)";
  const valueColor = color === "amber" ? "#F5A623" : "#4FC3F7";
  const glowColor = color === "amber" ? "rgba(245,166,35,0.08)" : "rgba(79,195,247,0.08)";

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "rgba(22,29,46,0.8)",
        border: `1px solid ${borderColor}`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${glowColor}`;
        (e.currentTarget as HTMLElement).style.borderColor = color === "amber" ? "rgba(245,166,35,0.4)" : "rgba(79,195,247,0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = borderColor;
      }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: valueColor, fontFamily: "'Playfair Display', serif" }}>
        {value}
        {unit && <span className="text-sm font-normal ml-1" style={{ color: "rgba(240,237,232,0.5)" }}>{unit}</span>}
      </p>
    </div>
  );
}

// ─── Prompt Card ───────────────────────────────────────────────────────────────
function PromptCard({
  title, subtitle, tags, prompt, platform, delay = 0
}: {
  title: string;
  subtitle: string;
  tags: { label: string; type: "amber" | "blue" }[];
  prompt: string;
  platform: string;
  delay?: number;
}) {
  return (
    <Section delay={delay}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(22,29,46,0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(245,166,35,0.12)",
        }}
      >
        {/* Card Header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(245,166,35,0.08)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="section-accent mb-2" />
              <h3 className="text-xl font-bold mb-1" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>{title}</h3>
              <p className="text-sm" style={{ color: "rgba(240,237,232,0.55)", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>
            </div>
            <span
              className="shrink-0 text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: "rgba(79,195,247,0.1)",
                border: "1px solid rgba(79,195,247,0.25)",
                color: "#4FC3F7",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {platform}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, i) => (
              <span key={i} className={tag.type === "amber" ? "tag-amber" : "tag-blue"}>{tag.label}</span>
            ))}
          </div>
        </div>

        {/* Prompt Content */}
        <div className="p-6">
          <div className="prompt-block p-4 rounded-r-xl mb-4 relative">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#F0EDE8", fontFamily: "'JetBrains Mono', monospace" }}>
              {prompt}
            </pre>
          </div>
          <div className="flex justify-end">
            <CopyButton text={prompt} label="프롬프트 복사" />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Upload Section ──────────────────────────────────────────────────────────
function UploadSection() {
  const [, navigate] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startAnalysisMutation = trpc.music.startAnalysis.useMutation({
    onSuccess: (data) => {
      navigate(`/analysis/${data.analysisId}`);
    },
    onError: (err) => {
      toast.error(`업로드 실패: ${err.message}`);
      setIsUploading(false);
    },
  });

  const handleFile = useCallback((file: File) => {
    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/mp4", "audio/m4a", "audio/ogg", "audio/webm"];
    if (!allowed.some(t => file.type.includes(t.split("/")[1])) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      toast.error("MP3, WAV, M4A, OGG 형식만 지원합니다.");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("파일 크기는 16MB 이하여야 합니다.");
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        await startAnalysisMutation.mutateAsync({
          fileName: selectedFile.name,
          fileBase64: base64,
          mimeType: selectedFile.type || "audio/mpeg",
          fileSizeBytes: selectedFile.size,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section id="upload" className="py-20" style={{ background: "rgba(10,14,26,0.6)" }}>
      <div className="container max-w-3xl mx-auto">
        <Section>
          <div className="mb-10 text-center">
            <div className="section-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
              내 음악 분석하기
            </h2>
            <p className="text-sm" style={{ color: "rgba(240,237,232,0.55)", fontFamily: "'DM Sans', sans-serif" }}>
              MP3, WAV, M4A 파일을 업로드하면 자동으로 분석하고 전문 프롬프트를 생성합니다
            </p>
          </div>
        </Section>

        <Section delay={100}>
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className="rounded-2xl transition-all duration-300 cursor-pointer"
            style={{
              background: isDragging ? "rgba(245,166,35,0.06)" : "rgba(22,29,46,0.7)",
              border: `2px dashed ${isDragging ? "rgba(245,166,35,0.6)" : selectedFile ? "rgba(79,195,247,0.4)" : "rgba(245,166,35,0.2)"}`,
              padding: "3rem 2rem",
              textAlign: "center",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.ogg,.webm,audio/*"
              className="hidden"
              onChange={handleInputChange}
            />

            {!selectedFile ? (
              <>
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)" }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
                <p className="text-base font-semibold mb-1" style={{ color: "#F0EDE8", fontFamily: "'DM Sans', sans-serif" }}>
                  {isDragging ? "파일을 여기에 놓으세요" : "파일을 드래그하거나 클릭하여 선택"}
                </p>
                <p className="text-xs" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                  MP3, WAV, M4A, OGG · 최대 16MB
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.3)" }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="1.5">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                </div>
                <p className="text-base font-semibold mb-1" style={{ color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>
                  {selectedFile.name}
                </p>
                <p className="text-xs mb-4" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                  {formatSize(selectedFile.size)}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="text-xs px-3 py-1 rounded-lg transition-colors"
                  style={{ color: "rgba(240,237,232,0.4)", border: "1px solid rgba(240,237,232,0.1)" }}
                >
                  다른 파일 선택
                </button>
              </>
            )}
          </div>
        </Section>

        {selectedFile && (
          <Section delay={150}>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={isUploading}
                className="flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                style={{
                  background: isUploading ? "rgba(245,166,35,0.5)" : "#F5A623",
                  color: "#0A0E1A",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    분석 중... (30~60초 소요)
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    음악 분석 시작
                  </>
                )}
              </button>
            </div>
          </Section>
        )}

        <Section delay={200}>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: "🎵", label: "BPM & 조성", desc: "템포, 키, 박자 자동 감지" },
              { icon: "🎭", label: "감성 분석", desc: "분위기, 에너지, 다이내믹" },
              { icon: "🎼", label: "전용 프롬프트", desc: "5개 플랫폼 전용 프롬프트" },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-4 text-center"
                style={{ background: "rgba(22,29,46,0.5)", border: "1px solid rgba(245,166,35,0.08)" }}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#F5A623", fontFamily: "'DM Sans', sans-serif" }}>{item.label}</p>
                <p className="text-xs" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [, navigate] = useLocation();
  const HERO_BG = "https://private-us-east-1.manuscdn.com/sessionFile/vJQZfRrBS7xhxbKPFtyTLG/sandbox/LcfYq3NyjRpYBGMTWsGw2t-img-1_1771896152000_na1fn_aGVyby1iZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvdkpRWmZSckJTN3hoeGJLUEZ0eVRMRy9zYW5kYm94L0xjZllxM055alJwWUJHTVRXc0d3MnQtaW1nLTFfMTc3MTg5NjE1MjAwMF9uYTFmbl9hR1Z5YnkxaVp3LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Y4Sb4Yz-lP~BPz4zvr1lv~lbC0YmFyA4S0b4PR7B8tNFMtb-3lpiCe-Li1AiiJuwU-2XWcpsv0BiEL34xv5JI5yaq4MryY1t1B4pVsfpfX-AWMFLcXtDXCU0RspO0qbdMNwuPbRxc4reCt359rvTac8AENA0csk7FI5g4mwwaAzb5-TEmjExxkPp19HUI3opCNKjCbP9vSinjLm3Ru-Enwc1bpVwmLWovbCSj73aCFTJY7VYcqngN~7GzvkhteWxB49mDyiFu7sQWp4BDIHM-zPNlY90frl4cJQz9WRAulnpfcbImRHN0dVGj2gp190Yxk0JatlNlMu6vOsEgopdnQ__";
  const WAVEFORM_BG = "https://private-us-east-1.manuscdn.com/sessionFile/vJQZfRrBS7xhxbKPFtyTLG/sandbox/LcfYq3NyjRpYBGMTWsGw2t-img-2_1771896160000_na1fn_d2F2ZWZvcm0tYXJ0.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvdkpRWmZSckJTN3hoeGJLUEZ0eVRMRy9zYW5kYm94L0xjZllxM055alJwWUJHTVRXc0d3MnQtaW1nLTJfMTc3MTg5NjE2MDAwMF9uYTFmbl9kMkYyWldadmNtMHRZWEowLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=e-JH6R19HCUpjnwFwuALeyT6j4~2b7NI7HAXaJp4nhsG0mrHvyr4flIQf1wCtrUHnonxTD5I8vdhFmDI17mPcUL6oeHk-ni52IjMWjojB4Vuu6jCPr9YQHrcnL-LyiJIBMUMTlwH0wTpypAISr7DVBi-k4N--msR73~AL7qu3I~4SzFVZZW4HppJUzjZaBG1B7r7qQOmepIUJTXJ4Q5Cj7spAaGyrYDDEsflNGY1qwS19xkEMH-D46hah0cJwdbCzO6jMO~B65pB3reb~F0KPbFffXM1d0Lg7bjNB~LZP6Bt89620m7lu8EmR9NHNd5-ACcHuCzc2SUpfcjjnIhgyA__";

  // ── Prompt Data ──────────────────────────────────────────────────────────────
  const prompts = [
    {
      title: "범용 마스터 프롬프트",
      subtitle: "Suno, Udio, Stable Audio 등 모든 음악 생성 플랫폼에서 사용 가능한 종합 프롬프트",
      platform: "Universal",
      tags: [
        { label: "Pop Ballad", type: "amber" as const },
        { label: "Hip-Hop", type: "amber" as const },
        { label: "Crossover", type: "blue" as const },
        { label: "80 BPM", type: "blue" as const },
        { label: "Bb Major", type: "amber" as const },
      ],
      prompt: `Emotional pop ballad with hip-hop crossover, tempo 80 BPM, key Bb major, 4/4 time signature.

[MOOD & ATMOSPHERE]
Deeply nostalgic, bittersweet longing, hopeful yet melancholic. Cinematic emotional depth. 
Evokes memories of a lost friend, themes of farewell and reunion. 
Tone: sincere, heartfelt, restrained emotion building to cathartic release.

[SONG STRUCTURE]
Intro (piano solo, 8 bars) → Chorus (melodic male vocal + minimal beat) → 
Verse 1 (rap, storytelling flow) → Chorus → Verse 2 (rap) → 
Bridge (emotional peak, key modulation feel) → Final Chorus (full arrangement) → Outro (fade piano)

[VOCALS]
Lead singer: Clear, warm male tenor voice with controlled falsetto transitions.
Dynamic range: soft and intimate in verses, emotionally open in chorus.
Rap vocal: Calm, measured delivery, conversational and sincere tone, 
not aggressive — more like a heartfelt spoken word over beats.
Harmony: subtle backing harmonies in chorus, no excessive ad-libs.

[INSTRUMENTATION]
- Grand piano: warm, reverb-drenched, arpeggiated chords, leading melodic motif
- 808-style kick drum: soft, punchy, minimal hip-hop pattern
- Snap/clap percussion: on beats 2 and 4, understated
- Synth bass: deep, smooth, root-note following, minimal movement
- String pad / synth pad: atmospheric background swell, enters in chorus
- No electric guitar, no heavy distortion, no EDM drops

[PRODUCTION STYLE]
Clean, polished mix. Vocals centered and prominent. 
Reverb and delay used generously for spatial depth. 
Wide stereo field on pads and strings. 
Dynamic contrast: quiet verses, fuller chorus. 
Mastered for emotional impact, not loudness.`,
    },
    {
      title: "Suno 전용 프롬프트",
      subtitle: "Suno의 스타일 태그 문법에 최적화된 상세 프롬프트",
      platform: "Suno",
      tags: [
        { label: "pop ballad", type: "amber" as const },
        { label: "hip hop", type: "amber" as const },
        { label: "piano", type: "blue" as const },
        { label: "male vocal", type: "blue" as const },
        { label: "emotional", type: "amber" as const },
      ],
      prompt: `[Style Tags]
pop ballad, hip hop crossover, emotional, cinematic, nostalgic, 
piano-driven, 808 beats, male vocal, rap verse, falsetto, 
slow tempo, 80 bpm, Bb major, 4/4, clean production, 
reverb-heavy, atmospheric strings, bittersweet, heartfelt

[Lyrics Theme]
A tribute to a lost friend. Themes of memory, farewell, and the hope of reunion. 
Conversational rap verses telling personal stories, 
soaring melodic chorus expressing longing and love.

[Song Structure]
[intro] [chorus] [verse] [chorus] [verse] [bridge] [chorus] [outro]

[Vocal Direction]
Verse: calm spoken-word style rap, sincere and measured
Chorus: warm tenor, emotional, controlled falsetto on high notes
Bridge: most emotionally intense section, near-breaking voice
Outro: soft, fading, intimate

[Instrumentation Notes]
Warm grand piano as the backbone throughout.
Minimal 808 kick and snap percussion — never overpowering.
Lush reverb on piano and vocals for emotional depth.
Subtle string ensemble swells in chorus and bridge.
Deep synth bass, root-note movement only.`,
    },
    {
      title: "Udio / Stable Audio 전용 프롬프트",
      subtitle: "Udio 및 Stable Audio의 자연어 기반 생성 방식에 최적화된 서술형 프롬프트",
      platform: "Udio / Stable Audio",
      tags: [
        { label: "Descriptive", type: "blue" as const },
        { label: "Natural Language", type: "blue" as const },
        { label: "Cinematic", type: "amber" as const },
        { label: "Emotional", type: "amber" as const },
      ],
      prompt: `Create a deeply emotional pop-hip-hop ballad at 80 BPM in Bb major. 
The song should feel like a heartfelt farewell letter to a close friend — 
nostalgic, tender, and ultimately hopeful.

The arrangement centers on a warm, reverb-drenched grand piano playing 
gentle arpeggiated chords throughout. A minimal hip-hop beat with a soft 808 
kick and subtle snap on the backbeat provides rhythmic foundation without 
overwhelming the emotional core.

The lead vocals alternate between a smooth, clear male tenor singing the 
melodic chorus with controlled falsetto passages, and a calm, measured rap 
delivery in the verses — conversational and sincere, like someone speaking 
from the heart rather than performing.

In the chorus, lush string pads and synth swells enter beneath the vocals, 
creating a sense of expansive emotional release. The bridge should be the 
most intense moment, with the vocalist reaching toward their upper register 
as the arrangement briefly swells before receding into a quiet, intimate outro.

Production should be clean and polished with generous use of reverb and 
stereo-width on the pads. The overall dynamic arc moves from intimate and 
sparse to full and cathartic, then back to quiet and reflective.`,
    },
    {
      title: "MusicGen / AudioCraft 프롬프트",
      subtitle: "Meta의 MusicGen 및 AudioCraft 모델에 최적화된 기술적 프롬프트",
      platform: "MusicGen",
      tags: [
        { label: "Technical", type: "blue" as const },
        { label: "Descriptive", type: "blue" as const },
        { label: "Instrumental", type: "amber" as const },
      ],
      prompt: `Pop hip-hop ballad instrumental, 80 BPM, Bb major, 4/4 time. 
Warm reverb-heavy grand piano arpeggios as primary melodic element. 
Soft 808 kick drum with snap percussion on beats 2 and 4. 
Smooth synth bass following root notes. 
Lush string pad swells entering at chorus sections. 
Emotional, nostalgic, cinematic atmosphere. 
Clean professional mix with wide stereo field. 
Slow build from sparse piano intro to full orchestral chorus arrangement. 
No electric guitar, no distortion, no aggressive elements. 
Bittersweet, heartfelt, contemplative mood throughout.`,
    },
    {
      title: "Beatoven.ai / AIVA 프롬프트",
      subtitle: "감성 기반 작곡 플랫폼에 최적화된 감정 중심 프롬프트",
      platform: "Beatoven / AIVA",
      tags: [
        { label: "Emotion-Driven", type: "amber" as const },
        { label: "Cinematic", type: "amber" as const },
        { label: "Orchestral", type: "blue" as const },
      ],
      prompt: `Compose a cinematic emotional ballad for a farewell scene between close friends.

Emotional arc: begins with quiet melancholy and reflection, 
builds through nostalgic warmth, reaches a cathartic emotional peak, 
then resolves into peaceful acceptance and hope.

Genre: Contemporary pop ballad with hip-hop rhythmic influence.
Tempo: Slow, approximately 80 BPM.
Key: Bb major (warm, nostalgic quality).
Time signature: 4/4.

Primary instruments:
- Solo grand piano (warm, expressive, slightly dampened tone)
- String ensemble (enters gradually, swells in emotional peaks)
- Soft percussion (minimal hip-hop pattern, 808 bass drum)
- Synth bass (smooth, supportive)
- Atmospheric reverb pad (background texture)

The composition should feel like a film score moment — 
the kind of music that plays during a montage of shared memories, 
with enough rhythmic grounding to feel contemporary and relatable.`,
    },
  ];

  // ── Analysis Data ────────────────────────────────────────────────────────────
  const analysisData = {
    basic: [
      { label: "템포 (BPM)", value: "~80", unit: "BPM", color: "amber" as const },
      { label: "조성 (Key)", value: "Bb", unit: "Major", color: "amber" as const },
      { label: "박자", value: "4/4", unit: "Time", color: "blue" as const },
      { label: "재생 시간", value: "3:57", unit: "min", color: "blue" as const },
      { label: "샘플레이트", value: "44,100", unit: "Hz", color: "amber" as const },
      { label: "채널", value: "Stereo", unit: "2ch", color: "blue" as const },
    ],
    mood: [
      { label: "주요 감정", value: "그리움", unit: "Nostalgia", color: "amber" as const },
      { label: "분위기", value: "서정적", unit: "Lyrical", color: "amber" as const },
      { label: "에너지", value: "중저", unit: "Medium-Low", color: "blue" as const },
      { label: "다이내믹", value: "넓음", unit: "Wide Range", color: "blue" as const },
    ],
  };

  const instruments = [
    { name: "그랜드 피아노", role: "메인 멜로디 & 화성", icon: "🎹", color: "amber" },
    { name: "808 킥 드럼", role: "힙합 리듬 기반", icon: "🥁", color: "blue" },
    { name: "스냅/클랩", role: "백비트 퍼커션", icon: "👏", color: "blue" },
    { name: "신스 베이스", role: "저음역 지지", icon: "🎸", color: "amber" },
    { name: "스트링 패드", role: "감성적 배경 텍스처", icon: "🎻", color: "amber" },
    { name: "남성 테너", role: "코러스 멜로디 보컬", icon: "🎤", color: "blue" },
    { name: "랩 보컬", role: "벌스 스토리텔링", icon: "🎙️", color: "amber" },
  ];

  const structure = [
    { section: "Intro", desc: "피아노 솔로, 8마디, 조용하고 서정적", time: "0:00" },
    { section: "Chorus", desc: "멜로디 보컬 + 미니멀 비트 첫 등장", time: "0:21" },
    { section: "Verse 1", desc: "랩 벌스, 개인적 스토리텔링", time: "0:40" },
    { section: "Chorus", desc: "코러스 반복, 감정 고조", time: "1:14" },
    { section: "Verse 2", desc: "두 번째 랩 벌스, 주제 심화", time: "1:55" },
    { section: "Bridge", desc: "감정 최고조, 보컬 피크", time: "2:29" },
    { section: "Chorus", desc: "풀 편곡 코러스, 스트링 스웰", time: "2:49" },
    { section: "Outro", desc: "피아노 페이드아웃, 여운", time: "3:29" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(10,14,26,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(245,166,35,0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#F0EDE8", fontFamily: "'DM Sans', sans-serif" }}>Music Prompt Lab</span>
        </div>
        <div className="flex items-center gap-2">
          <WaveformBars count={12} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.25)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
            </svg>
            설정
          </button>
          <button
            onClick={() => navigate("/history")}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
            히스토리
          </button>
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.2)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>
            분석 완료
          </span>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "520px" }}>
        {/* Background Image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.35)",
          }}
        />
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(10,14,26,0.7) 0%, rgba(10,14,26,0.3) 50%, rgba(10,14,26,0.8) 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: "linear-gradient(to top, #0A0E1A, transparent)" }}
        />

        {/* Hero Content */}
        <div className="relative container py-20">
          <div className="max-w-3xl">
            <div className="fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <span className="tag-amber">Wiz Khalifa ft. Charlie Puth</span>
                <span className="tag-blue">2015 · Atlantic Records</span>
              </div>
            </div>

            <div className="fade-in-up delay-100">
              <h1
                className="text-5xl md:text-6xl font-bold mb-3 leading-tight"
                style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}
              >
                Kaf-MusicAnalysis
              </h1>
              <p className="text-xl italic mb-6" style={{ color: "#F5A623", fontFamily: "'Playfair Display', serif" }}>
                — 음악 제작 프롬프트 분석 리포트
              </p>
            </div>

            <div className="fade-in-up delay-200">
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(240,237,232,0.7)", fontFamily: "'DM Sans', sans-serif", maxWidth: "600px" }}>
                세계적인 작곡가의 시각으로 이 곡의 음악적 DNA를 해부하고, 동일한 분위기·박자·리듬·악기·보컬 톤을 재현할 수 있는
                음악 생성 전문 프롬프트를 제공합니다. Suno, Udio, MusicGen 등 주요 플랫폼별 최적화 프롬프트가 포함되어 있습니다.
              </p>
            </div>

            <div className="fade-in-up delay-300">
              <div className="flex flex-wrap gap-3">
                <a href="#analysis" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105" style={{ background: "#F5A623", color: "#0A0E1A", fontFamily: "'DM Sans', sans-serif" }}>
                  음악 분석 보기
                </a>
                <a href="#prompts" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105" style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.3)", color: "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>
                  프롬프트 바로가기
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Analysis Section ───────────────────────────────────────────────── */}
      <section id="analysis" className="py-16 container">
        <Section>
          <div className="mb-10">
            <div className="section-accent" />
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
              음악 분석 리포트
            </h2>
            <p className="text-sm" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
              오디오 신호 처리 및 음악 이론 기반 정밀 분석
            </p>
          </div>
        </Section>

        {/* Basic Stats Grid */}
        <Section delay={100}>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>기본 음악 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {analysisData.basic.map((item, i) => (
              <StatCard key={i} {...item} />
            ))}
          </div>
        </Section>

        <div className="amber-line mb-8" />

        {/* Mood Stats */}
        <Section delay={200}>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>감성 & 분위기 분석</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {analysisData.mood.map((item, i) => (
              <StatCard key={i} {...item} />
            ))}
          </div>
        </Section>

        <div className="amber-line mb-8" />

        {/* Instruments */}
        <Section delay={300}>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>악기 구성</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {instruments.map((inst, i) => (
              <div
                key={i}
                className="rounded-xl p-4 flex items-start gap-3 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(22,29,46,0.8)",
                  border: `1px solid ${inst.color === "amber" ? "rgba(245,166,35,0.15)" : "rgba(79,195,247,0.15)"}`,
                }}
              >
                <span className="text-2xl">{inst.icon}</span>
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: inst.color === "amber" ? "#F5A623" : "#4FC3F7", fontFamily: "'DM Sans', sans-serif" }}>{inst.name}</p>
                  <p className="text-xs" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>{inst.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="amber-line mb-8" />

        {/* Song Structure */}
        <Section delay={400}>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "'DM Sans', sans-serif" }}>곡 구조 (Song Structure)</h3>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(22,29,46,0.75)", border: "1px solid rgba(245,166,35,0.1)" }}
          >
            {structure.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-white/[0.02]"
                style={{ borderBottom: i < structure.length - 1 ? "1px solid rgba(245,166,35,0.06)" : "none" }}
              >
                <span className="text-xs w-10 shrink-0" style={{ color: "#4FC3F7", fontFamily: "'JetBrains Mono', monospace" }}>{item.time}</span>
                <span
                  className="text-xs font-bold w-20 shrink-0 px-2 py-1 rounded text-center"
                  style={{
                    background: item.section === "Chorus" ? "rgba(245,166,35,0.15)" : item.section === "Bridge" ? "rgba(79,195,247,0.15)" : "rgba(255,255,255,0.05)",
                    color: item.section === "Chorus" ? "#F5A623" : item.section === "Bridge" ? "#4FC3F7" : "rgba(240,237,232,0.6)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {item.section}
                </span>
                <span className="text-sm" style={{ color: "rgba(240,237,232,0.65)", fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className="amber-line my-8" />

        {/* Waveform Visual Section */}
        <Section delay={500}>
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ height: "200px" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${WAVEFORM_BG})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.5)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(10,14,26,0.6), rgba(10,14,26,0.3))" }}
            />
            <div className="relative h-full flex flex-col items-center justify-center gap-4">
              <WaveformBars count={40} />
              <p className="text-sm font-medium" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "'DM Sans', sans-serif" }}>
                오디오 파형 시각화 — Kaf-MusicAnalysis
              </p>
            </div>
          </div>
        </Section>
      </section>

      {/* ── Prompts Section ────────────────────────────────────────────────── */}
      <section id="prompts" className="py-16" style={{ background: "rgba(10,14,26,0.5)" }}>
        <div className="container">
          <Section>
            <div className="mb-10">
              <div className="section-accent" />
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
                음악 생성 프롬프트
              </h2>
              <p className="text-sm" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                플랫폼별 최적화된 5종 전문 프롬프트 — 복사하여 즉시 사용 가능
              </p>
            </div>
          </Section>

          <div className="flex flex-col gap-6">
            {prompts.map((p, i) => (
              <PromptCard key={i} {...p} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Usage Guide Section ────────────────────────────────────────────── */}
      <section className="py-16 container">
        <Section>
          <div className="mb-8">
            <div className="section-accent" />
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>
              프롬프트 활용 가이드
            </h2>
          </div>
        </Section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "플랫폼 선택",
              desc: "Suno, Udio, MusicGen 등 사용하려는 음악 생성 플랫폼을 선택하고, 해당 플랫폼에 맞는 프롬프트를 위에서 복사합니다.",
              color: "amber",
            },
            {
              step: "02",
              title: "프롬프트 입력",
              desc: "복사한 프롬프트를 플랫폼의 텍스트 입력창에 붙여넣기 합니다. 필요에 따라 일부 파라미터(BPM, 키 등)를 조정할 수 있습니다.",
              color: "blue",
            },
            {
              step: "03",
              title: "생성 & 반복",
              desc: "여러 번 생성하여 가장 원하는 결과물을 선택합니다. 프롬프트의 특정 요소를 수정하여 세밀한 조정도 가능합니다.",
              color: "amber",
            },
          ].map((item, i) => (
            <Section key={i} delay={i * 150}>
              <div
                className="rounded-2xl p-6 h-full"
                style={{
                  background: "rgba(22,29,46,0.75)",
                  border: `1px solid ${item.color === "amber" ? "rgba(245,166,35,0.12)" : "rgba(79,195,247,0.12)"}`,
                }}
              >
                <div
                  className="text-4xl font-bold mb-4"
                  style={{
                    color: item.color === "amber" ? "rgba(245,166,35,0.2)" : "rgba(79,195,247,0.2)",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#F0EDE8", fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</p>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ── Upload Section ─────────────────────────────────────────────── */}
      <UploadSection />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        className="py-10"
        style={{
          borderTop: "1px solid rgba(245,166,35,0.08)",
          background: "rgba(10,14,26,0.8)",
        }}
      >
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#F5A623", fontFamily: "'Playfair Display', serif" }}>
              Kaf-MusicAnalysis
            </p>
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
              세계적인 작곡가의 시각으로 분석한 음악 프롬프트 리포트
            </p>
          </div>
          <div className="flex items-center gap-4">
            <WaveformBars count={8} />
            <span className="text-xs" style={{ color: "rgba(240,237,232,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
              © 2025 Music Prompt Lab
            </span>
          </div>
        </div>
      </footer>

      {/* ── KafCore Brand Badge ─────────────────────────────────────────── */}
      <KafCoreBadge />
    </div>
  );
}
