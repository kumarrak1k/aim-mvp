import type { Metadata } from "next";
import Link from "next/link";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export const metadata: Metadata = {
  title: { absolute: "ATS API Reference | AI Career Mentor" },
  description:
    "Integrate AI Career Mentor's candidate assessment data directly into your ATS or HRIS via our REST API.",
};

const BASE = "https://aicareermentor.co.uk/api/v1";

function Code({ children }: { children: string }) {
  return (
    <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-sm font-mono text-purple-200">
      {children}
    </code>
  );
}

function Block({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-6 text-green-300 border border-white/[0.06]">
      <code>{children}</code>
    </pre>
  );
}

function Tag({ method }: { method: "GET" | "POST" | "DELETE" }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    POST: "bg-green-500/20 text-green-300 border-green-500/30",
    DELETE: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-black ${colors[method]}`}>
      {method}
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0614] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo href="" size="md" showText />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/for-business" className="text-gray-400 hover:text-white">For hiring teams</Link>
            <Link
              href="/company/api-keys"
              className="rounded-full bg-purple-600 px-4 py-1.5 font-black text-white hover:bg-purple-500"
            >
              Get API key
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <span className="rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">
            v1.0
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em]">ATS API Reference</h1>
          <p className="mt-3 max-w-2xl text-gray-400">
            Pull candidate assessment results directly into your ATS or HRIS. Invite candidates programmatically, track completion status, and retrieve scored results, all via a simple REST API.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-1.5 text-gray-300 hover:bg-white/[0.05]"
            >
              OpenAPI spec (JSON)
            </a>
            <Link
              href="/company/api-keys"
              className="flex items-center gap-1.5 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-purple-300 hover:bg-purple-500/20"
            >
              Generate API key →
            </Link>
          </div>
        </div>

        {/* Authentication */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-black">Authentication</h2>
          <p className="mb-4 text-gray-400">
            All API requests must include your API key in the <Code>Authorization</Code> header.
            Keys are generated in your{" "}
            <Link href="/company/api-keys" className="text-purple-300 hover:text-purple-200">
              company dashboard
            </Link>
            . Keys begin with <Code>aim_</Code> and are shown only once on creation.
          </p>
          <Block>{`Authorization: Bearer aim_your_api_key_here`}</Block>
        </section>

        {/* Base URL */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-black">Base URL</h2>
          <Block>{BASE}</Block>
        </section>

        {/* Endpoints */}
        <section className="mb-10">
          <h2 className="mb-6 text-xl font-black">Endpoints</h2>

          {/* GET /templates */}
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="mb-3 flex items-center gap-3">
              <Tag method="GET" />
              <Code>/templates</Code>
            </div>
            <p className="mb-4 text-sm text-gray-400">List all active assessment templates for your company.</p>
            <Block>{`curl -H "Authorization: Bearer aim_..." \\
  ${BASE}/templates`}</Block>
            <p className="mt-4 mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Response</p>
            <Block>{`{
  "data": [
    {
      "id": "clt_abc123",
      "name": "Senior Software Engineer Screen",
      "role": "Software Engineer",
      "experienceLevel": "Senior (5+ years)",
      "interviewType": "Technical",
      "questionCount": 8,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 1
}`}</Block>
          </div>

          {/* GET /candidates */}
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="mb-3 flex items-center gap-3">
              <Tag method="GET" />
              <Code>/candidates</Code>
            </div>
            <p className="mb-2 text-sm text-gray-400">List candidate assignments with optional filters.</p>
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-gray-500">
                    <th className="pb-2 pr-6">Parameter</th>
                    <th className="pb-2 pr-6">Type</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-6"><Code>page</Code></td>
                    <td className="py-2 pr-6">integer</td>
                    <td className="py-2">Page number (default: 1)</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-6"><Code>pageSize</Code></td>
                    <td className="py-2 pr-6">integer</td>
                    <td className="py-2">Results per page, max 100 (default: 50)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6"><Code>status</Code></td>
                    <td className="py-2 pr-6">string</td>
                    <td className="py-2">Filter: <Code>pending</Code> | <Code>started</Code> | <Code>completed</Code> | <Code>expired</Code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Block>{`curl -H "Authorization: Bearer aim_..." \\
  "${BASE}/candidates?status=completed&page=1"`}</Block>
          </div>

          {/* POST /candidates */}
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="mb-3 flex items-center gap-3">
              <Tag method="POST" />
              <Code>/candidates</Code>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Invite a candidate to complete an assessment. Sends the invite email automatically.
            </p>
            <Block>{`curl -X POST \\
  -H "Authorization: Bearer aim_..." \\
  -H "Content-Type: application/json" \\
  -d '{"candidateEmail":"jane@example.com","templateId":"clt_abc123","expiryDays":7}' \\
  ${BASE}/candidates`}</Block>
            <p className="mt-4 mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Body parameters</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-gray-500">
                    <th className="pb-2 pr-6">Field</th>
                    <th className="pb-2 pr-6">Required</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-6"><Code>candidateEmail</Code></td>
                    <td className="py-2 pr-6">Yes</td>
                    <td className="py-2">Candidate&apos;s email address</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-6"><Code>templateId</Code></td>
                    <td className="py-2 pr-6">Yes</td>
                    <td className="py-2">ID of an active assessment template</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6"><Code>expiryDays</Code></td>
                    <td className="py-2 pr-6">No</td>
                    <td className="py-2">Days until the invite expires (1–30, default: 7)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GET /candidates/[id] */}
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="mb-3 flex items-center gap-3">
              <Tag method="GET" />
              <Code>{"/candidates/{id}"}</Code>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Retrieve a single assignment with full result data including score, hire signal, strengths, and improvements.
            </p>
            <Block>{`curl -H "Authorization: Bearer aim_..." \\
  ${BASE}/candidates/cla_xyz789`}</Block>
            <p className="mt-4 mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Result object</p>
            <Block>{`{
  "id": "cla_xyz789",
  "candidateEmail": "jane@example.com",
  "status": "completed",
  "template": { "role": "Software Engineer", "questionCount": 8 },
  "result": {
    "overallScore": 8,
    "hireSignal": "Strong",
    "recommendation": "Jane demonstrated strong technical...",
    "topStrengths": ["Problem decomposition", "Communication"],
    "priorityImprovements": ["System design depth"],
    "completedAt": "2025-01-16T14:30:00.000Z"
  }
}`}</Block>
          </div>
        </section>

        {/* Error codes */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-black">Error codes</h2>
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03]">
                <tr className="text-left">
                  <th className="px-4 py-3 text-gray-400">Status</th>
                  <th className="px-4 py-3 text-gray-400">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-gray-300">
                <tr><td className="px-4 py-3"><Code>200</Code></td><td className="px-4 py-3">OK</td></tr>
                <tr><td className="px-4 py-3"><Code>201</Code></td><td className="px-4 py-3">Created</td></tr>
                <tr><td className="px-4 py-3"><Code>400</Code></td><td className="px-4 py-3">Bad request: check required fields</td></tr>
                <tr><td className="px-4 py-3"><Code>401</Code></td><td className="px-4 py-3">Invalid or missing API key</td></tr>
                <tr><td className="px-4 py-3"><Code>404</Code></td><td className="px-4 py-3">Resource not found</td></tr>
                <tr><td className="px-4 py-3"><Code>500</Code></td><td className="px-4 py-3">Internal server error: contact support</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-6 text-center">
          <p className="text-sm text-gray-300">
            Need help integrating?{" "}
            <a href="mailto:support@aicareermentor.co.uk" className="font-black text-purple-300 hover:text-purple-200">
              Contact our team →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
