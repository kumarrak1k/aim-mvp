import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { absoluteUrl } from "@/app/config/site";
import { CertificateActions } from "./CertificateActions";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({ where: { id } });
  if (!cert) return {};
  return {
    title: { absolute: `${cert.name}: Interview Readiness Certificate | AI Career Mentor` },
    description: `${cert.name} has demonstrated interview readiness for ${cert.role} with an overall score of ${cert.score}/10.`,
    openGraph: {
      title: `${cert.name}: Interview Readiness Certificate`,
      description: `Overall score ${cert.score}/10 for ${cert.role}. Awarded by AI Career Mentor.`,
      type: "website",
    },
  };
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({ where: { id } });
  if (!cert) notFound();

  const dateStr = cert.issuedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const shareUrl = absoluteUrl(`/certificate/${id}`);
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const scoreColor =
    cert.score >= 8 ? "text-emerald-400" :
    cert.score >= 6 ? "text-purple-300" :
    "text-amber-400";

  return (
    <div className="relative min-h-screen bg-background text-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .cert-card { border: 2px solid #8c5cff !important; box-shadow: none !important; }
        }
      `}</style>

      {/* Background */}
      <div className="no-print pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.15),transparent)]" />
        <div className="absolute left-1/2 top-[-200px] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/[0.12] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Certificate card */}
        <div className="cert-card overflow-hidden rounded-[2rem] border border-purple-300/25 bg-gradient-to-b from-purple-950/60 to-background shadow-2xl shadow-purple-950/50">
          {/* Header band */}
          <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 px-8 py-6 text-center">
            <p className="text-[12px] font-bold tracking-wide text-white/80">
              AI Career Mentor
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              Interview Readiness Certificate
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-10 text-center sm:px-12 sm:py-12">
            <p className="text-xs tracking-wide text-gray-400">
              This certifies that
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {cert.name}
            </h1>
            <p className="mt-4 text-sm text-gray-400">
              has demonstrated interview readiness for
            </p>
            <p className="mt-2 text-xl font-bold text-purple-200">{cert.role}</p>

            {/* Score */}
            <div className="mx-auto mt-8 inline-block rounded-2xl border border-white/[0.1] bg-white/[0.05] px-8 py-5">
              <p className="text-xs tracking-wide text-gray-400">Overall score</p>
              <p className={`mt-1 text-4xl font-bold leading-none tracking-tight ${scoreColor}`}>
                {cert.score}
                <span className="text-2xl text-gray-400">/10</span>
              </p>
            </div>

            <p className="mt-8 text-xs text-gray-400">
              Awarded {dateStr} · AI Career Mentor · aicareermentor.co.uk
            </p>

            {/* Seal */}
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-400/40 bg-purple-500/10">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-purple-400" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Actions */}
        <CertificateActions linkedinShareUrl={linkedinShareUrl} shareUrl={shareUrl} />

        <p className="no-print mt-8 text-center text-xs text-gray-400">
          Earn your certificate by completing a practice session on{" "}
          <a href="/" className="text-purple-400 hover:text-purple-300">AI Career Mentor</a>
        </p>
      </div>
    </div>
  );
}
