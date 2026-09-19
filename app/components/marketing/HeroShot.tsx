import Image from "next/image";

/**
 * The homepage hero's product shot: scored feedback and a model answer, which
 * is the moment the product earns its keep.
 *
 * It is the page's largest image and sits in the first screen, so it loads
 * with priority. sizes matches the column it renders in: 7/12 of the content
 * width on wide screens, full width below that.
 */
export function HeroShot() {
  return (
    <figure className="mx-auto w-full max-w-3xl lg:max-w-none">
      <Image
        src="/marketing/candidate-03-feedback.webp"
        alt="An interview answer scored out of 10 across content, clarity, relevance, structure and confidence, with a model answer to compare against"
        width={2600}
        height={1781}
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="h-auto w-full rounded-3xl shadow-2xl shadow-purple-950/25"
      />
    </figure>
  );
}
