"use client";

export function CertificateActions({
  linkedinShareUrl,
  shareUrl,
}: {
  linkedinShareUrl: string;
  shareUrl: string;
}) {
  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
  }

  return (
    <div className="no-print mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <a
        href={linkedinShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl bg-[#0a66c2] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
      >
        <span>in</span>
        Share on LinkedIn
      </a>
      <button
        onClick={copyLink}
        className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.05] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.09]"
      >
        Copy link
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.05] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.09]"
      >
        Print / Save PDF
      </button>
    </div>
  );
}
