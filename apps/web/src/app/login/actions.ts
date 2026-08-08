"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  deriveSessionToken,
  isCorrectPassphrase,
} from "~/lib/auth";
import { env } from "~/lib/env";

/**
 * Whether the connection is actually HTTPS, rather than whether this is a
 * production build. A `secure` cookie is silently dropped over plain HTTP, so
 * keying it to NODE_ENV breaks every non-TLS environment — including the local
 * production build the end-to-end tests run against.
 */
async function isSecureConnection(): Promise<boolean> {
  const forwardedProto = (await headers()).get("x-forwarded-proto");
  return forwardedProto?.split(",")[0]?.trim() === "https";
}

export async function signIn(_state: { error: boolean }, formData: FormData) {
  const submitted = String(formData.get("passphrase") ?? "");

  if (!isCorrectPassphrase(submitted, env.passphrase)) {
    return { error: true };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await deriveSessionToken(env.sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureConnection(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}
