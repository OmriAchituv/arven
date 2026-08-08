"use client";

import { useActionState } from "react";

import { Wordmark } from "~/components/wordmark";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, { error: false });

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2.5rem",
          width: "min(22rem, 100%)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Wordmark size="2rem" />
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>הבריאות שלך. מובנת.</p>
        </div>

        <form
          action={formAction}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <input
            name="passphrase"
            type="password"
            autoComplete="current-password"
            aria-label="סיסמה"
            placeholder="סיסמה"
            required
            style={{
              font: "inherit",
              textAlign: "center",
              padding: "0.75rem 1rem",
              borderRadius: "2px",
              border: "1px solid var(--edge)",
              background: "var(--surface)",
              color: "var(--ink)",
            }}
          />
          <button
            type="submit"
            disabled={pending}
            style={{
              font: "inherit",
              padding: "0.75rem 1rem",
              borderRadius: "2px",
              border: "none",
              background: "var(--accent)",
              color: "var(--ground)",
              cursor: pending ? "default" : "pointer",
            }}
          >
            {pending ? "בודק…" : "כניסה"}
          </button>

          {/*
            Appendix A5: direct but refined. Not "שגיאה! הסיסמה שהזנת אינה נכונה"
            (bureaucratic), not an apology. Just what happened.
          */}
          {state.error ? (
            <p role="alert" data-testid="login-error" style={{ margin: 0, color: "var(--ink-soft)", fontSize: "var(--step-1)" }}>
              הסיסמה לא נכונה.
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
