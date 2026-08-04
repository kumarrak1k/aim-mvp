type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  items: FAQItem[];
  heading?: string;
  accentColor?: "purple" | "fuchsia";
};

export function FAQSection({
  items,
  heading = "Frequently asked questions",
  accentColor = "purple",
}: FAQSectionProps) {
  const borderColor =
    accentColor === "fuchsia"
      ? "border-fuchsia-400/20"
      : "border-purple-400/20";
  const summaryColor =
    accentColor === "fuchsia" ? "text-fuchsia-300" : "text-purple-300";

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        {heading}
      </h2>
      <div className="divide-y divide-white/[0.07]">
        {items.map((item) => (
          <details
            key={item.question}
            className={`group border-t ${borderColor} first:border-t-0`}
          >
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[15px] font-bold leading-6 text-white outline-none ${summaryColor} [&::-webkit-details-marker]:hidden`}
            >
              <span className="text-white">{item.question}</span>
              <span
                className={`shrink-0 text-lg transition-transform duration-200 group-open:rotate-45 ${summaryColor}`}
              >
                +
              </span>
            </summary>
            <p className="pb-5 text-sm leading-7 text-gray-400">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
