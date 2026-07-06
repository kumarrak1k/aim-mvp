/**
 * Hardened OpenAI client wrapper.
 *
 * Wraps the raw chat-completions REST endpoint with:
 *   - per-request timeout via AbortController
 *   - retry on 429 / 5xx and network errors
 *   - exponential backoff with jitter
 *   - friendly error mapping so callers can surface clear messages
 *
 * The OpenAI SDK already does some of this internally, but we use raw
 * `fetch` in `interview` and `feedback` routes — those are the ones that
 * actually need this wrapper.
 */

import { defaultReasoningEffort } from "./aiModels";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const RETRY_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

export type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  reasoning_effort?: "none" | "low" | "medium" | "high" | "xhigh";
  response_format?: { type: "json_object" } | { type: "text" };
  // Allow passing additional fields without making the type generic.
  [key: string]: unknown;
};

/**
 * GPT-5.x (and o-series) chat completions changed the request surface:
 * `max_tokens` became `max_completion_tokens`, custom `temperature`/`top_p`
 * are rejected, and `reasoning_effort` controls hidden thinking depth.
 * Translate legacy-style requests so call sites stay model-agnostic.
 */
export function adaptRequestForModel(request: ChatCompletionRequest): ChatCompletionRequest {
  const isReasoningModel = /^(gpt-5|o\d)/.test(request.model);
  if (!isReasoningModel) return request;

  const { temperature: _temperature, top_p: _topP, max_tokens, ...rest } = request;
  const adapted: ChatCompletionRequest = { ...rest };

  if (typeof max_tokens === "number" && adapted.max_completion_tokens === undefined) {
    // Reasoning tokens count against this budget, so give headroom beyond the
    // old visible-output cap.
    adapted.max_completion_tokens = max_tokens + 1000;
  }
  if (adapted.reasoning_effort === undefined) {
    adapted.reasoning_effort = defaultReasoningEffort(request.model);
  }
  return adapted;
}

export type ChatCompletionOptions = {
  /** Override the default 30s timeout. */
  timeoutMs?: number;
  /** Override the default 3 attempts (1 initial + 2 retries). */
  maxAttempts?: number;
};

export class OpenAIError extends Error {
  status: number;
  retryable: boolean;
  detail: string | undefined;

  constructor(message: string, status: number, retryable: boolean, detail?: string) {
    super(message);
    this.name = "OpenAIError";
    this.status = status;
    this.retryable = retryable;
    this.detail = detail;
  }
}

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

function backoffDelay(attempt: number) {
  // attempt 1 → ~500ms, attempt 2 → ~1.2s, attempt 3 → ~2.5s, with jitter
  const base = 400 * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 200;
  return base + jitter;
}

/**
 * Call the OpenAI chat-completions endpoint with timeout + retry.
 *
 * Returns the raw JSON response from OpenAI. Throws OpenAIError on
 * non-recoverable failures (auth, validation, exhausted retries).
 */
export async function callOpenAIChat(
  request: ChatCompletionRequest,
  options: ChatCompletionOptions = {}
): Promise<{
  choices: Array<{ message: { content: string }; finish_reason?: string }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
}> {
  // Test-only deterministic short-circuit. Set ONLY by the test runner via
  // AIM_TEST_MODE=mock (never in production). Dynamically imported so the canned
  // fixtures are code-split out of the production bundle. Bypasses the API key
  // requirement so the mocked suite needs no OpenAI credentials.
  if (process.env.AIM_TEST_MODE === "mock") {
    const { mockChatCompletion } = await import("./openaiMock");
    return {
      choices: [{ message: { content: mockChatCompletion(request) }, finish_reason: "stop" }],
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIError(
      "OpenAI is not configured on this server.",
      500,
      false,
      "OPENAI_API_KEY missing"
    );
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const payload = adaptRequestForModel(request);

  let lastError: OpenAIError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        return await response.json();
      }

      // Non-2xx — read body for context and decide whether to retry.
      const errorBody = await response.text().catch(() => "");
      const retryable = RETRY_STATUS_CODES.has(response.status);
      const message = mapStatusToMessage(response.status);

      lastError = new OpenAIError(message, response.status, retryable, errorBody.slice(0, 500));

      if (!retryable || attempt === maxAttempts) {
        throw lastError;
      }
      // Fall through to the backoff/retry below.
    } catch (err) {
      clearTimeout(timer);

      // If we already mapped this error into an OpenAIError above, rethrow
      // immediately when it's not retryable.
      if (err instanceof OpenAIError) {
        if (!err.retryable || attempt === maxAttempts) throw err;
        lastError = err;
      } else if (err instanceof Error && err.name === "AbortError") {
        lastError = new OpenAIError(
          "OpenAI request timed out. Please try again.",
          504,
          true,
          `timeout after ${timeoutMs}ms`
        );
        if (attempt === maxAttempts) throw lastError;
      } else {
        // Network-layer error (DNS, ECONNRESET, etc.) — retry.
        const detail = err instanceof Error ? err.message : "unknown network error";
        lastError = new OpenAIError(
          "Could not reach OpenAI. Please try again.",
          503,
          true,
          detail
        );
        if (attempt === maxAttempts) throw lastError;
      }
    }

    // Backoff before next attempt.
    await sleep(backoffDelay(attempt));
  }

  // Should never reach here, but TS needs a definite return.
  throw lastError ?? new OpenAIError("OpenAI request failed.", 500, false);
}

function mapStatusToMessage(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return "OpenAI authentication failed. Check OPENAI_API_KEY.";
    case 400:
      return "OpenAI rejected the request as invalid.";
    case 404:
      return "OpenAI endpoint or model not found.";
    case 408:
      return "OpenAI request timed out.";
    case 422:
      return "OpenAI rejected the request payload.";
    case 429:
      return "OpenAI rate limit hit. Please try again shortly.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "OpenAI is having a temporary problem. Please try again.";
    default:
      return `OpenAI returned an unexpected status (${status}).`;
  }
}
