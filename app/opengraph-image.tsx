import { ImageResponse } from "next/og";

export const alt =
  "AI Career Mentor · AI Interview Coaching for Answers, Voice & Camera Presence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#07030d",
          padding: "0 80px",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 22px",
            borderRadius: 100,
            border: "1px solid rgba(168, 85, 247, 0.35)",
            backgroundColor: "rgba(168, 85, 247, 0.1)",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#d8b4fe",
            }}
          >
            AI INTERVIEW COACHING
          </span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-4px",
            textAlign: "center",
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          AI Career Mentor
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 27,
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: 740,
            lineHeight: 1.45,
            marginBottom: 52,
          }}
        >
          Score your answers, voice delivery and camera presence.
          Tailored questions for your exact role. Free to start.
        </div>

        {/* URL pill */}
        <div
          style={{
            display: "flex",
            padding: "12px 28px",
            borderRadius: 100,
            backgroundColor: "rgba(139, 92, 246, 0.12)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#a78bfa",
              letterSpacing: "0.04em",
            }}
          >
            aicareermentor.co.uk
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
