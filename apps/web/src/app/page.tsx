import { Wordmark } from "~/components/wordmark";
import { SystemStatus } from "~/components/system-status";

/**
 * The app shell. Deliberately almost empty: this slice ships the pipeline, not
 * the product. Today's screen arrives in slice #2.
 */
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "max(1.5rem, env(safe-area-inset-top)) 1.5rem max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <header>
        <Wordmark />
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--step2)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          עוד אין כאן כלום.
        </h1>
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>
          המסך הראשון מגיע בשלב הבא.
        </p>
      </div>

      <footer style={{ fontSize: "var(--step-1)" }}>
        <SystemStatus />
      </footer>
    </main>
  );
}
