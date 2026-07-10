import { ImageResponse } from "next/og";
import { getAllQuestionSets, getQuestionSet } from "@/app/lib/content";

export const alt = "AI Career Mentor interview question bank";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllQuestionSets().map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function OGImage({ params }: Props) {
  const { slug } = await params;
  const set = getQuestionSet(slug);

  const title = set?.title ?? "Interview question library";
  const badge = (set?.category ?? "Question bank").toUpperCase();

  // Scale the headline down for longer titles so it never overflows.
  const fontSize = title.length > 70 ? 54 : title.length > 45 ? 62 : 72;

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
            "linear-gradient(135deg, #07030d 0%, #150a26 55%, #2b1050 100%)",
          padding: "56px 72px",
        }}
      >
        {/* Category badge */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 22px",
              borderRadius: 100,
              border: "1px solid rgba(168, 85, 247, 0.35)",
              backgroundColor: "rgba(168, 85, 247, 0.1)",
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
              {badge}
            </span>
          </div>
        </div>

        {/* Question set title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            paddingTop: 28,
            paddingBottom: 28,
          }}
        >
          <div
            style={{
              fontSize,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 1.1,
              maxWidth: 1020,
            }}
          >
            {title}
          </div>
        </div>

        {/* Wordmark + URL footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(139, 92, 246, 0.25)",
            paddingTop: 26,
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            AI Career Mentor
          </span>
          <span
            style={{
              fontSize: 20,
              color: "#a78bfa",
              letterSpacing: "0.04em",
            }}
          >
            aicareermentor.co.uk/questions
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
