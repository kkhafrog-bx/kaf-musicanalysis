/**
 * KafCoreBadge — 모든 페이지 하단 중앙에 표시되는 KafCore 로고 + ®KafCore 배지
 * 다크 시네마틱 테마에 맞게 로고를 amber/orange 톤으로 처리
 */

const KAFCORE_LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663378299413/ExfpoSWbfEymTJiS.png";

export default function KafCoreBadge() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-8"
      style={{ borderTop: "1px solid rgba(245,166,35,0.06)" }}
    >
      <div className="flex items-center gap-3">
        {/* 로고 이미지 — 다크 배경에 맞게 밝기/채도 조정 */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "10px",
            background: "rgba(245,166,35,0.06)",
            border: "1px solid rgba(245,166,35,0.15)",
            padding: "6px",
          }}
        >
          <img
            src={KAFCORE_LOGO_URL}
            alt="KafCore Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              /* 흰 배경 로고를 다크 테마에 맞게: 밝기를 낮추고 amber 톤 유지 */
              filter:
                "brightness(0.9) saturate(1.2) drop-shadow(0 0 6px rgba(245,166,35,0.3))",
            }}
          />
        </div>

        {/* ®KafCore 텍스트 */}
        <div className="flex flex-col">
          <div className="flex items-start gap-0.5">
            <span
              style={{
                fontSize: "10px",
                lineHeight: "1",
                color: "#F5A623",
                fontFamily: "'DM Sans', sans-serif",
                marginTop: "2px",
              }}
            >
              ®
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "#F0EDE8",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: "1.1",
              }}
            >
              KafCore
            </span>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "rgba(240,237,232,0.3)",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            Music Analysis Platform
          </span>
        </div>
      </div>
    </div>
  );
}
