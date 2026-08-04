import { SectionHeading } from "@/app/components/marketing/primitives";

type ProfileHeroProps = {
  completionScore: number;
  hasCvContext: boolean;
  hasRoleSpec: boolean;
};

export function ProfileHero({
  completionScore,
  hasCvContext,
  hasRoleSpec,
}: ProfileHeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-1 text-center sm:px-6 sm:pb-10 sm:pt-3">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          align="center"
          eyebrow="Candidate Profile"
          title="Build your candidate profile once. Practise smarter every time."
          description="Save your CV content, target role specification and interview goals so each practice session feels more relevant, focused and personalised."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <ProfileMetric
            value={`${completionScore}%`}
            label="Profile completion"
          />
          <ProfileMetric
            value={hasCvContext ? "Ready" : "Pending"}
            label="CV context"
          />
          <ProfileMetric
            value={hasRoleSpec ? "Ready" : "Pending"}
            label="Role spec"
          />
        </div>
      </div>
    </section>
  );
}

function ProfileMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-xl shadow-black/10">
      <p className="text-2xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}