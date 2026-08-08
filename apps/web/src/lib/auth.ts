/**
 * The passphrase gate.
 *
 * Temporary by design. ARVEN has exactly one user, and its data sits on a public
 * URL, so it needs a door — but not an identity system. Google sign-in replaces
 * this wholesale in iteration 4, at which point this file is deleted rather than
 * refactored. Everything the gate needs lives here for that reason.
 *
 * Uses Web Crypto so it runs unchanged in middleware on the edge runtime.
 */

const SESSION_PAYLOAD = "arven-session-v1";

export const SESSION_COOKIE = "arven_session";

/** Thirty days. Long enough that a phone stays signed in between uses. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * The cookie value: an HMAC over a fixed payload. It carries no information, and
 * cannot be produced without the secret, which is all the gate needs it to do.
 */
export async function deriveSessionToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(SESSION_PAYLOAD),
  );
  return toHex(signature);
}

/**
 * Compares in time independent of how much of the input matches, so a wrong
 * passphrase reveals nothing about how nearly right it was.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  // Length is compared as data rather than short-circuited, so unequal lengths
  // still cost the same as equal ones.
  let mismatch = aBytes.length === bBytes.length ? 0 : 1;
  const length = Math.max(aBytes.length, bBytes.length);

  for (let i = 0; i < length; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return mismatch === 0;
}

export async function isValidSession(
  cookieValue: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!cookieValue) return false;
  return constantTimeEqual(cookieValue, await deriveSessionToken(secret));
}

export function isCorrectPassphrase(
  submitted: string,
  expected: string,
): boolean {
  // An unset passphrase must never authenticate, or a misconfigured deploy is
  // an open door.
  if (expected.length === 0) return false;
  return constantTimeEqual(submitted, expected);
}
