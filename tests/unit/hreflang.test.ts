/**
 * Cross-domain hreflang must name URLs that actually exist.
 *
 * The two sites share English content, so every marketing page declares the
 * other domain's equivalent as a language alternate. That builder used to
 * assume both sites use the SAME path — but .co.uk renamed its candidate
 * pages when it collapsed to a single audience (/for-candidates/x -> /x) and
 * .com did not. The result was /mock-assessment-centre advertising five .com
 * URLs that all 404'd. Google discards a page's whole hreflang cluster when
 * the alternates don't resolve, so the sister pages competed as undeclared
 * duplicates and .com's assessment centre page went unindexed.
 *
 * These tests pin the divergent paths. If either site renames a page again,
 * this fails instead of silently emitting dead alternates.
 */

import { describe, it, expect } from "vitest";
import { buildAlternates } from "@/app/config/seo";

const INTL = "https://aicareermentor.com";
const UK = "https://aicareermentor.co.uk";

function languagesFor(path: string): Record<string, string> {
  const alt = buildAlternates(path);
  return (alt?.languages ?? {}) as Record<string, string>;
}

describe("cross-domain hreflang", () => {
  // Path on .co.uk -> the path the SAME page lives at on .com.
  const DIVERGENT: Array<[string, string]> = [
    ["/interview-practice", "/for-candidates/interview-practice"],
    ["/mock-assessment-centre", "/for-candidates/assessment-centre"],
    ["/pricing", "/for-candidates/pricing"],
  ];

  it.each(DIVERGENT)(
    "%s points its .com alternates at the real counterpart",
    (ukPath, intlPath) => {
      const langs = languagesFor(ukPath);

      expect(langs["en-GB"]).toBe(`${UK}${ukPath}`);
      expect(langs.en).toBe(`${INTL}${intlPath}`);
      expect(langs["x-default"]).toBe(`${INTL}${intlPath}`);
      for (const locale of ["fr", "de", "es"] as const) {
        expect(langs[locale]).toBe(`${INTL}/${locale}${intlPath}`);
      }
    }
  );

  it.each(DIVERGENT)(
    "%s never advertises its own path on .com (that URL 404s)",
    (ukPath) => {
      const langs = languagesFor(ukPath);

      // The old bug built every non-UK alternate as INTL + the .co.uk path.
      // Compare against those exact URLs: a substring check would misfire,
      // since /for-candidates/pricing legitimately ends with /pricing.
      expect(langs.en).not.toBe(`${INTL}${ukPath}`);
      expect(langs["x-default"]).not.toBe(`${INTL}${ukPath}`);
      for (const locale of ["fr", "de", "es"] as const) {
        expect(langs[locale]).not.toBe(`${INTL}/${locale}${ukPath}`);
      }
    }
  );

  it("leaves shared paths on the same path for both sites", () => {
    // /for-business/* and /universities resolve 200 on BOTH domains, so they
    // must NOT be rewritten.
    const langs = languagesFor("/for-business/pricing");
    expect(langs["en-GB"]).toBe(`${UK}/for-business/pricing`);
    expect(langs.en).toBe(`${INTL}/for-business/pricing`);
    expect(langs.fr).toBe(`${INTL}/fr/for-business/pricing`);
  });

  it("keeps the homepage suffix-free rather than emitting a trailing slash", () => {
    const langs = languagesFor("/");
    expect(langs["en-GB"]).toBe(UK);
    expect(langs.en).toBe(INTL);
    expect(langs.es).toBe(`${INTL}/es`);
  });

  it("self-references the UK URL on every page", () => {
    for (const path of ["/", "/pricing", "/blog", "/mock-assessment-centre"]) {
      const langs = languagesFor(path);
      expect(langs["en-GB"]).toBe(`${UK}${path === "/" ? "" : path}`);
    }
  });
});
