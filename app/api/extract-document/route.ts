import { auth } from "@clerk/nextjs/server";
import { inflateSync, inflateRawSync } from "zlib";
import { cleanDocumentText } from "@/app/lib/textSanitize";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 15000;

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx", ".pdf"];

function getExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.find((extension) => lower.endsWith(extension)) || "";
}

// Encoding fixes (WinAnsi C1 range, ligatures, symbol-font glyphs) live in
// the shared sanitizer so the profile save path applies the same rules.
const cleanExtractedText = cleanDocumentText;

function truncateExtractedText(text: string) {
  if (text.length <= MAX_EXTRACTED_CHARS) {
    return {
      text,
      wasTruncated: false,
    };
  }

  return {
    text: text.slice(0, MAX_EXTRACTED_CHARS).trim(),
    wasTruncated: true,
  };
}

async function extractTextFromDocx(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

// ── Native PDF text extractor ─────────────────────────────────────────────────
// Uses only Node.js built-ins (zlib) — no web workers, no external dependencies,
// works in every serverless environment. Handles FlateDecode-compressed streams
// (the format used by Word, Google Docs, Adobe Acrobat, Canva, etc.).

/** Unescape PDF string literal escape sequences. */
function unescapePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    );
}

/** Decode a PDF hex string like <48656c6c6f> → "Hello". */
function decodePdfHexString(hex: string): string {
  const cleaned = hex.replace(/\s/g, "");
  let result = "";
  for (let i = 0; i < cleaned.length; i += 2) {
    result += String.fromCharCode(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return result;
}

/**
 * Pull text out of a PDF content stream (the decompressed bytes of a page
 * content stream). Recognises Tj, TJ (show string / array), Td, TD, T-star,
 * and Tm (move text position = line break), plus literal (text) and hex
 * string forms.
 */
function extractPdfTextContent(content: string): string {
  const lines: string[] = [];

  // Iterate over BT...ET text blocks
  const btEt = /BT\b([\s\S]*?)\bET\b/g;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = btEt.exec(content)) !== null) {
    const block = blockMatch[1];

    // Within a BT/ET block we accumulate a "run" — consecutive text operators
    // with no intervening position change.  Consecutive Tj/TJ calls concatenate
    // directly (no space) because the PDF writer may split words at font/encoding
    // boundaries (e.g. "john" Tj + "@" Tj + "example.com" Tj = "john@example.com").
    // A space is only added when a position-change operator (Td/TD/T*/Tm) is
    // seen between two non-empty text runs.
    const segments: string[] = [];
    let run = "";
    let afterMove = true; // treat start-of-block like "after a move"

    const tokenRe =
      /\(([^)\\]*(?:\\[\s\S][^)\\]*)*)\)\s*(Tj|'|")|<([0-9a-fA-F\s]+)>\s*(Tj|'|")|(\[[\s\S]*?\])\s*TJ|\b(Td|TD|T\*|Tm)\b/g;
    let m: RegExpExecArray | null;

    while ((m = tokenRe.exec(block)) !== null) {
      if (m[6] !== undefined) {
        // Position operator — next text starts a fresh segment
        afterMove = true;
        continue;
      }

      let chunk = "";

      if (m[1] !== undefined) {
        // (literal string) Tj/'/''
        chunk = unescapePdfString(m[1]);
      } else if (m[3] !== undefined) {
        // <hexstring> Tj/'/''
        chunk = decodePdfHexString(m[3]);
      } else if (m[5] !== undefined) {
        // [...] TJ — array of strings interleaved with kerning numbers.
        // Strings are concatenated directly. In the PDF spec a negative number
        // advances the position rightward (i.e. adds space); a magnitude >= 200
        // typically represents a word space in most fonts.
        const inner = m[5];
        const tjTokRe =
          /\(([^)\\]*(?:\\[\s\S][^)\\]*)*)\)|<([0-9a-fA-F\s]+)>|(-?\d+(?:\.\d+)?)/g;
        let s: RegExpExecArray | null;
        while ((s = tjTokRe.exec(inner)) !== null) {
          if (s[1] !== undefined) chunk += unescapePdfString(s[1]);
          else if (s[2] !== undefined) chunk += decodePdfHexString(s[2]);
          else if (s[3] !== undefined && parseFloat(s[3]) <= -200) chunk += " ";
        }
      }

      if (afterMove) {
        const flushed = run.trim();
        if (flushed) segments.push(flushed);
        run = chunk;
        afterMove = false;
      } else {
        run += chunk;
      }
    }

    const lastRun = run.trim();
    if (lastRun) segments.push(lastRun);
    if (segments.length) lines.push(segments.join(" "));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Try to decompress a Buffer that may be a FlateDecode (zlib) PDF stream.
 * Returns the decompressed bytes as a latin1 string, or null if decompression
 * fails (meaning the stream is uncompressed or uses an unsupported filter).
 */
