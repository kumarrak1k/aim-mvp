import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl, siteConfig } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";

export const metadata: Metadata = createPageMetadata({
  path: "/universities",
  title: "University & Campus Licensing — AI Career Mentor",
  description:
    "Campus licensing for universities and careers services. Give every student unlimited access to AI interview coaching under a single institutional licence.",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: absoluteUrl("/universities"),
  name: "University & Campus Licensing — AI Career Mentor",
  description:
    "Campus licensing for universities and careers services. Give every student unlimited access to AI interview coaching.",
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

const benefits = [
  {
    title: "Unlimited student access",
    body: "Every enrolled student gets full platform access — unlimited practice sessions, voice coaching, camera presence feedback, and assessment centre preparation. No per-seat counting.",
  },
  {
    title: "Employability metrics dashboard",
    body: "Track platform engagement and preparation activity across your student cohort. Demonstrate ROI to leadership with clear employability outcomes data.",
  },
  {
    title: "Tailored to your institution",
    body: "Custom onboarding, single sign-on via your institutional identity provider, and optional co-branding. Works within your existing careers service workflow.",
  },
  {
    title: "Covers every interview type",
    body: "Competency, technical, case study, presentation, and assessment centre — students preparing for any employer can practise the exact format they'll face.",
  },
  {
    title: "GDPR & DPA compliant",
    body: "Full Data Processing Agreement provided. UK GDPR-ready by design, HESA-aligned data handling. Passes most institutional procurement reviews without issue.",
  },
  {
    title: "Careers team support",
    body: "Dedicated onboarding, careers advisor training pack, and priority support for your team. We become an extension of your careers service, not just a vendor.",
  },
];

const useCases = [
  "Pre-placement year preparation",
  "Graduate scheme application support",
  "Assessment centre cohort prep",
  "Employability module coursework",
  "Career service walk-in coaching supplement",
  "Alumni and postgraduate career support",
];

export default function UniversitiesPage() {
  return (
    <PublicShell currentPath="/universities">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-center sm:px-6 sm:pt-10">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
            For universities & careers services
          </p>
          <h1 className="mx-auto max-w-4xl text-[2.4rem] font-black leading-[1.04] tracking-[-0.055em] sm:text-5xl lg:text-[3.5rem]">
            Give every student{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              elite interview coaching.
            </span>{" "}
            One campus licence.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
            A single institutional licence gives your entire student body unlimited
            access to AI-powered interview practice, assessment centre preparation,
            and real-time coaching. At a fraction of the cost of human coaching.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:universities@aicareermentor.co.uk?subject=Campus%20licence%20enquiry"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.02]"
            >
              Request a demo →
            </a>
            <a
              href="mailto:universities@aicareermentor.co.uk?subject=Campus%20licence%20pricing%20enquiry"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.09]"
            >
              Discuss pricing
            </a>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7"
              >
                <h3 className="mb-3 font-black leading-tight">{b.title}</h3>
                <p className="text-sm leading-6 text-gray-400">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            How careers teams use it
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((uc) => (
              <div
                key={uc}
                className="flex items-center gap-3 rounded-2xl border border-purple-300/10 bg-purple-300/[0.04] px-5 py-4"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-purple-400" />
                <span className="text-sm text-gray-300">{uc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Custom pricing contact */}
        <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
          <div className="rounded-[2rem] border border-purple-300/20 bg-purple-300/[0.06] p-8 sm:p-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
              Custom pricing
            </div>
            <h2 className="mb-4 text-2xl font-black tracking-[-0.04em]">Pricing tailored to your institution</h2>
            <p className="mb-6 text-base leading-7 text-gray-400">
              Every university is different — in size, structure, and what they need from
              a careers platform. We don&rsquo;t publish fixed price lists because the right
              deal depends on your student numbers, modules required, contract length, and
              existing procurement arrangements. Get in touch and we&rsquo;ll put together a
              proposal that works for your institution.
            </p>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { icon: "🎓", label: "Institution size", desc: "Priced per campus, not per student — your whole cohort is covered." },
                { icon: "📋", label: "Modules & features", desc: "Interview coaching, assessment centre prep, career docs — mix as needed." },
                { icon: "📄", label: "Procurement ready", desc: "DPA, GDPR documentation and institutional paperwork provided as standard." },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <p className="mb-2 text-2xl">{item.icon}</p>
                  <p className="mb-1 text-sm font-black text-white">{item.label}</p>
                  <p className="text-xs leading-5 text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
            <a
              href="mailto:universities@aicareermentor.co.uk?subject=Campus%20licence%20pricing%20enquiry"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"
            >
              Contact us to discuss pricing →
            </a>
            <p className="mt-3 text-xs text-gray-600">
              universities@aicareermentor.co.uk · We respond within one working day
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
          <h2 className="mb-4 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Ready to talk?
          </h2>
          <p className="mb-8 text-base text-gray-400">
            Our team works with university careers services to set up trials, provide
            institutional pricing, and handle procurement paperwork. Get in touch and
            we&rsquo;ll respond within one working day.
          </p>
          <a
            href="mailto:universities@aicareermentor.co.uk"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.02]"
          >
            Contact us →
          </a>
          <p className="mt-3 text-xs text-gray-600">
            universities@aicareermentor.co.uk
          </p>
        </section>
      </div>
    </PublicShell>
  );
}
