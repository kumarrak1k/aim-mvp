/**
 * Sanitizer for user-provided document text (CVs, role specs, job
 * descriptions) arriving from PDF/DOCX extraction or paste.
 *
 * PDF extraction in particular produces three classes of junk:
 *  1. WinAnsi (Windows-1252) bytes decoded as latin1 — smart quotes, dashes,
 *     bullets and the euro sign land in the invisible C1 control range and
 *     render as symbol boxes.
 *  2. Ligature glyphs (fi, fl...) and other compatibility forms.
 *  3. Symbol-font glyphs (bullets from Wingdings/ZapfDingbats and custom
 *     fonts) that map into Unicode's Private Use Area or the dingbat blocks
 *     and render as tofu squares.
 *
 * Strategy: map what has a sensible text equivalent, turn line-leading
 * symbol glyphs into real bullets, then strip anything left outside a
 * whitelist that covers English plus the site's FR/DE/ES locales.
 */

const WIN1252_C1: Record<number, string> = {
  0x80: "€", 0x82: ",", 0x84: '"', 0x85: "...", 0x8a: "S", 0x8c: "OE",
  0x91: "'", 0x92: "'", 0x93: '"', 0x94: '"', 0x95: "•", 0x96: "-",
  0x97: "-", 0x99: "(TM)", 0x9a: "s", 0x9c: "oe", 0x9f: "Y",
};

const LIGATURES: Record<string, string> = {
  "ﬀ": "ff",
  "ﬁ": "fi",
  "ﬂ": "fl",
  "ﬃ": "ffi",
  "ﬄ": "ffl",
};

// Glyphs from symbol fonts that PDFs commonly use as list markers:
// Private Use Area, geometric shapes, dingbats, arrows, misc symbols.
const SYMBOL_GLYPH =
  "\\uE000-\\uF8FF\\u25A0-\\u25FF\\u2700-\\u27BF\\u2190-\\u21FF\\u2B00-\\u2BFF\\u2600-\\u26FF";

// Everything we deliberately keep: whitespace, printable ASCII, Latin-1
// letters/punctuation (e-acute, u-umlaut, pound, copyright...), Latin
// Extended-A (oe, S-caron...), typographic dashes/quotes, dagger/bullet,
// ellipsis, euro. Everything else is stripped rather than shown as tofu.
const STRIP = new RegExp(
  "[^\\t\\n\\r\\x20-\\x7E\\u00A0-\\u017F\\u2010-\\u2015\\u2018-\\u201F\\u2020-\\u2022\\u2026\\u20AC]",
  "g"
);

const LINE_LEADING_SYMBOL = new RegExp(
  "^[ \\t]*[" + SYMBOL_GLYPH + "][ \\t]*",
  "gm"
);

const REPLACEMENT_CHAR = new RegExp("\\uFFFD", "g");

export function sanitizeDocumentText(text: string): string {
  let out = text
    // 1. WinAnsi bytes stranded in the C1 control range
    .replace(/[\x80-\x9F]/g, (ch) => WIN1252_C1[ch.charCodeAt(0)] ?? "")
    // 2. Ligatures, then NFKC for remaining compatibility forms
    .replace(/[ﬀ-ﬄ]/g, (ch) => LIGATURES[ch] ?? ch)
    .normalize("NFKC")
    // 3. The Unicode replacement character from any earlier decode failure
    .replace(REPLACEMENT_CHAR, "");

  // A symbol-font glyph at the start of a line is a list bullet.
  out = out.replace(LINE_LEADING_SYMBOL, "• ");

  // Strip whatever junk remains outside the whitelist.
  out = out.replace(STRIP, "");

  return out;
}

/** Sanitize plus whitespace tidy-up — the standard pass for extracted files. */
export function cleanDocumentText(text: string): string {
  return sanitizeDocumentText(text)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
