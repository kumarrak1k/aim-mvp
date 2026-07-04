import { NextResponse } from "next/server";

export const dynamic = "force-static";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "AI Career Mentor ATS API",
    version: "1.0.0",
    description:
      "Integrate AI Career Mentor's candidate assessment data with your ATS. Authenticate with a Bearer API key generated in your company dashboard.",
    contact: { email: "support@aicareermentor.co.uk" },
  },
  servers: [{ url: "https://aicareermentor.co.uk/api/v1" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key generated in your company dashboard. Format: aim_<key>",
      },
    },
    schemas: {
      Template: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          role: { type: "string" },
          experienceLevel: { type: "string" },
          interviewType: { type: "string" },
          difficulty: { type: "string" },
          focusArea: { type: "string" },
          questionCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Result: {
        type: "object",
        nullable: true,
        properties: {
          sessionId: { type: "string" },
          overallScore: { type: "integer", minimum: 1, maximum: 10 },
          hireSignal: { type: "string", enum: ["Strong", "Moderate", "Needs work"] },
          totalQuestions: { type: "integer" },
          recommendation: { type: "string", nullable: true },
          topStrengths: { type: "array", items: { type: "string" } },
          priorityImprovements: { type: "array", items: { type: "string" } },
          completedAt: { type: "string", format: "date-time" },
        },
      },
      Candidate: {
        type: "object",
        properties: {
          id: { type: "string" },
          candidateEmail: { type: "string", format: "email" },
          status: { type: "string", enum: ["pending", "started", "completed", "expired"] },
          createdAt: { type: "string", format: "date-time" },
          startedAt: { type: "string", format: "date-time", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time" },
          template: { $ref: "#/components/schemas/Template" },
          result: { $ref: "#/components/schemas/Result" },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  paths: {
    "/templates": {
      get: {
        summary: "List assessment templates",
        operationId: "listTemplates",
        tags: ["Templates"],
        responses: {
          "200": {
            description: "List of active templates",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Template" } },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid or missing API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/candidates": {
      get: {
        summary: "List candidate assignments",
        operationId: "listCandidates",
        tags: ["Candidates"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "started", "completed", "expired"] } },
        ],
        responses: {
          "200": {
            description: "Paginated list of assignments",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Candidate" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pageSize: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid or missing API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        summary: "Invite a candidate",
        operationId: "inviteCandidate",
        tags: ["Candidates"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["candidateEmail", "templateId"],
                properties: {
                  candidateEmail: { type: "string", format: "email" },
                  templateId: { type: "string", description: "ID of an active assessment template" },
                  expiryDays: { type: "integer", default: 7, minimum: 1, maximum: 30 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Candidate invited",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Candidate" } } },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Invalid or missing API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Template not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/candidates/{id}": {
      get: {
        summary: "Get a candidate assignment",
        operationId: "getCandidate",
        tags: ["Candidates"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Assignment with result data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Candidate" } } },
          },
          "401": { description: "Invalid or missing API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Assignment not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
