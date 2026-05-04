import {
  GlassCard,
  SectionHeading,
} from "@/app/components/marketing/MarketingShell";

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
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <SectionHeading
            eyebrow="Candidate Profile"
            title="Build your candidate profile once. Practise smarter every time."
            description="Save your CV content, target role specification and interview goals so each practice session feels more relevant, focused and personalised."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

        <GlassCard className="overflow-hidden p-0">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"
            alt="Professional interview preparation"
            className="h-[320px] w-full object-cover"
          />
        </GlassCard>
      </div>
    </section>
  );
}

function ProfileMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-xl shadow-black/10">
      <p className="text-2xl font-black tracking-[-0.03em] text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}