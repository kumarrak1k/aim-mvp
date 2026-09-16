import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const create = vi.fn();
const captureException = vi.fn();

vi.mock("@/app/lib/prisma", () => ({
  prisma: { activityEvent: { create: (...args: unknown[]) => create(...args) } },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

const { recordActivity, ACTIVITY_EVENTS } = await import("@/app/lib/activity");

function closedConnection() {
  return new Prisma.PrismaClientKnownRequestError("Server has closed the connection.", {
    code: "P1017",
    clientVersion: "test",
  });
}

/**
 * recordActivity is fire-and-forget, so let its promise chain settle - long
 * enough to cover the retry delay, or the retry lands in the next test.
 */
const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

beforeEach(() => {
  create.mockReset();
  captureException.mockReset();
});

describe("recordActivity against a flaky pooler", () => {
  it("retries a dropped connection and does not report it to Sentry", async () => {
    create.mockRejectedValueOnce(closedConnection()).mockResolvedValue({});

    recordActivity("user_1", ACTIVITY_EVENTS.PAGE_VIEW);
    await settle();

    expect(create).toHaveBeenCalledTimes(2);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("reports a write that keeps failing, so lost telemetry is still visible", async () => {
    create.mockRejectedValue(closedConnection());

    recordActivity("user_1", ACTIVITY_EVENTS.PAGE_VIEW);
    await settle();

    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("reports a non-transient failure without retrying it", async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    recordActivity("user_1", ACTIVITY_EVENTS.PAGE_VIEW);
    await settle();

    expect(create).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
