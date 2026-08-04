import Link from "next/link";
import { absoluteUrl, siteConfig } from "@/app/config/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: absoluteUrl("/about"),
  name: "About AI Career Mentor",
  description:
    "The mission and story behind AI Career Mentor, a UK-built AI coaching platform for candidates and hiring teams.",
  mainEntity: {
    "@id": `${siteConfig.url}/#organization`,
  },
};

const values = [
  {
    title: "Equal access to preparation",
    body: "A first-generation graduate deserves the same quality of interview coaching as someone whose parents went to Oxbridge. We built AI Career Mentor so that background, network, and budget can no longer determine who gets prepared and who doesn't.",
  },
  {
    title: "Honest feedback, not flattery",
    body: "Real improvement comes from knowing exactly where you fell short. Our AI gives you the truth (constructively and specifically), not the encouragement you wanted to hear.",
  },
  {
    title: "Reducing bias, not reinforcing it",
    body: "Unstructured interviews disadvantage candidates who aren't familiar with the unwritten rules. We teach those rules explicitly, from STAR structure and competency frameworks to delivery, so that every candidate can be judged on their genuine capability.",
  },
  {
    title: "Privacy by design",
    body: "Your interview answers, CV context and coaching sessions belong to you. We never sell your data, we process only what's needed, and you can delete everything at any time.",
  },
];

export function AboutPageContent() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-2 sm:px-6 sm:pt-5">
        {/* Hero */}
        <section className="mb-12 text-center">
          <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl">
            Making elite interview prep{" "}
            <span className="text-violet-300">
              accessible to everyone
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
            AI Career Mentor is a UK-built platform that gives candidates the kind
            of preparation that used to cost hundreds of pounds per hour, and
            gives hiring teams a structured, fair way to assess candidates at scale.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-16 rounded-[2rem] border border-purple-300/15 bg-purple-300/[0.05] p-8 sm:p-10">
          <p className="mb-3 text-[11px] font-bold tracking-wide text-purple-300/80">
            Our mission
          </p>
          <blockquote className="text-xl font-bold leading-[1.4] tracking-tight text-white sm:text-2xl">
            &ldquo;To make the gap between a good candidate and a hired one about
            preparation, not privilege.&rdquo;
          </blockquote>
        </section>

        {/* DE&I statement */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Why this matters</h2>
          <div className="space-y-5 text-base leading-8 text-gray-400">
            <p>
              The interview process has a diversity problem, and it starts long before
              the interview room. Candidates from underrepresented backgrounds,
              first-generation graduates, career changers, and those without access to
              professional networks face a structural disadvantage that has nothing to
              do with their ability to do the job.
            </p>
            <p>
              Access to quality interview coaching has historically been a privilege.
              Private coaches charge £150–£300 per hour. Elite universities run
              dedicated careers programmes unavailable to everyone else. Professional
              networks give some candidates insider knowledge (the unwritten rules of
              interviews) that others never learn.
            </p>
            <p>
              The result is that hiring decisions are influenced not just by capability,
              but by who had access to preparation. That&rsquo;s not a fair outcome for
              candidates, and it&rsquo;s not good for employers who miss out on talented
              people who simply didn&rsquo;t know how to present themselves.
            </p>
            <p className="font-bold text-white">
              AI Career Mentor exists to close that gap. We give every candidate,
              regardless of background, institution, or budget, access to the same
              quality of structured, honest, personalised coaching that used to be
              reserved for the few.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">The story</h2>
          <div className="space-y-5 text-base leading-8 text-gray-400">
            <p>
              AI Career Mentor was built around one observation: preparation makes a
              meaningful difference to interview outcomes, yet access to that
              preparation is anything but equal. Candidates who practise with
              structured feedback perform measurably better. The coaching works. The
              problem is access.
            </p>
            <p>
              The platform started with one question: what would it look like if every
              candidate, whether a first-generation graduate, career changer, returner
              to work, or candidate from a non-traditional background, could access the same
              calibre of coaching as someone with a top-tier careers service and a
              private coach? Not generic questions, but coaching tailored to their
              exact role, level, and interview format, with honest feedback on answers,
              voice delivery, and camera presence.
            </p>
            <p>
              Built in the UK, GDPR-first, and committed to keeping the core
              experience genuinely accessible. Because inclusive hiring has to start
              with inclusive preparation.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">What we stand for</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <h3 className="mb-2 font-bold leading-tight">{v.title}</h3>
                <p className="text-sm leading-6 text-gray-400">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/for-candidates"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.02]"
          >
            Start practising →
          </Link>
          <p className="mt-3 text-xs text-gray-600">Free to start. No credit card required.</p>
        </section>
      </div>
    </>
  );
}
