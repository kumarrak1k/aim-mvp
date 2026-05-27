import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 3500;

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx", ".pdf"];

function getExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.find((extension) => lower.endsWith(extension)) || "";
}

function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

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

type PDFParserInstance = {
  getText(): Promise<{ text?: string } | string>;
  destroy?(): Promise<void> | void;
};

type PDFParseClass = {
  new (options: { data: Buffer }): PDFParserInstance;
  setWorker?: (src?: string) => string;
};

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const mod = await import("pdf-parse");

  // Webpack bundles CJS modules wrapped as { default: <exports> }.
  // The ESM entry hoists named exports directly onto the module object.
  // We handle both shapes so this works in every Next.js/Vercel build.
  const exports = mod as unknown as Record<string, unknown>;
  const PDFParse = (
    exports.PDFParse ??
    (exports.default as Record<string, unknown> | undefined)?.PDFParse
  ) as PDFParseClass | undefined;

  if (!PDFParse) {
    throw new Error(
      "PDF parser could not be initialised — PDFParse class not found."
    );
  }

  // Configure the worker path so pdfjs-dist can find it in serverless envs.
  if (typeof PDFParse.setWorker === "function") {
    PDFParse.setWorker();
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return typeof result === "string" ? result : (result.text ?? "");
  } finally {
    await parser.destroy?.();
  }
}

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
            "No readable text could be extracted from this file. Try copying and pasting the text manually, or upload a text-based DOCX/PDF.",
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