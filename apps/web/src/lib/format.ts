/**
 * How ARVEN writes numbers, dates and times in Hebrew.
 *
 * Every rule here comes from docs/brand-appendix-hebrew.md, and lives in one
 * place so no screen quietly invents its own format:
 *   A32 — Western numerals, always
 *   A33 — dates as "8 באוגוסט"
 *   A34 — 24-hour time
 *   A11 — קלוריות in copy, never קק"ל
 */

const ZONE = "Asia/Jerusalem";

const TIME = new Intl.DateTimeFormat("he-IL", {
  timeZone: ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE = new Intl.DateTimeFormat("he-IL", {
  timeZone: ZONE,
  day: "numeric",
  month: "long",
});

const WEEKDAY = new Intl.DateTimeFormat("he-IL", {
  timeZone: ZONE,
  weekday: "long",
});

/** `08:20`. Never `8:20 AM`. */
export function time(instant: Date): string {
  return TIME.format(instant);
}

/** `יום שבת, 8 באוגוסט` */
export function longDate(instant: Date): string {
  return `${WEEKDAY.format(instant)}, ${DATE.format(instant)}`;
}

/**
 * Calories, as a whole number with a thousands separator.
 *
 * Rounded only here, at the edge. The domain deliberately keeps full precision
 * so a day's total never drifts from the rows above it.
 */
export function kcal(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** Grams, to one decimal only when the amount is small enough for it to matter. */
export function grams(value: number): string {
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded.toLocaleString("en-US")} ג׳`;
}

/** Macros, rounded to whole grams — nobody eats a tenth of a gram of protein. */
export function macro(value: number): string {
  return `${Math.round(value)} ג׳`;
}