function tryDecompress(data: Buffer): string | null {
  // zlib (with 2-byte header)
  try {
    return inflateSync(data).toString("latin1");
  } catch {
    // fall through
  }
  // raw deflate (no header — some PDF writers skip the zlib wrapper)
  try {
    return inflateRawSync(data).toString("latin1");
  } catch {
    // fall through
  }
  return null;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Use latin1 (binary-identical to ISO-8859-1) for safe byte→char mapping.
  const raw = buffer.toString("latin1");
  const allParts: string[] = [];

  // Pass 1 — look for text directly in the uncompressed document body.
  // Some PDF writers inline small content streams without compression.
  const directText = extractPdfTextContent(raw);
  if (directText) allParts.push(directText);

  // Pass 2 — find every stream ... endstream block, decompress it, and
  // look for text operators inside the decompressed content.
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(raw)) !== null) {
    const streamBytes = Buffer.from(match[1], "latin1");
    if (streamBytes.length < 10) continue;

    const decompressed = tryDecompress(streamBytes);
    if (decompressed) {
      const text = extractPdfTextContent(decompressed);
      if (text) allParts.push(text);
    }
  }

  const result = allParts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "You must be signed in to upload a document." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file was uploaded." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        {
          error: `File is too large. Please upload a file under ${Math.round(
            MAX_UPLOAD_BYTES / 1024 / 1024
          )}MB.`,
        },
        { status: 400 }
      );
    }

    const extension = getExtension(file.name);

    if (!extension) {
      return Response.json(
        {
          error:
            "Unsupported file type. Please upload a .txt, .md, .docx or .pdf file.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (extension === ".txt" || extension === ".md") {
      extractedText = buffer.toString("utf-8");
    }

    if (extension === ".docx") {
      extractedText = await extractTextFromDocx(buffer);
    }

    if (extension === ".pdf") {
      extractedText = await extractTextFromPdf(buffer);
    }

    const cleanedText = cleanExtractedText(extractedText);

    if (!cleanedText) {
      return Response.json(
        {
          error:
            "No readable text could be extracted from this PDF. If it's a scanned or image-only PDF, please paste your CV text below instead.",
        },
        { status: 400 }
      );
    }

    const truncated = truncateExtractedText(cleanedText);

    return Response.json({
      fileName: file.name,
      fileSize: file.size,
      extension,
      text: truncated.text,
      wasTruncated: truncated.wasTruncated,
      message: truncated.wasTruncated
        ? "Text extracted and automatically trimmed to fit the current profile limit."
        : "Text extracted successfully.",
    });
  } catch (error) {
    console.error("DOCUMENT EXTRACTION ERROR:", error);

    return Response.json(
      {
        error:
          "Couldn't extract text from this file. If it's a scanned or image-based PDF, please paste your CV text below instead.",
      },
      { status: 500 }
    );
  }
}
