import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * An A on mineral green. Brief §31 rules out medical symbolism — no heart, no
 * ECG line, no leaf — and says the wordmark carries the identity, so the icon
 * is simply its first letter.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2F4A43",
          color: "#F6F4F1",
          fontSize: 300,
          fontFamily: "serif",
          letterSpacing: "0.02em",
          paddingBottom: 24,
        }}
      >
        A
      </div>
    ),
    size,
  );
}
