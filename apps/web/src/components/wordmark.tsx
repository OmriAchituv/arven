export function Wordmark({ size = "1.5rem" }: { size?: string }) {
  return (
    <span
      // Latin, letterspaced, always — appendix A1.
      dir="ltr"
      style={{
        fontFamily: "var(--font-wordmark), serif",
        fontSize: size,
        letterSpacing: "0.22em",
        lineHeight: 1,
        display: "inline-block",
      }}
    >
      ARVEN
    </span>
  );
}
