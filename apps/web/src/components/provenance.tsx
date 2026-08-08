/**
 * `●` grounded · `○` estimated.
 *
 * The whole trust promise, rendered. Deliberately distinguishable by shape as
 * well as by fill, so it survives colour blindness, a dimmed screen and a
 * greyscale screenshot — a mark you cannot read is a mark that isn't there.
 */
export function ProvenanceMark({ grounded }: { grounded: boolean }) {
  return (
    <span
      aria-label={grounded ? "מבוסס" : "מוערך"}
      title={grounded ? "מבוסס" : "מוערך"}
      style={{
        display: "inline-block",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        flex: "none",
        background: grounded ? "var(--accent)" : "transparent",
        border: grounded ? "none" : "1px solid var(--accent-soft)",
      }}
    />
  );
}
