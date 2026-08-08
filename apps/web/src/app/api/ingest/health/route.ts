import { NextResponse } from "next/server";

/**
 * Apple Health ingest — reserved, not implemented until iteration 3.
 *
 * This is REST rather than tRPC on purpose: an iOS Shortcut can only POST plain
 * JSON to a URL. The endpoint exists now so the boundary is fixed, and so the
 * payload shape is designed once — a native app or third-party bridge must be
 * able to post the identical body later without a schema change.
 */
export function POST() {
  return NextResponse.json(
    {
      error: "not_implemented",
      message: "Health ingest arrives in iteration 3.",
    },
    { status: 501 },
  );
}
