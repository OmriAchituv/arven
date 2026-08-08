import { describe, expect, it } from "vitest";

import {
  constantTimeEqual,
  deriveSessionToken,
  isCorrectPassphrase,
  isValidSession,
} from "./auth";

describe("constantTimeEqual", () => {
  it("accepts identical strings", () => {
    expect(constantTimeEqual("open sesame", "open sesame")).toBe(true);
  });

  it("rejects different strings of the same length", () => {
    expect(constantTimeEqual("abcdef", "abcdeg")).toBe(false);
  });

  it("rejects a prefix of the expected value", () => {
    expect(constantTimeEqual("abc", "abcdef")).toBe(false);
  });

  it("rejects an extension of the expected value", () => {
    expect(constantTimeEqual("abcdefg", "abcdef")).toBe(false);
  });

  it("handles multi-byte characters", () => {
    expect(constantTimeEqual("סיסמה", "סיסמה")).toBe(true);
    expect(constantTimeEqual("סיסמה", "סיסמא")).toBe(false);
  });
});

describe("isCorrectPassphrase", () => {
  it("accepts the configured passphrase", () => {
    expect(isCorrectPassphrase("hunter2", "hunter2")).toBe(true);
  });

  it("rejects a wrong passphrase", () => {
    expect(isCorrectPassphrase("hunter3", "hunter2")).toBe(false);
  });

  it("never authenticates when no passphrase is configured", () => {
    // A misconfigured deployment must be a closed door, not an open one.
    expect(isCorrectPassphrase("", "")).toBe(false);
    expect(isCorrectPassphrase("anything", "")).toBe(false);
  });
});

describe("session tokens", () => {
  it("derives a stable token for a secret", async () => {
    const first = await deriveSessionToken("s3cret");
    const second = await deriveSessionToken("s3cret");
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("derives a different token for a different secret", async () => {
    expect(await deriveSessionToken("one")).not.toBe(
      await deriveSessionToken("two"),
    );
  });

  it("accepts a cookie minted with the same secret", async () => {
    const token = await deriveSessionToken("s3cret");
    expect(await isValidSession(token, "s3cret")).toBe(true);
  });

  it("rejects a cookie minted with a different secret", async () => {
    const token = await deriveSessionToken("other");
    expect(await isValidSession(token, "s3cret")).toBe(false);
  });

  it("rejects a missing or forged cookie", async () => {
    expect(await isValidSession(undefined, "s3cret")).toBe(false);
    expect(await isValidSession("", "s3cret")).toBe(false);
    expect(await isValidSession("deadbeef", "s3cret")).toBe(false);
  });
});
