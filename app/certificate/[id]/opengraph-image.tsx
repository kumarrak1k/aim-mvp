import { ImageResponse } from "next/og";
import { prisma } from "@/app/lib/prisma";

// The whole value of the LinkedIn share is the preview card — without this
// file the share rendered as a bare link (no og:image on the route).
export const runtime = "nodejs";
export const alt = "Interview Readiness Certificate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

export default async function OGImage({ params }: Props) {
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({ where: { id } });

  const name = cert?.name ?? "Interview Readiness";
  const role = cert?.role ?? "";
  const score = cert?.score;
  const scoreColor =
    score == null ? "#d8b4fe" : score >= 8 ? "#34d399" : score >= 6 ? "#d8b4fe" : "#fbbf24";
  const nameSize = name.length > 26 ? 58 : name.length > 18 ? 68 : 78;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage:
            "linear-gradient(135deg, #07030d 0%, #1a0b33 55%, #2b1050 100%)",
          padding: "52px 72px",
        }}
      >
        {/* Award badge row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 24px",
              borderRadius: 100,
              border: "1px solid rgba(168, 85, 247, 0.4)",
              backgroundColor: "rgba(168, 85, 247, 0.12)",
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "#d8b4fe",
              }}
            >
              INTERVIEW READINESS CERTIFICATE
            </span>
          </div>
          {/* Star seal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 100,
              border: "2px solid rgba(168, 85, 247, 0.5)",
              backgroundColor: "rgba(168, 85, 247, 0.12)",
              fontSize: 34,
            }}
          >
            <span style={{ color: "#c084fc" }}>{"★"}</span>
          </div>
        </div>

        {/* Name + role */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <span style={{ fontSize: 22, color: "#a78bfa", letterSpacing: "0.06em" }}>
            This certifies that
          </span>
          <span
            style={{
              marginTop: 10,
              fontSize: nameSize,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 1.05,
              maxWidth: 1040,
            }}
          >
            {name}
          </span>
          {role ? (
            <span style={{ marginTop: 16, fontSize: 30, color: "#e9d5ff", maxWidth: 1040 }}>
              is interview-ready for {role}
            </span>
          ) : null}
          {score != null ? (
            <div style={{ display: "flex", marginTop: 26 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  padding: "14px 30px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.14)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 54, fontWeight: 900, color: scoreColor }}>{score}</span>
                <span style={{ fontSize: 30, color: "#9ca3af", marginLeft: 6 }}>/10 overall</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Wordmark + URL footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(139, 92, 246, 0.25)",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-1px" }}>
            AI Career Mentor
          </span>
          <span style={{ fontSize: 20, color: "#a78bfa", letterSpacing: "0.04em" }}>
            aicareermentor.co.uk
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
