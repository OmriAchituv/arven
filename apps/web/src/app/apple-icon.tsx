import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home screen. No transparency and no rounded corners of our own — iOS
 * applies its own mask, and drawing one underneath it reads as an error.
 */
export default function AppleIcon() {
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
          fontSize: 108,
          fontFamily: "serif",
          letterSpacing: "0.02em",
          paddingBottom: 8,
        }}
      >
        A
      </div>
    ),
    size,
  );
}
