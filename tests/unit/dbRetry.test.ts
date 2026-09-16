import { describe, it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { isTransientDbError, withDbRetry } from "@/app/lib/dbRetry";

function knownError(code: string, message: string) {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: "test",
  });
}

describe("isTransientDbError", () => {
  it("treats a closed pooler connection as transient", () => {
    expect(isTransientDbError(knownError("P1017", "Server has closed the connection."))).toBe(true);
  });

  it("treats an unreachable database server as transient", () => {
    expect(
      isTransientDbError(knownError("P1001", "Can't reach database server at `ep-lively-frost`"))
    ).toBe(true);
  });

  it("does not treat a unique constraint violation as transient", () => {
    expect(isTransientDbError(knownError("P2002", "Unique constraint failed"))).toBe(false);
  });

  it("does not treat a plain error as transient", () => {
    expect(isTransientDbError(new Error("boom"))).toBe(false);
  });
});

describe("withDbRetry", () => {
  it("returns the value without retrying when the call succeeds", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withDbRetry(fn, { delayMs: 0 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries a transient failure and returns the retry's value", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(knownError("P1017", "Server has closed the connection."))
      .mockResolvedValue("ok");
    await expect(withDbRetry(fn, { delayMs: 0 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gives up after the attempt budget and rethrows the last transient error", async () => {
    const error = knownError("P1001", "Can't reach database server");
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withDbRetry(fn, { attempts: 3, delayMs: 0 })).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry an error that is not transient", async () => {
    const error = knownError("P2002", "Unique constraint failed");
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withDbRetry(fn, { delayMs: 0 })).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
