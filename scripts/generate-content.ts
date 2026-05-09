#!/usr/bin/env node
/**
 * Bulk MDX content generator — uses gpt-4o-mini to generate blog articles
 * and interview question sets from a topic list JSON file.
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts --type blog [--limit 3]
 *   npx tsx scripts/generate-content.ts --type questions [--limit 3]
 *   npx tsx scripts/generate-content.ts --type blog --topics content/topics/blog-topics.json
 *
 * First run with --limit 3 to validate output quality before generating all.
 * Script is resumable — already-generated files are skipped automatically.
 *
 * Requires OPENAI_API_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── CLI ───────────────────────────────────────────────────────────────────────
function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const contentType = arg("--type") as "blog" | "questions" | undefined;
if (!contentType || !["blog", "questions"].includes(contentType)) {
  console.error("Error: --type blog|questions is required");
  process.exit(1);
}

const limitArg = arg("--limit");
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const topicsPath =
  arg("--topics") ?? `content/topics/${contentType}-topics.json`;

// ── Types ─────────────────────────────────────────────────────────────────────
type BlogTopic = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  wordCount?: number;
};

type QuestionsTopic = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  role: string;
  questionCount?: number;
};

// ── Prompts ───────────────────────────────────────────────────────────────────
function blogSystem(): string {
  return (
    "You are an expert interview coach and career writer for AI Career Mentor " +
    "(aicareermentor.co.uk), a UK AI interview coaching platform. Write " +
    "comprehensive, practical, SEO-optimised guides for candidates preparing " +
    "for UK job interviews. Be specific and actionable. British English. " +
    "No filler, no clichés like 'in today's competitive job market'."
  );
}

function blogUser(topic: BlogTopic): string {
  const words = topic.wordCount ?? 1800;
  return `Write a complete MDX article body (NO frontmatter) for:

Title: ${topic.title}
Description: ${topic.description}
Keywords: ${topic.keywords.join(", ")}
Category: ${topic.category}
Target word count: ~${words} words

Rules:
- Short intro paragraph before first heading
- ## for main sections (at least 4), ### for sub-sections
- Practical examples, sample answers, or step-by-step guidance
- End with a "## Key Takeaways" bullet list
- MDX only: ##, ###, **bold**, *italic*, - list, 1. ordered list
- Do NOT include the title as h1 — handled by the page template
- British English throughout`;
}

function questionsSystem(): string {
  return (
    "You are an expert interviewer and career coach for AI Career Mentor " +
    "(aicareermentor.co.uk). Create comprehensive interview question banks " +
    "for UK job interview preparation. Each question should be realistic and " +
    "role-specific, with clear guidance on what strong answers look like."
  );
}

function questionsUser(topic: QuestionsTopic): string {
  const count = topic.questionCount ?? 30;
  return `Write a complete MDX question set body (NO frontmatter) for:

Title: ${topic.title}
Role: ${topic.role}
Category: ${topic.category}
Number of questions: ${count}

Rules:
- Short intro paragraph before the first section
- Group into ## sections (e.g. ## Background & Motivation, ## Core Competencies, ## Situational, ## Role-specific)
- For each question:
  **Q1. Question text here**
  *What they're looking for:* one sentence
  **Strong answer approach:** 2-3 sentences of specific, actionable guidance
- Exactly ${count} questions numbered sequentially (Q1, Q2, ...)
- MDX only: ##, ###, **bold**, *italic*, - list
- Do NOT include the title as h1
- British English throughout`;
}

// ── Frontmatter ───────────────────────────────────────────────────────────────
function frontmatter(topic: BlogTopic | QuestionsTopic, type: "blog" | "questions"): string {
  const today = new Date().toISOString().split("T")[0];
  const wc = "wordCount" in topic ? (topic.wordCount ?? 1800) : undefined;
  const readingTime = wc ? `"${Math.round(wc / 200)} min"` : undefined;

  const lines = [
    "---",
    `title: "${topic.title.replace(/"/g, '\\"')}"`,
    `description: "${topic.description.replace(/"/g, '\\"')}"`,
    `date: "${today}"`,
    `keywords: [${topic.keywords.map((k) => `"${k}"`).join(", ")}]`,
    `category: "${topic.category}"`,
    ...(readingTime && type === "blog" ? [`readingTime: ${readingTime}`] : []),
    "---",
  ];
  return lines.join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY not found in .env.local");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const outputDir = path.join(process.cwd(), "content", contentType);
  fs.mkdirSync(outputDir, { recursive: true });

  const topicsFile = path.join(process.cwd(), topicsPath);
  if (!fs.existsSync(topicsFile)) {
    console.error(`Error: topics file not found at ${topicsPath}`);
    process.exit(1);
  }

  const allTopics: (BlogTopic | QuestionsTopic)[] = JSON.parse(
    fs.readFileSync(topicsFile, "utf8")
  );
  const topics = allTopics.slice(0, Number.isFinite(limit) ? limit : allTopics.length);

  console.log(`\nGenerating ${topics.length} ${contentType} files (of ${allTopics.length} total)\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const filePath = path.join(outputDir, `${topic.slug}.mdx`);

    if (fs.existsSync(filePath)) {
      console.log(`  skip [${i + 1}/${topics.length}] ${topic.slug}`);
      skipped++;
      continue;
    }

    try {
      const system = contentType === "blog" ? blogSystem() : questionsSystem();
      const user =
        contentType === "blog"
          ? blogUser(topic as BlogTopic)
          : questionsUser(topic as QuestionsTopic);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 3500,
      });

      const body = completion.choices[0]?.message?.content ?? "";
      const fm = frontmatter(topic, contentType);
      fs.writeFileSync(filePath, `${fm}\n\n${body.trim()}\n`, "utf8");

      const usage = completion.usage;
      const tokens = usage ? `${usage.total_tokens} tok` : "";
      console.log(`  done [${i + 1}/${topics.length}] ${topic.slug} ${tokens}`);
      generated++;

      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error(
        `  FAIL [${i + 1}/${topics.length}] ${topic.slug}:`,
        err instanceof Error ? err.message : err
      );
      failed++;
    }
  }

  console.log(
    `\nDone. generated=${generated} skipped=${skipped} failed=${failed}\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
